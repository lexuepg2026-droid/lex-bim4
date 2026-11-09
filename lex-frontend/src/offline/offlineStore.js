const DB_NAME = 'lex-offline';
const DB_VERSION = 2;
const STORE_ENTRADAS = 'entradas';
const STORE_INDICE = 'indice';
const STORE_FILA = 'fila';

export const isAvailable = () =>
  typeof indexedDB !== 'undefined' && indexedDB !== null;

let conexao = null;

const promessa = (requisicao) =>
  new Promise((resolve, reject) => {
    requisicao.onsuccess = () => resolve(requisicao.result);
    requisicao.onerror = () => reject(requisicao.error);
  });

export const open = () => {
  if (!isAvailable()) return Promise.resolve(null);
  if (conexao) return Promise.resolve(conexao);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ENTRADAS)) {
        db.createObjectStore(STORE_ENTRADAS, { keyPath: 'chave' });
      }
      if (!db.objectStoreNames.contains(STORE_INDICE)) {
        db.createObjectStore(STORE_INDICE, { keyPath: 'chave' });
      }
      if (!db.objectStoreNames.contains(STORE_FILA)) {
        db.createObjectStore(STORE_FILA, { keyPath: 'chave' });
      }
    };

    req.onblocked = () => reject(new Error('offline: banco bloqueado por outra aba'));

    req.onsuccess = () => {
      conexao = req.result;
      conexao.onversionchange = () => { conexao.close(); conexao = null; };
      resolve(conexao);
    };
    req.onerror = () => reject(req.error);
  });
};

const transacao = async (modo, stores) => {
  const db = await open();
  if (!db) return null;
  return db.transaction(stores, modo);
};

export const get = async (chave) => {
  const tx = await transacao('readonly', [STORE_ENTRADAS]);
  if (!tx) return null;
  return (await promessa(tx.objectStore(STORE_ENTRADAS).get(chave))) ?? null;
};

export const put = async (registro) => {
  const tx = await transacao('readwrite', [STORE_ENTRADAS, STORE_INDICE]);
  if (!tx) return false;
  tx.objectStore(STORE_ENTRADAS).put(registro);
  tx.objectStore(STORE_INDICE).put({
    chave: registro.chave,
    bytes: registro.bytes,
    atualizadoEm: registro.atualizadoEm,
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return true;
};

export const listIndex = async () => {
  const tx = await transacao('readonly', [STORE_INDICE]);
  if (!tx) return [];
  return (await promessa(tx.objectStore(STORE_INDICE).getAll())) ?? [];
};

export const listKeys = async () => {
  const tx = await transacao('readonly', [STORE_INDICE]);
  if (!tx) return [];
  return (await promessa(tx.objectStore(STORE_INDICE).getAllKeys())) ?? [];
};

export const remove = async (chaves) => {
  const lista = Array.isArray(chaves) ? chaves : [chaves];
  if (lista.length === 0) return true;
  const tx = await transacao('readwrite', [STORE_ENTRADAS, STORE_INDICE]);
  if (!tx) return false;
  for (const chave of lista) {
    tx.objectStore(STORE_ENTRADAS).delete(chave);
    tx.objectStore(STORE_INDICE).delete(chave);
  }
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return true;
};

export const putFila = async (registro) => {
  const tx = await transacao('readwrite', [STORE_FILA]);
  if (!tx) return false;
  tx.objectStore(STORE_FILA).put(registro);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return true;
};

export const listFila = async () => {
  const tx = await transacao('readonly', [STORE_FILA]);
  if (!tx) return [];
  return (await promessa(tx.objectStore(STORE_FILA).getAll())) ?? [];
};

export const listFilaKeys = async () => {
  const tx = await transacao('readonly', [STORE_FILA]);
  if (!tx) return [];
  return (await promessa(tx.objectStore(STORE_FILA).getAllKeys())) ?? [];
};

export const removeFila = async (chaves) => {
  const lista = Array.isArray(chaves) ? chaves : [chaves];
  if (lista.length === 0) return true;
  const tx = await transacao('readwrite', [STORE_FILA]);
  if (!tx) return false;
  for (const chave of lista) tx.objectStore(STORE_FILA).delete(chave);
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return true;
};

export const clear = async () => {
  const tx = await transacao('readwrite', [STORE_ENTRADAS, STORE_INDICE, STORE_FILA]);
  if (!tx) return false;
  tx.objectStore(STORE_ENTRADAS).clear();
  tx.objectStore(STORE_INDICE).clear();
  tx.objectStore(STORE_FILA).clear();
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  return true;
};

export const destroy = () => {
  if (!isAvailable()) return Promise.resolve(false);
  if (conexao) { conexao.close(); conexao = null; }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve(true);
    req.onblocked = () => resolve(false);
    req.onerror = () => reject(req.error);
  });
};
