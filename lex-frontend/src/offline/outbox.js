import { buildQueueKey } from './cacheKey.js';
import * as store from './offlineStore.js';
import { montarEntrada, marcarFalha, marcarPendente } from './outboxEntry.js';
import { ordenarFila, proximaEntrada } from './outboxPlan.js';
import { classificarFalha, mensagemDaFalha } from './outboxMessages.js';
import { avisarFilaMudou } from './outboxEvents.js';
import {
  getApiErrorMessage,
  getApiErrorStatus,
  getApiErrorConflict,
  getApiErrorDetails
} from '../utils/apiError.js';

const chaveDe = (userId, id) => buildQueueKey({ userId, chave: id });

const lerFilaCrua = async (userId) => {
  const registros = await store.listFila();
  return registros
    .filter((r) => r?.chave === chaveDe(userId, r?.entrada?.id))
    .map((r) => r.entrada);
};

export const listarFila = async (userId) => {
  try {
    if (!userId) return [];
    return ordenarFila(await lerFilaCrua(userId));
  } catch {
    return [];
  }
};

export const contarFila = async (userId) => (await listarFila(userId)).length;

export const enfileirar = async ({
  userId, method, url, body, versaoVista = null, titulo = null, agora = Date.now()
}) => {
  const fila = await listarFila(userId);
  const entrada = montarEntrada({
    method, url, body, versaoVista, titulo, agora, seq: fila.length
  });

  const gravou = await store.putFila({ chave: chaveDe(userId, entrada.id), entrada });
  if (!gravou) return null;
  avisarFilaMudou(userId);
  return entrada;
};

const gravar = async (userId, entrada) =>
  store.putFila({ chave: chaveDe(userId, entrada.id), entrada });

export const descreverFalha = (err) => {
  const status = getApiErrorStatus(err);
  const { regra } = getApiErrorConflict(err);
  const classificacao = classificarFalha({
    status,
    regra,
    offline: status === null
  });

  return {
    classificacao,
    status,
    regra: regra ?? null,
    mensagem: mensagemDaFalha(classificacao, {
      motivoDoServidor: status === null ? null : getApiErrorMessage(err, null)
    }),
    atual: classificacao === 'conflito' ? (getApiErrorDetails(err)?.atual ?? null) : null,
    em: Date.now()
  };
};

export const enviarFila = async ({ userId, enviar }) => {
  let fila = await listarFila(userId);
  const enviadas = [];
  let bloqueio = null;

  for (;;) {
    const entrada = proximaEntrada(fila);
    if (!entrada) break;

    try {
      await enviar(entrada);
      await store.removeFila(chaveDe(userId, entrada.id));
      fila = fila.filter((e) => e.id !== entrada.id);
      enviadas.push(entrada.id);
    } catch (err) {
      const falha = descreverFalha(err);
      const marcada = marcarFalha(entrada, falha);
      await gravar(userId, marcada);
      fila = fila.map((e) => (e.id === entrada.id ? marcada : e));
      bloqueio = { id: entrada.id, falha };
      break;
    }
  }

  return { enviadas, bloqueio, restantes: fila.length };
};

export const tentarDeNovo = async (userId, id) => {
  const fila = await listarFila(userId);
  const entrada = fila.find((e) => e.id === id);
  if (!entrada) return null;
  const pendente = marcarPendente(entrada);
  await gravar(userId, pendente);
  return pendente;
};

export const manterMinhaVersao = async (userId, id, agora = Date.now()) => {
  const fila = await listarFila(userId);
  const entrada = fila.find((e) => e.id === id);
  if (!entrada || entrada.falha?.classificacao !== 'conflito') return null;

  const versaoDoServidor = entrada.falha?.atual?.updatedAt ?? null;

  const nova = montarEntrada({
    method: entrada.method,
    url: entrada.url,
    body: entrada.body,
    versaoVista: versaoDoServidor,
    titulo: entrada.titulo,
    agora,
    seq: fila.length
  });

  await store.putFila({ chave: chaveDe(userId, nova.id), entrada: nova });
  await store.removeFila(chaveDe(userId, entrada.id));
  return nova;
};

export const descartar = async (userId, id) => {
  await store.removeFila(chaveDe(userId, id));
  return true;
};
