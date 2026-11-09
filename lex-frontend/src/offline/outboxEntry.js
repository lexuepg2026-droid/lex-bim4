import { identificarOperacao } from './outboxOperations.js';

export const novaChaveDeIdempotencia = () => {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();

  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-` +
    `${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const ESTADOS = Object.freeze(['pendente', 'falhou']);

export const montarEntrada = ({
  method,
  url,
  body = null,
  versaoVista = null,
  titulo = null,
  agora = Date.now(),
  chave = novaChaveDeIdempotencia(),
  seq = 0
} = {}) => {
  const operacao = identificarOperacao({ method, url });

  if (!operacao) {
    throw new Error(`fila: operação não enfileirável — ${String(method).toUpperCase()} ${url}`);
  }

  return {
    id: chave,
    chaveIdempotencia: chave,
    operacao: operacao.id,
    method: String(method).toLowerCase(),
    url,
    body,
    versaoVista,
    titulo,
    criadoEm: agora,
    seq,
    estado: 'pendente',
    tentativas: 0,
    falha: null
  };
};

export const marcarFalha = (entrada, falha) => ({
  ...entrada,
  estado: 'falhou',
  tentativas: (entrada.tentativas ?? 0) + 1,
  falha
});

export const marcarPendente = (entrada) => ({
  ...entrada,
  estado: 'pendente',
  falha: null
});
