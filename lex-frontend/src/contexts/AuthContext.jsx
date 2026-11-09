import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import authService from '../services/authService';
import { registrarSessao } from '../api/sessionLoss';
import { limparDadosDoUsuario } from '../utils/dadosDoUsuario';
import { startSession, clearAll } from '../offline/offlineCache';
import { registrarUsuarioAtual } from '../offline/currentUser';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();

    const registrarUsuario = useCallback((usuario) => {
        setUser(usuario);
        registrarSessao(Boolean(usuario));
        registrarUsuarioAtual(usuario?._id ?? usuario?.id ?? null);
    }, []);

    const idDe = (usuario) => usuario?._id ?? usuario?.id ?? null;

    const checkAuth = useCallback(async () => {
        try {
            const res = await authService.getMe();
            await startSession(idDe(res.data.usuario));
            registrarUsuario(res.data.usuario);
            return res.data.usuario;
        } catch {
            registrarUsuario(null);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [registrarUsuario]);

    const login = useCallback(async (email, senha) => {
        const res = await authService.login(email, senha);
        limparDadosDoUsuario();
        await startSession(idDe(res.data.usuario));
        registrarUsuario(res.data.usuario);
    }, [registrarUsuario]);

    const register = useCallback(async (payload) => {
        const res = await authService.register(payload);
        limparDadosDoUsuario();
        await startSession(idDe(res.data.usuario));
        registrarUsuario(res.data.usuario);
        return res.data.usuario;
    }, [registrarUsuario]);

    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } catch {
            return;
        } finally {
            limparDadosDoUsuario();
            await clearAll();
            registrarUsuario(null);
            navigate('/login');
        }
    }, [navigate, registrarUsuario]);

    const updateUser = useCallback((usuario) => {
        registrarUsuario(usuario);
    }, [registrarUsuario]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, checkAuth, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
