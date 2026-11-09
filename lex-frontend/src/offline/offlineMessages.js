export const MENSAGEM_ESCRITA_OFFLINE =
  'Sem conexão — você pode consultar, mas não registrar. ' +
  'Tente de novo quando o sinal voltar.';

export const MENSAGEM_LEITURA_SEM_CACHE =
  'Sem conexão — esta tela ainda não foi aberta com sinal neste aparelho, ' +
  'então não há dados guardados dela. Tente de novo quando o sinal voltar.';

export const MENSAGEM_DOWNLOAD_OFFLINE =
  'Sem conexão — o arquivo é gerado pelo servidor e não fica guardado neste ' +
  'aparelho. Tente de novo quando o sinal voltar.';

export const isNetworkError = (err) =>
  Boolean(err) && err.response === undefined && err.code !== 'ERR_CANCELED';

export const offlineErrorMessage = (err, { online = true } = {}) => {
  if (online) return null;
  if (err?.enfileirado === true) return err.message;
  if (err?.offline === true) return MENSAGEM_ESCRITA_OFFLINE;
  if (!isNetworkError(err)) return null;
  return MENSAGEM_LEITURA_SEM_CACHE;
};

export const blockReason = (motivoDaTela, { online = true } = {}) =>
  (online === false ? MENSAGEM_ESCRITA_OFFLINE : (motivoDaTela ?? undefined));
