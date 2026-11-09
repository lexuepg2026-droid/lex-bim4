const MENSAGEM_SEM_RESPOSTA = 'Não foi possível falar com o servidor. Confira a conexão e tente de novo.';
const MENSAGEM_TEMPO_ESGOTADO = 'O servidor demorou demais para responder. Tente de novo em instantes.';
const MENSAGEM_ERRO_DO_SERVIDOR = 'O servidor encontrou um erro e não concluiu o pedido. Tente de novo em instantes.';
const MENSAGEM_MUITAS_TENTATIVAS = 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.';

export const getApiErrorMessage = (err, fallback = 'Ocorreu um erro. Tente novamente.') => {
    if (err?.offline === true && err?.message) return err.message;

    const resposta = err?.response;

    if (err?.request && !resposta) {
        return err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT' ? MENSAGEM_TEMPO_ESGOTADO : MENSAGEM_SEM_RESPOSTA;
    }

    const doServidor = resposta?.data?.message || resposta?.data?.error;

    if (resposta?.status === 429) return doServidor || MENSAGEM_MUITAS_TENTATIVAS;
    if (resposta?.status >= 500 && (!doServidor || doServidor === 'Erro interno do servidor')) return MENSAGEM_ERRO_DO_SERVIDOR;

    return doServidor || fallback;
};

export const getApiErrorField = (err) => err?.response?.data?.campo || null;

export const getApiErrorCode = (err) => err?.response?.data?.codigo || null;

export const getApiErrorStatus = (err) => err?.response?.status ?? null;

export const getApiErrorDetails = (err) => err?.response?.data?.errors ?? null;

export const getApiErrorPendencias = (err) => {
    const pendencias = getApiErrorDetails(err)?.pendencias;
    
    return Array.isArray(pendencias) ? pendencias : [];
};

export const getApiErrorConflict = (err) => {
    const data = err?.response?.data ?? {};
    
    return {
        regra: data.regra ?? null,
        dependencia: data.dependencia ?? null,
        quantidade: typeof data.quantidade === 'number' ? data.quantidade : null,
        saldoDisponivel: typeof data.saldoDisponivel === 'number' ? data.saldoDisponivel : null,
        valorParcela: typeof data.valorParcela === 'number' ? data.valorParcela : null,
    };
};
