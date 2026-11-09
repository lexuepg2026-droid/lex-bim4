import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import Modal from "../../../components/Modal/Modal";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import EmptyState from "../../../components/EmptyState/EmptyState";
import ContextoDoProcesso from "../../../components/ContextoDoProcesso/ContextoDoProcesso";
import CampoDinheiro from "../../../components/CampoDinheiro/CampoDinheiro";

import feeService from "../../../services/feeService";
import processService from "../../../services/processService";

import { getApiErrorField } from "../../../utils/apiError";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { getFinancialErrorMessage } from "../../../utils/financialErrors";
import { formatDate, formatCurrency, formatPercent } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import {
    camposDoTipo,
    derivarValorHonorario,
    validarHonorario,
    montarPayloadHonorario,
} from "../../../utils/feeCalc";
import {
    labelDe,
    nomeDoCliente,
    TIPO_HONORARIO_OPTIONS,
    AJUDA_TIPO_HONORARIO,
    STATUS_HONORARIO_OPTIONS,
    STATUS_CANCELADO,
} from "../../../utils/enums";

const EMPTY_HONORARIO = {
    processoId: "",
    descricao: "",
    valor: "",
    percentual: "",
    valorBase: "",
    tipo: "",
    dataVencimento: "",
    statusOriginal: "pendente",
    cancelado: false,
};

function HonorariosLista() {
    const [honorarios, setHonorarios] = useState([]);
    const [processos, setProcessos] = useState([]);
    const [filtroProcesso, setFiltroProcesso] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [busca, setBusca] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [statusFiltro, setStatusFiltro] = useState("");
    const [de, setDe] = useState("");
    const [ate, setAte] = useState("");

    const [form, setForm] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");
    const [campoComErro, setCampoComErro] = useState(null);
    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });

    const carregar = () => {
        setCarregando(true);
        setErro("");
        feeService.listFees({
            page: pagina,
            limit: 10,
            busca: busca || undefined,
            tipo: tipoFiltro || undefined,
            status: statusFiltro || undefined,
            de: de || undefined,
            ate: ate || undefined,
        })
            .then((res) => {
                setHonorarios(res.data.data ?? res.data);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => setErro(getFinancialErrorMessage(err, "Falha ao buscar honorários.")))
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        carregar();
    }, [pagina, busca, tipoFiltro, statusFiltro, de, ate]);

    useEffect(() => {
        buscarTudo(processService.listProcesses)
            .then(setProcessos)
            .catch((err) => toast.error(getFinancialErrorMessage(err, "Não foi possível carregar os processos.")));
    }, []);

    const abrirNovo = () => {
        setErroForm("");
        setCampoComErro(null);
        setForm({ ...EMPTY_HONORARIO, _id: null });
    };

    const abrirEdicao = (honorario) => {
        setErroForm("");
        setCampoComErro(null);
        setForm({
            _id: honorario._id,
            processoId: honorario.processoId?._id ?? honorario.processoId,
            descricao: honorario.descricao || "",
            valor: honorario.valor ?? "",
            percentual: honorario.percentual ?? "",
            valorBase: honorario.valorBase ?? "",
            tipo: honorario.tipo || "",
            dataVencimento: honorario.dataVencimento ? honorario.dataVencimento.substring(0, 10) : "",
            statusOriginal: honorario.status || "pendente",
            cancelado: honorario.status === STATUS_CANCELADO,
        });
    };

    const fecharForm = () => setForm(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "percentual" && Number(value) > 100) return;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (campoComErro === name) setCampoComErro(null);
    };

    const salvar = async (e) => {
        e.preventDefault();

        if (!form.processoId) {
            setErroForm("Selecione o processo.");
            setCampoComErro("processoId");
            return;
        }

        const problema = validarHonorario(form);
        if (problema) {
            setErroForm(problema.mensagem);
            setCampoComErro(problema.campo);
            return;
        }

        const isEditing = Boolean(form._id);
        setSalvando(true);
        setErroForm("");
        setCampoComErro(null);
        try {
            const payload = montarPayloadHonorario(form, { isEditing });
            if (isEditing) {
                await feeService.updateFee(form._id, payload);
                toast.success("Honorário atualizado com sucesso.");
            } else {
                await feeService.createFee(payload);
                toast.success("Honorário cadastrado com sucesso.");
            }
            fecharForm();
            carregar();
        } catch (err) {
            setErroForm(getFinancialErrorMessage(err, "Erro ao salvar honorário."));
            setCampoComErro(getApiErrorField(err));
        } finally {
            setSalvando(false);
        }
    };

    const confirmarExcluir = (id) => setModalExcluir({ aberto: true, id });

    const excluir = async () => {
        const { id } = modalExcluir;
        setModalExcluir({ aberto: false, id: null });
        try {
            await feeService.deleteFee(id);
            toast.success("Honorário excluído com sucesso.");
            carregar();
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao excluir honorário."));
        }
    };

    return (
        <div className="financeiroSecao">
            <div className="financeiroSecaoCabecalho">
                <h2 className="financeiroSubtitulo">Honorários</h2>
                <button title="Cadastrar um honorário em um processo" type="button" className="button" onClick={abrirNovo}>+ Novo honorário</button>
            </div>

            <div className="linhaFiltros">
                <input
                    type="search"
                    className="financeiroBusca"
                    aria-label="Buscar honorários"
                    placeholder="Buscar por descrição ou nº do processo..."
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                    maxLength={80}
                />
                <div className="select">
                    <select value={tipoFiltro} onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1); }}>
                        <option value="">Todos os tipos</option>
                        {TIPO_HONORARIO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="select">
                    <select value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value); setPagina(1); }}>
                        <option value="">Todos os status</option>
                        {STATUS_HONORARIO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="filtroPeriodo">
                    <input type="date" aria-label="Vencimento a partir de" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} />
                    <span className="infoSecundariaDetalhe">até</span>
                    <input type="date" aria-label="Vencimento até" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} />
                </div>
            </div>

            {erro && <p className="mensagemErro">{erro}</p>}

            {carregando ? (
                <p className="infoSecundariaDetalhe">Carregando...</p>
            ) : honorarios.length === 0 ? (
                <EmptyState titulo="Nenhum honorário encontrado." descricao="Ajuste os filtros ou cadastre um novo honorário." />
            ) : (
                <ul className="listaParcelas financeiroTabela financeiroTabela--honorarios">
                    <li className="itemParcela financeiroTabelaCabecalho" aria-hidden="true">
                        <span>Processo / descrição</span>
                        <span>Tipo</span>
                        <span>Status</span>
                        <span className="financeiroCelulaNumero">Valor</span>
                        <span>Vencimento</span>
                        <span />
                    </li>
                    {honorarios.map((honorario) => (
                        <li key={honorario._id} className={`itemParcela ${honorario.status === STATUS_CANCELADO ? "itemParcela--inativa" : ""}`}>
                            <span className="financeiroCelulaPrincipal">
                                <Link to={`/processos/detalhes/${honorario.processoId?._id ?? honorario.processoId}`}>
                                    {honorario.processoId?.titulo ?? "Processo"}
                                </Link>
                                <span className="financeiroCelulaSecundaria">
                                    {honorario.descricao} · {nomeDoCliente(honorario.processoId?.clientePrincipalId)}{honorario.processoId?.numeroProcesso ? ` · nº ${honorario.processoId.numeroProcesso}` : ""}
                                </span>
                            </span>
                            <span data-label="Tipo">{labelDe(TIPO_HONORARIO_OPTIONS, honorario.tipo)}</span>
                            <span data-label="Status"><StatusBadge status={honorario.status} /></span>
                            <span data-label="Valor" className="financeiroCelulaNumero">{formatCurrency(honorario.valor)}</span>
                            <span data-label="Vencimento">{formatDate(honorario.dataVencimento)}</span>

                            <div className="acoesDetalhe">
                                <button type="button" className="botaoIcone" title="Editar" onClick={() => abrirEdicao(honorario)}>
                                    <img src={lapis} alt="Editar" />
                                </button>
                                <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir" onClick={() => confirmarExcluir(honorario._id)}>
                                    <img src={lixeira} alt="Excluir" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {totalPaginas > 1 && (
                <div className="financeiroPaginacao">
                    <button type="button" className="buttonOutlined" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>Anterior</button>
                    <span className="infoSecundariaDetalhe">Página {pagina} de {totalPaginas}</span>
                    <button type="button" className="buttonOutlined" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>Próxima</button>
                </div>
            )}

            {form && (
                <div className="modalOverlay" onClick={fecharForm}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">{form._id ? "Editar honorário" : "Novo honorário"}</h2>
                        <p className="notaCampo">Os valores do financeiro não aparecem no portal do cliente.</p>

                        <form onSubmit={salvar} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="processoHonorario">Processo</label>
                                {!form._id && <FiltroDeOpcoes valor={filtroProcesso} onChange={setFiltroProcesso} total={processos.length} placeholder="Buscar processo pelo título ou número..." />}
                                <select
                                    id="processoHonorario"
                                    name="processoId"
                                    className={`select ${campoComErro === "processoId" ? "input-erro" : ""}`}
                                    value={form.processoId}
                                    onChange={handleChange}
                                    disabled={Boolean(form._id)}
                                    required
                                >
                                    <option value="">Selecione um processo</option>
                                    {filtrarOpcoes(processos, filtroProcesso, (p) => `${p.titulo ?? ""} ${p.numeroProcesso ?? ""} ${nomeDoCliente(p.clientePrincipalId)}`, form.processoId).map((p) => (
                                        <option key={p._id} value={p._id}>{p.titulo} — {nomeDoCliente(p.clientePrincipalId)}{p.numeroProcesso ? ` — nº ${p.numeroProcesso}` : ""}</option>
                                    ))}
                                </select>
                            </div>

                            <ContextoDoProcesso processo={processos.find((p) => p._id === form.processoId)} />

                            <div className="divLabelTop">
                                <label htmlFor="descricaoHonorario">Descrição</label>
                                <input
                                    id="descricaoHonorario"
                                    name="descricao"
                                    type="text"
                                    value={form.descricao}
                                    onChange={handleChange}
                                    className={campoComErro === "descricao" ? "input-erro" : undefined}
                                    required
                                />
                            </div>

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="tipoHonorario">Tipo</label>
                                    <select
                                        id="tipoHonorario"
                                        name="tipo"
                                        className={`select ${campoComErro === "tipo" ? "input-erro" : ""}`}
                                        value={form.tipo}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {TIPO_HONORARIO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    {form.tipo && <small className="notaCampo">{AJUDA_TIPO_HONORARIO[form.tipo]}</small>}
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="dataVencimentoHonorario">Data de vencimento</label>
                                    <input
                                        id="dataVencimentoHonorario"
                                        name="dataVencimento"
                                        type="date"
                                        value={form.dataVencimento}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {camposDoTipo(form.tipo).valor === "entrada" && (
                                <div className="divLabelTop">
                                    <label htmlFor="valorHonorario">Valor</label>
                                    <CampoDinheiro
                                        id="valorHonorario"
                                        name="valor"
                                        value={form.valor}
                                        onChange={(v) => handleChange({ target: { name: "valor", value: v } })}
                                        className={campoComErro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>
                            )}

                            {camposDoTipo(form.tipo).percentual && (
                                <>
                                    <div className="calendarioFormLinha">
                                        <div className="divLabelTop">
                                            <label htmlFor="percentualHonorario">Percentual (%)</label>
                                            <input
                                                id="percentualHonorario"
                                                name="percentual"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max="100"
                                                value={form.percentual}
                                                onChange={handleChange}
                                                className={campoComErro === "percentual" ? "input-erro" : undefined}
                                                required
                                            />
                                            <small className="notaCampo">De 0,01 a 100. Valores acima de 100% não são aceitos.</small>
                                        </div>

                                        <div className="divLabelTop">
                                            <label htmlFor="valorBaseHonorario">Valor base</label>
                                            <CampoDinheiro
                                                id="valorBaseHonorario"
                                                name="valorBase"
                                                value={form.valorBase}
                                                onChange={(v) => handleChange({ target: { name: "valorBase", value: v } })}
                                                className={campoComErro === "valorBase" ? "input-erro" : undefined}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <p className="infoSecundariaDetalhe">
                                        Valor do honorário: {" "}
                                        <strong>
                                            {derivarValorHonorario(form.percentual, form.valorBase) === null
                                                ? "—"
                                                : formatCurrency(derivarValorHonorario(form.percentual, form.valorBase))}
                                        </strong>
                                        {" "}({formatPercent(form.percentual)} sobre {form.valorBase === "" ? "—" : formatCurrency(Number(form.valorBase))})
                                    </p>
                                </>
                            )}

                            {form._id && (
                                <label className="itemParticipante" style={{ cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={form.cancelado}
                                        onChange={(e) => setForm((prev) => ({ ...prev, cancelado: e.target.checked }))}
                                    />
                                    {" "}Cancelar este honorário
                                </label>
                            )}
                            {form._id && <small className="notaCampo">O status muda sozinho conforme as parcelas são pagas. Cancelado, o honorário sai do total contratado, mas continua na lista.</small>}

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
                titulo="Excluir honorário"
                mensagem="Tem certeza que deseja excluir este honorário? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null })}
            />
        </div>
    );
}

export default HonorariosLista;