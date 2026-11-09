import { buildKey, keysOfOtherUsers } from './cacheKey.js';
import {
  isStorable,
  chooseEvictions,
  MAX_TOTAL_BYTES,
  MAX_ENTRIES,
} from './cachePolicy.js';
import * as store from './offlineStore.js';

export const readCached = async ({ userId, resource, params }) => {
  try {
    const registro = await store.get(buildKey({ userId, resource, params }));
    if (!registro) return null;
    return { valor: registro.valor, atualizadoEm: registro.atualizadoEm };
  } catch {
    return null;
  }
};

export const writeCached = async ({ userId, resource, params, valor, agora = Date.now() }) => {
  try {
    const veredito = isStorable({ resource, value: valor });
    if (!veredito.ok) return false;

    const chave = buildKey({ userId, resource, params });
    const registro = { chave, valor, atualizadoEm: agora, bytes: veredito.bytes };

    await liberarEspaco({ chave, bytes: veredito.bytes });

    try {
      return await store.put(registro);
    } catch (erro) {
      if (erro?.name !== 'QuotaExceededError') return false;
      await liberarEspaco({
        chave,
        bytes: veredito.bytes,
        maxTotalBytes: Math.floor(MAX_TOTAL_BYTES / 2),
        maxEntries: Math.floor(MAX_ENTRIES / 2),
      });
      try {
        return await store.put(registro);
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
};

const liberarEspaco = async ({ chave, bytes, maxTotalBytes, maxEntries }) => {
  const indice = await store.listIndex();
  const descartar = chooseEvictions({
    entries: indice,
    incomingKey: chave,
    incomingBytes: bytes,
    ...(maxTotalBytes ? { maxTotalBytes } : {}),
    ...(maxEntries ? { maxEntries } : {}),
  });
  if (descartar.length > 0) await store.remove(descartar);
};

export const startSession = async (userId) => {
  try {
    const chaves = await store.listKeys();
    const alheias = keysOfOtherUsers(chaves, userId);
    if (alheias.length > 0) await store.remove(alheias);
    return alheias.length;
  } catch {
    return 0;
  }
};

export const clearAll = async () => {
  try {
    return await store.clear();
  } catch {
    try {
      return await store.destroy();
    } catch {
      return false;
    }
  }
};
