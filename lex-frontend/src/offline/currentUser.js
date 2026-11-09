let idAtual = null;

export const registrarUsuarioAtual = (id) => {
  idAtual = typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
};

export const usuarioAtual = () => idAtual;
