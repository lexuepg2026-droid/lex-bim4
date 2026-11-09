import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import clientService from "../../../services/clientService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { formatDate } from "../../../utils/formatters";
import { labelDe, PAPEL_PROCESSO_OPTIONS } from "../../../utils/enums";

import { LiberacaoPortal, EntregaAcesso } from "../Processos/AcessoPortal";
import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

const dataHora = (iso) => (iso
    ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null);

const rotuloDoProcesso = (item) => {
    const numero = item.numeroProcesso?.trim() ?? "";
    const titulo = item.titulo?.trim() ?? "";
    if (numero && titulo) return `${numero} — ${titulo}`;
    return numero || titulo || "(sem título)";
};

const situacaoNoPortal = (item, temSenhaPortal) => {
    if (item.processoAtivo === false) return { texto: "Processo desativado", podeLiberar: false };
    if (item.vinculoAtivo === false) return { texto: "Removido do processo", podeLiberar: false };
    if (!temSenhaPortal) return { texto: "Sem acesso ao portal", podeLiberar: false };
    return { texto: null, podeLiberar: true };
};

function PortalDoCliente({ clienteId, nomeCliente }) {
    const [acesso, setAcesso] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [entregaAberta, setEntregaAberta] = useState(null);

    useEffect(() => {
        let ativo = true;

        clientService.getAcessoPortal(clienteId)
            .then((res) => {
                if (ativo) setAcesso(res.data);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível consultar o acesso ao portal."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [clienteId]);

    const marcarLiberacao = (processoId, valor) => {
        setAcesso((atual) => ({
            ...atual,
            processos: atual.processos.map((p) => (String(p.processoId) === String(processoId) ? { ...p, liberadoNoPortal: valor } : p)),
            processosLiberados: atual.processosLiberados + (valor ? 1 : -1),
        }));
    };

    if (carregando) return <p className="detalheCarregando">Consultando o acesso ao portal…</p>;
    if (erro) return <p className="mensagemErro">{erro}</p>;
    if (!acesso) return null;

    return (
        <div className="secaoDetalhe">
            {acesso.temSenhaPortal ? (
                <div className="resumoPortalCliente">
                    <p><strong>Código de acesso pessoal:</strong> <span className="entregaAcessoCodigo">{acesso.codigoAcessoPessoal}</span><Ajuda assunto={AJUDA.clientePortal.assunto}>{AJUDA.clientePortal.texto}</Ajuda></p>
                    <p>
                        <strong>Senha:</strong>{" "}
                        {acesso.senhaPortalProvisoria
                            ? "provisória — o portal pede a troca no primeiro acesso"
                            : `definida pelo cliente${acesso.senhaPortalDefinidaEm ? ` em ${formatDate(acesso.senhaPortalDefinidaEm)}` : ""}`}
                    </p>
                    <p>
                        <strong>Processos no portal:</strong> {acesso.processosLiberados} de {acesso.processosAtivos} {acesso.processosAtivos === 1 ? "processo liberado" : "processos liberados"}
                    </p>
                    <Link title="Abre o cadastro do cliente para trocar ou revogar a senha do portal" to={`/clientes/editar/${clienteId}`} className="buttonOutlined botaoAcaoParticipante">
                        Trocar ou revogar a senha
                    </Link>
                </div>
            ) : (
                <div className="resumoPortalCliente">
                    <p><strong>Sem acesso ao portal.</strong></p>
                    <p>Para dar acesso, defina uma senha provisória no cadastro do cliente: o código pessoal é criado junto com ela.</p>
                    <Link title="Abre o cadastro do cliente para criar a senha do portal" to={`/clientes/editar/${clienteId}`} className="buttonOutlined botaoAcaoParticipante">
                        Definir a senha provisória
                    </Link>
                </div>
            )}

            <p className="notaCampo">Um código e uma senha por pessoa: com eles o cliente entra no portal e vê todos os processos que você liberar aqui, um por um. Os não liberados continuam ocultos.</p>

            <h3 className="financeiroSubtitulo">Processos deste cliente ({acesso.processos.length})</h3>

            {acesso.processos.length === 0 ? (
                <p className="infoSecundariaDetalhe">Este cliente não participa de nenhum processo.</p>
            ) : (
                <ul className="listaParticipantes">
                    {acesso.processos.map((item) => {
                        const processoId = String(item.processoId);
                        const situacao = situacaoNoPortal(item, acesso.temSenhaPortal);
                        const ultimoAcesso = dataHora(item.ultimoAcessoPortal);

                        return (
                            <li key={processoId} className="itemParticipante">
                                <div className="itemParticipanteInfo">
                                    <span className="nomeParticipante">
                                        <Link to={`/processos/detalhes/${processoId}`}>{rotuloDoProcesso(item)}</Link>
                                        {item.principal && <span className="badgePrincipal">Principal</span>}
                                    </span>
                                    <span className="infoSecundariaDetalhe">
                                        {labelDe(PAPEL_PROCESSO_OPTIONS, item.papel)} · {ultimoAcesso ? `último acesso: ${ultimoAcesso}` : "nunca acessou este processo"}
                                    </span>
                                    {situacao.texto && <span className="infoSecundariaDetalhe">{situacao.texto}</span>}
                                    {situacao.podeLiberar && (
                                        <LiberacaoPortal
                                            processoId={processoId}
                                            clienteId={clienteId}
                                            nomeCliente={nomeCliente}
                                            liberado={item.liberadoNoPortal === true}
                                            onAlterado={(valor) => marcarLiberacao(processoId, valor)}
                                        />
                                    )}
                                </div>

                                {situacao.podeLiberar && (
                                    <button title="Mostra o código pessoal do cliente e a mensagem pronta para enviar"
                                        type="button"
                                        className="buttonOutlined botaoAcaoParticipante"
                                        onClick={() => setEntregaAberta(entregaAberta === processoId ? null : processoId)}
                                    >
                                        Entregar acesso
                                    </button>
                                )}

                                {entregaAberta === processoId && (
                                    <EntregaAcesso
                                        processoId={processoId}
                                        clienteId={clienteId}
                                        nomeCliente={nomeCliente}
                                        nomeProcesso={item.titulo}
                                        onLiberado={() => marcarLiberacao(processoId, true)}
                                        onFechar={() => setEntregaAberta(null)}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default PortalDoCliente;
