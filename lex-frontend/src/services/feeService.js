import api from '../api/axiosConfig';

const listFees = ({ page = 1, limit = 20, processoId, busca, tipo, status, de, ate } = {}) => {
    const params = { page, limit };

    if (processoId) params.processoId = processoId;
    if (busca) params.busca = busca;
    if (tipo) params.tipo = tipo;
    if (status) params.status = status;
    if (de) params.de = de;
    if (ate) params.ate = ate;

    return api.get('/fees', { params });
};

const getFeeById = (id) => api.get(`/fees/${id}`);

const createFee = (data) => api.post('/fees', data);

const updateFee = (id, data) => api.patch(`/fees/${id}`, data);

const deleteFee = (id) => api.delete(`/fees/${id}`);

const getExtrato = (id, { page = 1, limit = 20 } = {}) =>
    api.get(`/fees/${id}/statement`, { params: { page, limit } });

const criarReparcelamento = (id, data) => api.post(`/fees/${id}/renegotiations`, data);

const listarReparcelamentos = (id) => api.get(`/fees/${id}/renegotiations`);

export default { 
    listFees, 
    getFeeById, 
    createFee, 
    updateFee, 
    deleteFee,
    getExtrato,
    criarReparcelamento,
    listarReparcelamentos,
};