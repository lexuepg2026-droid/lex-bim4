export const buscarTudo = async (funcaoDeBusca, parametrosBase = {}) => {
    const primeiraResposta = await funcaoDeBusca({ ...parametrosBase, limit: 100, page: 1 });
    const primeiraLista = primeiraResposta.data.data ?? primeiraResposta.data;
    const totalPages = primeiraResposta.data.totalPages ?? 1;

    if (totalPages <= 1) return primeiraLista;

    const chamadasRestantes = [];
    for (let pagina = 2; pagina <= totalPages; pagina++) {
        chamadasRestantes.push(funcaoDeBusca({ ...parametrosBase, limit: 100, page: pagina }));
    }

    const respostas = await Promise.all(chamadasRestantes);
    return [primeiraLista, ...respostas.map((r) => r.data.data ?? r.data)].flat();
};