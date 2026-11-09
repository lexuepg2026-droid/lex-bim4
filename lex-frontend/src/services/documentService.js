import api from '../api/axiosConfig';
import { nomeDoAnexo } from '../utils/download';

const listDocuments = ({ page = 1, limit = 20, processoId, busca, ehModelo } = {}) => {
    const params = { page, limit };
    
    if (processoId) params.processoId = processoId;
    if (busca) params.busca = busca;
    if (ehModelo !== undefined) params.ehModelo = String(ehModelo);
    
    return api.get('/documents', { params });
};

const getDocumentById = (id) => api.get(`/documents/${id}`);

const createDocument = (data) => api.post('/documents', data);

const updateDocument = (id, data) => api.patch(`/documents/${id}`, data);

const deleteDocument = (id) => api.delete(`/documents/${id}`);

/* ------------------------ Modelos, geração e preview ------------------------ */

const criarModelo = ({ nome, tipo, descricao } = {}) => api.post('/documents/modelos', { nome, tipo, descricao });

const listModelos = ({ page = 1, limit = 20, tipo } = {}) => {
    const params = { page, limit };

    if (tipo) params.tipo = tipo;

    return api.get('/documents/modelos', { params });
};

const gerarDocumento = (modeloId, { processoId, clienteId, honorarioId, confirmarSobrescrita } = {}) => api.post(`/documents/modelos/${modeloId}/gerar`, {
    processoId,
    clienteId,
    honorarioId,
    confirmarSobrescrita,
});

const compatibilidadeModelo = (modeloId, clienteId) => api.get(`/documents/modelos/${modeloId}/compatibilidade`, { params: { clienteId } });

const previewDocumento = (id, { processoId, clienteId, honorarioId } = {}) => {
    const params = {};
    
    if (processoId) params.processoId = processoId;
    if (clienteId) params.clienteId = clienteId;
    if (honorarioId) params.honorarioId = honorarioId;
    
    return api.get(`/documents/${id}/preview`, { params });
};

const atualizarTexto = (id, textoResolvido) => api.patch(`/documents/${id}/texto`, { textoResolvido });

const listDocumentSecoes = (id) => api.get(`/documents/${id}/secoes`);

const vincularSecao = (id, { secaoId, ordem } = {}) => api.post(`/documents/${id}/secoes`, { secaoId, ordem });

const desvincularSecao = (id, secaoId) => api.delete(`/documents/${id}/secoes/${secaoId}`);

const reordenarSecoes = (id, secoes) => api.patch(`/documents/${id}/secoes/reordenar`, { secoes });

const alternarVisibilidadePortal = (id, visivelPortal) => api.patch(`/documents/${id}/visibilidade-portal`, { visivelPortal });

const listarVariaveis = () => api.get('/documents/variaveis');

/* ------------------------ Download ------------------------ */

const baixarDocumento = (id, formato = 'pdf') => api.get(`/documents/${id}/download`, {
    params: { formato },
    responseType: 'blob',
});

const baixarEsalvar = async (id, formato = 'pdf') => {
    const response = await baixarDocumento(id, formato);
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
    listDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    deleteDocument,
    criarModelo,
    listModelos,
    gerarDocumento,
    compatibilidadeModelo,
    previewDocumento,
    listDocumentSecoes,
    vincularSecao,
    desvincularSecao,
    reordenarSecoes,
    alternarVisibilidadePortal,
    atualizarTexto,
    listarVariaveis,
    baixarDocumento,
    nomeDoAnexo,
    baixarEsalvar,
};
