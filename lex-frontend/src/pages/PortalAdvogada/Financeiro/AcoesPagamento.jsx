import { useState } from "react";

import paymentService from "../../../services/paymentService";

import { getApiErrorField } from "../../../utils/apiError";
import { getFinancialErrorMessage } from "../../../utils/financialErrors";
import { formatDate, formatCurrency } from "../../../utils/formatters";
import { toast } from "../../../utils/toast";
import CampoDinheiro from "../../../components/CampoDinheiro/CampoDinheiro";
import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

const ROTULO_ESTORNO = {
    total: "Estorno total",
    parcial: "Estorno parcial",
    anulacao: "Anulação de estorno",
};

export const valorLiquidoDe = (pagamento) => Number(pagamento.valorLiquido ?? pagamento.valor ?? 0);

export const podeEstornar = (pagamento) => valorLiquidoDe(pagamento) > 0;

export function SituacaoPagamento({ pagamento }) {
    const estornado = Number(pagamento.totalEstornado ?? 0);
    if (estornado <= 0) return null;

    return valorLiquidoDe(pagamento) <= 0
        ? <span className="statusBadge statusBadge--danger">Estornado</span>
        : <span className="statusBadge statusBadge--warning">Estorno parcial</span>;
}

export function EstornosDoPagamento({ pagamento, onAnular }) {
    const estornos = pagamento.estornos ?? [];
    if (estornos.length === 0) return null;

    return (
        <ul className="estornosLista">
            <li className="estornosResumo">
                Valor pago {formatCurrency(pagamento.valor)} · estornado {formatCurrency(pagamento.totalEstornado)} · líquido {formatCurrency(valorLiquidoDe(pagamento))}
            </li>
            {estornos.map((estorno) => (
                <li key={estorno._id} className={`estornoItem ${estorno.anulado ? "estornoItem--anulado" : ""}`}>
                    <span>{formatDate(estorno.data)}</span>
                    <span>{ROTULO_ESTORNO[estorno.tipo] ?? "Estorno"}{estorno.anulado ? " (anulado)" : ""}</span>
                    <span>{estorno.tipo === "anulacao" ? "—" : formatCurrency(estorno.valor)}</span>
                    <span className="estornoMotivo" title={estorno.motivo}>{estorno.motivo}</span>
                    {estorno.tipo !== "anulacao" && !estorno.anulado && (
                        <button title="Desfaz este estorno e o valor volta a contar como pago" type="button" className="buttonOutlined botaoAcaoParticipante" onClick={() => onAnular(estorno)}>
                            Anular
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

export function EstornoModal({ pagamento, estorno, onFechar, onConcluido }) {
    const ehAnulacao = Boolean(estorno);

    const [valor, setValor] = useState(String(valorLiquidoDe(pagamento)));
    const [motivo, setMotivo] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [campoComErro, setCampoComErro] = useState(null);

    const enviar = async (e) => {
        e.preventDefault();
        setSalvando(true);
        setErro("");
        setCampoComErro(null);
        try {
            const corpo = ehAnulacao
                ? { estornoAnuladoId: estorno._id, motivo }
                : { valor: Number(valor), motivo };
            await paymentService.criarEstorno(pagamento._id, corpo);
            toast.success(ehAnulacao ? "Estorno anulado." : "Estorno registrado.");
            onConcluido();
        } catch (err) {
            setErro(getFinancialErrorMessage(err, "Não foi possível concluir a operação."));
            setCampoComErro(getApiErrorField(err));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="modalOverlay" onClick={onFechar}>
            <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h2 className="modalTitulo">{ehAnulacao ? "Anular estorno" : "Estornar pagamento"}{ehAnulacao ? <Ajuda assunto={AJUDA.anularEstorno.assunto}>{AJUDA.anularEstorno.texto}</Ajuda> : <Ajuda assunto={AJUDA.estorno.assunto}>{AJUDA.estorno.texto}</Ajuda>}</h2>

                <p className="infoSecundariaDetalhe">
                    Pagamento de {formatCurrency(pagamento.valor)} em {formatDate(pagamento.data)}
                    {Number(pagamento.totalEstornado ?? 0) > 0 && ` · já estornado ${formatCurrency(pagamento.totalEstornado)}`}
                </p>

                {ehAnulacao ? (
                    <p className="infoSecundariaDetalhe">
                        O estorno de {formatCurrency(estorno.valor)} de {formatDate(estorno.data)} deixa de valer e o valor volta a contar como pago. Um estorno só pode ser anulado uma vez.
                    </p>
                ) : (
                    <p className="infoSecundariaDetalhe">
                        Pode estornar até {formatCurrency(valorLiquidoDe(pagamento))}. O valor sai das parcelas e o honorário volta a ter saldo em aberto.
                    </p>
                )}

                <form onSubmit={enviar} className="calendarioForm">
                    {!ehAnulacao && (
                        <div className="divLabelTop">
                            <label htmlFor="valorEstorno">Valor a estornar</label>
                            <CampoDinheiro
                                id="valorEstorno"
                                value={valor}
                                onChange={setValor}
                                className={campoComErro === "valor" ? "input-erro" : undefined}
                                required
                            />
                        </div>
                    )}

                    <div className="divLabelTop">
                        <label htmlFor="motivoEstorno">Motivo</label>
                        <input
                            id="motivoEstorno"
                            type="text"
                            minLength={3}
                            maxLength={500}
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            className={campoComErro === "motivo" ? "input-erro" : undefined}
                            required
                        />
                    </div>

                    {erro && <p className="mensagemErro">{erro}</p>}

                    <div className="modalAcoes calendarioFormAcoes">
                        <button type="button" className="buttonOutlined modalBotao" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="modalBotao modalBotaoPerigo" disabled={salvando}>
                            {salvando ? "Salvando..." : ehAnulacao ? "Anular estorno" : "Estornar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ObservacoesModal({ pagamento, onFechar, onConcluido }) {
    const [observacoes, setObservacoes] = useState(pagamento.observacoes ?? "");
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");

    const enviar = async (e) => {
        e.preventDefault();
        setSalvando(true);
        setErro("");
        try {
            await paymentService.updatePayment(pagamento._id, { observacoes: observacoes.trim() || null });
            toast.success("Observações do pagamento atualizadas.");
            onConcluido();
        } catch (err) {
            setErro(getFinancialErrorMessage(err, "Não foi possível salvar as observações."));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="modalOverlay" onClick={onFechar}>
            <div className="modalCaixa" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <h2 className="modalTitulo">Observações do pagamento</h2>

                <p className="infoSecundariaDetalhe">
                    Pagamento de {formatCurrency(pagamento.valor)} em {formatDate(pagamento.data)}. Valor, data e forma não mudam depois de registrados: para corrigir, estorne e registre de novo.
                </p>

                <form onSubmit={enviar} className="calendarioForm">
                    <div className="divLabelTop">
                        <label htmlFor="observacoesPagamento">Observações</label>
                        <textarea
                            id="observacoesPagamento"
                            rows={4}
                            maxLength={1000}
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                        />
                    </div>

                    {erro && <p className="mensagemErro">{erro}</p>}

                    <div className="modalAcoes calendarioFormAcoes">
                        <button type="button" className="buttonOutlined modalBotao" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="button modalBotao" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
