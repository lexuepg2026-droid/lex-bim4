const PREFIXOS = ['lex:avisos-lidos:', 'lex:aviso-email-dispensado:'];
const CHAVES_ANTIGAS = ['avisosLidos'];

const limpar = (armazenamento) => {
    const chaves = [];
    for (let i = 0; i < armazenamento.length; i += 1) {
        const chave = armazenamento.key(i);
        if (chave && (PREFIXOS.some((p) => chave.startsWith(p)) || CHAVES_ANTIGAS.includes(chave))) chaves.push(chave);
    }
    chaves.forEach((chave) => armazenamento.removeItem(chave));
};

export const limparDadosDoUsuario = () => {
    try {
        limpar(localStorage);
    } catch {
        return;
    }
    try {
        limpar(sessionStorage);
    } catch {
        return;
    }
};

export const chaveDoUsuario = (prefixo, usuario) => {
    const id = usuario?._id ?? usuario?.id;
    return id ? `${prefixo}${id}` : null;
};
