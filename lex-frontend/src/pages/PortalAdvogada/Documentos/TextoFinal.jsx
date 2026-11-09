import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import lixeira from "../../../assets/images/icons/lixeira.svg";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Modal from "../../../components/Modal/Modal";

import documentService from "../../../services/documentService";

import { getApiErrorDetails, getApiErrorMessage, getApiErrorPendencias } from "../../../utils/apiError";
import { formatDate } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import useIsMounted from "../../../hooks/useIsMounted";
import { labelDe, TIPO_DOCUMENTO_OPTIONS, TIPO_SECAO_OPTIONS } from "../../../utils/enums";

import { ListaPendencias, textoDaSobrescrita } from "./GerarDocumento";

import "./Documentos.css";

const idDe = (valor) => {
    if (valor == null) return null;
    if (typeof valor === "object") return valor._id ? String(valor._id) : null;
    return String(valor);
};

const motivoParaNaoRegerar = (documento) => {
    if (documento.origem === "upload") return "Este documento veio de upload: não há seções de origem para regerar.";
    if (!idDe(documento.geradoDeModeloId)) return "Este documento não registra de qual modelo saiu, então não há o que regerar.";
    if (!idDe(documento.processoId)) return "Este documento não está vinculado a um processo.";
    return null;
};

function TextoFinal({ documento }) {
    const navigate = useNavigate();
    // A resposta tardia não age numa tela que a advogada já deixou: regerar e
    // sair levava de volta ao documento 3 s depois (fase R2, guarda da 3.9).
    const montado = useIsMounted();
    const id = documento._id;
    const areaRef = useRef(null);

    const [texto, setTexto] = useState("");
    const [textoSalvo, setTextoSalvo] = useState("");
    const [lacunas, setLacunas] = useState([]);
    const [editadoManualmente, setEditadoManualmente] = useState(documento.editadoManualmente === true);
    const [visivelPortal, setVisivelPortal] = useState(documento.visivelPortal === true);
    const [vinculos, setVinculos] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [baixando, setBaixando] = useState("");
    const [alternandoPortal, setAlternandoPortal] = useState(false);
    const [regerando, setRegerando] = useState(false);

    const [pendencias, setPendencias] = useState([]);
    const [conflito, setConflito] = useState(null);
    const [avisoNaoSalvo, setAvisoNaoSalvo] = useState(false);
    const [modalExcluir, setModalExcluir] = useState(false);

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro("");

        Promise.all([documentService.previewDocumento(id), documentService.listDocumentSecoes(id)])
            .then(([resPreview, resVinculos]) => {
                if (!ativo) return;
                const conteudo = resPreview.data.textoResolvido ?? "";
                setTexto(conteudo);
                setTextoSalvo(conteudo);
                setLacunas(Array.isArray(resPreview.data.lacunas) ? resPreview.data.lacunas : []);
                if (resPreview.data.editadoManualmente === true) setEditadoManualmente(true);
                const lista = resVinculos.data.data ?? resVinculos.data;
                setVinculos(Array.isArray(lista) ? lista : []);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Não foi possível carregar o texto do documento."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [id]);

    const sujo = texto !== textoSalvo;
    const impedimentoDeRegerar = motivoParaNaoRegerar(documento);

    const salvar = async () => {
        if (!sujo) return;
        setSalvando(true);
        try {
            const res = await documentService.atualizarTexto(id, texto);
            if (!montado.current) return;
            setTextoSalvo(texto);
            setEditadoManualmente(res.data?.editadoManualmente === true);
            setLacunas(Array.isArray(res.data?.lacunas) ? res.data.lacunas : []);
            toast.success("Texto final salvo.");
        } catch (err) {
            if (!montado.current) return;
            toast.error(getApiErrorMessage(err, "Não foi possível salvar o texto."));
        } finally {
            setSalvando(false);
        }
    };

    const baixar = async (formato) => {
        setBaixando(formato);
        try {
            const { nome } = await documentService.baixarEsalvar(id, formato);
            if (!montado.current) return;
            toast.success(`${nome} baixado.`);
        } catch (err) {
            if (!montado.current) return;
            toast.error(getApiErrorMessage(err, `Não foi possível baixar em ${formato.toUpperCase()}.`));
        } finally {
            setBaixando("");
        }
    };

    const alternarPortal = async () => {
        setAlternandoPortal(true);
        try {
            const res = await documentService.alternarVisibilidadePortal(id, !visivelPortal);
            if (!montado.current) return;
            setVisivelPortal(res.data?.visivelPortal === true);
            toast.success(res.data?.visivelPortal ? "Documento visível no portal do cliente." : "Documento oculto do portal do cliente.");
        } catch (err) {
            if (!montado.current) return;
            toast.error(getApiErrorMessage(err, "Não foi possível alterar a visibilidade."));
        } finally {
            setAlternandoPortal(false);
        }
    };

    const regerar = async (confirmarSobrescrita) => {
        setAvisoNaoSalvo(false);
        setRegerando(true);
        setPendencias([]);
        try {
            const res = await documentService.gerarDocumento(idDe(documento.geradoDeModeloId), {
                processoId: idDe(documento.processoId),
                clienteId: idDe(documento.clienteId) ?? undefined,
                honorarioId: idDe(documento.honorarioId) ?? undefined,
                confirmarSobrescrita: confirmarSobrescrita || undefined,
            });
            if (!montado.current) return;
            setConflito(null);
            toast.success("Documento regerado a partir das seções.");
            navigate(`/documentos/${res.data._id}`, { replace: true });
        } catch (err) {
            if (!montado.current) return;
            const status = err?.response?.status;

            if (status === 409) {
                setConflito(getApiErrorDetails(err) ?? {});
                return;
            }

            if (status === 422) {
                const lista = getApiErrorPendencias(err);
                if (lista.length > 0) {
                    setPendencias(lista);
                    return;
                }
            }

            toast.error(getApiErrorMessage(err, "Não foi possível regerar o documento."));
        } finally {
            setRegerando(false);
        }
    };

    const tentarRegerar = () => {
        if (sujo) {
            setAvisoNaoSalvo(true);
            return;
        }
        regerar(false);
    };

    const irParaLacuna = (lacuna) => {
        const area = areaRef.current;
        if (!area) return;
        area.focus();
        area.setSelectionRange(lacuna.inicio, lacuna.fim);
        const linhas = texto.slice(0, lacuna.inicio).split("\n").length;
        area.scrollTop = Math.max(0, (linhas - 6) * 22);
    };

    const excluirDocumento = async () => {
        setModalExcluir(false);
        try {
            await documentService.deleteDocument(id);
            if (!montado.current) return;
            toast.success("Documento excluído com sucesso.");
            navigate("/documentos");
        } catch (err) {
            if (!montado.current) return;
            toast.error(getApiErrorMessage(err, "Erro ao excluir documento."));
        }
    };

    return (
        <div className="tela telaClientes">
            <BotaoVoltar />

            <div className="baloesTelasAdvogada">
                <div className="detalheTopo">
                    <div>
                        <h1 className="tituloPagina">{documento.nome}</h1>
                        <p className="detalheSubtitulo">
                            {labelDe(TIPO_DOCUMENTO_OPTIONS, documento.tipo)}
                            {documento.dataGeracao ? ` · Gerado em ${formatDate(documento.dataGeracao)}` : ""}
                            {documento.processoId?.titulo && (
                                <> · <Link to={`/processos/detalhes/${documento.processoId._id}`}>{documento.processoId.titulo}</Link></>
                            )}
                        </p>

                        <div className="selosDocumento">
                            {editadoManualmente && <span className="documentoSelo">Editado à mão</span>}
                            {visivelPortal && <span className="documentoSelo documentoSeloPortal--visivel">No portal</span>}
                            {!editadoManualmente && !visivelPortal && <span className="documentoSelo">Gerado</span>}
                            {documento.substituidoPorId && <span className="documentoSelo">Substituído por uma versão mais nova</span>}
                            {sujo && <span className="documentoSelo documentoSelo--alerta">Alterações não salvas</span>}
                        </div>
                    </div>

                    <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir documento" onClick={() => setModalExcluir(true)}>
                        <img src={lixeira} alt="Excluir documento" />
                    </button>
                </div>

                <div className="acoesDocumento acoesDocumento--barra">
                    <button type="button" className="button botaoAcaoParticipante" onClick={salvar} disabled={!sujo || salvando}>
                        {salvando ? "Salvando..." : "Salvar"}
                    </button>
                    <button title="Baixar o documento em PDF" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => baixar("pdf")} disabled={Boolean(baixando)}>
                        {baixando === "pdf" ? "Baixando..." : "Baixar PDF"}
                    </button>
                    <button title="Baixar o documento em Word (DOCX)" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => baixar("docx")} disabled={Boolean(baixando)}>
                        {baixando === "docx" ? "Baixando..." : "Baixar DOCX"}
                    </button>
                    <button title={visivelPortal ? "O cliente deixa de ver este documento no portal" : "O cliente para quem o documento foi gerado poderá baixá-lo no portal"} type="button" className="buttonOutlined botaoAcaoParticipante" onClick={alternarPortal} disabled={alternandoPortal}>
                        {visivelPortal ? "Ocultar do portal" : "Liberar no portal"}
                    </button>
                    <button
                        type="button"
                        className="buttonOutlined botaoAcaoParticipante"
                        onClick={tentarRegerar}
                        disabled={regerando || Boolean(impedimentoDeRegerar)}
                        title={impedimentoDeRegerar ?? "Recompõe o texto a partir das seções atuais do modelo"}
                    >
                        {regerando ? "Regerando..." : "Regerar"}
                    </button>
                </div>

                {erro && <p className="mensagemErro">{erro}</p>}

                <ListaPendencias pendencias={pendencias} />

                {carregando ? (
                    <p className="infoSecundariaDetalhe">Carregando...</p>
                ) : (
                    <div className="textoFinalGrade">
                        <textarea
                            ref={areaRef}
                            className="textoFinalArea"
                            rows={22}
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                        />

                        <aside className="textoFinalLateral">
                            <h2 className="financeiroSubtitulo">Lacunas ({lacunas.length})</h2>
                            {lacunas.length === 0 ? (
                                <p className="infoSecundariaDetalhe">Nenhum trecho a preencher.</p>
                            ) : (
                                <ul className="lacunasLista">
                                    {lacunas.map((lacuna) => (
                                        <li key={`${lacuna.tipo}-${lacuna.inicio}`}>
                                            <button title="Ir até este ponto do texto" type="button" className="lacunaItem" onClick={() => irParaLacuna(lacuna)}>
                                                <span className="pendenciaRotulo">{lacuna.rotulo} · linha {lacuna.linha}</span>
                                                <span className="infoSecundariaDetalhe">{lacuna.contexto}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {lacunas.length > 0 && sujo && (
                                <p className="infoSecundariaDetalhe">Salve para atualizar a lista de lacunas.</p>
                            )}

                            <h2 className="financeiroSubtitulo">Seções de origem</h2>
                            {vinculos.length === 0 ? (
                                <p className="infoSecundariaDetalhe">Sem registro de seções.</p>
                            ) : (
                                <ol className="origemLista">
                                    {vinculos.map((vinculo) => (
                                        <li key={vinculo._id}>
                                            {vinculo.secaoId?.titulo ?? "Seção removida da biblioteca"}
                                            {vinculo.secaoId?.tipo && <span className="infoSecundariaDetalhe"> · {labelDe(TIPO_SECAO_OPTIONS, vinculo.secaoId.tipo)}</span>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            <Modal
                aberto={avisoNaoSalvo}
                titulo="Alterações não salvas"
                mensagem="Regerar recompõe o texto a partir das seções e descarta o que você digitou e ainda não salvou. Deseja continuar?"
                perigo
                labelConfirmar="Regerar mesmo assim"
                onConfirmar={() => regerar(false)}
                onCancelar={() => setAvisoNaoSalvo(false)}
            />

            <Modal
                aberto={Boolean(conflito)}
                titulo="Substituir o texto editado?"
                mensagem={textoDaSobrescrita(conflito)}
                perigo
                labelConfirmar="Substituir"
                onConfirmar={() => regerar(true)}
                onCancelar={() => setConflito(null)}
            />

            <Modal
                aberto={modalExcluir}
                titulo="Excluir documento"
                mensagem="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluirDocumento}
                onCancelar={() => setModalExcluir(false)}
            />
        </div>
    );
}

export default TextoFinal;
