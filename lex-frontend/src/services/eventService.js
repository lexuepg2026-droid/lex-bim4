import api from '../api/axiosConfig';
import { cabecalhoDeVersao } from '../offline/versionHeader';

const createEvent = (data) => api.post('/events', data);

const updateEvent = (id, data, versao) => api.patch(`/events/${id}`, data, { headers: cabecalhoDeVersao(versao) });

const concludeEvent = (id, concluido, versao) => api.patch(`/events/${id}/concluir`, { concluido }, { headers: cabecalhoDeVersao(versao) });

const deleteEvent = (id) => api.delete(`/events/${id}`);

// A lista de compromissos por situação (fase R3): a Agenda usa para mostrar os
// desativados, que GET /calendar não traz. `situacao`: ativos, inativos ou todos.
const listEvents = (params = {}) => api.get('/events', { params });

// Desfaz a exclusão (soft delete) de um compromisso. O back recusa com 409 quando
// o processo do compromisso está desativado, e a frase diz qual (DEC-053).
const reactivateEvent = (id) => api.patch(`/events/${id}/reactivate`);

export default { createEvent, updateEvent, concludeEvent, deleteEvent, listEvents, reactivateEvent };