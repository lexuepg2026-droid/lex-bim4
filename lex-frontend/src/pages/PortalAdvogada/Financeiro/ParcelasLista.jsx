import { useState, useEffect, useRef } from "react";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import Modal from "../../../components/Modal/Modal";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import EmptyState from "../../../components/EmptyState/EmptyState";
import ContextoDoProcesso from "../../../components/ContextoDoProcesso/ContextoDoProcesso";
import CampoDinheiro from "../../../components/CampoDinheiro/CampoDinheiro";

import installmentService from "../../../services/installmentService";
import feeService from "../../../services/feeService";

import { getApiErrorField } from "../../../utils/apiError";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { getFinancialErrorMessage } from "../../../utils/financialErrors";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import { STATUS_PARCELA_OPTIONS, nomeDoCliente } from "../../../utils/enums";

const EMPTY_PARCELA = { feeId: "", numeroParcela: "", valor: "", dataVencimento: "" };

function ParcelasLista() {
    const [parcelas, setParcelas] = useState([]);
    const [honorarios, setHonorarios] = useState([]);
    const [filtroHonorario, setFiltroHonorario] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [statusFiltro, setStatusFiltro] = useState("");
    const [busca, setBusca] = useState("");
    const [de, setDe] = useState("");
    const [ate, setAte] = useState("");

    const [form, setForm] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");
    const [campoComErro, setCampoComErro] = useState(null);
    const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });

    const ultimaBusca = useRef(0);

    // Só a resposta da busca mais recente vale: com a rede lenta, a resposta de
    // um filtro antigo chegava depois e sobrescrevia a lista (fase R2).
    const carregar = () => {
        const numero = ++ultimaBusca.current;
        setCarregando(true);
        setErro("");
        installmentService.listInstallments({
            page: pagina,
            limit: 10,
            status: statusFiltro || undefined,
            busca: busca.trim() || undefined,
            de: de || undefined,
            ate: ate || undefined,
        })
            .then((res) => {
                if (numero !== ultimaBusca.current) return;
                setParcelas(res.data.data ?? res.data);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => {
                if (numero === ultimaBusca.current) setErro(getFinancialErrorMessage(err, "Falha ao buscar parcelas."));
            })
            .finally(() => {
                if (numero === ultimaBusca.current) setCarregando(false);
            });
    };

    useEffect(() => {
        carregar();
    }, [pagina, statusFiltro, busca, de, ate]);

    useEffect(() => {
        buscarTudo(feeService.listFees)
            .then(setHonorarios)
            .catch((err) => toast.error(getFinancialErrorMessage(err, "Não foi possível carregar os honorários.")));
    }, []);

    const abrirNovo = () => {
        setErroForm("");
        setCampoComErro(null);
        setForm({ ...EMPTY_PARCELA, _id: null });
    };

    const abrirEdicao = (parcela) => {
        setErroForm("");
        setCampoComErro(null);
        setForm({
            _id: parcela._id,
            feeId: parcela.feeId?._id ?? parcela.feeId,
            numeroParcela: parcela.numeroParcela ?? "",
            valor: parcela.valor ?? "",
            dataVencimento: parcela.dataVencimento ? parcela.dataVencimento.substring(0, 10) : "",
        });
    };

    const fecharForm = () => setForm(null);

    const honorarioPorId = Object.fromEntries(honorarios.map((h) => [h._id, h]));

    const sugerirNumero = (feeId) => {
        if (!feeId) return;
        buscarTudo(installmentService.listInstallments, { honorarioId: feeId })
            .then((lista) => {
                const proximo = lista.reduce((maior, p) => Math.max(maior, Number(p.numeroParcela) || 0), 0) + 1;
                setForm((prev) => (prev && !prev._id && prev.feeId === feeId ? { ...prev, numeroParcela: String(proximo) } : prev));
            })
            // Só a sugestão do próximo número: sem ela a advogada digita. Falha de
            // servidor ou de rede já aparece no toast global (DEC-084).
            .catch(() => {});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (campoComErro === name) setCampoComErro(null);
        if (name === "feeId" && !form._id) sugerirNumero(value);
    };

    const salvar = async (e) => {
        e.preventDefault();

        if (!form.feeId) {
            setErroForm("Selecione o honorário.");
            setCampoComErro("feeId");
            return;
        }

        const isEditing = Boolean(form._id);
        setSalvando(true);
        setErroForm("");
        setCampoComErro(null);
        try {
            const payload = {
                feeId: form.feeId,
                numeroParcela: Number(form.numeroParcela),
                valor: Number(form.valor),
                dataVencimento: form.dataVencimento || undefined,
            };
            if (isEditing) {
                await installmentService.updateInstallment(form._id, payload);
                toast.success("Parcela atualizada com sucesso.");
            } else {
                await installmentService.createInstallment(payload);
                toast.success("Parcela cadastrada com sucesso.");
            }
            fecharForm();
            carregar();
        } catch (err) {
            setErroForm(getFinancialErrorMessage(err, "Erro ao salvar parcela."));
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
            await installmentService.deleteInstallment(id);
            toast.success("Parcela excluída com sucesso.");
            carregar();
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao excluir parcela."));
        }
    };

    return (
        <div className="financeiroSecao">
            <div className="financeiroSecaoCabecalho">
                <h2 className="financeiroSubtitulo">Parcelas</h2>
                <button title="Cadastrar uma parcela de um honorário" type="button" className="button" onClick={abrirNovo}>+ Nova parcela</button>
            </div>

            <div className="linhaFiltros">
                <input
                    type="text"
                    className="financeiroBusca"
                    placeholder="Buscar por honorário ou processo..."
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                    maxLength={80}
                />
                <div className="filtroPeriodo">
                    <input type="date" aria-label="Vencimento a partir de" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} />
                    <span className="infoSecundariaDetalhe">até</span>
                    <input type="date" aria-label="Vencimento até" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} />
                </div>
                <div className="select">
                    <select value={statusFiltro} onChange={(e) => { setStatusFiltro(e.target.value); setPagina(1); }}>
                        <option value="">Todos os status</option>
                        {STATUS_PARCELA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
            </div>

            {erro && <p className="mensagemErro">{erro}</p>}

            {carregando ? (
                <p className="infoSecundariaDetalhe">Carregando...</p>
            ) : parcelas.length === 0 ? (
                !erro && <EmptyState titulo="Nenhuma parcela encontrada." descricao="Ajuste os filtros ou cadastre uma em &quot;+ Nova parcela&quot;." />
            ) : (
                <ul className="listaParcelas financeiroTabela financeiroTabela--parcelas">
                    <li className="itemParcela financeiroTabelaCabecalho" aria-hidden="true">
                        <span>Honorário</span>
                        <span className="financeiroCelulaNumero">Valor</span>
                        <span className="financeiroCelulaNumero">Recebido</span>
                        <span className="financeiroCelulaNumero">Em aberto</span>
                        <span>Vencimento</span>
                        <span>Status</span>
                        <span />
                    </li>
                    {parcelas.map((parcela) => {
                        const emAberto = Math.max(0, Number(parcela.valor || 0) - Number(parcela.valorPago || 0));
                        const processo = honorarioPorId[parcela.feeId?._id ?? parcela.feeId]?.processoId;
                        return (
                            <li key={parcela._id} className="itemParcela">
                                <span className="financeiroCelulaPrincipal">
                                    <span className="financeiroCelulaTexto" title={parcela.feeId?.descricao}>{parcela.feeId?.descricao ?? "—"}</span>
                                    <span className="financeiroCelulaSecundaria">
                                        Parcela {parcela.numeroParcela}
                                        {processo && ` · ${nomeDoCliente(processo.clientePrincipalId)} · ${processo.numeroProcesso ? `nº ${processo.numeroProcesso}` : processo.titulo}`}
                                    </span>
                                </span>
                                <span data-label="Valor" className="financeiroCelulaNumero">{formatCurrency(parcela.valor)}</span>
                                <span data-label="Recebido" className="financeiroCelulaNumero">{formatCurrency(parcela.valorPago ?? 0)}</span>
                                <span data-label="Em aberto" className="financeiroCelulaNumero">{formatCurrency(emAberto)}</span>
                                <span data-label="Vencimento">{formatDate(parcela.dataVencimento)}</span>
                                <span data-label="Status"><StatusBadge status={parcela.status} /></span>

                                <div className="acoesDetalhe">
                                    <button type="button" className="botaoIcone" title="Editar" onClick={() => abrirEdicao(parcela)}>
                                        <img src={lapis} alt="Editar" />
                                    </button>
                                    <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir" onClick={() => confirmarExcluir(parcela._id)}>
                                        <img src={lixeira} alt="Excluir" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
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
                        <h2 className="modalTitulo">{form._id ? "Editar parcela" : "Nova parcela"}</h2>

                        <form onSubmit={salvar} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="feeIdParcela">Honorário</label>
                                {!form._id && <FiltroDeOpcoes valor={filtroHonorario} onChange={setFiltroHonorario} total={honorarios.length} placeholder="Buscar pelo honorário ou processo..." />}
                                <select
                                    id="feeIdParcela"
                                    name="feeId"
                                    className={`select ${campoComErro === "feeId" ? "input-erro" : ""}`}
                                    value={form.feeId}
                                    onChange={handleChange}
                                    disabled={Boolean(form._id)}
                                    required
                                >
                                    <option value="">Selecione um honorário</option>
                                    {filtrarOpcoes(honorarios, filtroHonorario, (f) => `${f.descricao ?? ""} ${f.processoId?.titulo ?? ""} ${f.processoId?.numeroProcesso ?? ""} ${nomeDoCliente(f.processoId?.clientePrincipalId)}`, form.feeId).map((f) => (
                                        <option key={f._id} value={f._id}>{f.descricao} — {nomeDoCliente(f.processoId?.clientePrincipalId)} — {f.processoId?.numeroProcesso ? `nº ${f.processoId.numeroProcesso}` : f.processoId?.titulo ?? "processo"}</option>
                                    ))}
                                </select>
                                <small className="notaCampo">Se o honorário tiver saldo adiantado, ele já é usado para pagar esta parcela.</small>
                            </div>

                            <ContextoDoProcesso honorario={honorarioPorId[form.feeId]} />

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="numeroParcelaGlobal">Nº da parcela</label>
                                    <input
                                        id="numeroParcelaGlobal"
                                        name="numeroParcela"
                                        type="number"
                                        min="1"
                                        value={form.numeroParcela}
                                        onChange={handleChange}
                                        className={campoComErro === "numeroParcela" ? "input-erro" : undefined}
                                        required
                                    />
                                    <small className="notaCampo">Ao escolher o honorário, o próximo número livre é preenchido sozinho. Não pode repetir o de outra parcela dele.</small>
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="valorParcelaGlobal">Valor</label>
                                    <CampoDinheiro
                                        id="valorParcelaGlobal"
                                        name="valor"
                                        value={form.valor}
                                        onChange={(v) => handleChange({ target: { name: "valor", value: v } })}
                                        className={campoComErro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="dataVencimentoParcelaGlobal">Data de vencimento</label>
                                <input
                                    id="dataVencimentoParcelaGlobal"
                                    name="dataVencimento"
                                    type="date"
                                    value={form.dataVencimento}
                                    onChange={handleChange}
                                    required
                                />
                                <small className="notaCampo">Parcelas vencidas ou que vencem nos próximos 7 dias aparecem em destaque na Home.</small>
                            </div>

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
                titulo="Excluir parcela"
                mensagem="Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluir}
                onCancelar={() => setModalExcluir({ aberto: false, id: null })}
            />
        </div>
    );
}

export default ParcelasLista;