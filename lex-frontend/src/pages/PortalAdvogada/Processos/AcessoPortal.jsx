import { useState, useEffect } from "react";

import processService from "../../../services/processService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";

const ENDERECO_PORTAL = `${window.location.origin}/portal`;

const montarMensagem = (codigo, nomeProcesso) => (
    `Olá! Você pode acompanhar os seus processos${nomeProcesso ? ` — entre eles, ${nomeProcesso} —` : ""} pelo portal do escritório.\n\n` +
    `Endereço: ${ENDERECO_PORTAL}\n` +
    `Código de acesso: ${codigo}\n\n` +
    "A senha vai por outro canal, por segurança. No primeiro acesso o sistema vai pedir que você troque essa senha por uma que só você conheça."
);

const copiar = async (texto, oQue) => {
    try {
        await navigator.clipboard.writeText(texto);
        toast.success(`${oQue} copiado.`);
    } catch {
        toast.error(`Não foi possível copiar. ${oQue} está na tela para você selecionar.`);
    }
};

export function LiberacaoPortal({ processoId, clienteId, nomeCliente, liberado, onAlterado }) {
    const [confirmando, setConfirmando] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const gravar = async (valor) => {
        setEnviando(true);
        try {
            await processService.setLiberacaoNoPortal(processoId, clienteId, valor);
            toast.success(valor ? `Processo liberado no portal para ${nomeCliente}.` : `${nomeCliente} deixou de ver este processo no portal.`);
            setConfirmando(false);
            onAlterado(valor);
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível alterar a liberação."));
        } finally {
            setEnviando(false);
        }
    };

    const alternar = () => {
        if (enviando) return;
        if (liberado) setConfirmando(true);
        else gravar(true);
    };

    return (
        <span className="liberacaoPortal">
            <button title={liberado ? "O cliente vê este processo no portal. Clique para desligar" : "Clique para o cliente ver este processo no portal"}
                type="button"
                role="switch"
                aria-checked={liberado}
                className={`liberacaoPortalControle ${liberado ? "liberacaoPortalControle--sim" : ""}`}
                onClick={alternar}
                disabled={enviando}
            >
                <span className="liberacaoPortalTrilho" aria-hidden="true">
                    <span className="liberacaoPortalBotao" />
                </span>
                Liberado no portal: {liberado ? "sim" : "não"}
            </button>

            {confirmando && (
                <span className="liberacaoPortalConfirmacao">
                    <span className="infoSecundariaDetalhe">{nomeCliente} deixa de ver este processo no portal.</span>
                    <button title="O cliente deixa de ver este processo no portal" type="button" className="modalBotao modalBotaoPerigo botaoAcaoParticipante" onClick={() => gravar(false)} disabled={enviando}>
                        {enviando ? "Desligando..." : "Desligar"}
                    </button>
                    <button type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => setConfirmando(false)}>
                        Cancelar
                    </button>
                </span>
            )}
        </span>
    );
}

export function EntregaAcesso({ processoId, clienteId, nomeCliente, nomeProcesso, onLiberado, onFechar }) {
    const [acesso, setAcesso] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [liberando, setLiberando] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        let ativo = true;

        processService.getProcessClienteCodigoAcesso(processoId, clienteId)
            .then((res) => {
                if (!ativo) return;
                setAcesso({
                    codigo: res.data.codigoAcesso ?? "",
                    liberadoNoPortal: res.data.liberadoNoPortal === true,
                    temSenhaPortal: res.data.temSenhaPortal === true,
                    senhaPortalProvisoria: res.data.senhaPortalProvisoria === true,
                });
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível obter o código de acesso."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [processoId, clienteId]);

    const liberar = async () => {
        setLiberando(true);
        try {
            await processService.setLiberacaoNoPortal(processoId, clienteId, true);
            setAcesso((atual) => ({ ...atual, liberadoNoPortal: true }));
            toast.success(`Processo liberado no portal para ${nomeCliente}.`);
            onLiberado();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível liberar o processo."));
        } finally {
            setLiberando(false);
        }
    };

    return (
        <div className="entregaAcesso">
            <div className="entregaAcessoCabecalho">
                <strong>Entregar acesso a {nomeCliente}</strong>
                <button type="button" className="buttonOutlined botaoAcaoParticipante" onClick={onFechar}>Fechar</button>
            </div>

            {carregando && <p className="infoSecundariaDetalhe">Buscando o código...</p>}
            {erro && <p className="mensagemErro">{erro}</p>}

            {acesso && !acesso.temSenhaPortal && (
                <p className="entregaAcessoAviso">
                    <strong>{nomeCliente} ainda não tem acesso ao portal.</strong> Defina uma senha provisória no cadastro do cliente: o código pessoal é criado junto com ela.
                </p>
            )}

            {acesso?.temSenhaPortal && (
                <p className="entregaAcessoAviso">
                    {acesso.liberadoNoPortal ? (
                        <>Este processo <strong>está liberado</strong> no portal para {nomeCliente}.</>
                    ) : (
                        <>
                            Este processo <strong>ainda não está liberado</strong> no portal: com o código abaixo, {nomeCliente} entra e não o vê.{" "}
                            <button title="O cliente passa a ver este processo no portal" type="button" className="button botaoAcaoParticipante" onClick={liberar} disabled={liberando}>
                                {liberando ? "Liberando..." : "Liberar este processo"}
                            </button>
                        </>
                    )}
                    {acesso.senhaPortalProvisoria && <> A senha ainda é a <strong>provisória</strong>: no primeiro acesso o portal pede a troca.</>}
                </p>
            )}

            {acesso?.codigo && (
                <>
                    <p className="infoSecundariaDetalhe">Código de acesso pessoal de {nomeCliente}. É o mesmo para todos os processos dele: ao liberar outro processo, não é preciso mandar um código novo.</p>
                    <p className="entregaAcessoCodigo">{acesso.codigo}</p>

                    <div className="acoesEntregaAcesso">
                        <button title="Copiar o código de acesso" type="button" className="button botaoAcaoParticipante" onClick={() => copiar(acesso.codigo, "Código")}>
                            Copiar só o código
                        </button>
                        <button title="Copiar uma mensagem pronta com o código para enviar ao cliente" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => copiar(montarMensagem(acesso.codigo, nomeProcesso), "Texto da mensagem")}>
                            Copiar mensagem pronta
                        </button>
                    </div>

                    <p className="entregaAcessoAviso">
                        <strong>Envie a senha por outro canal.</strong> A mensagem pronta traz o endereço e o código, mas não a senha: diga a senha por telefone ou por um aplicativo diferente do que usar para mandar este texto.
                    </p>

                    <pre className="entregaAcessoPrevia">{montarMensagem(acesso.codigo, nomeProcesso)}</pre>
                </>
            )}
        </div>
    );
}

export function ConfirmacoesDoProcesso({ processoId }) {
    const [confirmacoes, setConfirmacoes] = useState(null);
    const [carregando, setCarregando] = useState(false);

    const abrir = async () => {
        setCarregando(true);
        try {
            const res = await processService.listProcessConfirmacoes(processoId);
            const lista = res.data.data ?? res.data;
            setConfirmacoes(Array.isArray(lista) ? lista : []);
            if (Array.isArray(lista) && lista.some((c) => c.vistaPelaAdvogada === false)) {
                processService.marcarConfirmacoesVistas(processoId).catch(() => {});
            }
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Não foi possível carregar as confirmações."));
        } finally {
            setCarregando(false);
        }
    };

    const dataHora = (iso) => (iso
        ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—");

    const nome = (cliente) => cliente?.nomeCompleto || cliente?.razaoSocial || "Participante";

    return (
        <div className="confirmacoesProcesso">
            <div className="financeiroSecaoCabecalho">
                <h3 className="financeiroSubtitulo">Confirmações de leitura do cliente</h3>
                {confirmacoes === null && (
                    <button title="Ver quando os clientes confirmaram que estão acompanhando o processo" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={abrir} disabled={carregando}>
                        {carregando ? "Carregando..." : "Ver confirmações"}
                    </button>
                )}
            </div>

            {confirmacoes !== null && (confirmacoes.length === 0 ? (
                <p className="infoSecundariaDetalhe">Nenhum cliente confirmou ter visto este processo no portal ainda.</p>
            ) : (
                <ul className="listaConfirmacoes">
                    {confirmacoes.map((c) => (
                        <li key={c._id} className="itemConfirmacao">
                            <span className="nomeParticipante">
                                {nome(c.clienteId)}
                                {c.vistaPelaAdvogada === false && <span className="badgePrincipal">Nova</span>}
                            </span>
                            <span className="infoSecundariaDetalhe">{dataHora(c.dataHora)}</span>
                            <span className="infoSecundariaDetalhe">
                                Na ocasião: processo {c.instantaneo?.statusProcesso ?? "—"}, {c.instantaneo?.quantidadeDocumentos === 1 ? "1 documento visível" : `${c.instantaneo?.quantidadeDocumentos ?? 0} documentos visíveis`}
                            </span>
                            {c.textoConfirmado && <pre className="entregaAcessoPrevia">{c.textoConfirmado}</pre>}
                        </li>
                    ))}
                </ul>
            ))}
        </div>
    );
}
