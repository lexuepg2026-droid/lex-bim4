function formatarDocumento(valor) {
    const numeros = valor.replace(/\D/g, "").slice(0, 14);

    if (numeros.length <= 11) {
        return numeros
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(
                /^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})$/,
                "$1.$2.$3-$4"
            );
    }

    return numeros
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
        .replace(
            /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})$/,
            "$1.$2.$3/$4-$5"
        );
}

export default formatarDocumento;