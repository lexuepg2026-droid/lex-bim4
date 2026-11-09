import api from '../api/axiosConfig';

const listSecoes = ({ page = 1, limit = 20, tipo, busca } = {}) => {
    const params = { page, limit };
    
    if (tipo) params.tipo = tipo;
    if (busca) params.busca = busca;
    
    return api.get('/secoes', { params });
};

const getSecaoById = (id) => api.get(`/secoes/${id}`);

const createSecao = (data) => api.post('/secoes', data);

const updateSecao = (id, data) => api.patch(`/secoes/${id}`, data);

const deleteSecao = (id) => api.delete(`/secoes/${id}`);

export default {
    listSecoes,
    getSecaoById,
    createSecao,
    updateSecao,
    deleteSecao,
};
