import axios from 'axios';

import { BASE_URL } from './baseURL';

const portalApi = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export const ERRO_PORTAL = Object.freeze({
    CREDENCIAIS_INVALIDAS: 'credenciaisInvalidas',
    SESSAO_INVALIDA: 'sessaoPortalInvalida',
    SENHA_PROVISORIA: 'senhaPortalProvisoria',
    CONFIRMACAO_EXIGE_SENHA_PROPRIA: 'confirmacaoExigeSenhaPropria',
});

export const codigoDoErro = (err) => err?.response?.data?.codigo ?? null;

const ROTAS_SEM_SESSAO = ['/portal/login', '/portal/logout'];

let aoPerderSessao = null;
export const registrarPerdaDeSessao = (callback) => {
    aoPerderSessao = callback;
};

portalApi.interceptors.response.use((response) => response, (error) => {
    const url = error.config?.url ?? '';
    
    const ehRotaSemSessao = ROTAS_SEM_SESSAO.some((rota) => url.startsWith(rota));

    if (error.response?.status === 401 && codigoDoErro(error) === ERRO_PORTAL.SESSAO_INVALIDA && !ehRotaSemSessao) {
        aoPerderSessao?.();
    }

    return Promise.reject(error);
});

export default portalApi;
