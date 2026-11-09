import api from '../api/axiosConfig';

const getDashboardSummary = () => api.get('/dashboard');

const getStatusCounts = () => api.get('/dashboard/status');

const getFeesByMonth = (params) => api.get('/dashboard/honorarios-por-mes', { params });

export default { 
    getDashboardSummary, 
    getStatusCounts, 
    getFeesByMonth 
};