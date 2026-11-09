import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import documentService from "../../../services/documentService";

import { getApiErrorDetails, getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { labelDe, TIPO_DOCUMENTO_OPTIONS } from "../../../utils/enums";

import { useRolagemInfinita } from "../../../hooks/useRolagemInfinita";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import EmptyState from "../../../components/EmptyState/EmptyState";

import SecoesLista from "./SecoesLista";
import GerarDocumento from "./GerarDocumento";
import "./Documentos.css";

const mensagemDeErro = (err, fallback) => {
    const detalhes = getApiErrorDetails(err);
    if (Array.isArray(detalhes) && detalhes.length > 0) return detalhes.join(" ");
    return getApiErrorMessage(err, fallback);
};

const EMPTY_MODELO = { nome: "", tipo: "", descricao: "" };

function MeusModelos() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [aba, setAba] = useState(searchParams.get("aba") === "secoes" ? "secoes" : "modelos");
    const [modelos, setModelos] = useState([]);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [formModelo, setFormModelo] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");

    const [modeloParaGerar, setModeloParaGerar] = useState(null);

    const carregar = (proxima) => {
        setCarregando(true);
        setErro("");
        documentService.listModelos({ page: proxima, limit: 20 })
            .then((res) => {
                const lista = res.data.data ?? res.data;
                setModelos((atual) => (proxima === 1 ? lista : [...atual, ...lista]));
                setPagina(proxima);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao buscar modelos.")))
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        carregar(1);
    }, []);

    const sentinela = useRolagemInfinita(pagina < totalPaginas && !erro, carregando, () => carregar(pagina + 1));

    const abrirNovoModelo = () => {
        setErroForm("");
        setFormModelo({ ...EMPTY_MODELO });
    };

    const fecharFormModelo = () => setFormModelo(null);

    const salvarModelo = async (e) => {
        e.preventDefault();
        setSalvando(true);
        setErroForm("");
        try {
            const res = await documentService.criarModelo(formModelo);
            toast.success("Modelo cadastrado. Agora monte o texto com as seções.");
            fecharFormModelo();
            navigate(`/documentos/${res.data._id}`);
        } catch (err) {
            setErroForm(mensagemDeErro(err, "Erro ao salvar modelo."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="tela telaModelos">
            <BotaoVoltar />

            <div className="modelosGrade">
                <aside className="modelosMenu">
                    <h1 className="modelosMenuTitulo">Meus modelos</h1>

                    <button title="Bases dos documentos, montadas com as seções" type="button" className={`detalheAba ${aba === "modelos" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("modelos")}>
                        Modelos
                    </button>

                    <button title="Trechos de texto reutilizáveis nos modelos" type="button" className={`detalheAba ${aba === "secoes" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("secoes")}>
                        Seções
                    </button>
                </aside>

                <div className="modelosConteudo">
                    {aba === "modelos" ? (
                        <div className="financeiroSecao">
                            <div className="financeiroSecaoCabecalho">
                                <h2 className="financeiroSubtitulo">Modelos</h2>
                                <button title="Cadastrar um modelo e montar o texto dele" type="button" className="button" onClick={abrirNovoModelo}>+ Novo modelo</button>
                            </div>

                            <p className="modelosIntro">
                                Um modelo é a base de um documento (uma procuração, um contrato) — monte o texto dele com as seções da sua biblioteca, na aba "Seções", e depois gere um documento a partir dele pra um processo.
                            </p>

                            {erro && <p className="mensagemErro">{erro}</p>}

                            {carregando && modelos.length === 0 ? (
                                <p className="infoSecundariaDetalhe">Carregando...</p>
                            ) : modelos.length === 0 ? (
                                <EmptyState titulo="Nenhum modelo cadastrado ainda." descricao="Clique em &quot;+ Novo modelo&quot; para montar o primeiro." />
                            ) : (
                                <ul className="listaParcelas">
                                    {modelos.map((modelo) => (
                                        <li key={modelo._id} className="linhaModelo">
                                            <Link to={`/documentos/${modelo._id}`}>{modelo.nome}</Link>
                                            <span className="documentoSelo">{labelDe(TIPO_DOCUMENTO_OPTIONS, modelo.tipo)}</span>
                                            <span className="infoSecundariaDetalhe">{modelo.descricao || "—"}</span>

                                            <div className="acoesDetalhe">
                                                <button title="Gerar um documento deste modelo para um processo" type="button" className="button botaoAcaoParticipante" onClick={() => setModeloParaGerar(modelo)}>
                                                    Gerar documento
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div ref={sentinela} />
                            {carregando && modelos.length > 0 && <p className="infoSecundariaDetalhe listaCarregandoMais">Carregando...</p>}
                        </div>
                    ) : (
                        <SecoesLista />
                    )}
                </div>
            </div>

            {formModelo && (
                <div className="modalOverlay" onClick={fecharFormModelo}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">Novo modelo</h2>

                        <form onSubmit={salvarModelo} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="nomeModelo">Nome</label>
                                <input
                                    id="nomeModelo"
                                    type="text"
                                    value={formModelo.nome}
                                    onChange={(e) => setFormModelo((prev) => ({ ...prev, nome: e.target.value }))}
                                    required
                                />
                                <small className="notaCampo">Ex.: Procuração ad judicia, Contrato de honorários.</small>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="tipoModelo">Tipo</label>
                                <select
                                    id="tipoModelo"
                                    className="select"
                                    value={formModelo.tipo}
                                    onChange={(e) => setFormModelo((prev) => ({ ...prev, tipo: e.target.value }))}
                                    required
                                >
                                    <option value="">Selecione</option>
                                    {TIPO_DOCUMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="descricaoModelo">Descrição (opcional)</label>
                                <input
                                    id="descricaoModelo"
                                    type="text"
                                    value={formModelo.descricao}
                                    onChange={(e) => setFormModelo((prev) => ({ ...prev, descricao: e.target.value }))}
                                />
                                <small className="notaCampo">Aparece na lista de modelos para diferenciar um do outro.</small>
                            </div>

                            {erroForm && <p className="mensagemErro">{erroForm}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharFormModelo}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>

                        <p className="infoSecundariaDetalhe" style={{ marginTop: "0.75rem" }}>
                            Depois de criar, você vai direto para a montagem do texto com as seções da sua biblioteca.
                        </p>
                    </div>
                </div>
            )}

            {modeloParaGerar && (
                <GerarDocumento modelo={modeloParaGerar} onFechar={() => setModeloParaGerar(null)} />
            )}
        </div>
    );
}

export default MeusModelos;