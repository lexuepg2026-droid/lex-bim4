import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Loading from "../../../components/Loading/Loading";

import financeiroService from "../../../services/financeiroService";

import { formatCurrency, formatDate } from "../../../utils/formatters";
import { getApiErrorMessage } from "../../../utils/apiError";

import HonorariosLista from "./HonorariosLista";
import ParcelasLista from "./ParcelasLista";
import PagamentosLista from "./PagamentosLista";

import "./Financeiro.css";

const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const rotuloDoMes = (mesReferencia) => {
    if (!mesReferencia) return "";
    const [ano, mes] = mesReferencia.split("-");
    const nome = MESES[Number(mes) - 1] ?? "";
    return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
};

const RAIO = 45;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

const CARTOES = [
    { chave: "valorContratado", label: "Contratado", tom: "neutro" },
    { chave: "recebido", label: "Recebido", tom: "positivo" },
    { chave: "pendente", label: "Pendente", tom: "alerta" },
    { chave: "saldoAdiantado", label: "Saldo adiantado", tom: "info" },
    { chave: "valorVencido", label: "Vencido", tom: "perigo" },
];

function Financeiro() {
    const [resumo, setResumo] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        financeiroService.getResumo()
            .then((res) => setResumo(res.data))
            .catch((err) => setErro(getApiErrorMessage(err, "Falha ao carregar o resumo financeiro.")))
            .finally(() => setCarregando(false));
    }, []);

    if (carregando) return <Loading />;

    const recebidoNoMes = resumo?.recebidoNoMes ?? 0;
    const aReceberNoMes = resumo?.aReceberNoMes ?? 0;
    const totalMes = recebidoNoMes + aReceberNoMes;

    const pctRecebido = totalMes > 0 ? recebidoNoMes / totalMes : 0;
    const pctAReceber = totalMes > 0 ? aReceberNoMes / totalMes : 0;

    const comprimentoRecebido = CIRCUNFERENCIA * pctRecebido;
    const comprimentoAReceber = CIRCUNFERENCIA * pctAReceber;

    const proximos = resumo?.proximosVencimentos ?? [];

    return (
        <div className="telaFinanceiro">
            {/* ---------- Resumo ---------- */}
            <section className="baloesTelasAdvogada financeiroResumo">
                <h1 className="financeiroTitulo">Financeiro</h1>

                {erro && <p className="mensagemErro">{erro}</p>}

                <div className="financeiroCartoes">
                    {CARTOES.map((cartao) => (
                        <div key={cartao.chave} className={`financeiroCartao financeiroCartao--${cartao.tom}`}>
                            <span className="financeiroCartaoLabel">{cartao.label}</span>
                            <span className="financeiroCartaoValor">{formatCurrency(resumo?.[cartao.chave] ?? 0)}</span>
                        </div>
                    ))}

                    <div className="financeiroCartao financeiroCartao--perigo">
                        <span className="financeiroCartaoLabel">Parcelas vencidas</span>
                        <span className="financeiroCartaoValor">{resumo?.vencidas ?? 0}</span>
                    </div>
                </div>
            </section>

            {/* ---------- Próximos vencimentos + mês ---------- */}
            <div className="financeiroGradeInferior">
                <section className="baloesTelasAdvogada financeiroColunaPrincipal">
                    <div className="financeiroSecaoCabecalho">
                        <h2 className="financeiroSubtitulo">Próximos vencimentos</h2>
                        <Link to="/processos" className="financeiroVerProcessos">Ver processos</Link>
                    </div>

                    {proximos.length === 0 ? (
                        <p className="financeiroSemItens">Nenhum vencimento nos próximos dias.</p>
                    ) : (
                        <ul className="financeiroListaVencimentos">
                            {proximos.map((parcela) => (
                                <li key={parcela._id} className="financeiroItemVencimento">
                                    <span className="financeiroItemData">{formatDate(parcela.dataVencimento)}</span>

                                    <div className="financeiroItemCorpo">
                                        <span className="financeiroItemTitulo" title={parcela.descricaoHonorario}>
                                            {parcela.descricaoHonorario || "Honorário"}
                                        </span>
                                        <span className="financeiroItemProcesso">
                                            {parcela.totalParcelas ? `Parcela ${parcela.numeroParcela} de ${parcela.totalParcelas} · ` : ""}
                                            {parcela.numeroProcesso || "Sem nº de processo"}
                                        </span>
                                    </div>

                                    <span className="financeiroItemValor">{formatCurrency(parcela.emAberto)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="baloesTelasAdvogada financeiroColunaLateral">
                    <h2 className="financeiroSubtitulo">{rotuloDoMes(resumo?.mesReferencia) || "Este mês"}</h2>

                    {totalMes === 0 ? (
                        <p className="financeiroSemItens">Nenhum honorário com vencimento neste mês.</p>
                    ) : (
                        <>
                            <div className="financeiroDonutContainer">
                                <svg
                                    viewBox="0 0 100 100"
                                    className="financeiroDonut"
                                    role="img"
                                    aria-label={`${Math.round(pctRecebido * 100)}% recebido no mês`}
                                >
                                    <circle cx="50" cy="50" r={RAIO} fill="none" stroke="var(--bege10)" strokeWidth="10" />
                                    <circle
                                        cx="50" cy="50" r={RAIO} fill="none"
                                        stroke="var(--verdeStatus)" strokeWidth="10"
                                        strokeDasharray={`${comprimentoRecebido} ${CIRCUNFERENCIA}`}
                                        transform="rotate(-90 50 50)"
                                    />
                                    <circle
                                        cx="50" cy="50" r={RAIO} fill="none"
                                        stroke="var(--vermelhoStatus)" strokeWidth="10"
                                        strokeDasharray={`${comprimentoAReceber} ${CIRCUNFERENCIA}`}
                                        strokeDashoffset={-comprimentoRecebido}
                                        transform="rotate(-90 50 50)"
                                    />
                                </svg>
                                <div className="financeiroDonutCentro">
                                    <strong>{Math.round(pctRecebido * 100)}%</strong>
                                    <span>recebido</span>
                                </div>
                            </div>

                            <ul className="financeiroLegendaDonut">
                                <li>
                                    <span className="financeiroLegendaBolinha financeiroLegendaBolinha--verde" />
                                    <span className="financeiroLegendaLabel">Recebido</span>
                                    <span className="financeiroLegendaPercentual">{Math.round(pctRecebido * 100)}%</span>
                                    <span className="financeiroLegendaValor">{formatCurrency(recebidoNoMes)}</span>
                                </li>
                                <li>
                                    <span className="financeiroLegendaBolinha financeiroLegendaBolinha--vermelha" />
                                    <span className="financeiroLegendaLabel">A receber</span>
                                    <span className="financeiroLegendaPercentual">{Math.round(pctAReceber * 100)}%</span>
                                    <span className="financeiroLegendaValor">{formatCurrency(aReceberNoMes)}</span>
                                </li>
                                <li className="financeiroLegendaTotal">
                                    <span className="financeiroLegendaLabel">Total do mês</span>
                                    <span className="financeiroLegendaValor">{formatCurrency(totalMes)}</span>
                                </li>
                            </ul>
                        </>
                    )}
                </section>
            </div>

            <HonorariosLista />
            <ParcelasLista />
            <PagamentosLista />
        </div>
    );
}

export default Financeiro;