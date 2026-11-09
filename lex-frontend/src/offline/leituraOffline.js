import { caminhoDaRequisicao } from './outboxOperations.js';
import { isCacheableResource } from './cacheKey.js';
import { readCached, writeCached } from './offlineCache.js';
import { usuarioAtual } from './currentUser.js';
import { avisarLeituraDoEspelho } from './espelhoEvents.js';

const ehLeituraGuardavel = (config) => {
    if (!config) return null;
    if ((config.method ?? 'get').toLowerCase() !== 'get') return null;
    if (config.responseType && config.responseType !== 'json') return null;
    const userId = usuarioAtual();
    const caminho = caminhoDaRequisicao(config.url);
    if (!userId || !isCacheableResource(caminho)) return null;
    const params = config.params && typeof config.params === 'object' ? config.params : undefined;
    return { userId, resource: caminho, params };
};

export const guardarResposta = (response) => {
    const alvo = ehLeituraGuardavel(response?.config);
    if (!alvo) return;
    writeCached({ ...alvo, valor: response.data }).catch(() => {});
};

export const respostaDoEspelho = async (error) => {
    const alvo = ehLeituraGuardavel(error?.config);
    if (!alvo) return null;
    try {
        const guardado = await readCached(alvo);
        if (!guardado) return null;
        avisarLeituraDoEspelho(guardado.atualizadoEm);
        return {
            data: guardado.valor,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: error.config,
            doEspelho: true,
            atualizadoEm: guardado.atualizadoEm,
        };
    } catch {
        return null;
    }
};
