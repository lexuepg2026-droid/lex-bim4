import api from '../api/axiosConfig';

const listInstallments = ({ page = 1, limit = 20, processoId, honorarioId, status, busca, de, ate } = {}) => {
    const params = { page, limit };
    
    if (processoId) params.processoId = processoId;
    if (honorarioId) params.honorarioId = honorarioId;
    if (status) params.status = status;
    if (busca) params.busca = busca;
    if (de) params.de = de;
    if (ate) params.ate = ate;
    
    return api.get('/installments', { params });
};

const getInstallmentById = (id) => api.get(`/installments/${id}`);

const createInstallment = (data) => api.post('/installments', data);

const updateInstallment = (id, data) => api.patch(`/installments/${id}`, data);

const deleteInstallment = (id) => api.delete(`/installments/${id}`);

export default { 
    listInstallments, 
    getInstallmentById, 
    createInstallment, 
    updateInstallment, 
    deleteInstallment
};
