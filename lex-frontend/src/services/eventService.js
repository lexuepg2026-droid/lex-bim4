import api from '../api/axiosConfig';
import { cabecalhoDeVersao } from '../offline/versionHeader';

const createEvent = (data) => api.post('/events', data);

const updateEvent = (id, data, versao) => api.patch(`/events/${id}`, data, { headers: cabecalhoDeVersao(versao) });

const concludeEvent = (id, concluido, versao) => api.patch(`/events/${id}/concluir`, { concluido }, { headers: cabecalhoDeVersao(versao) });

const deleteEvent = (id) => api.delete(`/events/${id}`);

export default { createEvent, updateEvent, concludeEvent, deleteEvent };