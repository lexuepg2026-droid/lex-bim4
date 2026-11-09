const ehInstanteValido = (ms) => typeof ms === 'number' && Number.isFinite(ms) && ms > 0;

const horaLocal = (data) =>
  data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const diaLocal = (data) =>
  `${String(data.getDate()).padStart(2, '0')}/` +
  `${String(data.getMonth() + 1).padStart(2, '0')}/` +
  `${data.getFullYear()}`;

const diasDeDiferenca = (a, b) => {
  const meiaNoite = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((meiaNoite(b) - meiaNoite(a)) / 86400000);
};

export const formatUpdatedAt = (atualizadoEm, agora = Date.now()) => {
  if (!ehInstanteValido(atualizadoEm)) return null;

  const quando = new Date(atualizadoEm);
  const referencia = new Date(ehInstanteValido(agora) ? agora : Date.now());
  const dias = diasDeDiferenca(quando, referencia);

  if (dias < 0) return `${diaLocal(quando)} às ${horaLocal(quando)}`;
  if (dias === 0) return `hoje às ${horaLocal(quando)}`;
  if (dias === 1) return `ontem às ${horaLocal(quando)}`;
  return `${diaLocal(quando)} às ${horaLocal(quando)}`;
};

export const offlineNoticeText = (atualizadoEm, agora = Date.now()) => {
  const quando = formatUpdatedAt(atualizadoEm, agora);
  return quando
    ? `Sem conexão. Dados de ${quando}.`
    : 'Sem conexão. Esta tela ainda não foi aberta com sinal.';
};
