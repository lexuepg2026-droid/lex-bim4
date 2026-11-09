export const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB',
    'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
].map((uf) => ({ value: uf, label: uf }));

export const SEXO_OPTIONS = [
    { value: 'feminino', label: 'Feminino' },
    { value: 'masculino', label: 'Masculino' },
];

export const ESTADO_CIVIL_OPTIONS = [
    { value: 'solteiro', label: 'Solteiro(a)' },
    { value: 'casado', label: 'Casado(a)' },
    { value: 'separado_judicialmente', label: 'Separado(a) judicialmente' },
    { value: 'divorciado', label: 'Divorciado(a)' },
    { value: 'viuvo', label: 'Viúvo(a)' },
    { value: 'uniao_estavel', label: 'União estável (amasiado)' },
];

export const TIPO_PESSOA_OPTIONS = [
    { value: 'fisica', label: 'Pessoa Física' },
    { value: 'juridica', label: 'Pessoa Jurídica' },
];

export const PAPEL_PROCESSO_OPTIONS = [
    { value: 'autor', label: 'Autor' },
    { value: 'reu', label: 'Réu' },
    { value: 'terceiro_interessado', label: 'Terceiro interessado' },
    { value: 'litisconsorte', label: 'Litisconsorte' },
];

export const TIPO_SECAO_OPTIONS = [
    { value: 'qualificacao', label: 'Qualificação' },
    { value: 'objeto', label: 'Objeto' },
    { value: 'clausula', label: 'Cláusula' },
    { value: 'fundamentacao', label: 'Fundamentação' },
    { value: 'pedido', label: 'Pedido' },
    { value: 'encerramento', label: 'Encerramento' },
    { value: 'assinatura', label: 'Assinatura' },
    { value: 'outro', label: 'Outro' },
];

export const TIPO_DOCUMENTO_OPTIONS = [
    { value: 'procuracao', label: 'Procuração' },
    { value: 'contrato_prestacao_servicos', label: 'Contrato de prestação de serviços' },
    { value: 'declaracao_isencao_ir', label: 'Declaração de isenção de IR' },
    { value: 'declaracao_autonomo', label: 'Declaração de autônomo' },
    { value: 'declaracao_hipossuficiencia', label: 'Declaração de hipossuficiência' },
    { value: 'declaracao_renuncia', label: 'Declaração de renúncia' },
    { value: 'peticao', label: 'Petição' },
    { value: 'sentenca', label: 'Sentença' },
    { value: 'comprovante', label: 'Comprovante' },
    { value: 'outro', label: 'Outro' },
];

export const TIPO_HONORARIO_OPTIONS = [
    { value: 'fixo', label: 'Fixo' },
    { value: 'percentual', label: 'Percentual' },
    { value: 'custas', label: 'Custas processuais' },
];

export const AJUDA_TIPO_HONORARIO = {
    fixo: 'Valor fechado em reais.',
    percentual: 'Calculado sobre um valor base, como o valor da causa ou da condenação.',
    custas: 'Despesas do processo que serão cobradas do cliente.',
};

export const TIPO_PERCENTUAL = 'percentual';

export const STATUS_HONORARIO_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'parcialmente_pago', label: 'Parcialmente pago' },
    { value: 'pago', label: 'Pago' },
    { value: 'cancelado', label: 'Cancelado' },
];

export const STATUS_CANCELADO = 'cancelado';

export const STATUS_PARCELA_OPTIONS = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'parcial', label: 'Parcial' },
    { value: 'pago', label: 'Pago' },
    { value: 'vencido', label: 'Vencido' },
    { value: 'cancelado', label: 'Cancelado' },
];

export const FORMA_PAGAMENTO_OPTIONS = [
    { value: 'pix', label: 'Pix' },
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
    { value: 'cartao_debito', label: 'Cartão de Débito' },
    { value: 'transferencia', label: 'Transferência' },
];

export const nomeDoCliente = (cliente) => {
    if (!cliente || typeof cliente !== 'object') return '—';

    const nome = cliente.tipoPessoa === 'fisica' ? cliente.nomeCompleto : cliente.razaoSocial;

    return nome || '—';
};

export const documentoDoCliente = (cliente) => {
    if (!cliente || typeof cliente !== 'object') return '';

    return cliente.tipoPessoa === 'fisica' ? (cliente.cpf ? `CPF: ${cliente.cpf}` : '') : (cliente.cnpj ? `CNPJ: ${cliente.cnpj}` : '');
};

export const labelDe = (options, value) => {
    if (!value) return '—';

    const found = options.find((o) => o.value === value);

    return found ? found.label : '—';
};

export const TIPO_EVENTO_OPTIONS = [
    { value: 'audiencia', label: 'Audiência' },
    { value: 'prazo', label: 'Prazo' },
    { value: 'reuniao', label: 'Reunião' },
    { value: 'outro', label: 'Outro' },
];

export const STATUS_PROCESSO_OPTIONS = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'suspenso', label: 'Suspenso' },
    { value: 'encerrado', label: 'Encerrado' },
];

export const FASE_PROCESSO_OPTIONS = [
    { value: 'conhecimento', label: 'Fase de conhecimento' },
    { value: 'sentenca', label: 'Sentença' },
    { value: 'execucao', label: 'Execução' },
    { value: 'recursos', label: 'Recursos' },
];

export const rotuloDaFase = (fase) => labelDe(FASE_PROCESSO_OPTIONS, fase);

export const ESTADO_PORTAL_OPTIONS = [
    { value: 'nunca_acessou', label: 'Nunca acessou o portal' },
    { value: 'acessou_sem_confirmar', label: 'Acessou, mas não confirmou' },
    { value: 'confirmou', label: 'Confirmou' },
];

export const TIPO_PAGAMENTO_OPTIONS = [
    { value: 'comum', label: 'Pagamento comum' },
    { value: 'adiantamento', label: 'Adiantamento' },
];