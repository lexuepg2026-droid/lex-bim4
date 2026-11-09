const PALETA_CORES = [
    "#3949AB", "#00796B", "#C62828", "#7B1FA2",
    "#BF360C", "#2E7D32", "#1565C0", "#5D4037",
    "#AD1457", "#512DA8", "#00727D", "#33691E",
];

export const corDoAvatar = (id) => {
    if (!id) return PALETA_CORES[0];

    let soma = 0;
    for (let i = 0; i < id.length; i++) soma += id.charCodeAt(i);

    return PALETA_CORES[soma % PALETA_CORES.length];
};

export const inicialDoAvatar = (nome) => {
    if (!nome) return "?";

    return nome.trim().charAt(0).toUpperCase();
};