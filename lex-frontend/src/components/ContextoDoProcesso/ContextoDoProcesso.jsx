import { nomeDoCliente } from "../../utils/enums";
import { formatCurrency } from "../../utils/formatters";

import "./ContextoDoProcesso.css";

function ContextoDoProcesso({ processo, cliente, honorario }) {
    const proc = processo ?? honorario?.processoId;
    if (!proc || typeof proc !== "object") return null;

    const clienteDoProcesso = cliente ?? proc.clientePrincipalId;

    return (
        <dl className="contextoProcesso" aria-label="Você está lançando para">
            <div>
                <dt>Cliente</dt>
                <dd>{nomeDoCliente(clienteDoProcesso)}</dd>
            </div>
            <div>
                <dt>Processo</dt>
                <dd>
                    {proc.titulo || "—"}
                    <span className="contextoProcessoNumero">{proc.numeroProcesso ? `nº ${proc.numeroProcesso}` : "sem número"}</span>
                </dd>
            </div>
            {honorario && (
                <div>
                    <dt>Honorário</dt>
                    <dd>
                        {honorario.descricao}
                        {honorario.valor != null && <span className="contextoProcessoNumero">{formatCurrency(honorario.valor)}</span>}
                    </dd>
                </div>
            )}
        </dl>
    );
}

export default ContextoDoProcesso;
