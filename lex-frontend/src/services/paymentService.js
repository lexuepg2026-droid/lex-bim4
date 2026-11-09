import api from '../api/axiosConfig';
import { nomeDoAnexo } from '../utils/download';

const listPayments = ({ page = 1, limit = 20, installmentId, processoId, honorarioId, formaPagamento, tipo, busca, de, ate } = {}) => {
    const params = { page, limit };
    
    if (installmentId) params.installmentId = installmentId;
    if (processoId) params.processoId = processoId;
    if (honorarioId) params.honorarioId = honorarioId;
    if (formaPagamento) params.formaPagamento = formaPagamento;
    if (tipo) params.tipo = tipo;
    if (busca) params.busca = busca;
    if (de) params.de = de;
    if (ate) params.ate = ate;
    
    return api.get('/payments', { params });
};

const getPaymentById = (id) => api.get(`/payments/${id}`);

const createPayment = (data) => api.post('/payments', data);

const preverAlocacao = (data) => api.post('/payments/preview', data);

const updatePayment = (id, data) => api.patch(`/payments/${id}`, data);

const criarEstorno = (id, data) => api.post(`/payments/${id}/reversals`, data);

const listarEstornos = (id) => api.get(`/payments/${id}/reversals`);

const baixarRecibo = (id) => api.get(`/payments/${id}/recibo`, { responseType: 'blob' });

const baixarEsalvarRecibo = async (id) => {
    const response = await baixarRecibo(id);
    
    const nome = nomeDoAnexo(response, 'recibo.pdf');
    
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
    listPayments,
    getPaymentById,
    createPayment,
    preverAlocacao,
    updatePayment,
    criarEstorno,
    listarEstornos,
    baixarRecibo,
    baixarEsalvarRecibo,
};