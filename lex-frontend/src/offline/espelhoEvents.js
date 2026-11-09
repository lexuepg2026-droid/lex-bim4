const assinantes = new Set();

export const aoLerDoEspelho = (fn) => {
    if (typeof fn !== 'function') return () => {};
    assinantes.add(fn);
    return () => { assinantes.delete(fn); };
};

export const avisarLeituraDoEspelho = (atualizadoEm) => {
    for (const fn of [...assinantes]) {
        try { fn(atualizadoEm); } catch { continue; }
    }
};
