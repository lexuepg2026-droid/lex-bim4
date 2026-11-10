import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";

import { usePortalAuth } from "../../../contexts/PortalAuthContext";

import portalService from "../../../services/portalService";

import { getApiErrorMessage } from "../../../utils/apiError";

import {
    rotuloStatus, explicacaoStatus,
    rotuloFase, explicacaoFase,
    rotuloPapel, explicacaoPapel,
    rotuloTipoDocumento,
    formatarData, formatarDataHora,
} from "../../../utils/portalLabels";

import "./ProcessoPortal.css";
import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

function ProcessoPortal() {
    const { processoId } = useParams();
    const { sair } = usePortalAuth();

    const [processo, setProcesso] = useState(null);
    const [cliente, setCliente] = useState(null);
    const [acesso, setAcesso] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [confirmacao, setConfirmacao] = useState(null);
    const [historico, setHistorico] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [confirmando, setConfirmando] = useState(false);
    const [baixando, setBaixando] = useState(null);

    useEffect(() => {
        const carregar = async () => {
            setCarregando(true);
            setErro("");
            try {
                const [resProcesso, resDocumentos, resTexto, resHistorico] = await Promise.all([
                    portalService.obterProcesso(processoId),
                    portalService.listarDocumentos(processoId),
                    portalService.textoConfirmacao(),
                    portalService.listarConfirmacoes(processoId),
                ]);

                setProcesso(resProcesso.data.processo);
                setCliente(resProcesso.data.cliente);
                setAcesso(resProcesso.data.acesso);
                setDocumentos(resDocumentos.data.data);
                setConfirmacao(resTexto.data);
                setHistorico(resHistorico.data.data);
            } catch (err) {
                setErro(getApiErrorMessage(err, "Não foi possível carregar os dados do processo."));
            } finally {
                setCarregando(false);
            }
        };

        carregar();
    }, [processoId]);

    // Guarda de comportamento (R4): dois cliques no mesmo ciclo passavam pelo
    // `disabled` antes de o React redesenhar e gravavam duas confirmações. O
    // desenho do botão não muda.
    const enviandoConfirmacao = useRef(false);

    const confirmarLeitura = async () => {
        if (enviandoConfirmacao.current) return;
        enviandoConfirmacao.current = true;
        setConfirmando(true);
        setErro("");

        try {
            const res = await portalService.confirmar(processoId);
            setHistorico((atual) => [res.data, ...atual]);
            setAcesso((atual) => ({ ...atual, ultimaConfirmacao: res.data.dataHora }));
        } catch (err) {
            setErro(getApiErrorMessage(err, "Não foi possível registrar a confirmação."));
        } finally {
            enviandoConfirmacao.current = false;
            setConfirmando(false);
        }
    };

    const baixar = async (documento, formato) => {
        setBaixando(`${documento.id}-${formato}`);
        try {
            await portalService.baixarEsalvar(processoId, documento.id, formato);
        } catch {
            setErro("Não foi possível baixar o documento.");
        } finally {
            setBaixando(null);
        }
    };

    if (carregando) {
        return (
            <div className="telaPortal">
                <p className="info">Carregando...</p>
            </div>
        );
    }

    if (!processo) {
        return (
            <div className="telaPortal">
                <div className="cardPortal">
                    <p className="erroPortal">{erro || "Não foi possível carregar o processo."}</p>
                    <Link to="/portal/processo" className="buttonNoBorder">Ver os meus processos</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="telaPortal telaPortalProcesso">
            <div className="cardPortal cardPortalLargo">
                <div className="cabecalhoPortalProcesso">
                    <div>
                        <h1 className="tituloPortal tituloPortalEsquerda">Olá, {cliente.nome}</h1>
                        <p className="info infoEsquerda">
                            {rotuloPapel(processo.meuPapel)} — {explicacaoPapel(processo.meuPapel)}
                        </p>
                    </div>
                    <div className="acoesCabecalhoPortal">
                        <Link title="Voltar para a lista dos seus processos" to="/portal/processo" className="buttonNoBorder">Meus processos</Link>
                        <button title="Sair do portal" type="button" className="buttonNoBorder" onClick={sair}>Sair</button>
                    </div>
                </div>

                {erro && <p className="erroPortal">{erro}</p>}

                <div className="secaoPortal">
                    <h2>{processo.titulo}</h2>
                    <p className="linhaPortal"><strong>Número:</strong> {processo.numeroProcesso || "—"}</p>
                    <p className="linhaPortal"><strong>Situação:</strong> {rotuloStatus(processo.status)}</p>
                    <p className="infoSecundaria">{explicacaoStatus(processo.status)}</p>
                    {processo.fase && (
                        <>
                            <p className="linhaPortal"><strong>Fase:</strong> {rotuloFase(processo.fase)}</p>
                            <p className="infoSecundaria">{explicacaoFase(processo.fase)}</p>
                        </>
                    )}
                    {processo.transitoEmJulgadoEm && (
                        <p className="linhaPortal"><strong>Trânsito em julgado:</strong> {formatarData(processo.transitoEmJulgadoEm)} — não cabe mais recurso.</p>
                    )}
                    {processo.tipoAcao && <p className="linhaPortal"><strong>Tipo de ação:</strong> {processo.tipoAcao}</p>}
                    {processo.area && <p className="linhaPortal"><strong>Área:</strong> {processo.area}</p>}
                    {processo.orgao && <p className="linhaPortal"><strong>Órgão:</strong> {processo.orgao}</p>}
                    {processo.vara && <p className="linhaPortal"><strong>Vara:</strong> {processo.vara}</p>}
                    {processo.comarca && <p className="linhaPortal"><strong>Comarca:</strong> {processo.comarca}</p>}
                    {processo.dataDistribuicao && (
                        <p className="linhaPortal"><strong>Distribuído em:</strong> {formatarData(processo.dataDistribuicao)}</p>
                    )}
                    {processo.descricao && <p className="linhaPortal descricaoPortal">{processo.descricao}</p>}
                </div>

                <div className="secaoPortal">
                    <h2>Documentos</h2>
                    {documentos.length === 0 ? (
                        <p className="info">Nenhum documento liberado ainda.</p>
                    ) : (
                        <ul className="listaDocumentosPortal">
                            {documentos.map((documento) => (
                                <li key={documento.id} className="itemDocumentoPortal">
                                    <div>
                                        <p className="nomeDocumentoPortal">{documento.nome}</p>
                                        <p className="infoSecundaria">
                                            {rotuloTipoDocumento(documento.tipo)} — {formatarData(documento.dataGeracao)}
                                        </p>
                                    </div>
                                    <div className="botoesDocumentoPortal">
                                        {documento.formatosDisponiveis.map((formato) => (
                                            <button title={`Baixar este documento em ${formato.toUpperCase()}`}
                                                key={formato}
                                                type="button"
                                                className="buttonOutlined botaoBaixarPortal"
                                                onClick={() => baixar(documento, formato)}
                                                disabled={baixando === `${documento.id}-${formato}`}
                                            >
                                                {baixando === `${documento.id}-${formato}` ? "Baixando..." : formato.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="secaoPortal">
                    <h2>Confirmar que você está por dentro<Ajuda assunto={AJUDA.portalConfirmar.assunto}>{AJUDA.portalConfirmar.texto}</Ajuda></h2>
                    <p className="infoSecundaria">
                        {acesso?.ultimaConfirmacao
                            ? `Última confirmação em ${formatarDataHora(acesso.ultimaConfirmacao)}.`
                            : "Você ainda não confirmou que está acompanhando este processo."}
                    </p>

                    {confirmacao && <p className="textoConfirmacaoPortal">{confirmacao.texto}</p>}

                    <button
                        type="button"
                        className="button buttonConsultar"
                        onClick={confirmarLeitura}
                        disabled={confirmando}
                    >
                        {confirmando ? "Registrando..." : "Confirmar leitura"}
                    </button>
                </div>

                {historico.length > 0 && (
                    <div className="secaoPortal">
                        <h2>Histórico de confirmações</h2>
                        <ul className="listaHistoricoPortal">
                            {historico.map((item) => (
                                <li key={item.id} className="itemHistoricoPortal">
                                    <span>{formatarDataHora(item.dataHora)}</span>
                                    <span className="infoSecundaria">
                                        {rotuloStatus(item.instantaneo.statusProcesso)} · {item.instantaneo.quantidadeDocumentos} documento(s)
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ProcessoPortal;