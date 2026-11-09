const STATUS_PROCESSO = {
  ativo: {
    rotulo: 'Em andamento',
    explicacao: 'O processo está em curso.',
  },
  encerrado: {
    rotulo: 'Encerrado',
    explicacao: 'O processo foi finalizado.',
  },
  suspenso: {
    rotulo: 'Suspenso',
    explicacao: 'O processo está temporariamente parado.',
  },
};

const FASE_PROCESSO = {
  conhecimento: {
    rotulo: 'Fase de conhecimento',
    explicacao: 'O juiz analisa o caso e as provas apresentadas pelos dois lados.',
  },
  sentenca: {
    rotulo: 'Sentença',
    explicacao: 'O juiz já decidiu o caso.',
  },
  execucao: {
    rotulo: 'Execução',
    explicacao: 'Fase de fazer valer o que foi decidido.',
  },
  recursos: {
    rotulo: 'Recursos',
    explicacao: 'A decisão está sendo reexaminada por um tribunal superior.',
  },
};

const PAPEL = {
  autor: {
    rotulo: 'Autor',
    explicacao: 'Você é quem entrou com a ação.',
  },
  reu: {
    rotulo: 'Réu',
    explicacao: 'A ação foi movida contra você.',
  },
  terceiro_interessado: {
    rotulo: 'Terceiro interessado',
    explicacao:
      'Você não é o autor nem o réu, mas o resultado do processo afeta um direito seu.',
  },
  litisconsorte: {
    rotulo: 'Litisconsorte',
    explicacao:
      'Você participa do processo ao lado de outra pessoa, na mesma posição que ela.',
  },
};

const TIPO_DOCUMENTO = {
  procuracao: 'Procuração',
  contrato_prestacao_servicos: 'Contrato de prestação de serviços',
  declaracao_isencao_ir: 'Declaração de isenção de imposto de renda',
  declaracao_autonomo: 'Declaração de trabalhador autônomo',
  declaracao_hipossuficiencia: 'Declaração de hipossuficiência',
  declaracao_renuncia: 'Declaração de renúncia',
  peticao: 'Petição',
  sentenca: 'Sentença',
  comprovante: 'Comprovante',
  outro: 'Documento',
};

export const rotuloStatus = (status) => STATUS_PROCESSO[status]?.rotulo ?? status ?? '—';

export const explicacaoStatus = (status) => STATUS_PROCESSO[status]?.explicacao ?? '';

export const rotuloFase = (fase) => FASE_PROCESSO[fase]?.rotulo ?? fase ?? '—';

export const explicacaoFase = (fase) => FASE_PROCESSO[fase]?.explicacao ?? '';

export const rotuloPapel = (papel) => PAPEL[papel]?.rotulo ?? papel ?? '—';

export const explicacaoPapel = (papel) => PAPEL[papel]?.explicacao ?? '';

export const rotuloTipoDocumento = (tipo) => TIPO_DOCUMENTO[tipo] ?? tipo ?? 'Documento';

const FUSO = 'America/Sao_Paulo';

export const formatarData = (iso) => {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { timeZone: FUSO });
};

export const formatarDataHora = (iso) => {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleString('pt-BR', {
    timeZone: FUSO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default {
  rotuloStatus,
  explicacaoStatus,
  rotuloFase,
  explicacaoFase,
  rotuloPapel,
  explicacaoPapel,
  rotuloTipoDocumento,
  formatarData,
  formatarDataHora,
};
