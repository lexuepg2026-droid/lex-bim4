export const buscarCidadesPorEstado = async (uf) => {
    if (!uf) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(
            `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
            { signal: controller.signal }
        );
        if (!res.ok) return [];

        const data = await res.json();
        return data
            .map((municipio) => municipio.nome)
            .sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
    } catch {
        return [];
    } finally {
        clearTimeout(timeout);
    }
};