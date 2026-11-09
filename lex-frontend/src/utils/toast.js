// Toasts: um canal pub/sub que o ToastContainer escuta (DEC-083, reescrita na fase R2).
//
// - três tipos: success, info e error, cada um com a sua duração;
// - a mesma mensagem do mesmo tipo não se repete dentro de JANELA_DEDUP: uma
//   tela que faz três pedidos ao back caído mostra UM aviso, não três;
// - as funções puras (duracaoDe, regiaoDe, deveEmitir) são exportadas para os
//   testes, sem navegador.

export const DURACOES = Object.freeze({ success: 3000, info: 4000, error: 6000 });
export const JANELA_DEDUP = 4000;

export const duracaoDe = (tipo) => DURACOES[tipo] ?? DURACOES.info;

// O erro interrompe o leitor de tela (role="alert"); sucesso e info esperam a
// vez (role="status").
export const regiaoDe = (tipo) => (tipo === 'error' ? 'alert' : 'status');

const chaveDe = (tipo, mensagem) => `${tipo}\u0000${mensagem}`;

export function deveEmitir(registro, tipo, mensagem, agora) {
  const chave = chaveDe(tipo, mensagem);
  const ultima = registro.get(chave);
  if (ultima !== undefined && agora - ultima < JANELA_DEDUP) return false;
  registro.set(chave, agora);
  for (const [k, t] of registro) {
    if (agora - t >= JANELA_DEDUP) registro.delete(k);
  }
  return true;
}

const subscribers = new Set();
const emitidos = new Map();
let _id = 0;

function notify(type, message) {
  if (!message) return;
  if (!deveEmitir(emitidos, type, message, Date.now())) return;
  const id = ++_id;
  subscribers.forEach((fn) => fn({ id, type, message, duracao: duracaoDe(type) }));
}

export const toast = {
  success: (message) => notify('success', message),
  info: (message) => notify('info', message),
  error: (message) => notify('error', message),
};

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Só para testes.
export function _limparDeduplicacao() {
  emitidos.clear();
}
