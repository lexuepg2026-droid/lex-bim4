// O toast global de erro, com política estreita (DEC-084, reescrita na fase R2).
//
// O interceptor emite toast só para o que NENHUMA tela sabe explicar:
//   - 5xx (o servidor falhou);
//   - sem resposta (o back fora do ar, a rede caiu com o navegador "online");
//   - 429 (muitas tentativas).
// Os 400/409/422 ficam com a tela, que sabe destacar o campo e dizer o que
// corrigir; o 401 é a perda de sessão, tratada à parte (avisoDeSessao).
//
// Quem não quer o toast (porque mostra o erro de outro jeito) passa
// `semToastGlobal: true` no config do axios.

import { getApiErrorMessage, getApiErrorStatus } from '../utils/apiError.js';

export function deveExibirToastGlobal(erro, config, online) {
  if (config?.semToastGlobal === true) return false;
  // Sem sinal: a camada offline já explicou (escrita barrada, enfileirada ou
  // leitura do espelho). Repetir em toast seria a mesma frase duas vezes.
  if (erro?.offline === true || erro?.enfileirado === true) return false;
  if (erro?.code === 'ERR_CANCELED') return false;

  const status = getApiErrorStatus(erro);
  if (status === null) return online === true;
  if (status === 401) return false;
  if (status === 429) return true;
  return status >= 500;
}

// A frase é a mesma que as telas mostram (utils/apiError.js): com a
// deduplicação do toast, a tela que também avisa não gera dois toasts iguais.
export const mensagemDoToastGlobal = (erro) => getApiErrorMessage(erro, 'O servidor encontrou um erro e não concluiu o pedido. Tente de novo em instantes.');

// ── A mensagem da sessão perdida sobrevive ao recarregamento ─────────────
//
// O interceptor manda para /login com window.location (recarrega a página), e
// um toast emitido antes disso morre com ela. A mensagem vai para o
// sessionStorage e o ToastContainer a mostra ao montar, uma vez.

export const CHAVE_AVISO_SESSAO = 'lex:aviso-sessao';
export const MENSAGEM_SESSAO_EXPIRADA = 'Sua sessão expirou. Faça login novamente.';

export function guardarAvisoDeSessao(armazenamento, mensagem = MENSAGEM_SESSAO_EXPIRADA) {
  try {
    armazenamento?.setItem(CHAVE_AVISO_SESSAO, mensagem);
  } catch {
    // Navegação privada sem storage: a advogada chega ao login sem o aviso.
  }
}

export function consumirAvisoDeSessao(armazenamento) {
  try {
    const mensagem = armazenamento?.getItem(CHAVE_AVISO_SESSAO) ?? null;
    if (mensagem) armazenamento.removeItem(CHAVE_AVISO_SESSAO);
    return mensagem;
  } catch {
    return null;
  }
}
