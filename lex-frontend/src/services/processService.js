import api from '../api/axiosConfig';
import { cabecalhoDeVersao } from '../offline/versionHeader';

const listProcesses = ({ page = 1, limit = 20, busca, status, fase, liminar, situacao, tipoAcao, portal } = {}) => {
    const params = { page, limit };

    if (busca) params.busca = busca;
    if (status) params.status = status;
    if (fase) params.fase = fase;
    if (liminar) params.liminar = liminar;
    if (situacao) params.situacao = situacao;
    if (tipoAcao) params.tipoAcao = tipoAcao;
    if (portal) params.portal = portal;

    return api.get('/processes', { params });
};

const getProcessById = (id) => api.get(`/processes/${id}`);

const createProcess = (data) => api.post('/processes', data);

const updateProcess = (id, data) => api.patch(`/processes/${id}`, data);

const deleteProcess = (id) => api.delete(`/processes/${id}`);

const reactivateProcess = (id) => api.patch(`/processes/${id}/reactivate`);

const getActivationPreview = (id) => api.get(`/processes/${id}/activation-preview`);

const listProcessClientes = (id) => api.get(`/processes/${id}/clientes`);

const addProcessCliente = (id, { clienteId, papel }) => api.post(`/processes/${id}/clientes`, { clienteId, papel });

const updateProcessClientePapel = (id, clienteId, papel) => api.patch(`/processes/${id}/clientes/${clienteId}`, { papel });

const setProcessClientePrincipal = (id, clienteId) => api.patch(`/processes/${id}/clientes/${clienteId}/principal`);

const removeProcessCliente = (id, clienteId) => api.delete(`/processes/${id}/clientes/${clienteId}`);

const getProcessClienteCodigoAcesso = (id, clienteId) => api.get(`/processes/${id}/clientes/${clienteId}/codigo-acesso`);

const setLiberacaoNoPortal = (id, clienteId, liberadoNoPortal) => api.patch(`/processes/${id}/clientes/${clienteId}/liberacao`, { liberadoNoPortal });

const listarTiposDeAcao = () => api.get('/processes/tipos-acao');

const listProcessConfirmacoes = (id) => api.get(`/processes/${id}/confirmacoes`);

const marcarConfirmacoesVistas = (id) => api.patch(`/processes/${id}/confirmacoes/vistas`);

const changePhase = (id, data, versao) => api.patch(`/processes/${id}/fase`, data, { headers: cabecalhoDeVersao(versao) });

const getTimeline = (id) => api.get(`/processes/${id}/timeline`);

export default {
    listProcesses,
    getProcessById,
    createProcess,
    updateProcess,
    deleteProcess,
    reactivateProcess,
    getActivationPreview,
    listProcessClientes,
    addProcessCliente,
    updateProcessClientePapel,
    setProcessClientePrincipal,
    removeProcessCliente,
    getProcessClienteCodigoAcesso,
    setLiberacaoNoPortal,
    listarTiposDeAcao,
    listProcessConfirmacoes,
    marcarConfirmacoesVistas,
    changePhase,
    getTimeline,
};
