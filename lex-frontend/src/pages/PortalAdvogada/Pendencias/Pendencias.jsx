import { Fragment, useState } from "react";

import EmptyState from "../../../components/EmptyState/EmptyState";
import Modal from "../../../components/Modal/Modal";

import { useOutbox } from "../../../contexts/OutboxContext";

import { descreverEntrada, mensagemDeDescarte } from "../../../offline/outboxMessages";
import { formatUpdatedAt } from "../../../offline/dataAge";
import { formatDate } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";

import "./Pendencias.css";

const CAMPOS_COMPARAVEIS = [
    ["titulo", "Título"],
    ["data", "Data"],
    ["hora", "Hora"],
    ["local", "Local"],
    ["descricao", "Descrição"],
    ["fase", "Fase"],
    ["concluido", "Concluído"],
];

const valorLegivel = (campo, valor) => {
    if (valor === null || valor === undefined || valor === "") return "—";
    if (typeof valor === "boolean") return valor ? "sim" : "não";
    if (campo === "data") return formatDate(valor);
    return String(valor);
};

function ComparacaoDeVersoes({ minha, doServidor }) {
    const campos = CAMPOS_COMPARAVEIS.filter(
        ([campo]) => Object.prototype.hasOwnProperty.call(minha ?? {}, campo) || Object.prototype.hasOwnProperty.call(doServidor ?? {}, campo)
    );

    if (campos.length === 0) return null;

    return (
        <div className="pendenciaVersoes">
            {[["A sua versão", minha], ["O que está no servidor", doServidor]].map(([titulo, versao]) => (
                <div key={titulo} className="pendenciaVersao">
                    <h3>{titulo}</h3>
                    <dl>
                        {campos.map(([campo, rotulo]) => (
                            <Fragment key={campo}>
                                <dt>{rotulo}</dt>
                                <dd>{valorLegivel(campo, versao?.[campo])}</dd>
                            </Fragment>
                        ))}
                    </dl>
                </div>
            ))}
        </div>
    );
}

function Pendencias() {
    const { entradas, quantidade, enviando, online, enviar, tentarDeNovo, descartar, manterMinhaVersao } = useOutbox();
    const [descarteAberto, setDescarteAberto] = useState(null);

    const confirmarDescarte = async () => {
        const entrada = descarteAberto;
        setDescarteAberto(null);
        await descartar(entrada.id);
        toast.success("Alteração descartada.");
    };

    const manterMinha = async (entrada) => {
        await manterMinhaVersao(entrada.id);
        toast.success("Sua versão foi reenviada por cima da que estava no servidor.");
    };

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <div className="pendenciasTopo">
                    <h1 className="tituloPagina">Alterações não enviadas ({quantidade})</h1>
                    <button
                        type="button"
                        className="buttonOutlined"
                        onClick={enviar}
                        disabled={quantidade === 0 || enviando || !online}
                        title={online ? "Envia agora o que está na fila, sem esperar" : "Sem conexão: a fila sobe sozinha quando o sinal voltar"}
                    >
                        {enviando ? "Enviando..." : "Tentar enviar agora"}
                    </button>
                </div>

                <p className="notaCampo">
                    Aqui ficam os compromissos da agenda e as mudanças de fase salvos sem conexão neste aparelho. Eles são enviados na ordem em que foram feitos, e nada é descartado sem você decidir.
                </p>

                {!online && <p className="pendenciasSemSinal">Sem conexão. A fila sobe sozinha quando o sinal voltar.</p>}

                {quantidade === 0 ? (
                    <EmptyState titulo="Nada pendente." descricao="Toda alteração que você fez já chegou ao servidor." />
                ) : (
                    <ol className="pendenciasLista">
                        {entradas.map((entrada, indice) => {
                            const falhou = entrada.estado === "falhou";
                            const conflito = entrada.falha?.classificacao === "conflito";

                            return (
                                <li key={entrada.id} className={`pendenciaItem ${falhou ? "pendenciaItem--falhou" : ""}`}>
                                    <div className="pendenciaLinha">
                                        <span className="pendenciaOrdem" aria-hidden="true">{indice + 1}</span>
                                        <div className="pendenciaTextos">
                                            <p className="pendenciaDescricao">{descreverEntrada(entrada)}</p>
                                            <p className="pendenciaEstado">
                                                {falhou ? entrada.falha?.mensagem : `Aguardando envio — salva ${formatUpdatedAt(entrada.criadoEm) ?? ""}.`}
                                            </p>
                                        </div>

                                        <div className="pendenciaAcoes">
                                            {conflito ? (
                                                <>
                                                    <button type="button" className="button botaoAcaoParticipante" onClick={() => manterMinha(entrada)} title="Envia a sua versão por cima da que está no servidor">
                                                        Manter a minha versão
                                                    </button>
                                                    <button type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => setDescarteAberto(entrada)} title="Descarta a sua alteração e mantém a do servidor">
                                                        Ficar com a do servidor
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {falhou && (
                                                        <button type="button" className="button botaoAcaoParticipante" onClick={() => tentarDeNovo(entrada.id)} disabled={enviando} title="Tenta enviar esta alteração de novo">
                                                            Tentar de novo
                                                        </button>
                                                    )}
                                                    <button type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => setDescarteAberto(entrada)} title="Apaga esta alteração deste aparelho sem enviar">
                                                        Descartar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {conflito && <ComparacaoDeVersoes minha={entrada.body} doServidor={entrada.falha?.atual} />}
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>

            <Modal
                aberto={Boolean(descarteAberto)}
                titulo="Descartar alteração"
                mensagem={descarteAberto ? mensagemDeDescarte(descarteAberto) : ""}
                perigo
                labelConfirmar="Descartar"
                onConfirmar={confirmarDescarte}
                onCancelar={() => setDescarteAberto(null)}
            />
        </div>
    );
}

export default Pendencias;
