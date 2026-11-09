import { MENSAGEM_ESCRITA_OFFLINE } from './offlineMessages.js';
import { MENSAGEM_ENFILEIRADO } from './outboxMessages.js';

export const WRITE_METHODS = Object.freeze(['post', 'put', 'patch', 'delete']);

export const isWriteMethod = (method) =>
  typeof method === 'string' && WRITE_METHODS.includes(method.toLowerCase());

export const shouldBlockWrite = ({ method, online } = {}) =>
  isWriteMethod(method) && online === false;

export const offlineWriteError = (config) => {
  const erro = new Error(MENSAGEM_ESCRITA_OFFLINE);
  erro.offline = true;
  erro.config = config;
  return erro;
};

export const offlineQueuedError = (config, entrada) => {
  const erro = new Error(MENSAGEM_ENFILEIRADO);
  erro.offline = true;
  erro.enfileirado = true;
  erro.entrada = entrada;
  erro.config = config;
  return erro;
};
