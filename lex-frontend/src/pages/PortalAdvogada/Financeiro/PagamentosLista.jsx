import { useState, useEffect, useRef } from "react";

import EmptyState from "../../../components/EmptyState/EmptyState";
import ContextoDoProcesso from "../../../components/ContextoDoProcesso/ContextoDoProcesso";
import CampoDinheiro from "../../../components/CampoDinheiro/CampoDinheiro";

import feeService from "../../../services/feeService";
import paymentService from "../../../services/paymentService";

import { getApiErrorField } from "../../../utils/apiError";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { getFinancialErrorMessage } from "../../../utils/financialErrors";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import { buscarTudo } from "../../../utils/buscarTudo";
import { labelDe, nomeDoCliente, FORMA_PAGAMENTO_OPTIONS, TIPO_PAGAMENTO_OPTIONS } from "../../../utils/enums";

import { SituacaoPagamento, EstornosDoPagamento, EstornoModal, ObservacoesModal, podeEstornar, valorLiquidoDe } from "./AcoesPagamento";

const EMPTY_PAGAMENTO = {
    honorarioId: "",
    valor: "",
    data: new Date().toISOString().substring(0, 10),
    tipo: "comum",
    formaPagamento: "pix",
    observacoes: "",
};

function PagamentosLista() {
    const [pagamentos, setPagamentos] = useState([]);
    const [honorarios, setHonorarios] = useState([]);
    const [filtroHonorario, setFiltroHonorario] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const [formaFiltro, setFormaFiltro] = useState("");
    const [tipoFiltro, setTipoFiltro] = useState("");
    const [busca, setBusca] = useState("");
    const [de, setDe] = useState("");
    const [ate, setAte] = useState("");

    const [form, setForm] = useState(null);
    const [preview, setPreview] = useState(null);
    const [calculandoPreview, setCalculandoPreview] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroForm, setErroForm] = useState("");
    const [campoComErro, setCampoComErro] = useState(null);
    const [reciboEmCurso, setReciboEmCurso] = useState(null);

    const [estornoAlvo, setEstornoAlvo] = useState(null);
    const [observacoesAlvo, setObservacoesAlvo] = useState(null);

    const ultimaBusca = useRef(0);

    // Só a resposta da busca mais recente vale: com a rede lenta, a resposta de
    // um filtro antigo chegava depois e sobrescrevia a lista (fase R2).
    const carregar = () => {
        const numero = ++ultimaBusca.current;
        setCarregando(true);
        setErro("");
        paymentService.listPayments({
            page: pagina,
            limit: 10,
            formaPagamento: formaFiltro || undefined,
            tipo: tipoFiltro || undefined,
            busca: busca.trim() || undefined,
            de: de || undefined,
            ate: ate || undefined,
        })
            .then((res) => {
                if (numero !== ultimaBusca.current) return;
                setPagamentos(res.data.data ?? res.data);
                setTotalPaginas(res.data.totalPages ?? 1);
            })
            .catch((err) => {
                if (numero === ultimaBusca.current) setErro(getFinancialErrorMessage(err, "Falha ao buscar pagamentos."));
            })
            .finally(() => {
                if (numero === ultimaBusca.current) setCarregando(false);
            });
    };

    useEffect(() => {
        carregar();
    }, [pagina, formaFiltro, tipoFiltro, busca, de, ate]);

    useEffect(() => {
        buscarTudo(feeService.listFees)
            .then(setHonorarios)
            .catch((err) => toast.error(getFinancialErrorMessage(err, "Não foi possível carregar os honorários.")));
    }, []);

    const abrirNovo = () => {
        setErroForm("");
        setCampoComErro(null);
        setPreview(null);
        setForm({ ...EMPTY_PAGAMENTO });
    };

    const fecharForm = () => {
        setForm(null);
        setPreview(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setPreview(null);
        if (campoComErro === name) setCampoComErro(null);
    };

    const calcularPreview = async () => {
        if (!form.honorarioId) {
            setErroForm("Selecione o honorário.");
            setCampoComErro("honorarioId");
            return;
        }
        if (!form.valor || Number(form.valor) <= 0) {
            setErroForm("Informe um valor maior que zero para calcular a alocação.");
            return;
        }
        setCalculandoPreview(true);
        setErroForm("");
        try {
            const res = await paymentService.preverAlocacao({
                honorarioId: form.honorarioId,
                valor: Number(form.valor),
                tipo: form.tipo,
            });
            setPreview(res.data);
        } catch (err) {
            setErroForm(getFinancialErrorMessage(err, "Erro ao calcular a alocação."));
        } finally {
            setCalculandoPreview(false);
        }
    };

    const salvar = async (e) => {
        e.preventDefault();

        setSalvando(true);
        setErroForm("");
        setCampoComErro(null);
        try {
            const payload = {
                honorarioId: form.honorarioId,
                valor: Number(form.valor),
                data: form.data,
                tipo: form.tipo,
                formaPagamento: form.formaPagamento,
                observacoes: form.observacoes,
            };
            await paymentService.createPayment(payload);
            toast.success("Pagamento registrado com sucesso.");
            fecharForm();
            carregar();
        } catch (err) {
            setErroForm(getFinancialErrorMessage(err, "Erro ao registrar pagamento."));
            setCampoComErro(getApiErrorField(err));
        } finally {
            setSalvando(false);
        }
    };

    const baixarRecibo = async (pagamentoId) => {
        setReciboEmCurso(pagamentoId);
        try {
            await paymentService.baixarEsalvarRecibo(pagamentoId);
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Não foi possível gerar o recibo."));
        } finally {
            setReciboEmCurso(null);
        }
    };

    return (
        <div className="financeiroSecao">
            <div className="financeiroSecaoCabecalho">
                <h2 className="financeiroSubtitulo">Pagamentos</h2>
                <button title="Lançar um valor recebido de um honorário" type="button" className="button" onClick={abrirNovo}>+ Registrar pagamento</button>
            </div>

            <div className="linhaFiltros">
                <input
                    type="text"
                    className="financeiroBusca"
                    placeholder="Buscar por honorário, processo ou observação..."
                    value={busca}
                    onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                    maxLength={80}
                />
                <div className="select">
                    <select value={formaFiltro} onChange={(e) => { setFormaFiltro(e.target.value); setPagina(1); }}>
                        <option value="">Todas as formas</option>
                        {FORMA_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="select">
                    <select value={tipoFiltro} onChange={(e) => { setTipoFiltro(e.target.value); setPagina(1); }}>
                        <option value="">Todos os tipos</option>
                        {TIPO_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="filtroPeriodo">
                    <input type="date" aria-label="Data inicial" value={de} onChange={(e) => { setDe(e.target.value); setPagina(1); }} />
                    <span className="infoSecundariaDetalhe">até</span>
                    <input type="date" aria-label="Data final" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(1); }} />
                </div>
            </div>

            {erro && <p className="mensagemErro">{erro}</p>}

            {carregando ? (
                <p className="infoSecundariaDetalhe">Carregando...</p>
            ) : pagamentos.length === 0 ? (
                !erro && <EmptyState titulo="Nenhum pagamento encontrado." descricao="Ajuste os filtros ou registre um novo pagamento." />
            ) : (
                <ul className="listaParcelas financeiroTabela financeiroTabela--pagamentos">
                    <li className="itemParcela financeiroTabelaCabecalho" aria-hidden="true">
                        <span>Data</span>
                        <span>Honorário / processo</span>
                        <span className="financeiroCelulaNumero">Valor</span>
                        <span>Forma</span>
                        <span>Tipo</span>
                        <span />
                    </li>
                    {pagamentos.map((pagamento) => (
                        <li key={pagamento._id} className={`itemParcela ${!podeEstornar(pagamento) ? "itemParcela--inativa" : ""}`}>
                            <span data-label="Data">{formatDate(pagamento.data)}</span>
                            <span className="financeiroCelulaPrincipal">
                                <span className="financeiroCelulaTexto" title={pagamento.honorarioId?.descricao}>{pagamento.honorarioId?.descricao ?? "—"}</span>
                                <span className="financeiroCelulaSecundaria">
                                    {nomeDoCliente(pagamento.honorarioId?.processoId?.clientePrincipalId)} · {pagamento.honorarioId?.processoId?.numeroProcesso ? `nº ${pagamento.honorarioId.processoId.numeroProcesso}` : pagamento.honorarioId?.processoId?.titulo ?? "—"}
                                </span>
                            </span>
                            <span data-label="Valor" className="financeiroCelulaNumero">
                                {formatCurrency(valorLiquidoDe(pagamento))}
                                {Number(pagamento.totalEstornado ?? 0) > 0 && (
                                    <span className="financeiroCelulaSecundaria">de {formatCurrency(pagamento.valor)}</span>
                                )}
                            </span>
                            <span data-label="Forma">{labelDe(FORMA_PAGAMENTO_OPTIONS, pagamento.formaPagamento)}</span>
                            <span data-label="Tipo">
                                {pagamento.tipo === "adiantamento" ? "Adiantamento" : "Comum"}
                                <SituacaoPagamento pagamento={pagamento} />
                            </span>

                            <div className="acoesDetalhe">
                                <button title="Baixar o recibo em PDF deste pagamento"
                                    type="button"
                                    className="buttonOutlined botaoAcaoParticipante"
                                    onClick={() => baixarRecibo(pagamento._id)}
                                    disabled={reciboEmCurso === pagamento._id}
                                >
                                    {reciboEmCurso === pagamento._id ? "Baixando..." : "Recibo"}
                                </button>
                                <button title="Ver ou editar as observações, o único campo que muda depois de salvo" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => setObservacoesAlvo(pagamento)}>
                                    Observações
                                </button>
                                {podeEstornar(pagamento) && (
                                    <button title="Devolver parte ou todo o valor deste pagamento" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => setEstornoAlvo({ pagamento, estorno: null })}>
                                        Estornar
                                    </button>
                                )}
                            </div>

                            {pagamento.observacoes && <span className="observacaoPagamento">{pagamento.observacoes}</span>}

                            <EstornosDoPagamento pagamento={pagamento} onAnular={(estorno) => setEstornoAlvo({ pagamento, estorno })} />
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
                        <h2 className="modalTitulo">Registrar pagamento</h2>
                        <p className="notaCampo">Depois de salvo, só as observações podem ser alteradas. Para corrigir um valor, use "Estornar" na lista de pagamentos.</p>

                        <form onSubmit={salvar} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="honorarioIdPagamento">Honorário</label>
                                <FiltroDeOpcoes valor={filtroHonorario} onChange={setFiltroHonorario} total={honorarios.length} placeholder="Buscar pelo honorário ou processo..." />
                                <select
                                    id="honorarioIdPagamento"
                                    name="honorarioId"
                                    className={`select ${campoComErro === "honorarioId" ? "input-erro" : ""}`}
                                    value={form.honorarioId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecione um honorário</option>
                                    {filtrarOpcoes(honorarios, filtroHonorario, (f) => `${f.descricao ?? ""} ${f.processoId?.titulo ?? ""} ${f.processoId?.numeroProcesso ?? ""} ${nomeDoCliente(f.processoId?.clientePrincipalId)}`, form.honorarioId).map((f) => (
                                        <option key={f._id} value={f._id}>
                                            {f.descricao} — {nomeDoCliente(f.processoId?.clientePrincipalId)} — {f.processoId?.numeroProcesso ? `nº ${f.processoId.numeroProcesso}` : f.processoId?.titulo ?? "processo"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <ContextoDoProcesso honorario={honorarios.find((f) => f._id === form.honorarioId)} />

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="valorPagamentoGlobal">Valor</label>
                                    <CampoDinheiro
                                        id="valorPagamentoGlobal"
                                        name="valor"
                                        value={form.valor}
                                        onChange={(v) => handleChange({ target: { name: "valor", value: v } })}
                                        className={campoComErro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="tipoPagamentoGlobal">Tipo</label>
                                    <select
                                        id="tipoPagamentoGlobal"
                                        name="tipo"
                                        className="select"
                                        value={form.tipo}
                                        onChange={handleChange}
                                        required
                                    >
                                        {TIPO_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <small className="notaCampo">O valor quita as parcelas em aberto a partir do vencimento mais antigo, e o que sobrar vira saldo adiantado. O tipo só identifica o pagamento.</small>

                            <button title="Mostra quais parcelas este valor vai quitar antes de salvar"
                                type="button"
                                className="buttonOutlined botaoAcaoParticipante"
                                onClick={calcularPreview}
                                disabled={calculandoPreview}
                            >
                                {calculandoPreview ? "Calculando..." : "Ver onde este valor vai cair"}
                            </button>

                            {preview && (
                                <div className="detalheCardFinanceiro">
                                    {preview.destinos.length === 0 ? (
                                        <p className="infoSecundariaDetalhe">Nenhuma parcela em aberto — o valor todo vira saldo adiantado.</p>
                                    ) : (
                                        <ul className="listaParcelas">
                                            {preview.destinos.map((destino) => (
                                                <li key={destino.parcelaId} className="itemParcela">
                                                    <span>Parcela {destino.numeroParcela}</span>
                                                    <span>{formatCurrency(destino.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {preview.sobra > 0 && (
                                        <div className="detalheFinanceiroLinha">
                                            <span>Sobra (vira saldo adiantado)</span>
                                            <strong>{formatCurrency(preview.sobra)}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="dataPagamentoGlobal">Data do pagamento</label>
                                    <input
                                        id="dataPagamentoGlobal"
                                        name="data"
                                        type="date"
                                        value={form.data}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="formaPagamentoGlobal">Forma de pagamento</label>
                                    <select
                                        id="formaPagamentoGlobal"
                                        name="formaPagamento"
                                        className="select"
                                        value={form.formaPagamento}
                                        onChange={handleChange}
                                        required
                                    >
                                        {FORMA_PAGAMENTO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="observacoesPagamentoGlobal">Observações (opcional)</label>
                                <input
                                    id="observacoesPagamentoGlobal"
                                    name="observacoes"
                                    type="text"
                                    maxLength={1000}
                                    value={form.observacoes}
                                    onChange={handleChange}
                                />
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

            {estornoAlvo && (
                <EstornoModal
                    pagamento={estornoAlvo.pagamento}
                    estorno={estornoAlvo.estorno}
                    onFechar={() => setEstornoAlvo(null)}
                    onConcluido={() => { setEstornoAlvo(null); carregar(); }}
                />
            )}

            {observacoesAlvo && (
                <ObservacoesModal
                    pagamento={observacoesAlvo}
                    onFechar={() => setObservacoesAlvo(null)}
                    onConcluido={() => { setObservacoesAlvo(null); carregar(); }}
                />
            )}
        </div>
    );
}

export default PagamentosLista;