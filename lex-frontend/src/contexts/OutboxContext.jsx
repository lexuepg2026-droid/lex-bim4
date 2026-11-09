import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useAuth } from './AuthContext';
import useOnlineStatus from '../hooks/useOnlineStatus';
import { listarFila, enviarFila, tentarDeNovo, descartar, manterMinhaVersao } from '../offline/outbox';
import { enviarEntrada } from '../api/outboxSender';
import { contarFalhas, filaTravada } from '../offline/outboxPlan';
import { aoMudarFila } from '../offline/outboxEvents';
import { toast } from '../utils/toast';

const OutboxContext = createContext(null);

export function OutboxProvider({ children }) {
    const { user } = useAuth();
    const userId = user?._id ?? user?.id ?? null;
    const online = useOnlineStatus();

    const [estado, setEstado] = useState({ dono: null, lista: [] });
    const [enviando, setEnviando] = useState(false);
    const emCurso = useRef(false);

    const recarregar = useCallback(async () => {
        if (!userId) return [];
        const fila = await listarFila(userId);
        setEstado({ dono: userId, lista: fila });
        return fila;
    }, [userId]);

    const enviar = useCallback(async () => {
        if (!userId || emCurso.current) return null;
        emCurso.current = true;
        setEnviando(true);
        try {
            const resultado = await enviarFila({ userId, enviar: enviarEntrada });
            await recarregar();
            if (resultado.enviadas.length > 0) {
                toast.success(resultado.enviadas.length === 1
                    ? "1 alteração feita sem conexão foi enviada."
                    : `${resultado.enviadas.length} alterações feitas sem conexão foram enviadas.`);
            }
            if (resultado.bloqueio && resultado.bloqueio.falha.classificacao !== "semSinal") {
                toast.error("Uma alteração feita sem conexão não pôde ser enviada. Veja em Pendências.");
            }
            return resultado;
        } finally {
            emCurso.current = false;
            setEnviando(false);
        }
    }, [userId, recarregar]);

    useEffect(() => {
        if (!userId) return;
        listarFila(userId).then((fila) => setEstado({ dono: userId, lista: fila }));
    }, [userId]);

    const entradas = estado.dono === userId ? estado.lista : [];

    useEffect(() => aoMudarFila((quem) => {
        if (!quem || quem === userId) recarregar();
    }), [userId, recarregar]);

    useEffect(() => {
        if (online && userId) enviar();
    }, [online, userId, enviar]);

    const acaoTentarDeNovo = useCallback(async (id) => {
        await tentarDeNovo(userId, id);
        await recarregar();
        return enviar();
    }, [userId, recarregar, enviar]);

    const acaoDescartar = useCallback(async (id) => {
        await descartar(userId, id);
        return recarregar();
    }, [userId, recarregar]);

    const acaoManterMinha = useCallback(async (id) => {
        await manterMinhaVersao(userId, id);
        await recarregar();
        return enviar();
    }, [userId, recarregar, enviar]);

    const valor = {
        entradas,
        quantidade: entradas.length,
        falhas: contarFalhas(entradas),
        travada: filaTravada(entradas),
        enviando,
        online,
        recarregar,
        enviar,
        tentarDeNovo: acaoTentarDeNovo,
        descartar: acaoDescartar,
        manterMinhaVersao: acaoManterMinha,
    };

    return <OutboxContext.Provider value={valor}>{children}</OutboxContext.Provider>;
}

export function useOutbox() {
    return useContext(OutboxContext) ?? {
        entradas: [], quantidade: 0, falhas: 0, travada: false, enviando: false,
        online: true, recarregar: async () => [], enviar: async () => null,
        tentarDeNovo: async () => {}, descartar: async () => {}, manterMinhaVersao: async () => {},
    };
}
