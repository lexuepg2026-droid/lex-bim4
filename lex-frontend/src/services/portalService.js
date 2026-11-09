import portalApi from '../api/portalAxios';

const login = (codigoAcesso, senha) => portalApi.post('/portal/login', { codigoAcesso, senha });

const logout = () => portalApi.post('/portal/logout');

const sessao = () => portalApi.get('/portal/sessao');

const trocarSenha = (senhaAtual, novaSenha) => portalApi.patch('/portal/senha', { senhaAtual, novaSenha });

const listarProcessos = () => portalApi.get('/portal/processos');

const obterProcesso = (processoId) => portalApi.get(`/portal/processos/${processoId}`);

const listarDocumentos = (processoId) => portalApi.get(`/portal/processos/${processoId}/documentos`);

const textoConfirmacao = () => portalApi.get('/portal/confirmacoes/texto');

const confirmar = (processoId) => portalApi.post(`/portal/processos/${processoId}/confirmacoes`, {});

const listarConfirmacoes = (processoId) => portalApi.get(`/portal/processos/${processoId}/confirmacoes`);

const baixarDocumento = (processoId, id, formato = 'pdf') => portalApi.get(`/portal/processos/${processoId}/documentos/${id}/download`, {
    params: { formato },
    responseType: 'blob',
});

const nomeDoAnexo = (response, alternativo) => {
    const disposition = response?.headers?.['content-disposition'] ?? '';
    
    return disposition.match(/filename="?([^";]+)"?/)?.[1] ?? alternativo;
};

const baixarEsalvar = async (processoId, id, formato = 'pdf') => {
    const response = await baixarDocumento(processoId, id, formato);
    
    const nome = nomeDoAnexo(response, `documento.${formato}`);
    
    const url = URL.createObjectURL(response.data);

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        URL.revokeObjectURL(url);
    }

    return { nome, tamanho: response.data?.size ?? 0 };
};

export default {
    login,
    logout,
    sessao,
    trocarSenha,
    listarProcessos,
    obterProcesso,
    listarDocumentos,
    textoConfirmacao,
    confirmar,
    listarConfirmacoes,
    baixarDocumento,
    nomeDoAnexo,
    baixarEsalvar,
};
