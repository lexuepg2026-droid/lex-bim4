import api from '../api/axiosConfig';

const getAllClients = ({ page = 1, limit = 20, busca, situacao, tipoPessoa, portal, ordem } = {}) => {
    const params = { page, limit };
    
    if (busca) params.busca = busca;
    if (situacao) params.situacao = situacao;
    if (tipoPessoa) params.tipoPessoa = tipoPessoa;
    if (portal) params.portal = portal;
    if (ordem) params.ordem = ordem;
    
    return api.get('/clients', { params });
};

const getClientById = (id) => api.get(`/clients/${id}`);

const createClient = (data) => api.post('/clients', data);

const updateClient = (id, data) => api.patch(`/clients/${id}`, data);

const deleteClient = (id) => api.delete(`/clients/${id}`);

const reactivateClient = (id) => api.patch(`/clients/${id}/reactivate`);

const revogarSenhaPortal = (id) => api.delete(`/clients/${id}/senha-portal`);

const getAcessoPortal = (id) => api.get(`/clients/${id}/acesso-portal`);

export default {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    reactivateClient,
    revogarSenhaPortal,
    getAcessoPortal,
};
