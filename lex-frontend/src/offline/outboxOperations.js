export const OPERACOES = Object.freeze([
  {
    id: 'criarEvento',
    metodo: 'post',
    padrao: /^\/events\/?$/,
    rotulo: 'Compromisso',
    verbo: 'criado'
  },
  {
    id: 'atualizarEvento',
    metodo: 'patch',
    padrao: /^\/events\/[^/]+$/,
    rotulo: 'Compromisso',
    verbo: 'editado'
  },
  {
    id: 'concluirEvento',
    metodo: 'patch',
    padrao: /^\/events\/[^/]+\/concluir$/,
    rotulo: 'Compromisso',
    verbo: 'concluído'
  },
  {
    id: 'mudarFase',
    metodo: 'patch',
    padrao: /^\/processes\/[^/]+\/fase$/,
    rotulo: 'Fase do processo',
    verbo: 'alterada'
  }
]);

export const caminhoDaRequisicao = (url) => {
  if (typeof url !== 'string' || url.trim() === '') return null;
  let caminho = url.trim().split('?')[0].split('#')[0];

  if (/^https?:\/\//i.test(caminho)) {
    try {
      caminho = new URL(caminho).pathname;
    } catch {
      return null;
    }
  }

  caminho = caminho.replace(/^\/api(?=\/|$)/, '');
  if (!caminho.startsWith('/')) caminho = `/${caminho}`;
  return caminho.length > 1 ? caminho.replace(/\/$/, '') : caminho;
};

export const identificarOperacao = ({ method, url } = {}) => {
  if (typeof method !== 'string') return null;
  const metodo = method.toLowerCase();
  const caminho = caminhoDaRequisicao(url);
  if (!caminho) return null;

  return (
    OPERACOES.find((op) => op.metodo === metodo && op.padrao.test(caminho)) ?? null
  );
};

export const ehEnfileiravel = (requisicao) => identificarOperacao(requisicao) !== null;

export const OPERACAO_POR_ID = Object.freeze(
  Object.fromEntries(OPERACOES.map((op) => [op.id, op]))
);
