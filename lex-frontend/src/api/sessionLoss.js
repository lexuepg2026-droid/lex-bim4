let sessaoEmPe = false;

export const ehSessaoPerdida = (status, haviaSessao) => status === 401 && haviaSessao === true;

export const registrarSessao = (ativa) => {
    sessaoEmPe = Boolean(ativa);
};

export const haviaSessao = () => sessaoEmPe;
