import { isCacheableResource } from './cacheKey.js';

export const MAX_TOTAL_BYTES = 5 * 1024 * 1024;
export const MAX_ENTRIES = 120;
export const MAX_ENTRY_BYTES = 256 * 1024;

const encoder = new TextEncoder();

export const estimateBytes = (value) => {
  if (value === undefined) return 0;
  try {
    return encoder.encode(JSON.stringify(value)).length;
  } catch {
    return Infinity;
  }
};

const ehBinario = (value) =>
  (typeof Blob !== 'undefined' && value instanceof Blob) ||
  (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) ||
  ArrayBuffer.isView?.(value) === true;

export const isStorable = ({ resource, value } = {}) => {
  if (!isCacheableResource(resource)) {
    return { ok: false, motivo: `recurso "${resource}" fora da lista do que se guarda` };
  }
  if (value === undefined || value === null) {
    return { ok: false, motivo: 'não há valor a guardar' };
  }
  if (ehBinario(value)) {
    return { ok: false, motivo: 'binário não se guarda — PDF e DOCX ficam de fora' };
  }
  const bytes = estimateBytes(value);
  if (bytes > MAX_ENTRY_BYTES) {
    return { ok: false, motivo: `entrada de ${bytes} bytes acima do teto de ${MAX_ENTRY_BYTES}` };
  }
  return { ok: true, motivo: null, bytes };
};

export const chooseEvictions = ({
  entries = [],
  incomingKey = null,
  incomingBytes = 0,
  maxTotalBytes = MAX_TOTAL_BYTES,
  maxEntries = MAX_ENTRIES,
} = {}) => {
  const outras = entries.filter((e) => e && e.chave !== incomingKey);

  let bytes = outras.reduce((soma, e) => soma + (Number(e.bytes) || 0), 0) + incomingBytes;
  let quantidade = outras.length + 1;

  const candidatas = [...outras].sort((a, b) => {
    const x = Number(a.atualizadoEm) || 0;
    const y = Number(b.atualizadoEm) || 0;
    if (x !== y) return x - y;
    return String(a.chave).localeCompare(String(b.chave));
  });

  const descartar = [];
  for (const entrada of candidatas) {
    if (bytes <= maxTotalBytes && quantidade <= maxEntries) break;
    descartar.push(entrada.chave);
    bytes -= Number(entrada.bytes) || 0;
    quantidade -= 1;
  }
  return descartar;
};

export const decideSource = ({ online, hasCache } = {}) => {
  if (online) return 'network';
  return hasCache ? 'cache' : 'unavailable';
};
