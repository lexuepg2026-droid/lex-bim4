import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import lupa from "../../../assets/images/icons/lupa.svg";
import sino from "../../../assets/images/icons/sino.svg";
import pessoa from "../../../assets/images/icons/pessoa.svg";
import documento from "../../../assets/images/icons/documento.svg";
import dinheiro from "../../../assets/images/icons/dinheiro.svg";
import relogio from "../../../assets/images/icons/relogio.svg";
import folder from "../../../assets/images/icons/folder.svg";

import Loading from "../../../components/Loading/Loading";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import EmptyState from "../../../components/EmptyState/EmptyState";

import { useAuth } from "../../../contexts/AuthContext";

import dashboardService from "../../../services/dashboardService";
import financeiroService from "../../../services/financeiroService";
import installmentService from "../../../services/installmentService";
import { buscarTudo } from "../../../utils/buscarTudo";

import { formatCurrency } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../utils/apiError";
import { dataDeCalendario, diaLocalDaquiA, prazoDaParcela, venceAte } from "../../../utils/datas";

import "./Home.css";

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const LIMITE_PARCELAS = 6;

const CARTOES = [
    { chave: "processosAtivos", label: "Processos ativos", rota: "/processos", icone: documento, cor: "primary" },
    { chave: "clientesCadastrados", label: "Clientes cadastrados", rota: "/clientes", icone: pessoa, cor: "primary" },
    { chave: "honorariosAReceber", label: "Honorários em aberto", rota: "/financeiro", icone: dinheiro, cor: "warning" },
    { chave: "parcelasVencidas", label: "Parcelas vencidas", rota: "/financeiro", icone: relogio, cor: "danger" },
    { chave: "documentosCadastrados", label: "Documentos cadastrados", rota: "/documentos", icone: folder, cor: "neutral" },
    { chave: "confirmacoesNaoVistas", label: "Confirmações novas", rota: null, icone: sino, cor: "info" },
];

const CARTOES_DO_MES = [
    { chave: "recebidoNoMes", label: (mes) => `Recebido em ${mes}`, icone: dinheiro, cor: "success" },
    { chave: "aReceberNoMes", label: (mes) => `A receber em ${mes}`, icone: relogio, cor: "warning" },
];

const CARTOES_FINANCEIROS = [
    { chave: "valorContratado", label: "Valor contratado (total)", icone: documento, cor: "primary" },
    { chave: "recebido", label: "Recebido (total)", icone: dinheiro, cor: "success" },
    { chave: "pendente", label: "Em aberto (total)", icone: relogio, cor: "warning" },
];

const mesAtual = () => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
};

const deslocarMes = (mes, quantidade) => {
    const [ano, numero] = mes.split("-").map(Number);
    const data = new Date(ano, numero - 1 + quantidade, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
};

const rotuloDoMes = (mes) => {
    const [ano, numero] = mes.split("-").map(Number);
    return `${MESES_ABREV[numero - 1]}/${ano}`;
};

const COR_STATUS = {
    ativo: "var(--verdeStatus)",
    pago: "var(--verdeStatus)",
    pendente: "var(--amareloStatus)",
    suspenso: "var(--amareloStatus)",
    parcialmente_pago: "var(--azulStatus)",
    encerrado: "var(--bege70)",
    vencido: "var(--vermelhoStatus)",
    cancelado: "var(--vermelhoStatus)",
};

const ROTULO_STATUS = {
    ativo: "Ativo",
    pago: "Pago",
    pendente: "Pendente",
    suspenso: "Suspenso",
    parcialmente_pago: "Parcialmente pago",
    encerrado: "Encerrado",
    vencido: "Vencido",
    cancelado: "Cancelado",
};

const rotuloStatus = (status) => {
    if (ROTULO_STATUS[status]) return ROTULO_STATUS[status];
    const texto = String(status).replace(/_/g, " ");
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const dataDeHoje = () => {
    const texto = new Date().toLocaleDateString("pt-BR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

// DEC-164: "processo · cliente" da parcela, com o processo resumido que
// GET /installments já manda (DEC-102 do back).
const contextoDaParcela = (parcela) => {
    const processo = parcela.processo;
    if (!processo) return "";
    return [processo.titulo || processo.numeroProcesso, processo.clientePrincipalNome].filter(Boolean).join(" · ");
};

const rotaDaParcela = (parcela) => {
    const processoId = parcela.processo?._id ?? parcela.processoId?._id ?? parcela.processoId;
    return processoId ? `/processos/detalhes/${processoId}` : "/financeiro";
};

const formatCurrencyCompacto = (valor) =>
    (valor ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
    });

const paraDadosDonut = (objeto) =>
    Object.entries(objeto || {})
        .map(([status, quantidade]) => ({ status, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

function DonutStatus({ titulo, dados }) {
    const RAIO = 40;
    const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
    const total = dados.reduce((acc, d) => acc + d.quantidade, 0);

    const { segmentos } = dados.reduce(
        (estado, d) => {
            const comprimento = total > 0 ? (d.quantidade / total) * CIRCUNFERENCIA : 0;
            return {
                acumulado: estado.acumulado + comprimento,
                segmentos: [...estado.segmentos, { ...d, comprimento, offset: -estado.acumulado }],
            };
        },
        { acumulado: 0, segmentos: [] }
    );

    return (
        <div className="homeGraficoPainel">
            <p className="homeGraficoTitulo">{titulo}</p>

            {total === 0 ? (
                <p className="homeGraficoSemDados">Sem dados</p>
            ) : (
                <div className="homeGraficoConteudo">
                    <div className="homeGraficoDonutArea">
                        <svg viewBox="0 0 100 100" className="homeGraficoDonut" role="img" aria-label={`${titulo}: ${total} no total`}>
                            <circle cx="50" cy="50" r={RAIO} fill="none" stroke="var(--bege10)" strokeWidth="12" />
                            {segmentos.map((s) => (
                                <circle
                                    key={s.status}
                                    cx="50" cy="50" r={RAIO} fill="none"
                                    stroke={COR_STATUS[s.status] ?? "var(--bege50)"}
                                    strokeWidth="12"
                                    strokeDasharray={`${s.comprimento} ${CIRCUNFERENCIA}`}
                                    strokeDashoffset={s.offset}
                                    transform="rotate(-90 50 50)"
                                />
                            ))}
                        </svg>
                        <div className="homeGraficoTotal">
                            <strong>{total}</strong>
                            <span>total</span>
                        </div>
                    </div>

                    <ul className="homeGraficoLegenda">
                        {dados.map((d) => (
                            <li key={d.status}>
                                <span className="homeGraficoLegendaBolinha" style={{ backgroundColor: COR_STATUS[d.status] ?? "var(--bege50)" }} />
                                <span className="homeGraficoLegendaNome">{rotuloStatus(d.status)}</span>
                                <span className="homeGraficoLegendaQtd">{d.quantidade}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function GraficoHonorariosPorMes({ dados }) {
    if (dados.length === 0) {
        return <EmptyState titulo="Sem dados mensais." descricao="Nenhum honorário registrado nos últimos 6 meses." />;
    }

    const maior = Math.max(...dados.map((d) => d.total), 1);

    return (
        <div className="homeGraficoBarras">
            {dados.map((d) => {
                const [, mesStr] = d.mes.split("-");
                const altura = (d.total / maior) * 100;
                return (
                    <div key={d.mes} className="homeBarraColuna" title={formatCurrency(d.total)}>
                        <span className="homeBarraValor">{formatCurrencyCompacto(d.total)}</span>
                        <div className="homeBarraTrilho">
                            <div className="homeBarra" style={{ height: `${altura}%` }} />
                        </div>
                        <span className="homeBarraLabel">{MESES_ABREV[Number(mesStr) - 1]}</span>
                    </div>
                );
            })}
        </div>
    );
}

function Cartao({ rota, icone, cor, valor, label }) {
    const conteudo = (
        <>
            <div className={`homeCartaoIcone homeCartaoIcone--${cor}`}>
                <img src={icone} alt="" />
            </div>
            <span className="homeCartaoLabel">{label}</span>
            <span className="homeCartaoValor">{valor}</span>
        </>
    );

    return rota ? (
        <Link to={rota} className="homeCartao">{conteudo}</Link>
    ) : (
        <div className="homeCartao homeCartaoEstatico">{conteudo}</div>
    );
}

function Home() {
    const { user } = useAuth();
    const primeiroNome = user?.nomeCompleto?.split(" ")[0] || "";

    const [resumo, setResumo] = useState(null);
    const [resumoFinanceiro, setResumoFinanceiro] = useState(null);
    const [statusData, setStatusData] = useState(null);
    const [feesByMonth, setFeesByMonth] = useState([]);
    const [parcelasUrgentes, setParcelasUrgentes] = useState([]);
    // Cada bloco sabe se carregou e se falhou: "Todas as parcelas estão em dia"
    // e "Sem dados mensais" só aparecem com a resposta na mão (fase R2).
    const [parcelasCarregadas, setParcelasCarregadas] = useState(false);
    const [erroParcelas, setErroParcelas] = useState("");
    const [mensalCarregado, setMensalCarregado] = useState(false);
    const [erroMensal, setErroMensal] = useState("");
    const [erroStatus, setErroStatus] = useState("");
    const [mes, setMes] = useState(mesAtual);
    const [busca, setBusca] = useState("");
    const navigate = useNavigate();
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        dashboardService.getDashboardSummary()
            .then((res) => setResumo(res.data))
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao carregar o resumo.")))
            .finally(() => setCarregando(false));
    }, []);

    useEffect(() => {
        financeiroService.getResumo({ mes })
            .then((res) => setResumoFinanceiro(res.data))
            .catch((err) => toast.error(getApiErrorMessage(err, "Não foi possível carregar os totais financeiros.")));
    }, [mes]);

    useEffect(() => {
        dashboardService.getStatusCounts()
            .then((res) => setStatusData(res.data))
            .catch((err) => {
                const mensagem = getApiErrorMessage(err, "Não foi possível carregar as estatísticas.");
                setErroStatus(mensagem);
                toast.error(mensagem);
            });
    }, []);

    useEffect(() => {
        dashboardService.getFeesByMonth({ mes })
            .then((res) => {
                setFeesByMonth(res.data);
                setMensalCarregado(true);
                setErroMensal("");
            })
            .catch((err) => {
                const mensagem = getApiErrorMessage(err, "Não foi possível carregar o gráfico financeiro.");
                setErroMensal(mensagem);
                toast.error(mensagem);
            });
    }, [mes]);

    useEffect(() => {
        // Datas de calendário, e não instantes no fuso do navegador (DEC-165).
        const ate = diaLocalDaquiA(7);

        buscarTudo(installmentService.listInstallments, { ate })
            .then((todas) => {
                const urgentes = todas
                    .filter((parcela) => {
                        if (parcela.status === "vencido") return true;
                        if (parcela.status !== "pendente") return false;
                        return venceAte(parcela.dataVencimento, 7);
                    })
                    .sort((a, b) => (dataDeCalendario(a.dataVencimento) ?? "").localeCompare(dataDeCalendario(b.dataVencimento) ?? ""));

                setParcelasUrgentes(urgentes);
                setParcelasCarregadas(true);
            })
            .catch((err) => {
                const mensagem = getApiErrorMessage(err, "Não foi possível carregar as cobranças urgentes.");
                setErroParcelas(mensagem);
                toast.error(mensagem);
            });
    }, []);

    const pesquisar = (e) => {
        e.preventDefault();
        if (!busca.trim()) return;
        navigate("/processos", { state: { busca: busca.trim() } });
    };

    const rotaDoCartao = (cartao) => {
        if (cartao.chave !== "confirmacoesNaoVistas") return cartao.rota;
        const porProcesso = resumo?.confirmacoesNovasPorProcesso ?? [];
        if (porProcesso.length === 1) return `/processos/detalhes/${porProcesso[0].processoId}`;
        return porProcesso.length > 1 ? "/processos" : null;
    };

    if (carregando) return <Loading />;

    const parcelasVisiveis = parcelasUrgentes.slice(0, LIMITE_PARCELAS);
    const parcelasRestantes = parcelasUrgentes.length - parcelasVisiveis.length;

    return (
        <div className="telaHome">
            <section className="baloesTelasAdvogada homeTopo">
                <div className="homeSaudacao">
                    <h1 className="homeTitulo">Olá, {primeiroNome}</h1>
                    <p className="homeData">{dataDeHoje()}</p>
                </div>

                <div className="homeTopoAcoes">
                    <form className="homeBusca" role="search" onSubmit={pesquisar}>
                        <img src={lupa} alt="" />
                        <input
                            type="search"
                            placeholder="Pesquisar processos"
                            aria-label="Pesquisar"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </form>

                    <nav className="homeAcoesRapidas" aria-label="Ações rápidas">
                        <Link to="/clientes/novo" className="homeAcaoRapida">
                            <img src={pessoa} alt="" />
                            <span>Novo cliente</span>
                        </Link>
                        <Link to="/processos/novo" className="homeAcaoRapida">
                            <img src={documento} alt="" />
                            <span>Novo processo</span>
                        </Link>
                        <Link to="/modelos" className="homeAcaoRapida">
                            <img src={folder} alt="" />
                            <span>Novo documento</span>
                        </Link>
                    </nav>
                </div>

                {erro && <p className="mensagemErro homeErro">{erro}</p>}
            </section>

            <section className="baloesTelasAdvogada homeResumo">
                <h2 className="homeSubtitulo">Resumo geral</h2>
                <div className="homeCartoes">
                    {CARTOES.map((cartao) => (
                        <Cartao
                            key={cartao.chave}
                            rota={rotaDoCartao(cartao)}
                            icone={cartao.icone}
                            cor={cartao.cor}
                            valor={resumo?.[cartao.chave] ?? 0}
                            label={cartao.label}
                        />
                    ))}
                </div>

                <div className="homeSecaoCabecalho homeSubtitulo--espacado homeFinanceiroCabecalho">
                    <h2 className="homeSubtitulo">Financeiro</h2>
                    <div className="homeSeletorMes" role="group" aria-label="Mês do financeiro">
                        <button type="button" className="homeSeletorMesSeta" onClick={() => setMes((atual) => deslocarMes(atual, -1))} title="Mês anterior" aria-label="Mês anterior">‹</button>
                        <input
                            type="month"
                            className="homeSeletorMesCampo"
                            value={mes}
                            onChange={(e) => setMes(e.target.value || mesAtual())}
                            aria-label="Escolher o mês"
                            title="Escolha o mês dos cartões e do gráfico"
                        />
                        <button type="button" className="homeSeletorMesSeta" onClick={() => setMes((atual) => deslocarMes(atual, 1))} title="Próximo mês" aria-label="Próximo mês">›</button>
                        {mes !== mesAtual() && (
                            <button type="button" className="buttonOutlined homeSeletorMesAtual" onClick={() => setMes(mesAtual())} title="Voltar para o mês corrente">
                                Mês atual
                            </button>
                        )}
                    </div>
                </div>
                <p className="notaCampo homeNotaMes">Os dois primeiros cartões e o gráfico seguem o mês escolhido. Os totais são de todo o período.</p>
                <div className="homeCartoes homeCartoes--financeiro">
                    {resumoFinanceiro && CARTOES_DO_MES.map((cartao) => (
                        <Cartao
                            key={cartao.chave}
                            rota="/financeiro"
                            icone={cartao.icone}
                            cor={cartao.cor}
                            valor={formatCurrency(resumoFinanceiro[cartao.chave] ?? 0)}
                            label={cartao.label(rotuloDoMes(resumoFinanceiro.mesReferencia ?? mes))}
                        />
                    ))}
                    {resumoFinanceiro && CARTOES_FINANCEIROS.map((cartao) => (
                        <Cartao
                            key={cartao.chave}
                            rota="/financeiro"
                            icone={cartao.icone}
                            cor={cartao.cor}
                            valor={formatCurrency(resumoFinanceiro[cartao.chave] ?? 0)}
                            label={cartao.label}
                        />
                    ))}
                </div>
            </section>

            <section className="baloesTelasAdvogada homeParcelas">
                <div className="homeSecaoCabecalho">
                    <h2 className="homeSubtitulo">
                        Parcelas que precisam de atenção
                        {parcelasUrgentes.length > 0 && (
                            <span className="homeContador">{parcelasUrgentes.length}</span>
                        )}
                    </h2>
                    <Link to="/financeiro" className="homeLinkSecao">Ver financeiro</Link>
                </div>

                {erroParcelas ? (
                    <p className="mensagemErro">{erroParcelas}</p>
                ) : !parcelasCarregadas ? (
                    <p className="homeCarregandoTexto">Carregando...</p>
                ) : parcelasUrgentes.length === 0 ? (
                    <EmptyState
                        titulo="Nenhuma parcela urgente."
                        descricao="Todas as parcelas estão em dia nos próximos 7 dias."
                    />
                ) : (
                    <>
                        <ul className="homeListaParcelas">
                            {parcelasVisiveis.map((parcela) => (
                                <li key={parcela._id} className="homeItemParcelaUrgente">
                                    {/* DEC-164: a linha inteira leva ao processo da parcela, e diz
                                        processo e cliente. */}
                                    <Link to={rotaDaParcela(parcela)} className="homeItemLinkParcela">
                                        <div className="homeItemCorpo">
                                            <span className="homeItemTitulo" title={parcela.feeId?.descricao}>
                                                {parcela.feeId?.descricao ?? "Honorário"}
                                            </span>
                                            <span className="homeItemSubtitulo">
                                                Parcela {parcela.numeroParcela} · {prazoDaParcela(parcela.dataVencimento)}
                                            </span>
                                            {contextoDaParcela(parcela) && (
                                                <span className="homeItemSubtitulo" title={contextoDaParcela(parcela)}>
                                                    {contextoDaParcela(parcela)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="homeItemDireita">
                                            <span className="homeItemValor">{formatCurrency(parcela.valor)}</span>
                                            <StatusBadge status={parcela.status} />
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {parcelasRestantes > 0 && (
                            <Link to="/financeiro" className="homeVerMais">
                                Ver mais {parcelasRestantes} {parcelasRestantes === 1 ? "parcela" : "parcelas"}
                            </Link>
                        )}
                    </>
                )}
            </section>

            <section className="baloesTelasAdvogada homeMensal">
                <h2 className="homeSubtitulo">Honorários contratados por mês</h2>
                <p className="notaCampo homeNotaMes">Os 6 meses até {rotuloDoMes(mes)}.</p>
                {erroMensal ? (
                    <p className="mensagemErro">{erroMensal}</p>
                ) : !mensalCarregado ? (
                    <p className="homeCarregandoTexto">Carregando...</p>
                ) : (
                    <GraficoHonorariosPorMes dados={feesByMonth} />
                )}
            </section>

            <section className="baloesTelasAdvogada homeStatus">
                <h2 className="homeSubtitulo">Distribuição por status</h2>

                {erroStatus ? (
                    <p className="mensagemErro">{erroStatus}</p>
                ) : !statusData ? (
                    <p className="homeCarregandoTexto">Carregando...</p>
                ) : (
                    <div className="homeGraficosGrade">
                        <DonutStatus titulo="Processos" dados={paraDadosDonut(statusData.processos)} />
                        <DonutStatus titulo="Honorários" dados={paraDadosDonut(statusData.honorarios)} />
                        <DonutStatus titulo="Parcelas" dados={paraDadosDonut(statusData.parcelas)} />
                    </div>
                )}
            </section>
        </div>
    );
}

export default Home;