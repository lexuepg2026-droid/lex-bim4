export const ordenarFila = (entradas = []) =>
  [...entradas].sort((a, b) => {
    const ta = Number(a?.criadoEm) || 0;
    const tb = Number(b?.criadoEm) || 0;
    if (ta !== tb) return ta - tb;
    return (Number(a?.seq) || 0) - (Number(b?.seq) || 0);
  });

export const proximaEntrada = (entradas = []) => {
  const fila = ordenarFila(entradas);
  const primeira = fila[0];
  if (!primeira) return null;
  return primeira.estado === 'pendente' ? primeira : null;
};

export const contarPendencias = (entradas = []) => entradas.length;

export const contarFalhas = (entradas = []) =>
  entradas.filter((e) => e?.estado === 'falhou').length;

export const filaTravada = (entradas = []) => {
  const primeira = ordenarFila(entradas)[0];
  return Boolean(primeira && primeira.estado === 'falhou');
};

export const planejarReenvio = (entradas = []) => {
  const fila = ordenarFila(entradas);
  const paradaEm = fila.findIndex((e) => e.estado !== 'pendente');
  return {
    ordem: fila.map((e) => e.id),
    enviaveis: (paradaEm === -1 ? fila : fila.slice(0, paradaEm)).map((e) => e.id),
    travadaPor: paradaEm === -1 ? null : fila[paradaEm].id
  };
};

export const temPendenciaPara = (entradas = [], { operacao, url }) =>
  entradas.some((e) => (!operacao || e.operacao === operacao) && (!url || e.url === url));
