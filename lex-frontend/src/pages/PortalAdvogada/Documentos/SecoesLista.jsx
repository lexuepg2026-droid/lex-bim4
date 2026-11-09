import { useState, useEffect, useRef } from "react";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import { useRolagemInfinita } from "../../../hooks/useRolagemInfinita";

import Modal from "../../../components/Modal/Modal";
import EmptyState from "../../../components/EmptyState/EmptyState";

import secaoService from "../../../services/secaoService";
import documentService from "../../../services/documentService";

import { getApiErrorMessage } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";
import { labelDe, TIPO_SECAO_OPTIONS } from "../../../utils/enums";

import "./Documentos.css";

const EMPTY_SECAO = { titulo: "", tipo: "", texto: "" };

function SecoesLista() {
    const [secoes, setSecoes] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [busca, setBusca] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");

    const [form, setForm] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");
    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });
    const textoRef = useRef(null);
    const ultimaBusca = useRef(0);

    const carregar = (proxima) => {
        const numero = ++ultimaBusca.current;
        setCarregando(true);
        setErro("");
        secaoService.listSecoes({ page: proxima, limit: 20, busca: busca || undefined, tipo: tipoFiltro || undefined })
            .then((res) => {
                if (numero !== ultimaBusca.current) return;
                const lista = res.data.data ?? res.data;
                setSecoes((atual) => (proxima === 1 ? lista : [...atual, ...lista]));
                setPagina(proxima);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => {
                if (numero === ultimaBusca.current) setErro(getApiErrorMessage(err, "Falha ao buscar seções."));
            })
            .finally(() => {
                if (numero === ultimaBusca.current) setCarregando(false);
            });
    };

    useEffect(() => {
        carregar(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busca, tipoFiltro]);

    const sentinela = useRolagemInfinita(pagina < totalPaginas && !erro, carregando, () => carregar(pagina + 1));

    useEffect(() => {
        documentService.listarVariaveis()
            .then((res) => setCatalogo(res.data.grupos ?? []))
            .catch(() => {});
    }, []);

    const abrirNovo = () => {
        setErroForm("");
        setForm({ ...EMPTY_SECAO, _id: null });
    };

    const abrirEdicao = (secao) => {
        setErroForm("");
        setForm({ _id: secao._id, titulo: secao.titulo, tipo: secao.tipo, texto: secao.texto });
    };

    const fecharForm = () => setForm(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const inserirVariavel = (chave) => {
        const area = textoRef.current;
        const marcador = `{{${chave}}}`;
        const inicio = area ? area.selectionStart : form.texto.length;
        const fim = area ? area.selectionEnd : form.texto.length;

        setForm((prev) => ({ ...prev, texto: prev.texto.slice(0, inicio) + marcador + prev.texto.slice(fim) }));

        requestAnimationFrame(() => {
            if (!area) return;
            area.focus();
            area.setSelectionRange(inicio + marcador.length, inicio + marcador.length);
        });
    };

    const salvar = async (e) => {
        e.preventDefault();

        const isEditing = Boolean(form._id);
        setSalvando(true);
        setErroForm("");
        try {
            const payload = { titulo: form.titulo.trim(), tipo: form.tipo, texto: form.texto };
            if (isEditing) {
                await secaoService.updateSecao(form._id, payload);
                toast.success("Seção atualizada com sucesso.");
            } else {
                await secaoService.createSecao(payload);
                toast.success("Seção cadastrada com sucesso.");
            }
            fecharForm();
            carregar(1);
        } catch (err) {
            setErroForm(getApiErrorMessage(err, "Erro ao salvar seção."));
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExcluir = (id) => setModalExcluir({ aberto: true, id });

    const excluir = async () => {
        const { id } = modalExcluir;
        setModalExcluir({ aberto: false, id: null });
        try {
            await secaoService.deleteSecao(id);
            toast.success("Seção excluída com sucesso.");
            carregar(1);
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao excluir seção."));
        }
    };

    return (
        <div className="financeiroSecao">
            <div className="financeiroSecaoCabecalho">
                <h2 className="financeiroSubtitulo">Seções</h2>
                <button title="Cadastrar um trecho de texto para usar nos modelos" type="button" className="button" onClick={abrirNovo}>+ Nova seção</button>
            </div>

            <div className="linhaFiltros">
                <input
                    type="text"
                    className="financeiroBusca"
                    placeholder="Buscar por título..."
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

            {erro && <p className="mensagemErro">{erro}</p>}

            {carregando && secoes.length === 0 ? (
                <p className="infoSecundariaDetalhe">Carregando...</p>
            ) : secoes.length === 0 ? (
                <EmptyState titulo="Nenhuma seção encontrada." descricao="Ajuste a busca ou crie uma nova seção." />
            ) : (
                <ul className="listaParcelas">
                    {secoes.map((secao) => (
                        <li key={secao._id} className="linhaSecao">
                            <span>{secao.titulo}</span>
                            <span className="documentoSelo">{labelDe(TIPO_SECAO_OPTIONS, secao.tipo)}</span>
                            <span className="secaoTextoPreview">{secao.texto}</span>
                            <span className="secaoContadorVariaveis">{(secao.variaveis ?? []).length} variável(is)</span>

                            <div className="acoesDetalhe">
                                <button type="button" className="botaoIcone" title="Editar" onClick={() => abrirEdicao(secao)}>
                                    <img src={lapis} alt="Editar" />
                                </button>
                                <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir" onClick={() => confirmarExcluir(secao._id)}>
                                    <img src={lixeira} alt="Excluir" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div ref={sentinela} />
            {carregando && secoes.length > 0 && <p className="infoSecundariaDetalhe listaCarregandoMais">Carregando...</p>}

            {form && (
                <div className="modalOverlay" onClick={fecharForm}>
                    <div className="modalCaixa calendarioFormCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "40rem" }}>
                        <h2 className="modalTitulo">{form._id ? "Editar seção" : "Nova seção"}</h2>

                        <form onSubmit={salvar} className="calendarioForm">
                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="tituloSecao">Título</label>
                                    <input
                                        id="tituloSecao"
                                        name="titulo"
                                        type="text"
                                        maxLength={120}
                                        value={form.titulo}
                                        onChange={handleChange}
                                        required
                                    />
                                    <small className="notaCampo">Nome para achar a seção na biblioteca. Não pode repetir o de outra seção.</small>
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="tipoSecao">Tipo</label>
                                    <select
                                        id="tipoSecao"
                                        name="tipo"
                                        className="select"
                                        value={form.tipo}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {TIPO_SECAO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <small className="notaCampo">Usado para filtrar a biblioteca na montagem do modelo.</small>
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="textoSecao">Texto</label>
                                <textarea
                                    ref={textoRef}
                                    id="textoSecao"
                                    name="texto"
                                    rows={8}
                                    value={form.texto}
                                    onChange={handleChange}
                                    required
                                />
                                <small className="notaCampo">As variáveis são trocadas pelos dados do cliente, do processo e do escritório quando o documento é gerado. Use só as da lista abaixo: nomes diferentes são recusados ao salvar.</small>
                            </div>

                            {catalogo.length > 0 && (
                                <div className="catalogoVariaveis">
                                    <p className="catalogoVariaveisAjuda">Clique para inserir a variável onde está o cursor no texto:</p>
                                    {catalogo.map((grupo) => (
                                        <div key={grupo.origem} className="catalogoVariaveisGrupo">
                                            <p className="catalogoVariaveisGrupoTitulo">{grupo.rotulo}</p>
                                            <div className="catalogoVariaveisLista">
                                                {grupo.variaveis.map((v) => (
                                                    <button
                                                        type="button"
                                                        key={v.chave}
                                                        className="variavelBotao"
                                                        title={v.descricao}
                                                        onClick={() => inserirVariavel(v.chave)}
                                                    >
                                                        {`{{${v.chave}}}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {erroForm && <p className="mensagemErro">{erroForm}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharForm}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Modal
                aberto={modalExcluir.aberto}
                titulo="Excluir seção"
                mensagem="Tem certeza que deseja excluir esta seção? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null })}
            />
        </div>
    );
}

export default SecoesLista;