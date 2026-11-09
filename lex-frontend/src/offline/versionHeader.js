export const CABECALHO_VERSAO = 'X-If-Unmodified-Since';

export const cabecalhoDeVersao = (updatedAt) =>
  updatedAt ? { [CABECALHO_VERSAO]: updatedAt } : {};
