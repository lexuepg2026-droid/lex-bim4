function formatarCodProcesso(valor) {
    let caracteres = valor
        .replace(/^LEX-?/i, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 8)
        .toUpperCase();

    if (caracteres.length === 0) {
        return "LEX-";
    }

    if (caracteres.length <= 4) {
        return `LEX-${caracteres}`;
    }

    return `LEX-${caracteres.slice(0, 4)}-${caracteres.slice(4)}`;
}

export default formatarCodProcesso;