import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import documentService from "../../../services/documentService";
import processService from "../../../services/processService";

import { getApiErrorDetails, getApiErrorMessage, getApiErrorPendencias } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { labelDe, nomeDoCliente, documentoDoCliente, PAPEL_PROCESSO_OPTIONS } from "../../../utils/enums";

import "./Documentos.css";
import { TextoComAjuda } from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

const MOTIVOS_INCOMPATIVEIS = ["tipoIncompativel", "tipoHonorarioIncompativel", "parcelasDesiguais"];

export const textoDaSobrescrita = (conflito) => {
    const partes = ["O texto editado à mão será substituído pelo texto recomposto a partir das seções."];

    partes.push(conflito?.dataGeracao
        ? `A versão atual foi gerada em ${formatDate(conflito.dataGeracao)} e ficará guardada como substituída.`
        : "A versão atual ficará guardada como substituída.");

    if (conflito?.sairaDoPortal === true) {
        partes.push("Este documento está visível no portal do cliente e sairá de lá: o documento novo nasce oculto e precisa ser liberado outra vez.");
    }

    return partes.join(" ");
};

function ItemPendencia({ pendencia }) {
    return (
        <li className="pendenciaItem">
            <span className="pendenciaRotulo">{pendencia.rotulo}</span>
            {pendencia.causa && <span className="pendenciaCausa">{pendencia.causa}</span>}
            <span className="pendenciaOrientacao">{pendencia.orientacao}</span>
            <code className="pendenciaChave">{`{{${pendencia.variavel}}}`}</code>
        </li>
    );
}

export function ListaPendencias({ pendencias }) {
    if (!pendencias || pendencias.length === 0) return null;

    const bloqueios = pendencias.filter((p) => MOTIVOS_INCOMPATIVEIS.includes(p.motivo));
    const faltantes = pendencias.filter((p) => !MOTIVOS_INCOMPATIVEIS.includes(p.motivo));

    return (
        <div className="pendencias">
            {bloqueios.length > 0 && (
                <>
                    <p className="pendenciasTitulo">
                        {bloqueios.length === 1
                            ? "Uma variável não se aplica a esta combinação"
                            : `${bloqueios.length} variáveis não se aplicam a esta combinação`}
                    </p>
                    <p className="pendenciasAjuda">Estas não se resolvem preenchendo cadastro: o campo não existe para este cliente ou para este honorário.</p>
                    <ul className="pendenciasLista">
                        {bloqueios.map((p) => <ItemPendencia key={p.variavel} pendencia={p} />)}
                    </ul>
                </>
            )}

            {faltantes.length > 0 && (
                <>
                    <p className="pendenciasTitulo">
                        {faltantes.length === 1 ? "Falta um dado no cadastro" : `Faltam ${faltantes.length} dados no cadastro`}
                    </p>
                    <p className="pendenciasAjuda">O documento não é gerado pela metade. Preencha o que falta e volte aqui.</p>
                    <ul className="pendenciasLista">
                        {faltantes.map((p) => <ItemPendencia key={p.variavel} pendencia={p} />)}
                    </ul>
                </>
            )}
        </div>
    );
}

function GerarDocumento({ modelo, totalSecoes, onFechar }) {
    const navigate = useNavigate();

    const [processos, setProcessos] = useState([]);
    const [filtroProcesso, setFiltroProcesso] = useState("");
    const [processoId, setProcessoId] = useState("");

    const [participantes, setParticipantes] = useState([]);
    const [carregandoParticipantes, setCarregandoParticipantes] = useState(false);
    const [clienteId, setClienteId] = useState("");

    const [incompat, setIncompat] = useState(null);
    const [pendencias, setPendencias] = useState([]);
    const [honorarioId, setHonorarioId] = useState("");
    const [conflito, setConflito] = useState(null);

    const [erro, setErro] = useState("");
    const [gerando, setGerando] = useState(false);

    useEffect(() => {
        buscarTudo(processService.listProcesses)
            .then(setProcessos)
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao buscar processos.")));
    }, []);

    useEffect(() => {
        setParticipantes([]);
        setClienteId("");
        setPendencias([]);
        setHonorarioId("");
        setConflito(null);
        setErro("");

        if (!processoId) return;

        let ativo = true;
        setCarregandoParticipantes(true);

        processService.listProcessClientes(processoId)
            .then((res) => {
                if (!ativo) return;
                const lista = res.data.data ?? res.data;
                const vinculos = Array.isArray(lista) ? lista : [];
                setParticipantes(vinculos);
                if (vinculos.length === 1) setClienteId(String(vinculos[0].clienteId?._id ?? vinculos[0].clienteId));
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Falha ao carregar os clientes do processo."));
            })
            .finally(() => {
                if (ativo) setCarregandoParticipantes(false);
            });

        return () => { ativo = false; };
    }, [processoId]);

    useEffect(() => {
        setIncompat(null);
        setPendencias([]);
        setHonorarioId("");
        setConflito(null);

        if (!clienteId) return;

        let ativo = true;

        documentService.compatibilidadeModelo(modelo._id, clienteId)
            .then((res) => {
                if (ativo) setIncompat(res.data?.compativel === false ? res.data : null);
            })
            .catch(() => {
                if (ativo) setIncompat(null);
            });

        return () => { ativo = false; };
    }, [modelo._id, clienteId]);

    const escolhaDeHonorario = pendencias.find((p) => p.variavel === "honorarioId" && Array.isArray(p.opcoes));
    const pendenciasDeCadastro = pendencias.filter((p) => p !== escolhaDeHonorario && !(escolhaDeHonorario && p.origem === "honorario"));

    const gerar = async (confirmarSobrescrita) => {
        setGerando(true);
        setErro("");

        try {
            const res = await documentService.gerarDocumento(modelo._id, {
                processoId,
                clienteId: clienteId || undefined,
                honorarioId: honorarioId || undefined,
                confirmarSobrescrita: confirmarSobrescrita || undefined,
            });
            toast.success("Documento gerado. Agora é revisar o texto final.");
            navigate(`/documentos/${res.data._id}`);
        } catch (err) {
            const status = err?.response?.status;

            if (status === 422) {
                const lista = getApiErrorPendencias(err);
                setPendencias(lista);
                if (lista.length === 0) setErro(getApiErrorMessage(err, "Há informações faltando no cadastro."));
                return;
            }

            if (status === 409) {
                setConflito(getApiErrorDetails(err) ?? {});
                return;
            }

            setErro(getApiErrorMessage(err, "Não foi possível gerar o documento."));
        } finally {
            setGerando(false);
        }
    };

    const enviar = (e) => {
        e.preventDefault();
        gerar(false);
    };

    const podeGerar = Boolean(processoId) && Boolean(clienteId) && totalSecoes !== 0 && !gerando;

    return (
        <div className="modalOverlay" onClick={onFechar}>
            <div className="modalCaixa gerarCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h2 className="modalTitulo"><TextoComAjuda texto={`Gerar "${modelo.nome}"`} assunto={AJUDA.gerar.assunto}>{AJUDA.gerar.texto}</TextoComAjuda></h2>

                {totalSecoes === 0 && (
                    <p className="avisoLacunas">Este modelo ainda não tem seções. Acrescente ao menos uma seção antes de gerar.</p>
                )}

                <form onSubmit={enviar} className="calendarioForm">
                    <div className="divLabelTop">
                        <label htmlFor="processoGerar">Processo</label>
                        <FiltroDeOpcoes valor={filtroProcesso} onChange={setFiltroProcesso} total={processos.length} placeholder="Buscar processo pelo título ou número..." />
                        <select
                            id="processoGerar"
                            className="select selectForm"
                            value={processoId}
                            onChange={(e) => setProcessoId(e.target.value)}
                            required
                        >
                            <option value="">Selecione um processo</option>
                            {filtrarOpcoes(processos, filtroProcesso, (p) => `${p.titulo ?? ""} ${p.numeroProcesso ?? ""} ${nomeDoCliente(p.clientePrincipalId)}`, processoId).map((p) => (
                                <option key={p._id} value={p._id}>{p.titulo} — {nomeDoCliente(p.clientePrincipalId)}{p.numeroProcesso ? ` — nº ${p.numeroProcesso}` : ""}</option>
                            ))}
                        </select>
                        <small className="notaCampo">Os dados deste processo preenchem as variáveis do modelo.</small>
                    </div>

                    <div className="divLabelTop">
                        <label htmlFor="clienteGerar">Cliente do processo</label>
                        <select
                            id="clienteGerar"
                            className="select selectForm"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            disabled={!processoId || carregandoParticipantes}
                            required
                        >
                            <option value="">
                                {!processoId ? "Escolha o processo primeiro" : carregandoParticipantes ? "Carregando clientes..." : "Selecione o cliente"}
                            </option>
                            {participantes.map((vinculo) => {
                                const cliente = vinculo.clienteId ?? {};
                                const id = String(cliente._id ?? vinculo.clienteId);
                                const documento = documentoDoCliente(cliente);
                                return (
                                    <option key={id} value={id}>
                                        {nomeDoCliente(cliente)} — {labelDe(PAPEL_PROCESSO_OPTIONS, vinculo.papel)}
                                        {vinculo.principal ? " (principal)" : ""}
                                        {documento ? ` · ${documento}` : ""}
                                    </option>
                                );
                            })}
                        </select>
                        <small className="notaCampo">Num processo com mais de um cliente, cada um recebe o próprio documento. O documento novo nasce oculto no portal até você liberar.</small>
                    </div>

                    {incompat && (
                        <div className="avisoGeracao">
                            <p className="pendenciasTitulo">
                                {incompat.totalVariaveis === 1
                                    ? "Uma variável deste modelo não serve para este cliente"
                                    : `${incompat.totalVariaveis} variáveis deste modelo não servem para este cliente`}
                            </p>
                            <p className="pendenciasAjuda">
                                {incompat.nomeCliente} é {incompat.tipoPessoaCliente === "fisica" ? "pessoa física" : "pessoa jurídica"}, e este modelo usa variáveis do outro tipo.
                            </p>
                            <ul className="pendenciasLista">
                                {incompat.secoes.map((secao) => (
                                    <li key={secao.secaoId} className="pendenciaItem">
                                        <span className="pendenciaRotulo">{secao.titulo}</span>
                                        <span className="pendenciaOrientacao">{secao.variaveis.map((v) => v.rotulo).join(", ")}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {escolhaDeHonorario && (
                        <div className="avisoGeracao">
                            <p className="pendenciasTitulo">{escolhaDeHonorario.rotulo}</p>
                            <p className="pendenciasAjuda">{escolhaDeHonorario.orientacao}</p>

                            <div className="opcoesHonorario">
                                {escolhaDeHonorario.opcoes.map((opcao) => {
                                    const id = String(opcao.honorarioId);
                                    return (
                                        <label key={id} className={`opcaoHonorario ${honorarioId === id ? "opcaoHonorario--ativa" : ""}`}>
                                            <input
                                                type="radio"
                                                name="honorario"
                                                value={id}
                                                checked={honorarioId === id}
                                                onChange={() => setHonorarioId(id)}
                                            />
                                            <span>
                                                <strong>{formatCurrency(opcao.valor)}</strong>
                                                {opcao.descricao ? ` — ${opcao.descricao}` : ""}
                                                <span className="infoSecundariaDetalhe">
                                                    {opcao.dataVencimento ? ` · vence em ${formatDate(opcao.dataVencimento)}` : ""}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <ListaPendencias pendencias={pendenciasDeCadastro} />

                    {conflito && (
                        <div className="avisoGeracao">
                            <p className="pendenciasTitulo">Este documento já foi gerado e editado à mão</p>
                            <p className="pendenciasAjuda">{textoDaSobrescrita(conflito)}</p>
                            <button title="Gera de novo e descarta as edições feitas à mão neste documento" type="button" className="modalBotao modalBotaoPerigo" onClick={() => gerar(true)} disabled={gerando}>
                                {gerando ? "Gerando..." : "Substituir mesmo assim"}
                            </button>
                        </div>
                    )}

                    {erro && <p className="mensagemErro">{erro}</p>}

                    <div className="modalAcoes calendarioFormAcoes">
                        <button type="button" className="buttonOutlined modalBotao" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="button modalBotao" disabled={!podeGerar || (escolhaDeHonorario && !honorarioId)}>
                            {gerando ? "Gerando..." : escolhaDeHonorario ? "Gerar com este honorário" : "Gerar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GerarDocumento;
