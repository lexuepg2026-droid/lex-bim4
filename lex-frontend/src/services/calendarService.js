import api from '../api/axiosConfig';

const getCalendario = (de, ate) => api.get('/calendar', { params: { de, ate } });

const getAvisos = () => api.get('/calendar/avisos');

export default { 
    getCalendario,
    getAvisos  
};