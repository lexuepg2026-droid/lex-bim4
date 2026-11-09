import { formatUpdatedAt } from './dataAge.js';
import { rotuloDaFase } from '../utils/enums.js';
import { OPERACAO_POR_ID } from './outboxOperations.js';

export const classificarFalha = ({ status = null, regra = null, offline = false } = {}) => {
  if (offline || status === null) return 'semSinal';
  if (status === 409 && regra === 'conflitoDeVersao') return 'conflito';
  if (status >= 500) return 'servidor';
  if (status >= 400) return 'recusado';
  return 'servidor';
};

export const mensagemDaFalha = (classificacao, { motivoDoServidor = null } = {}) => {
  switch (classificacao) {
    case 'conflito':
      return 'Este registro foi alterado em outro aparelho depois que você o editou. ' +
        'Compare as duas versões e escolha qual vale.';
    case 'recusado':
      return motivoDoServidor
        ? `O servidor recusou: ${motivoDoServidor}`
        : 'O servidor recusou esta gravação. Corrija e envie de novo.';
    case 'servidor':
      return 'O servidor não conseguiu gravar agora. Você pode tentar de novo.';
    case 'semSinal':
    default:
      return 'Ainda sem conexão. Será enviado sozinho quando o sinal voltar.';
  }
};

export const descreverEntrada = (entrada, agora = Date.now()) => {
  const operacao = OPERACAO_POR_ID[entrada?.operacao];
  const rotulo = operacao?.rotulo ?? 'Alteração';
  const verbo = operacao?.verbo ?? 'registrada';
  const quando = formatUpdatedAt(entrada?.criadoEm, agora);
  const titulo = entrada?.titulo ? ` "${entrada.titulo}"` : '';

  return `${rotulo}${titulo}, ${verbo}${quando ? ` ${quando}` : ''}`;
};

export const tituloDaRequisicao = (operacaoId, body) => {
  if (!body || typeof body !== 'object') return null;
  if (operacaoId === 'criarEvento' || operacaoId === 'atualizarEvento') {
    return typeof body.titulo === 'string' && body.titulo.trim() !== ''
      ? body.titulo.trim()
      : null;
  }
  if (operacaoId === 'mudarFase') {
    return typeof body.fase === 'string' ? rotuloDaFase(body.fase) : null;
  }
  return null;
};

export const mensagemDeDescarte = (entrada, agora = Date.now()) =>
  `Descartar "${descreverEntrada(entrada, agora)}"? ` +
  'Esta alteração nunca chegou ao servidor e não será enviada. ' +
  'Não há como recuperá-la depois.';

export const mensagemDeLogoutComFila = (quantas) =>
  quantas === 1
    ? 'Há 1 alteração que ainda não foi enviada ao servidor. Se você sair agora, ' +
      'ela será descartada e não há como recuperá-la.'
    : `Há ${quantas} alterações que ainda não foram enviadas ao servidor. Se você ` +
      'sair agora, elas serão descartadas e não há como recuperá-las.';

export const MENSAGEM_ENFILEIRADO =
  'Sem conexão — a alteração ficou na fila e será enviada sozinha quando o sinal voltar.';

export const MENSAGEM_ALTERACAO_NAO_ENVIADA =
  'Há alteração não enviada nesta tela. O que aparece aqui é o que está no servidor.';
