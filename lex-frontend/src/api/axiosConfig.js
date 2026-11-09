import axios from 'axios';
import { toast } from '../utils/toast';
import { BASE_URL } from './baseURL';
import { ehSessaoPerdida, haviaSessao, registrarSessao } from './sessionLoss';
import { lerOnline } from '../offline/online';
import { shouldBlockWrite, offlineWriteError, offlineQueuedError } from '../offline/writeGuard';
import { identificarOperacao } from '../offline/outboxOperations';
import { tituloDaRequisicao } from '../offline/outboxMessages';
import { enfileirar } from '../offline/outbox';
import { usuarioAtual } from '../offline/currentUser';
import { CABECALHO_VERSAO } from '../offline/versionHeader';
import { offlineErrorMessage } from '../offline/offlineMessages';
import { guardarResposta, respostaDoEspelho } from '../offline/leituraOffline';
import { deveExibirToastGlobal, mensagemDoToastGlobal, guardarAvisoDeSessao } from './toastGlobal';

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

const enfileirarComSeguranca = async (dados) => {
    try {
        return await enfileirar(dados);
    } catch {
        return null;
    }
};

api.interceptors.request.use(async (config) => {
    if (config.daFila) return config;

    if (!shouldBlockWrite({ method: config.method, online: lerOnline() })) return config;

    const operacao = identificarOperacao({ method: config.method, url: config.url });
    const userId = usuarioAtual();

    if (!operacao || !userId) return Promise.reject(offlineWriteError(config));

    const corpo = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data ?? null);

    const entrada = await enfileirarComSeguranca({
        userId,
        method: config.method,
        url: config.url,
        body: corpo,
        versaoVista: config.headers?.get?.(CABECALHO_VERSAO) ?? config.headers?.[CABECALHO_VERSAO] ?? null,
        titulo: tituloDaRequisicao(operacao.id, corpo),
    });

    if (!entrada) return Promise.reject(offlineWriteError(config));

    return Promise.reject(offlineQueuedError(config, entrada));
});

let isRedirecting = false;

api.interceptors.response.use(
    (response) => {
        guardarResposta(response);
        return response;
    },
    async (error) => {
        const online = lerOnline();

        if (!online && !error.response && !error.offline) {
            const doEspelho = await respostaDoEspelho(error);
            if (doEspelho) return doEspelho;
        }

        const semSinal = offlineErrorMessage(error, { online });
        if (semSinal) {
            error.message = semSinal;
            error.offline = true;
        }

        if (ehSessaoPerdida(error.response?.status, haviaSessao()) && !isRedirecting) {
            isRedirecting = true;
            registrarSessao(false);
            // O redirecionamento recarrega a página: a mensagem vai para o
            // sessionStorage e o ToastContainer a mostra no login (DEC-084).
            guardarAvisoDeSessao(window.sessionStorage);
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // DEC-084: 5xx, sem resposta e 429 viram toast aqui, porque nenhuma
        // tela sabe explicá-los. 400/409/422 ficam com a tela.
        if (deveExibirToastGlobal(error, error.config, online)) {
            toast.error(mensagemDoToastGlobal(error));
        }
        return Promise.reject(error);
    }
);

export default api;
