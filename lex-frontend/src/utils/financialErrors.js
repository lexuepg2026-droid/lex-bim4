import {
  getApiErrorMessage,
  getApiErrorConflict,
  getApiErrorPendencias,
} from './apiError.js';
import { formatCurrency } from './formatters.js';

const ROTULO_DEPENDENCIA = {
  parcelas: { singular: 'parcela ativa', plural: 'parcelas ativas', acao: 'A exclusão foi recusada.', verbo: 'excluir' },
  pagamentos: { singular: 'pagamento ativo', plural: 'pagamentos ativos', acao: 'A exclusão foi recusada.', verbo: 'excluir' },
  processos: { singular: 'processo ativo', plural: 'processos ativos', acao: 'A desativação foi recusada.', verbo: 'desativar' },
  documentos: { singular: 'documento ativo', plural: 'documentos ativos', acao: 'A exclusão foi recusada.', verbo: 'excluir' },
};

export const mensagemDeExcedente = (err) => {
  const { regra, saldoDisponivel, valorParcela } = getApiErrorConflict(err);
  if (regra !== 'pagamentoExcedeParcela' || saldoDisponivel === null) return null;

  const base = getApiErrorMessage(err, 'O pagamento excede o valor da parcela.');
  const saldo = formatCurrency(saldoDisponivel);

  const complemento =
    saldoDisponivel <= 0
      ? `A parcela de ${formatCurrency(valorParcela)} já está quitada — não há saldo a receber nela.`
      : `Ainda cabem ${saldo} nesta parcela, de ${formatCurrency(valorParcela)} no total.`;

  return `${base} ${complemento}`;
};

export const mensagemDeIntegridade = (err) => {
  const { dependencia, quantidade } = getApiErrorConflict(err);
  if (!dependencia || quantidade === null) return null;

  const rotulo = ROTULO_DEPENDENCIA[dependencia];
  if (!rotulo) return null;

  const base = getApiErrorMessage(err, rotulo.acao);
  const contagem = quantidade === 1 ? `1 ${rotulo.singular}` : `${quantidade} ${rotulo.plural}`;

  return `${base} Há ${contagem} vinculada(s) — remova antes de ${rotulo.verbo}.`;
};

export const mensagemDePendencias = (err) => {
  const pendencias = getApiErrorPendencias(err);
  if (pendencias.length === 0) return null;

  const base = getApiErrorMessage(err, 'Faltam dados de cadastro para gerar o documento.');
  const itens = pendencias
    .map((p) => p.rotulo)
    .filter(Boolean)
    .join(', ');

  return itens ? `${base} Pendências: ${itens}.` : base;
};

export const getFinancialErrorMessage = (err, fallback) =>
  mensagemDeExcedente(err) ??
  mensagemDeIntegridade(err) ??
  mensagemDePendencias(err) ??
  getApiErrorMessage(err, fallback);
