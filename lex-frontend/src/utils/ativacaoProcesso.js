const plural = (n, singular, pluralForma) => `${n} ${n === 1 ? singular : pluralForma}`;

export const mensagemDesativarProcesso = (vinculos = 0) => {
    const base = "Este processo será desativado e deixa de aparecer nas listagens.";

    if (vinculos === 0) {
        return `${base} Ele não tem participantes ativos. Nada é apagado: você pode reativá-lo depois.`;
    }

    const quantos = plural(vinculos, "participante vinculado sai", "participantes vinculados saem");
    return `${base} ${quantos} junto. Nada é apagado: você pode reativá-lo depois, e ${vinculos === 1 ? "esse participante volta" : "esses participantes voltam"} com ele.`;
};

export const mensagemReativarProcesso = (vinculos = 0) => {
    const efeito = vinculos > 0
        ? ` ${plural(vinculos, "participante volta", "participantes voltam")} com ele.`
        : " Nenhum participante volta com ele.";

    return `Este processo será reativado.${efeito} Participantes que você removeu à mão antes da desativação não voltam.`;
};

export const motivoDeNaoReativar = (impedimentos = []) => {
    const nomes = (impedimentos ?? []).map((i) => i.nome).filter(Boolean);
    if (nomes.length === 0) return null;

    if (nomes.length === 1) {
        return `O cliente ${nomes[0]} está desativado. Reative o cliente primeiro.`;
    }

    const lista = `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
    return `Os clientes ${lista} estão desativados. Reative-os primeiro.`;
};
