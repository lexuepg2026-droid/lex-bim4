import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Modal from "../../../components/Modal/Modal";

import documentService from "../../../services/documentService";
import secaoService from "../../../services/secaoService";

import { getApiErrorDetails, getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import { labelDe, TIPO_DOCUMENTO_OPTIONS, TIPO_SECAO_OPTIONS } from "../../../utils/enums";

import GerarDocumento from "./GerarDocumento";

import "./Documentos.css";

const mensagemDeErro = (err, fallback) => {
    const detalhes = getApiErrorDetails(err);
    if (Array.isArray(detalhes) && detalhes.length > 0) return detalhes.join(" ");
    return getApiErrorMessage(err, fallback);
};

const semAcento = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const secaoIdDe = (vinculo) => String(vinculo.secaoId?._id ?? vinculo.secaoId);

function MontagemModelo({ documento, onAtualizado }) {
    const navigate = useNavigate();
    const id = documento._id;

    const [vinculos, setVinculos] = useState([]);
    const [biblioteca, setBiblioteca] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [busca, setBusca] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");

    const [formEdicao, setFormEdicao] = useState(null);
    const [salvandoEdicao, setSalvandoEdicao] = useState(false);
    const [erroEdicao, setErroEdicao] = useState("");

    const [secaoParaRemover, setSecaoParaRemover] = useState(null);
    const [modalExcluir, setModalExcluir] = useState(false);
    const [gerarAberto, setGerarAberto] = useState(false);

    const recarregarVinculos = async () => {
        const res = await documentService.listDocumentSecoes(id);
        setVinculos(res.data.data ?? res.data);
    };

    useEffect(() => {
        let ativo = true;
        setCarregando(true);
        setErro("");

        Promise.all([documentService.listDocumentSecoes(id), buscarTudo(secaoService.listSecoes)])
            .then(([resVinculos, secoes]) => {
                if (!ativo) return;
                setVinculos(resVinculos.data.data ?? resVinculos.data);
                setBiblioteca(secoes);
            })
            .catch((err) => {
                if (ativo) setErro(getApiErrorMessage(err, "Falha ao carregar a montagem do modelo."));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => { ativo = false; };
    }, [id]);

    const idsUsados = new Set(vinculos.map(secaoIdDe));
    const termo = semAcento(busca.trim());

    const secoesDisponiveis = biblioteca.filter((secao) =>
        !idsUsados.has(String(secao._id))
        && (!tipoFiltro || secao.tipo === tipoFiltro)
        && (!termo || semAcento(secao.titulo).includes(termo) || semAcento(secao.texto).includes(termo))
    );

    const adicionarSecao = async (secao) => {
        setSalvando(true);
        try {
            await documentService.vincularSecao(id, { secaoId: secao._id });
            await recarregarVinculos();
            toast.success("Seção adicionada ao modelo.");
        } catch (err) {
            toast.error(mensagemDeErro(err, "Não foi possível adicionar a seção."));
        } finally {
            setSalvando(false);
        }
    };

    const moverSecao = async (indice, direcao) => {
        const alvo = indice + direcao;
        if (alvo < 0 || alvo >= vinculos.length) return;

        const anterior = vinculos;
        const novaOrdem = [...vinculos];
        [novaOrdem[indice], novaOrdem[alvo]] = [novaOrdem[alvo], novaOrdem[indice]];
        setVinculos(novaOrdem);

        setSalvando(true);
        try {
            await documentService.reordenarSecoes(id, novaOrdem.map(secaoIdDe));
        } catch (err) {
            setVinculos(anterior);
            toast.error(mensagemDeErro(err, "Não foi possível salvar a nova ordem."));
        } finally {
            setSalvando(false);
        }
    };

    const removerSecao = async () => {
        const secaoId = secaoParaRemover;
        setSecaoParaRemover(null);

        setSalvando(true);
        try {
            await documentService.desvincularSecao(id, secaoId);
            await recarregarVinculos();
            toast.success("Seção removida do modelo.");
        } catch (err) {
            toast.error(mensagemDeErro(err, "Não foi possível remover a seção."));
        } finally {
            setSalvando(false);
        }
    };

    const abrirEdicao = () => {
        setErroEdicao("");
        setFormEdicao({ nome: documento.nome, tipo: documento.tipo, descricao: documento.descricao ?? "" });
    };

    const salvarEdicao = async (e) => {
        e.preventDefault();
        setSalvandoEdicao(true);
        setErroEdicao("");
        try {
            const res = await documentService.updateDocument(id, {
                nome: formEdicao.nome.trim(),
                tipo: formEdicao.tipo,
                descricao: formEdicao.descricao.trim(),
            });
            onAtualizado(res.data);
            setFormEdicao(null);
            toast.success("Modelo atualizado com sucesso.");
        } catch (err) {
            setErroEdicao(mensagemDeErro(err, "Erro ao salvar o modelo."));
        } finally {
            setSalvandoEdicao(false);
        }
    };

    const excluirModelo = async () => {
        setModalExcluir(false);
        try {
            await documentService.deleteDocument(id);
            toast.success("Modelo excluído com sucesso.");
            navigate("/modelos");
        } catch (err) {
            toast.error(mensagemDeErro(err, "Erro ao excluir o modelo."));
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
                            {labelDe(TIPO_DOCUMENTO_OPTIONS, documento.tipo)} · Modelo reutilizável, sem processo e sem cliente
                        </p>
                        {documento.descricao && <p className="infoSecundariaDetalhe">{documento.descricao}</p>}
                    </div>

                    <div className="acoesDocumento">
                        <span className="infoSecundariaDetalhe">{salvando ? "Salvando..." : "Cada mudança salva sozinha"}</span>
                        <button title="Gerar um documento deste modelo para um processo" type="button" className="button botaoAcaoParticipante" onClick={() => setGerarAberto(true)}>
                            Gerar documento
                        </button>
                        <button type="button" className="botaoIcone" title="Editar modelo" onClick={abrirEdicao}>
                            <img src={lapis} alt="Editar modelo" />
                        </button>
                        <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir modelo" onClick={() => setModalExcluir(true)}>
                            <img src={lixeira} alt="Excluir modelo" />
                        </button>
                    </div>
                </div>

                {erro && <p className="mensagemErro">{erro}</p>}

                {carregando ? (
                    <p className="infoSecundariaDetalhe">Carregando...</p>
                ) : (
                    <div className="montagemGrade">
                        <section className="montagemColuna">
                            <h2 className="financeiroSubtitulo">Folha ({vinculos.length})</h2>
                            <p className="composicaoAjuda">O texto do documento sai destas seções, nesta ordem.</p>

                            {vinculos.length === 0 ? (
                                <p className="infoSecundariaDetalhe">A folha está vazia. Adicione seções da biblioteca ao lado.</p>
                            ) : (
                                <ol className="folhaLista">
                                    {vinculos.map((vinculo, indice) => (
                                        <li key={vinculo._id} className="folhaSecao">
                                            <div className="folhaSecaoTopo">
                                                <span className="folhaSecaoTitulo">{indice + 1}. {vinculo.secaoId?.titulo ?? "Seção removida da biblioteca"}</span>
                                                <span className="documentoSelo">{labelDe(TIPO_SECAO_OPTIONS, vinculo.secaoId?.tipo)}</span>

                                                <div className="acoesDocumento">
                                                    <button type="button" className="setaOrdem" disabled={salvando || indice === 0} onClick={() => moverSecao(indice, -1)} title="Mover para cima">↑</button>
                                                    <button type="button" className="setaOrdem" disabled={salvando || indice === vinculos.length - 1} onClick={() => moverSecao(indice, 1)} title="Mover para baixo">↓</button>
                                                    <button
                                                        type="button"
                                                        className="botaoIcone botaoIconePerigo"
                                                        title="Remover do modelo"
                                                        disabled={salvando}
                                                        onClick={() => setSecaoParaRemover(secaoIdDe(vinculo))}
                                                    >
                                                        <img src={lixeira} alt="Remover do modelo" />
                                                    </button>
                                                </div>
                                            </div>

                                            {vinculo.secaoId?.texto && <p className="folhaSecaoTexto">{vinculo.secaoId.texto}</p>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>

                        <section className="montagemColuna">
                            <h2 className="financeiroSubtitulo">Biblioteca de seções</h2>

                            <div className="bibliotecaFiltros">
                                <input
                                    type="text"
                                    className="financeiroBusca"
                                    placeholder="Buscar seção..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    maxLength={80}
                                />
                                <div className="select">
                                    <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
                                        <option value="">Todos os tipos</option>
                                        {TIPO_SECAO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {biblioteca.length === 0 ? (
                                <p className="infoSecundariaDetalhe">
                                    Você ainda não tem seções. Crie em <Link to="/modelos?aba=secoes">Meus modelos → Seções</Link>.
                                </p>
                            ) : secoesDisponiveis.length === 0 ? (
                                <p className="infoSecundariaDetalhe">Nenhuma seção disponível com esses filtros.</p>
                            ) : (
                                <ul className="bibliotecaLista">
                                    {secoesDisponiveis.map((secao) => (
                                        <li key={secao._id} className="bibliotecaItem">
                                            <div className="bibliotecaItemTopo">
                                                <span className="folhaSecaoTitulo">{secao.titulo}</span>
                                                <span className="documentoSelo">{labelDe(TIPO_SECAO_OPTIONS, secao.tipo)}</span>
                                            </div>
                                            <p className="secaoTextoPreview bibliotecaItemTexto">{secao.texto}</p>
                                            <button title="Adicionar esta seção ao fim do modelo" type="button" className="buttonOutlined botaoAcaoParticipante" disabled={salvando} onClick={() => adicionarSecao(secao)}>
                                                + Adicionar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}
            </div>

            {formEdicao && (
                <div className="modalOverlay" onClick={() => setFormEdicao(null)}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">Editar modelo</h2>

                        <form onSubmit={salvarEdicao} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="nomeModeloEdicao">Nome</label>
                                <input
                                    id="nomeModeloEdicao"
                                    type="text"
                                    value={formEdicao.nome}
                                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, nome: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="tipoModeloEdicao">Tipo</label>
                                <select
                                    id="tipoModeloEdicao"
                                    className="select selectForm"
                                    value={formEdicao.tipo}
                                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, tipo: e.target.value }))}
                                    required
                                >
                                    {TIPO_DOCUMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="descricaoModeloEdicao">Descrição (opcional)</label>
                                <input
                                    id="descricaoModeloEdicao"
                                    type="text"
                                    value={formEdicao.descricao}
                                    onChange={(e) => setFormEdicao((prev) => ({ ...prev, descricao: e.target.value }))}
                                />
                            </div>

                            {erroEdicao && <p className="mensagemErro">{erroEdicao}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={() => setFormEdicao(null)}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvandoEdicao}>
                                    {salvandoEdicao ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {gerarAberto && (
                <GerarDocumento modelo={documento} totalSecoes={vinculos.length} onFechar={() => setGerarAberto(false)} />
            )}

            <Modal
                aberto={Boolean(secaoParaRemover)}
                titulo="Remover seção"
                mensagem="A seção sai deste modelo, mas continua na sua biblioteca."
                perigo
                labelConfirmar="Remover"
                onConfirmar={removerSecao}
                onCancelar={() => setSecaoParaRemover(null)}
            />

            <Modal
                aberto={modalExcluir}
                titulo="Excluir modelo"
                mensagem="Tem certeza que deseja excluir este modelo? Os documentos já gerados a partir dele continuam existindo."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluirModelo}
                onCancelar={() => setModalExcluir(false)}
            />
        </div>
    );
}

export default MontagemModelo;
