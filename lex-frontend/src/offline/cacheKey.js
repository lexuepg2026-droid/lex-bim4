export const KEY_PREFIX = 'lex-offline';

export const CAMINHOS_GUARDADOS = Object.freeze([
    /^\/dashboard(\/status|\/honorarios-por-mes)?$/,
    /^\/financeiro\/resumo$/,
    /^\/financeiro\/processos\/[^/]+$/,
    /^\/clients$/,
    /^\/clients\/[^/]+$/,
    /^\/clients\/[^/]+\/acesso-portal$/,
    /^\/processes$/,
    /^\/processes\/tipos-acao$/,
    /^\/processes\/[^/]+$/,
    /^\/processes\/[^/]+\/(clientes|timeline|confirmacoes)$/,
    /^\/fees$/,
    /^\/fees\/[^/]+$/,
    /^\/installments$/,
    /^\/payments$/,
    /^\/events$/,
    /^\/events\/[^/]+$/,
    /^\/calendar$/,
    /^\/calendar\/avisos$/,
    /^\/documents$/,
    /^\/documents\/modelos$/,
    /^\/secoes$/,
]);

export const isCacheableResource = (resource) =>
    typeof resource === 'string' && !resource.includes('|') && CAMINHOS_GUARDADOS.some((padrao) => padrao.test(resource));

export const serializeParams = (params) => {
    if (params === undefined || params === null) return '';
    if (typeof params !== 'object' || Array.isArray(params)) {
        throw new Error('offline: os parâmetros da chave precisam ser um objeto simples');
    }

    return Object.keys(params)
        .sort()
        .filter((k) => {
            const v = params[k];
            return v !== undefined && v !== null && v !== '';
        })
        .map((k) => {
            const v = params[k];
            if (typeof v === 'object') {
                throw new Error(`offline: o parâmetro "${k}" precisa ser texto, número ou booleano`);
            }
            return `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`;
        })
        .join('&');
};

const normalizeUserId = (userId) => (typeof userId === 'string' ? userId.trim() : '');

export const buildKey = ({ userId, resource, params } = {}) => {
    const dono = normalizeUserId(userId);

    if (!dono) {
        throw new Error('offline: chave sem usuário. Todo dado guardado é escopado pelo id de quem o buscou.');
    }
    if (dono.includes('|')) {
        throw new Error('offline: o id do usuário não pode conter "|", que é o separador da chave');
    }
    if (!isCacheableResource(resource)) {
        throw new Error(`offline: o caminho "${resource}" não está na lista do que se guarda`);
    }

    return `${KEY_PREFIX}|u:${dono}|r:${resource}|p:${serializeParams(params)}`;
};

export const buildQueueKey = ({ userId, chave } = {}) => {
    const dono = normalizeUserId(userId);
    if (!dono) {
        throw new Error('offline: entrada de fila sem usuário. A fila é escopada como o resto do espelho.');
    }
    if (dono.includes('|')) {
        throw new Error('offline: o id do usuário não pode conter "|", que é o separador da chave');
    }
    if (typeof chave !== 'string' || chave.trim() === '' || chave.includes('|')) {
        throw new Error('offline: a entrada de fila precisa de uma chave de idempotência');
    }
    return `${KEY_PREFIX}|u:${dono}|f:${chave.trim()}`;
};

export const parseKey = (key) => {
    if (typeof key !== 'string') return null;
    const partes = key.split('|');

    if (partes.length === 3 && partes[0] === KEY_PREFIX && partes[1].startsWith('u:') && partes[2].startsWith('f:')) {
        const dono = partes[1].slice(2);
        const chave = partes[2].slice(2);
        if (!dono || !chave) return null;
        return { userId: dono, fila: true, chave };
    }

    if (partes.length !== 4) return null;
    const [prefixo, u, r, p] = partes;
    if (prefixo !== KEY_PREFIX) return null;
    if (!u.startsWith('u:') || !r.startsWith('r:') || !p.startsWith('p:')) return null;

    const userId = u.slice(2);
    if (!userId) return null;

    return { userId, resource: r.slice(2), params: p.slice(2) };
};

export const belongsToUser = (key, userId) => {
    const dono = normalizeUserId(userId);
    if (!dono) return false;
    const partes = parseKey(key);
    return partes !== null && partes.userId === dono;
};

export const keysOfOtherUsers = (keys, userId) => {
    if (!Array.isArray(keys)) return [];
    return keys.filter((k) => !belongsToUser(k, userId));
};
