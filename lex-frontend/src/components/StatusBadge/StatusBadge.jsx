import "./StatusBadge.css";

const STATUS_MAP = {
    // Processos
    ativo:     { label: "Ativo",     cor: "success" },
    encerrado: { label: "Encerrado", cor: "neutral" },
    suspenso:  { label: "Suspenso",  cor: "warning" },
    
    // Honorários / Parcelas / Pagamentos
    pendente:  { label: "Pendente",  cor: "warning" },
    pago:      { label: "Pago",      cor: "success" },
    cancelado: { label: "Cancelado", cor: "danger"  },
    vencido:   { label: "Vencido",   cor: "danger"  },
    recebido:  { label: "Recebido",  cor: "success" },
    parcial:   { label: "Parcial",   cor: "info"    },
    parcialmente_pago: { label: "Parcialmente pago", cor: "info" },
    
    // Estado do participante no portal do cliente
    nunca_acessou:         { label: "Nunca acessou",          cor: "neutral" },
    acessou_sem_confirmar: { label: "Acessou, não confirmou", cor: "warning" },
    confirmou:             { label: "Confirmou a leitura",    cor: "success" },
};

function StatusBadge({ status }) {
    const normalizado = status?.toLowerCase().trim();
    const config = STATUS_MAP[normalizado] ?? { label: status ?? "—", cor: "neutral" };

    return (
        <span className={`statusBadge statusBadge--${config.cor}`}>
            {config.label}
        </span>
    );
}

export default StatusBadge;