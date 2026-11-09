const normalizar = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const filtrarOpcoes = (lista, termo, textoDe, valorAtual) => {
    const busca = normalizar(termo).trim();
    if (!busca) return lista;

    return lista.filter((item) => item._id === valorAtual || normalizar(textoDe(item)).includes(busca));
};
