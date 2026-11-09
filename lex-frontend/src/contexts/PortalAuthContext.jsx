import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registrarPerdaDeSessao } from "../api/portalAxios";

import portalService from "../services/portalService";

const PortalAuthContext = createContext(null);

export function PortalAuthProvider({ children }) {
    const [sessao, setSessao] = useState(null);
    const [carregando, setCarregando] = useState(true);

    const navigate = useNavigate();

    const conferirSessao = useCallback(async () => {
        try {
            const resposta = await portalService.sessao();
            setSessao(resposta.data);
        } catch {
            setSessao(null);
        } finally {
            setCarregando(false);
        }
    }, []);

    const entrar = useCallback(async (codigoAcesso, senha) => {
        await portalService.login(codigoAcesso, senha);

        const resposta = await portalService.sessao();

        setSessao(resposta.data);

        return resposta.data;
    }, []);

    const trocarSenha = useCallback(async (senhaAtual, novaSenha) => {
        await portalService.trocarSenha(senhaAtual, novaSenha);

        const resposta = await portalService.sessao();

        setSessao(resposta.data);

        return resposta.data;
    }, []);

    const sair = useCallback(async () => {
        try {
            await portalService.logout();
        } catch {
            return;
        } finally {
            setSessao(null);
            navigate("/portal", { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        conferirSessao();
    }, [conferirSessao]);

    useEffect(() => {
        registrarPerdaDeSessao(() => {
            setSessao(null);
            navigate("/portal", { replace: true });
        });

        return () => registrarPerdaDeSessao(null);
    }, [navigate]);

    return (
        <PortalAuthContext.Provider
            value={{
                sessao,
                carregando,
                autenticado: !!sessao,
                senhaProvisoria:
                    sessao?.senhaPortalProvisoria === true,
                cliente: sessao?.cliente ?? null,
                entrar,
                trocarSenha,
                sair,
                conferirSessao
            }}
        >
            {children}
        </PortalAuthContext.Provider>
    );
}

export function usePortalAuth() {
    return useContext(PortalAuthContext);
}