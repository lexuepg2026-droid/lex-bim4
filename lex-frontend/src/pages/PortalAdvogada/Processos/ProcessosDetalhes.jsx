import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import lapis from "../../../assets/images/icons/lapis.svg";
import lixeira from "../../../assets/images/icons/lixeira.svg";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";
import Loading from "../../../components/Loading/Loading";
import Modal from "../../../components/Modal/Modal";
import EmptyState from "../../../components/EmptyState/EmptyState";
import ContextoDoProcesso from "../../../components/ContextoDoProcesso/ContextoDoProcesso";
import CampoDinheiro from "../../../components/CampoDinheiro/CampoDinheiro";

import processService from "../../../services/processService";
import financeiroService from "../../../services/financeiroService";
import clientService from "../../../services/clientService";
import feeService from "../../../services/feeService";
import installmentService from "../../../services/installmentService";
import paymentService from "../../../services/paymentService";

import { getApiErrorMessage, getApiErrorField } from "../../../utils/apiError";
import FiltroDeOpcoes from "../../../components/FiltroDeOpcoes/FiltroDeOpcoes";
import { filtrarOpcoes } from "../../../utils/filtrarOpcoes";
import { getFinancialErrorMessage } from "../../../utils/financialErrors";
import { formatDate, formatCurrency, formatPercent } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import { corDoStatus } from "../../../utils/statusProcesso";
import { buscarTudo } from "../../../utils/buscarTudo";
import {
    camposDoTipo,
    derivarValorHonorario,
    validarHonorario,
    montarPayloadHonorario,
} from "../../../utils/feeCalc";
import {
    nomeDoCliente, labelDe,
    STATUS_PROCESSO_OPTIONS, FASE_PROCESSO_OPTIONS, PAPEL_PROCESSO_OPTIONS, ESTADO_PORTAL_OPTIONS,
    STATUS_HONORARIO_OPTIONS, STATUS_PARCELA_OPTIONS,
    TIPO_HONORARIO_OPTIONS, AJUDA_TIPO_HONORARIO, STATUS_CANCELADO, FORMA_PAGAMENTO_OPTIONS, TIPO_PAGAMENTO_OPTIONS,
} from "../../../utils/enums";
import { mensagemDesativarProcesso } from "../../../utils/ativacaoProcesso";

import { SituacaoPagamento, EstornosDoPagamento, EstornoModal, ObservacoesModal, podeEstornar, valorLiquidoDe } from "../Financeiro/AcoesPagamento";
import { LiberacaoPortal, EntregaAcesso, ConfirmacoesDoProcesso } from "./AcessoPortal";
import DocumentosDoProcesso from "./DocumentosDoProcesso";

import "./Processos.css";

function ProcessosDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [processo, setProcesso] = useState(null);
    const [participantes, setParticipantes] = useState([]);
    const [linhaDoTempo, setLinhaDoTempo] = useState([]);
    const [ficha, setFicha] = useState(null);
    const [pagamentos, setPagamentos] = useState([]);
    const [clientesDisponiveis, setClientesDisponiveis] = useState([]);
    const [filtroCliente, setFiltroCliente] = useState("");

    const [aba, setAba] = useState("informacoes");

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [novoClienteId, setNovoClienteId] = useState("");
    const [novoPapel, setNovoPapel] = useState("autor");
    const [adicionando, setAdicionando] = useState(false);

    const [entregaAberta, setEntregaAberta] = useState(null);

    const [modalExcluirProcesso, setModalExcluirProcesso] = useState(null);
    const [modalRemoverCliente, setModalRemoverCliente] = useState({ aberto: false, clienteId: null });
    const [mensagemFalhaExclusao, setMensagemFalhaExclusao] = useState(null);

    const [formHonorario, setFormHonorario] = useState(null);
    const [formParcela, setFormParcela] = useState(null);
    const [formPagamento, setFormPagamento] = useState(null);
    const [previewPagamento, setPreviewPagamento] = useState(null);
    const [calculandoPreview, setCalculandoPreview] = useState(false);
    const [estornoAlvo, setEstornoAlvo] = useState(null);
    const [observacoesAlvo, setObservacoesAlvo] = useState(null);
    const [reciboEmCurso, setReciboEmCurso] = useState(null);
    const [extrato, setExtrato] = useState(null);
    const [formReparcelamento, setFormReparcelamento] = useState(null);
    const [salvandoFinanceiro, setSalvandoFinanceiro] = useState(false);
    const [erroFinanceiro, setErroFinanceiro] = useState("");
    const [campoComErroFinanceiro, setCampoComErroFinanceiro] = useState(null);
    const [modalExcluirHonorario, setModalExcluirHonorario] = useState({ aberto: false, id: null });
    const [modalExcluirParcela, setModalExcluirParcela] = useState({ aberto: false, id: null });

    const carregar = async () => {
        setCarregando(true);
        setErro("");
        try {
            const [resProcesso, resParticipantes, resTimeline, resFicha, resPagamentos] = await Promise.all([
                processService.getProcessById(id),
                processService.listProcessClientes(id),
                processService.getTimeline(id),
                financeiroService.getFichaDoProcesso(id),
                buscarTudo(paymentService.listPayments, { processoId: id }),
            ]);
            setProcesso(resProcesso.data);
            setParticipantes(resParticipantes.data.data ?? resParticipantes.data);
            setLinhaDoTempo(resTimeline.data.entradas ?? []);
            setFicha(resFicha.data);
            setPagamentos(resPagamentos);
        } catch (err) {
            setErro(getApiErrorMessage(err, "Não foi possível carregar o processo."));
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
    }, [id]);

    useEffect(() => {
        buscarTudo(clientService.getAllClients)
            .then(setClientesDisponiveis)
            .catch(() => {});
    }, []);

    const idsJaVinculados = participantes.map((p) => p.clienteId?._id);
    const clientesParaAdicionar = clientesDisponiveis.filter((c) => !idsJaVinculados.includes(c._id));

    const adicionarParticipante = async (e) => {
        e.preventDefault();
        if (!novoClienteId) return;

        setAdicionando(true);
        try {
            await processService.addProcessCliente(id, { clienteId: novoClienteId, papel: novoPapel });
            toast.success("Cliente vinculado ao processo. Use \"Entregar acesso\" para enviar o código do portal.");
            setNovoClienteId("");
            setNovoPapel("autor");
            await carregar();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao vincular cliente."));
        } finally {
            setAdicionando(false);
        }
    };

    const trocarPapel = async (clienteId, papel) => {
        try {
            await processService.updateProcessClientePapel(id, clienteId, papel);
            toast.success("Papel atualizado.");
            await carregar();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao trocar o papel."));
        }
    };

    const tornarPrincipal = async (clienteId) => {
        try {
            await processService.setProcessClientePrincipal(id, clienteId);
            toast.success("Cliente definido como principal.");
            await carregar();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao definir cliente principal."));
        }
    };

    const confirmarRemoverCliente = (clienteId) => setModalRemoverCliente({ aberto: true, clienteId });

    const removerParticipante = async () => {
        const { clienteId } = modalRemoverCliente;
        setModalRemoverCliente({ aberto: false, clienteId: null });
        try {
            await processService.removeProcessCliente(id, clienteId);
            toast.success("Cliente desvinculado do processo.");
            await carregar();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Erro ao desvincular cliente."));
        }
    };

    const atualizarLiberacao = (clienteId, liberado) => {
        setParticipantes((atual) => atual.map((p) => (
            (p.clienteId?._id ?? p.clienteId) === clienteId ? { ...p, liberadoNoPortal: liberado } : p
        )));
    };

    const EMPTY_HONORARIO = {
        descricao: "",
        valor: "",
        percentual: "",
        valorBase: "",
        tipo: "",
        dataVencimento: "",
        statusOriginal: "pendente",
        cancelado: false,
    };

    const abrirNovoHonorario = () => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        setFormHonorario({ ...EMPTY_HONORARIO, _id: null });
    };

    const abrirEdicaoHonorario = (honorario) => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        setFormHonorario({
            _id: honorario._id,
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

    const fecharFormHonorario = () => setFormHonorario(null);

    const handleHonorarioChange = (e) => {
        const { name, value } = e.target;
        if (name === "percentual" && Number(value) > 100) return;
        setFormHonorario((prev) => ({ ...prev, [name]: value }));
        if (campoComErroFinanceiro === name) setCampoComErroFinanceiro(null);
    };

    const salvarHonorario = async (e) => {
        e.preventDefault();

        const problema = validarHonorario(formHonorario);
        if (problema) {
            setErroFinanceiro(problema.mensagem);
            setCampoComErroFinanceiro(problema.campo);
            return;
        }

        const isEditing = Boolean(formHonorario._id);
        setSalvandoFinanceiro(true);
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        try {
            const payload = montarPayloadHonorario(
                { ...formHonorario, processoId: id },
                { isEditing }
            );
            if (isEditing) {
                await feeService.updateFee(formHonorario._id, payload);
                toast.success("Honorário atualizado com sucesso.");
            } else {
                await feeService.createFee(payload);
                toast.success("Honorário cadastrado com sucesso.");
            }
            fecharFormHonorario();
            await carregar();
        } catch (err) {
            setErroFinanceiro(getFinancialErrorMessage(err, "Erro ao salvar honorário."));
            setCampoComErroFinanceiro(getApiErrorField(err));
        } finally {
            setSalvandoFinanceiro(false);
        }
    };

    const confirmarExcluirHonorario = (honorarioId) => setModalExcluirHonorario({ aberto: true, id: honorarioId });

    const excluirHonorario = async () => {
        const { id: honorarioId } = modalExcluirHonorario;
        setModalExcluirHonorario({ aberto: false, id: null });
        try {
            await feeService.deleteFee(honorarioId);
            toast.success("Honorário excluído com sucesso.");
            await carregar();
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao excluir honorário."));
        }
    };

    const EMPTY_PARCELA = { feeId: "", numeroParcela: "", valor: "", dataVencimento: "" };

    const abrirNovaParcela = (feeId) => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        const parcelasDoHonorario = ficha?.honorarios.find((h) => h._id === feeId)?.parcelas ?? [];
        const proximo = parcelasDoHonorario.reduce((maior, p) => Math.max(maior, Number(p.numeroParcela) || 0), 0) + 1;
        setFormParcela({ ...EMPTY_PARCELA, feeId, numeroParcela: String(proximo), _id: null });
    };

    const abrirEdicaoParcela = (parcela) => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        setFormParcela({
            _id: parcela._id,
            feeId: parcela.feeId,
            numeroParcela: parcela.numeroParcela ?? "",
            valor: parcela.valor ?? "",
            dataVencimento: parcela.dataVencimento ? parcela.dataVencimento.substring(0, 10) : "",
        });
    };

    const fecharFormParcela = () => setFormParcela(null);

    const handleParcelaChange = (e) => {
        const { name, value } = e.target;
        setFormParcela((prev) => ({ ...prev, [name]: value }));
        if (campoComErroFinanceiro === name) setCampoComErroFinanceiro(null);
    };

    const salvarParcela = async (e) => {
        e.preventDefault();

        const isEditing = Boolean(formParcela._id);
        setSalvandoFinanceiro(true);
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        try {
            const payload = {
                feeId: formParcela.feeId,
                numeroParcela: Number(formParcela.numeroParcela),
                valor: Number(formParcela.valor),
                dataVencimento: formParcela.dataVencimento || undefined,
            };
            if (isEditing) {
                await installmentService.updateInstallment(formParcela._id, payload);
                toast.success("Parcela atualizada com sucesso.");
            } else {
                await installmentService.createInstallment(payload);
                toast.success("Parcela cadastrada com sucesso.");
            }
            fecharFormParcela();
            await carregar();
        } catch (err) {
            setErroFinanceiro(getFinancialErrorMessage(err, "Erro ao salvar parcela."));
            setCampoComErroFinanceiro(getApiErrorField(err));
        } finally {
            setSalvandoFinanceiro(false);
        }
    };

    const confirmarExcluirParcela = (parcelaId) => setModalExcluirParcela({ aberto: true, id: parcelaId });

    const excluirParcela = async () => {
        const { id: parcelaId } = modalExcluirParcela;
        setModalExcluirParcela({ aberto: false, id: null });
        try {
            await installmentService.deleteInstallment(parcelaId);
            toast.success("Parcela excluída com sucesso.");
            await carregar();
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao excluir parcela."));
        }
    };

    const EMPTY_PAGAMENTO = {
        honorarioId: "",
        valor: "",
        data: new Date().toISOString().substring(0, 10),
        tipo: "comum",
        formaPagamento: "pix",
        observacoes: "",
    };

    const abrirPagamento = (honorario) => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        setPreviewPagamento(null);
        setFormPagamento({ ...EMPTY_PAGAMENTO, honorarioId: honorario._id, honorarioSelecionado: honorario });
    };

    const fecharFormPagamento = () => {
        setFormPagamento(null);
        setPreviewPagamento(null);
    };

    const handlePagamentoChange = (e) => {
        const { name, value } = e.target;
        setFormPagamento((prev) => ({ ...prev, [name]: value }));
        setPreviewPagamento(null);
        if (campoComErroFinanceiro === name) setCampoComErroFinanceiro(null);
    };

    const calcularPreviewPagamento = async () => {
        if (!formPagamento.valor || Number(formPagamento.valor) <= 0) {
            setErroFinanceiro("Informe um valor maior que zero para calcular a alocação.");
            return;
        }
        setCalculandoPreview(true);
        setErroFinanceiro("");
        try {
            const res = await paymentService.preverAlocacao({
                honorarioId: formPagamento.honorarioId,
                valor: Number(formPagamento.valor),
                tipo: formPagamento.tipo,
            });
            setPreviewPagamento(res.data);
        } catch (err) {
            setErroFinanceiro(getFinancialErrorMessage(err, "Erro ao calcular a alocação."));
        } finally {
            setCalculandoPreview(false);
        }
    };

    const salvarPagamento = async (e) => {
        e.preventDefault();

        setSalvandoFinanceiro(true);
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        try {
            const payload = {
                honorarioId: formPagamento.honorarioId,
                valor: Number(formPagamento.valor),
                data: formPagamento.data,
                tipo: formPagamento.tipo,
                formaPagamento: formPagamento.formaPagamento,
                observacoes: formPagamento.observacoes,
            };
            await paymentService.createPayment(payload);
            toast.success("Pagamento registrado com sucesso.");
            fecharFormPagamento();
            await carregar();
        } catch (err) {
            setErroFinanceiro(getFinancialErrorMessage(err, "Erro ao registrar pagamento."));
            setCampoComErroFinanceiro(getApiErrorField(err));
        } finally {
            setSalvandoFinanceiro(false);
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

    const abrirExtrato = async (honorario) => {
        setExtrato({ honorario, carregando: true, eventos: [], pagina: 1, totalPaginas: 1 });
        try {
            const res = await feeService.getExtrato(honorario._id, { page: 1, limit: 20 });
            setExtrato({
                honorario,
                carregando: false,
                eventos: res.data.data,
                pagina: res.data.page,
                totalPaginas: res.data.totalPages,
            });
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao carregar o extrato."));
            setExtrato(null);
        }
    };

    const mudarPaginaExtrato = async (novaPagina) => {
        if (!extrato) return;
        setExtrato((prev) => ({ ...prev, carregando: true }));
        try {
            const res = await feeService.getExtrato(extrato.honorario._id, { page: novaPagina, limit: 20 });
            setExtrato((prev) => ({
                ...prev,
                carregando: false,
                eventos: res.data.data,
                pagina: res.data.page,
                totalPaginas: res.data.totalPages,
            }));
        } catch (err) {
            toast.error(getFinancialErrorMessage(err, "Erro ao carregar o extrato."));
        }
    };

    const fecharExtrato = () => setExtrato(null);

    const abrirReparcelamento = (honorario) => {
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        setFormReparcelamento({
            honorario,
            parcelas: [{ valor: "", dataVencimento: "" }],
            motivo: "",
        });
    };

    const fecharFormReparcelamento = () => setFormReparcelamento(null);

    const adicionarLinhaReparcelamento = () => {
        setFormReparcelamento((prev) => ({
            ...prev,
            parcelas: [...prev.parcelas, { valor: "", dataVencimento: "" }],
        }));
    };

    const removerLinhaReparcelamento = (indice) => {
        setFormReparcelamento((prev) => ({
            ...prev,
            parcelas: prev.parcelas.filter((_, i) => i !== indice),
        }));
    };

    const handleLinhaReparcelamentoChange = (indice, campo, valor) => {
        setFormReparcelamento((prev) => ({
            ...prev,
            parcelas: prev.parcelas.map((p, i) => (i === indice ? { ...p, [campo]: valor } : p)),
        }));
    };

    const somaReparcelamento = formReparcelamento
        ? formReparcelamento.parcelas.reduce((acc, p) => acc + (Number(p.valor) || 0), 0)
        : 0;

    const salvarReparcelamento = async (e) => {
        e.preventDefault();

        setSalvandoFinanceiro(true);
        setErroFinanceiro("");
        setCampoComErroFinanceiro(null);
        try {
            const payload = {
                parcelas: formReparcelamento.parcelas.map((p) => ({
                    valor: Number(p.valor),
                    dataVencimento: p.dataVencimento,
                })),
                motivo: formReparcelamento.motivo || undefined,
            };
            await feeService.criarReparcelamento(formReparcelamento.honorario._id, payload);
            toast.success("Reparcelamento realizado com sucesso.");
            fecharFormReparcelamento();
            await carregar();
        } catch (err) {
            setErroFinanceiro(getFinancialErrorMessage(err, "Erro ao reparcelar."));
            setCampoComErroFinanceiro(getApiErrorField(err));
        } finally {
            setSalvandoFinanceiro(false);
        }
    };

    const abrirExclusaoProcesso = async () => {
        setModalExcluirProcesso("Conferindo o efeito desta ação…");
        try {
            const res = await processService.getActivationPreview(id);
            setModalExcluirProcesso(mensagemDesativarProcesso(res.data.vinculosAfetados));
        } catch {
            setModalExcluirProcesso(mensagemDesativarProcesso(0));
        }
    };

    const excluirProcesso = async () => {
        setModalExcluirProcesso(null);
        try {
            await processService.deleteProcess(id);
            toast.success("Processo desativado. Você pode reativá-lo na lista, em \"Somente desativados\".");
            navigate("/processos");
        } catch (err) {
            setMensagemFalhaExclusao(getApiErrorMessage(err, "Erro ao excluir processo."));
        }
    };

    const clientePrincipal = participantes.find((p) => p.principal)?.clienteId ?? null;
    const honorarioDaFicha = (feeId) => ficha?.honorarios.find((h) => h._id === feeId) ?? null;

    if (carregando) return <Loading />;

    if (erro || !processo) {
        return (
            <div className="tela telaClientes">
                <div className="baloesTelasAdvogada">
                    <p className="mensagemErro">{erro || "Processo não encontrado."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tela telaClientes">
            <div className="baloesTelasAdvogada">
                <div className="detalheTopo">
                    <div className="detalheIdentidade">
                        <span
                            className="detalheStatusBolinha"
                            style={{ backgroundColor: corDoStatus(processo.status) }}
                            title={labelDe(STATUS_PROCESSO_OPTIONS, processo.status)}
                        />
                        <div>
                            <h1 className="tituloPagina">{processo.titulo}</h1>
                            <p className="detalheSubtitulo">
                                {labelDe(STATUS_PROCESSO_OPTIONS, processo.status)} · {labelDe(FASE_PROCESSO_OPTIONS, processo.fase)}
                            </p>
                        </div>
                    </div>

                    <div className="acoesDetalhe">
                        <Link to={`/processos/editar/${id}`} className="botaoIcone" title="Editar">
                            <img src={lapis} alt="Editar" />
                        </Link>
                        <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir" onClick={abrirExclusaoProcesso}>
                            <img src={lixeira} alt="Excluir" />
                        </button>
                        <BotaoVoltar />
                    </div>
                </div>

                <div className="detalheAbas">
                    <div className="detalheAbasBotoes">
                        <button type="button" className={`detalheAba ${aba === "informacoes" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("informacoes")}>
                            Informações
                        </button>
                        <button type="button" className={`detalheAba ${aba === "participantes" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("participantes")}>
                            Participantes
                        </button>
                        <button type="button" className={`detalheAba ${aba === "financeiro" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("financeiro")}>
                            Financeiro
                        </button>
                        <button type="button" className={`detalheAba ${aba === "documentos" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("documentos")}>
                            Documentos
                        </button>
                        <button type="button" className={`detalheAba ${aba === "linha-do-tempo" ? "detalheAbaAtiva" : ""}`} onClick={() => setAba("linha-do-tempo")}>
                            Linha do tempo
                        </button>
                    </div>
                </div>

                {aba === "informacoes" && (
                    <div className="secaoForm">
                        <div className="tituloInput informacaoPequena">
                            <label>Número</label>
                            <span className="valorLeitura">{processo.numeroProcesso || "—"}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Status</label>
                            <span className="valorLeitura">{labelDe(STATUS_PROCESSO_OPTIONS, processo.status)}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Fase</label>
                            <span className="valorLeitura">{labelDe(FASE_PROCESSO_OPTIONS, processo.fase)}</span>
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>Tipo de ação</label>
                            <span className="valorLeitura">{processo.tipoAcao || "—"}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Área</label>
                            <span className="valorLeitura">{processo.area || "—"}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Órgão</label>
                            <span className="valorLeitura">{processo.orgao || "—"}</span>
                        </div>

                        <div className="tituloInput informacaoPequena">
                            <label>Vara</label>
                            <span className="valorLeitura">{processo.vara || "—"}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Comarca</label>
                            <span className="valorLeitura">{processo.comarca || "—"}</span>
                        </div>
                        <div className="tituloInput informacaoPequena">
                            <label>Distribuído em</label>
                            <span className="valorLeitura">{formatDate(processo.dataDistribuicao)}</span>
                        </div>

                        {processo.liminar && (
                            <div className="tituloInput informacaoGrande">
                                <label>Liminar</label>
                                <span className="valorLeitura">
                                    {processo.liminarObservacao || "Sim"} {processo.liminarEm ? `(${formatDate(processo.liminarEm)})` : ""}
                                </span>
                            </div>
                        )}

                        {processo.descricao && (
                            <div className="tituloInput informacaoGrande">
                                <label>Descrição</label>
                                <span className="observacaoBox">{processo.descricao}</span>
                            </div>
                        )}
                    </div>
                )}

                {aba === "participantes" && (
                    <div className="secaoDetalhe">
                        <ul className="listaParticipantes">
                            {participantes.map((participante) => (
                                <li key={participante._id} className="itemParticipante">
                                    <div className="itemParticipanteInfo">
                                        <span className="nomeParticipante">
                                            {nomeDoCliente(participante.clienteId)}
                                            {participante.principal && <span className="badgePrincipal">Principal</span>}
                                        </span>
                                        <span className="infoSecundariaDetalhe">
                                            {labelDe(ESTADO_PORTAL_OPTIONS, participante.estadoPortal)}
                                        </span>
                                        {participante.temAcessoPortal ? (
                                            <LiberacaoPortal
                                                processoId={id}
                                                clienteId={participante.clienteId._id}
                                                nomeCliente={nomeDoCliente(participante.clienteId)}
                                                liberado={participante.liberadoNoPortal === true}
                                                onAlterado={(valor) => atualizarLiberacao(participante.clienteId._id, valor)}
                                            />
                                        ) : (
                                            <span className="infoSecundariaDetalhe">Sem senha no portal: defina uma senha provisória no cadastro do cliente.</span>
                                        )}
                                    </div>

                                    <div className="select selectPapel">
                                        <select
                                            value={participante.papel}
                                            onChange={(e) => trocarPapel(participante.clienteId._id, e.target.value)}
                                        >
                                            {PAPEL_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>

                                    {!participante.principal && (
                                        <button title="Define este cliente como o principal do processo" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => tornarPrincipal(participante.clienteId._id)}>
                                            Tornar principal
                                        </button>
                                    )}

                                    <button title="Mostra o código pessoal do cliente e a mensagem pronta para enviar"
                                        type="button"
                                        className="buttonOutlined botaoAcaoParticipante"
                                        onClick={() => setEntregaAberta(entregaAberta === participante.clienteId._id ? null : participante.clienteId._id)}
                                    >
                                        Entregar acesso
                                    </button>

                                    {!participante.principal && (
                                        <button type="button" className="botaoIcone botaoIconePerigo" title="Desvincular" onClick={() => confirmarRemoverCliente(participante.clienteId._id)}>
                                            <img src={lixeira} alt="Desvincular" />
                                        </button>
                                    )}

                                    {entregaAberta === participante.clienteId._id && (
                                        <EntregaAcesso
                                            processoId={id}
                                            clienteId={participante.clienteId._id}
                                            nomeCliente={nomeDoCliente(participante.clienteId)}
                                            nomeProcesso={processo.titulo}
                                            onLiberado={() => atualizarLiberacao(participante.clienteId._id, true)}
                                            onFechar={() => setEntregaAberta(null)}
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>

                        <FiltroDeOpcoes valor={filtroCliente} onChange={setFiltroCliente} total={clientesParaAdicionar.length} placeholder="Buscar cliente para vincular..." />
                        <form className="formNovoParticipante" onSubmit={adicionarParticipante}>
                            <div className="select">
                                <select value={novoClienteId} onChange={(e) => setNovoClienteId(e.target.value)}>
                                    <option value="">Adicionar cliente…</option>
                                    {filtrarOpcoes(clientesParaAdicionar, filtroCliente, nomeDoCliente, novoClienteId).map((cliente) => (
                                        <option key={cliente._id} value={cliente._id}>{nomeDoCliente(cliente)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="select">
                                <select value={novoPapel} onChange={(e) => setNovoPapel(e.target.value)}>
                                    {PAPEL_PROCESSO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <button title="Adicionar o cliente escolhido ao processo" type="submit" className="button" disabled={!novoClienteId || adicionando}>
                                {adicionando ? "Vinculando..." : "Vincular"}
                            </button>
                        </form>

                        <ConfirmacoesDoProcesso processoId={id} />
                    </div>
                )}

                {aba === "financeiro" && (
                    <div className="secaoDetalhe">
                        <div className="financeiroDetalheTopo">
                            <button title="Cadastrar um honorário neste processo" type="button" className="button" onClick={abrirNovoHonorario}>
                                + Novo honorário
                            </button>
                        </div>

                        {!ficha || ficha.honorarios.length === 0 ? (
                            <EmptyState titulo="Nenhum honorário cadastrado neste processo." descricao="Clique em &quot;+ Novo honorário&quot; para cadastrar o primeiro." />
                        ) : (
                            <div className="detalheListaFinanceiro">
                                {ficha.honorarios.map((honorario) => {
                                    const pagamentosDoHonorario = pagamentos.filter(
                                        (p) => (p.honorarioId?._id ?? p.honorarioId) === honorario._id
                                    );

                                    return (
                                        <div key={honorario._id} className="detalheCardFinanceiro">
                                            <div className="detalheCardFinanceiroCabecalho">
                                                <h4>{honorario.descricao}</h4>
                                                <div className="acoesDetalhe">
                                                    <button type="button" className="botaoIcone" title="Editar honorário" onClick={() => abrirEdicaoHonorario(honorario)}>
                                                        <img src={lapis} alt="Editar" />
                                                    </button>
                                                    <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir honorário" onClick={() => confirmarExcluirHonorario(honorario._id)}>
                                                        <img src={lixeira} alt="Excluir" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="detalheFinanceiroLinha">
                                                <span>Status</span>
                                                <strong>{labelDe(STATUS_HONORARIO_OPTIONS, honorario.status)}</strong>
                                            </div>
                                            <div className="detalheFinanceiroLinha">
                                                <span>Contratado</span>
                                                <strong>{formatCurrency(honorario.totais.contratado)}</strong>
                                            </div>
                                            <div className="detalheFinanceiroLinha">
                                                <span>Pago</span>
                                                <strong>{formatCurrency(honorario.totais.pago)}</strong>
                                            </div>
                                            <div className="detalheFinanceiroLinha">
                                                <span>Em aberto</span>
                                                <strong>{formatCurrency(honorario.totais.emAberto)}</strong>
                                            </div>
                                            {honorario.saldoAdiantado > 0 && (
                                                <div className="detalheFinanceiroLinha">
                                                    <span>Saldo adiantado</span>
                                                    <strong>{formatCurrency(honorario.saldoAdiantado)}</strong>
                                                </div>
                                            )}

                                            {honorario.parcelas.length > 0 && (
                                                <ul className="listaParcelas">
                                                    {honorario.parcelas.map((parcela) => (
                                                        <li key={parcela._id} className="itemParcela">
                                                            <span>Parcela {parcela.numeroParcela}</span>
                                                            <span>{formatDate(parcela.dataVencimento)}</span>
                                                            <span>{labelDe(STATUS_PARCELA_OPTIONS, parcela.status)}</span>
                                                            <span>{formatCurrency(parcela.valor)}</span>

                                                            <div className="acoesDetalhe">
                                                                <button type="button" className="botaoIcone" title="Editar parcela" onClick={() => abrirEdicaoParcela({ ...parcela, feeId: honorario._id })}>
                                                                    <img src={lapis} alt="Editar" />
                                                                </button>
                                                                <button type="button" className="botaoIcone botaoIconePerigo" title="Excluir parcela" onClick={() => confirmarExcluirParcela(parcela._id)}>
                                                                    <img src={lixeira} alt="Excluir" />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <div className="financeiroBotoesHonorario">
                                                <button title="Cadastrar uma parcela neste honorário" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => abrirNovaParcela(honorario._id)}>
                                                    + Nova parcela
                                                </button>
                                                {honorario.status !== "pago" && honorario.status !== "cancelado" && (
                                                    <button title="Lançar um valor recebido neste honorário" type="button" className="button botaoAcaoParticipante" onClick={() => abrirPagamento(honorario)}>
                                                        Registrar pagamento
                                                    </button>
                                                )}
                                                {honorario.totais.emAberto > 0 && (
                                                    <button title="Troca as parcelas em aberto por novas parcelas com o mesmo total" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => abrirReparcelamento(honorario)}>
                                                        Reparcelar
                                                    </button>
                                                )}
                                                <button title="Histórico de parcelas, pagamentos e estornos deste honorário" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => abrirExtrato(honorario)}>
                                                    Ver extrato
                                                </button>
                                            </div>

                                            {pagamentosDoHonorario.length > 0 && (
                                                <>
                                                    <p className="infoSecundariaDetalhe" style={{ marginTop: "0.75rem" }}>Pagamentos</p>
                                                    <ul className="listaParcelas">
                                                        {pagamentosDoHonorario.map((pagamento) => (
                                                            <li key={pagamento._id} className="itemParcela itemPagamento">
                                                                <span>{formatDate(pagamento.data)}</span>
                                                                <span>
                                                                    {formatCurrency(valorLiquidoDe(pagamento))}
                                                                    {Number(pagamento.totalEstornado ?? 0) > 0 && <span className="infoSecundariaDetalhe"> de {formatCurrency(pagamento.valor)}</span>}
                                                                </span>
                                                                <span>{labelDe(FORMA_PAGAMENTO_OPTIONS, pagamento.formaPagamento)}</span>
                                                                <span>
                                                                    {pagamento.tipo === "adiantamento" ? "Adiantamento" : "Comum"} <SituacaoPagamento pagamento={pagamento} />
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
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {aba === "documentos" && <DocumentosDoProcesso processoId={id} />}

                {aba === "linha-do-tempo" && (
                    <div className="secaoDetalhe">
                        {linhaDoTempo.length === 0 ? (
                            <EmptyState titulo="Nenhum evento registrado ainda." descricao="Mudanças de fase, liminares e eventos do processo aparecem aqui." />
                        ) : (
                            <ul className="listaLinhaDoTempo">
                                {linhaDoTempo.map((item, indice) => (
                                    <li key={item._id ?? indice} className="itemLinhaDoTempo">
                                        <span className="dataLinhaDoTempo">{formatDate(item.data)}</span>
                                        <span>
                                            {item.tipo === "fase" && (item.de ? `${item.deRotulo} → ${item.paraRotulo}` : `Processo iniciado em ${item.paraRotulo}`)}
                                            {item.tipo === "fase" && item.motivo && ` — ${item.motivo}`}
                                            {item.tipo === "encerramento" && `Trânsito em julgado${item.motivo ? ` — ${item.motivo}` : ""}`}
                                            {item.tipo === "liminar" && `Liminar${item.observacao ? ` — ${item.observacao}` : ""}`}
                                            {item.tipo === "evento" && `${item.tipoEventoRotulo}: ${item.titulo}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {formHonorario && (
                <div className="modalOverlay" onClick={fecharFormHonorario}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">{formHonorario._id ? "Editar honorário" : "Novo honorário"}</h2>
                        <ContextoDoProcesso processo={processo} cliente={clientePrincipal} />
                        <p className="notaCampo">Os valores do financeiro não aparecem no portal do cliente.</p>

                        <form onSubmit={salvarHonorario} className="calendarioForm">
                            <div className="divLabelTop">
                                <label htmlFor="descricaoHonorario">Descrição</label>
                                <input
                                    id="descricaoHonorario"
                                    name="descricao"
                                    type="text"
                                    value={formHonorario.descricao}
                                    onChange={handleHonorarioChange}
                                    className={campoComErroFinanceiro === "descricao" ? "input-erro" : undefined}
                                    required
                                />
                            </div>

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="tipoHonorario">Tipo</label>
                                    <select
                                        id="tipoHonorario"
                                        name="tipo"
                                        className={`select ${campoComErroFinanceiro === "tipo" ? "input-erro" : ""}`}
                                        value={formHonorario.tipo}
                                        onChange={handleHonorarioChange}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        {TIPO_HONORARIO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                    {formHonorario.tipo && <small className="notaCampo">{AJUDA_TIPO_HONORARIO[formHonorario.tipo]}</small>}
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="dataVencimentoHonorario">Data de vencimento</label>
                                    <input
                                        id="dataVencimentoHonorario"
                                        name="dataVencimento"
                                        type="date"
                                        value={formHonorario.dataVencimento}
                                        onChange={handleHonorarioChange}
                                        required
                                    />
                                </div>
                            </div>

                            {camposDoTipo(formHonorario.tipo).valor === "entrada" && (
                                <div className="divLabelTop">
                                    <label htmlFor="valorHonorario">Valor</label>
                                    <CampoDinheiro
                                        id="valorHonorario"
                                        name="valor"
                                        value={formHonorario.valor}
                                        onChange={(v) => handleHonorarioChange({ target: { name: "valor", value: v } })}
                                        className={campoComErroFinanceiro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>
                            )}

                            {camposDoTipo(formHonorario.tipo).percentual && (
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
                                                value={formHonorario.percentual}
                                                onChange={handleHonorarioChange}
                                                className={campoComErroFinanceiro === "percentual" ? "input-erro" : undefined}
                                                required
                                            />
                                            <small className="notaCampo">De 0,01 a 100. Valores acima de 100% não são aceitos.</small>
                                        </div>

                                        <div className="divLabelTop">
                                            <label htmlFor="valorBaseHonorario">Valor base</label>
                                            <CampoDinheiro
                                                id="valorBaseHonorario"
                                                name="valorBase"
                                                value={formHonorario.valorBase}
                                                onChange={(v) => handleHonorarioChange({ target: { name: "valorBase", value: v } })}
                                                className={campoComErroFinanceiro === "valorBase" ? "input-erro" : undefined}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <p className="infoSecundariaDetalhe">
                                        Valor do honorário: {" "}
                                        <strong>
                                            {derivarValorHonorario(formHonorario.percentual, formHonorario.valorBase) === null
                                                ? "—"
                                                : formatCurrency(derivarValorHonorario(formHonorario.percentual, formHonorario.valorBase))}
                                        </strong>
                                        {" "}(calculado — {formatPercent(formHonorario.percentual)} sobre {formHonorario.valorBase === "" ? "—" : formatCurrency(Number(formHonorario.valorBase))})
                                    </p>
                                </>
                            )}

                            {formHonorario._id && (
                                <label className="itemParticipante" style={{ cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={formHonorario.cancelado}
                                        onChange={(e) => setFormHonorario((prev) => ({ ...prev, cancelado: e.target.checked }))}
                                    />
                                    {" "}Cancelar este honorário
                                </label>
                            )}
                            {formHonorario._id && <small className="notaCampo">O status muda sozinho conforme as parcelas são pagas. Cancelado, o honorário sai do total contratado, mas continua na lista.</small>}

                            {erroFinanceiro && <p className="mensagemErro">{erroFinanceiro}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharFormHonorario}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvandoFinanceiro}>
                                    {salvandoFinanceiro ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {formParcela && (
                <div className="modalOverlay" onClick={fecharFormParcela}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">{formParcela._id ? "Editar parcela" : "Nova parcela"}</h2>
                        <ContextoDoProcesso processo={processo} cliente={clientePrincipal} honorario={honorarioDaFicha(formParcela.feeId)} />
                        <p className="notaCampo">Se o honorário tiver saldo adiantado, ele já é usado para pagar esta parcela.</p>

                        <form onSubmit={salvarParcela} className="calendarioForm">
                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="numeroParcela">Nº da parcela</label>
                                    <input
                                        id="numeroParcela"
                                        name="numeroParcela"
                                        type="number"
                                        min="1"
                                        value={formParcela.numeroParcela}
                                        onChange={handleParcelaChange}
                                        className={campoComErroFinanceiro === "numeroParcela" ? "input-erro" : undefined}
                                        required
                                    />
                                    <small className="notaCampo">Já vem com o próximo número livre deste honorário. Não pode repetir o de outra parcela dele.</small>
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="valorParcela">Valor</label>
                                    <CampoDinheiro
                                        id="valorParcela"
                                        name="valor"
                                        value={formParcela.valor}
                                        onChange={(v) => handleParcelaChange({ target: { name: "valor", value: v } })}
                                        className={campoComErroFinanceiro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="dataVencimentoParcela">Data de vencimento</label>
                                <input
                                    id="dataVencimentoParcela"
                                    name="dataVencimento"
                                    type="date"
                                    value={formParcela.dataVencimento}
                                    onChange={handleParcelaChange}
                                    required
                                />
                                <small className="notaCampo">Parcelas vencidas ou que vencem nos próximos 7 dias aparecem em destaque na Home.</small>
                            </div>

                            {erroFinanceiro && <p className="mensagemErro">{erroFinanceiro}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharFormParcela}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvandoFinanceiro}>
                                    {salvandoFinanceiro ? "Salvando..." : "Salvar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {formPagamento && (
                <div className="modalOverlay" onClick={fecharFormPagamento}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">Registrar pagamento</h2>
                        <ContextoDoProcesso processo={processo} cliente={clientePrincipal} honorario={formPagamento.honorarioSelecionado} />
                        <p className="notaCampo">Depois de salvo, só as observações podem ser alteradas. Para corrigir um valor, use "Estornar" no pagamento.</p>

                        <p className="infoSecundariaDetalhe">
                            {formPagamento.honorarioSelecionado?.descricao}
                            {" "}· Em aberto: {formatCurrency(formPagamento.honorarioSelecionado?.totais?.emAberto)}
                        </p>

                        <form onSubmit={salvarPagamento} className="calendarioForm">
                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="valorPagamento">Valor</label>
                                    <CampoDinheiro
                                        id="valorPagamento"
                                        name="valor"
                                        value={formPagamento.valor}
                                        onChange={(v) => handlePagamentoChange({ target: { name: "valor", value: v } })}
                                        className={campoComErroFinanceiro === "valor" ? "input-erro" : undefined}
                                        required
                                    />
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="tipoPagamento">Tipo</label>
                                    <select
                                        id="tipoPagamento"
                                        name="tipo"
                                        className="select"
                                        value={formPagamento.tipo}
                                        onChange={handlePagamentoChange}
                                        required
                                    >
                                        {TIPO_PAGAMENTO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <small className="notaCampo">O valor quita as parcelas em aberto a partir do vencimento mais antigo, e o que sobrar vira saldo adiantado. O tipo só identifica o pagamento.</small>

                            <button title="Mostra quais parcelas este valor vai quitar antes de salvar"
                                type="button"
                                className="buttonOutlined botaoAcaoParticipante"
                                onClick={calcularPreviewPagamento}
                                disabled={calculandoPreview}
                            >
                                {calculandoPreview ? "Calculando..." : "Ver onde este valor vai cair"}
                            </button>

                            {previewPagamento && (
                                <div className="detalheCardFinanceiro">
                                    {previewPagamento.destinos.length === 0 ? (
                                        <p className="infoSecundariaDetalhe">Nenhuma parcela em aberto — o valor todo vira saldo adiantado.</p>
                                    ) : (
                                        <ul className="listaParcelas">
                                            {previewPagamento.destinos.map((destino) => (
                                                <li key={destino.parcelaId} className="itemParcela">
                                                    <span>Parcela {destino.numeroParcela}</span>
                                                    <span>{formatCurrency(destino.valor)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {previewPagamento.sobra > 0 && (
                                        <div className="detalheFinanceiroLinha">
                                            <span>Sobra (vira saldo adiantado)</span>
                                            <strong>{formatCurrency(previewPagamento.sobra)}</strong>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="calendarioFormLinha">
                                <div className="divLabelTop">
                                    <label htmlFor="dataPagamento">Data do pagamento</label>
                                    <input
                                        id="dataPagamento"
                                        name="data"
                                        type="date"
                                        value={formPagamento.data}
                                        onChange={handlePagamentoChange}
                                        required
                                    />
                                </div>

                                <div className="divLabelTop">
                                    <label htmlFor="formaPagamento">Forma de pagamento</label>
                                    <select
                                        id="formaPagamento"
                                        name="formaPagamento"
                                        className="select"
                                        value={formPagamento.formaPagamento}
                                        onChange={handlePagamentoChange}
                                        required
                                    >
                                        {FORMA_PAGAMENTO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="divLabelTop">
                                <label htmlFor="observacoesPagamento">Observações (opcional)</label>
                                <input
                                    id="observacoesPagamento"
                                    name="observacoes"
                                    type="text"
                                    maxLength={1000}
                                    value={formPagamento.observacoes}
                                    onChange={handlePagamentoChange}
                                />
                            </div>

                            {erroFinanceiro && <p className="mensagemErro">{erroFinanceiro}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharFormPagamento}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvandoFinanceiro}>
                                    {salvandoFinanceiro ? "Salvando..." : "Salvar"}
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

            {extrato && (
                <div className="modalOverlay" onClick={fecharExtrato}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">Extrato — {extrato.honorario.descricao}</h2>

                        {extrato.carregando ? (
                            <p className="infoSecundariaDetalhe">Carregando...</p>
                        ) : extrato.eventos.length === 0 ? (
                            <p className="infoSecundariaDetalhe">Nenhum evento registrado ainda.</p>
                        ) : (
                            <ul className="listaLinhaDoTempo">
                                {extrato.eventos.map((evento) => (
                                    <li key={evento.id} className="itemLinhaDoTempo">
                                        <span className="dataLinhaDoTempo">{formatDate(evento.data)}</span>
                                        <span>{evento.descricao}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {extrato.totalPaginas > 1 && (
                            <div className="modalAcoes calendarioFormAcoes">
                                <button
                                    type="button"
                                    className="buttonOutlined modalBotao"
                                    disabled={extrato.pagina <= 1}
                                    onClick={() => mudarPaginaExtrato(extrato.pagina - 1)}
                                >
                                    Anterior
                                </button>
                                <span className="infoSecundariaDetalhe">Página {extrato.pagina} de {extrato.totalPaginas}</span>
                                <button
                                    type="button"
                                    className="buttonOutlined modalBotao"
                                    disabled={extrato.pagina >= extrato.totalPaginas}
                                    onClick={() => mudarPaginaExtrato(extrato.pagina + 1)}
                                >
                                    Próxima
                                </button>
                            </div>
                        )}

                        <div className="modalAcoes calendarioFormAcoes">
                            <button type="button" className="buttonOutlined modalBotao" onClick={fecharExtrato}>Fechar</button>
                        </div>
                    </div>
                </div>
            )}

            {formReparcelamento && (
                <div className="modalOverlay" onClick={fecharFormReparcelamento}>
                    <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modalTitulo">Reparcelar — {formReparcelamento.honorario.descricao}</h2>
                        <ContextoDoProcesso processo={processo} cliente={clientePrincipal} honorario={formReparcelamento.honorario} />

                        <p className="infoSecundariaDetalhe">
                            Saldo em aberto: {formatCurrency(formReparcelamento.honorario.totais.emAberto)}
                            {" "}· Soma das parcelas novas: {" "}
                            <strong className={somaReparcelamento !== formReparcelamento.honorario.totais.emAberto ? "mensagemErro" : undefined}>
                                {formatCurrency(somaReparcelamento)}
                            </strong>
                        </p>
                        <p className="infoSecundariaDetalhe">
                            Todas as parcelas em aberto deste honorário serão canceladas e substituídas pelas linhas abaixo. A soma tem que bater exatamente com o saldo em aberto.
                        </p>

                        <form onSubmit={salvarReparcelamento} className="calendarioForm">
                            {formReparcelamento.parcelas.map((parcela, indice) => (
                                <div className="calendarioFormLinha" key={indice}>
                                    <div className="divLabelTop">
                                        <label>Valor</label>
                                        <CampoDinheiro
                                            value={parcela.valor}
                                            onChange={(v) => handleLinhaReparcelamentoChange(indice, "valor", v)}
                                            required
                                        />
                                    </div>
                                    <div className="divLabelTop">
                                        <label>Vencimento</label>
                                        <input
                                            type="date"
                                            value={parcela.dataVencimento}
                                            onChange={(e) => handleLinhaReparcelamentoChange(indice, "dataVencimento", e.target.value)}
                                            required
                                        />
                                    </div>
                                    {formReparcelamento.parcelas.length > 1 && (
                                        <button type="button" className="botaoIcone botaoIconePerigo" title="Remover linha" onClick={() => removerLinhaReparcelamento(indice)}>
                                            <img src={lixeira} alt="Remover" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button title="Adicionar mais uma linha de parcela" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={adicionarLinhaReparcelamento}>
                                + Adicionar parcela
                            </button>

                            <div className="divLabelTop">
                                <label htmlFor="motivoReparcelamento">Motivo (opcional)</label>
                                <input
                                    id="motivoReparcelamento"
                                    type="text"
                                    maxLength={500}
                                    value={formReparcelamento.motivo}
                                    onChange={(e) => setFormReparcelamento((prev) => ({ ...prev, motivo: e.target.value }))}
                                />
                            </div>

                            {erroFinanceiro && <p className="mensagemErro">{erroFinanceiro}</p>}

                            <div className="modalAcoes calendarioFormAcoes">
                                <button type="button" className="buttonOutlined modalBotao" onClick={fecharFormReparcelamento}>Cancelar</button>
                                <button type="submit" className="button modalBotao" disabled={salvandoFinanceiro}>
                                    {salvandoFinanceiro ? "Salvando..." : "Confirmar reparcelamento"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Modal
                aberto={modalExcluirHonorario.aberto}
                titulo="Excluir honorário"
                mensagem="Tem certeza que deseja excluir este honorário? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluirHonorario}
                onCancelar={() => setModalExcluirHonorario({ aberto: false, id: null })}
            />

            <Modal
                aberto={modalExcluirParcela.aberto}
                titulo="Excluir parcela"
                mensagem="Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita."
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluirParcela}
                onCancelar={() => setModalExcluirParcela({ aberto: false, id: null })}
            />

            <Modal
                aberto={Boolean(modalExcluirProcesso)}
                titulo="Excluir processo"
                mensagem={modalExcluirProcesso}
                perigo
                labelConfirmar="Excluir"
                onConfirmar={excluirProcesso}
                onCancelar={() => setModalExcluirProcesso(null)}
            />

            <Modal
                aberto={modalRemoverCliente.aberto}
                titulo="Desvincular cliente"
                mensagem="Tem certeza que deseja desvincular este cliente do processo?"
                perigo
                labelConfirmar="Desvincular"
                onConfirmar={removerParticipante}
                onCancelar={() => setModalRemoverCliente({ aberto: false, clienteId: null })}
            />

            <Modal
                aberto={Boolean(mensagemFalhaExclusao)}
                titulo="Não foi possível excluir"
                mensagem={mensagemFalhaExclusao}
                somenteInfo
                labelConfirmar="Entendi"
                onConfirmar={() => setMensagemFalhaExclusao(null)}
            />
        </div>
    );
}

export default ProcessosDetalhes;