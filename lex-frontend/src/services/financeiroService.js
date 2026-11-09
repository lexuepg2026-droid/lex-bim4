import api from '../api/axiosConfig';

const getResumo = (params) => api.get('/financeiro/resumo', { params });

const getFichaDoProcesso = (processoId) => api.get(`/financeiro/processos/${processoId}`);

export default { getResumo, getFichaDoProcesso };
