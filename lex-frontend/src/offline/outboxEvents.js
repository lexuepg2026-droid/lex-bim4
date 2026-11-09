const assinantes = new Set();

export const aoMudarFila = (fn) => {
  if (typeof fn !== 'function') return () => {};
  assinantes.add(fn);
  return () => { assinantes.delete(fn); };
};

export const avisarFilaMudou = (userId) => {
  for (const fn of [...assinantes]) {
    try { fn(userId); } catch { continue; }
  }
};

export default { aoMudarFila, avisarFilaMudou };
