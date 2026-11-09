import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import useOnlineStatus from "../../hooks/useOnlineStatus";
import { useOutbox } from "../../contexts/OutboxContext";
import { aoLerDoEspelho } from "../../offline/espelhoEvents";
import { offlineNoticeText } from "../../offline/dataAge";

import "./AvisoOffline.css";

function AvisoOffline() {
    const online = useOnlineStatus();
    const { pathname } = useLocation();
    const { quantidade } = useOutbox();
    const [leitura, setLeitura] = useState({ pathname, maisAntigo: null });

    useEffect(() => aoLerDoEspelho((atualizadoEm) => {
        setLeitura((atual) => {
            const caminho = window.location.pathname;
            const anterior = atual.pathname === caminho ? atual.maisAntigo : null;
            return { pathname: caminho, maisAntigo: anterior === null ? atualizadoEm : Math.min(anterior, atualizadoEm) };
        });
    }), []);

    const maisAntigo = leitura.pathname === pathname ? leitura.maisAntigo : null;

    if (online) return null;

    return (
        <div className="avisoOffline" role="status">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 2l20 20" />
                <path d="M8.5 16.5a5 5 0 0 1 7 0" />
                <path d="M5 12.9a10 10 0 0 1 5.2-2.8" />
                <path d="M19 12.9a10 10 0 0 0-2.4-1.6" />
                <path d="M12 20h.01" />
            </svg>
            <div className="avisoOfflineTexto">
                <strong>{maisAntigo ? offlineNoticeText(maisAntigo) : "Sem conexão."}</strong>
                <span>
                    Você pode consultar o que já abriu neste aparelho. Compromissos da agenda e a fase do processo podem ser salvos: ficam na fila e são enviados sozinhos quando o sinal voltar. O resto precisa de conexão.
                    {quantidade > 0 && <> <Link to="/pendencias">Ver {quantidade === 1 ? "1 alteração na fila" : `${quantidade} alterações na fila`}</Link>.</>}
                </span>
            </div>
        </div>
    );
}

export default AvisoOffline;
