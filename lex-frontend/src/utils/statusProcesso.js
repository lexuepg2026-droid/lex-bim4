export const corDoStatus = (status) => {
    if (status === "ativo") return "#2E7D32";
    if (status === "suspenso") return "#BF360C";
    if (status === "encerrado") return "#616161";
    return "#616161";
};