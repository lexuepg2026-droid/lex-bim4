import api from '../api/axiosConfig';
import { nomeDoAnexo } from '../utils/download';

const register = (payload) => api.post('/auth/register', payload);

const login = (email, senha) => api.post('/auth/login', { email, senha });

const logout = () => api.post('/auth/logout');

const getMe = () => api.get('/auth/me');

const updateMe = (payload) => api.patch('/auth/me', payload);

const changePassword = (senhaAtual, novaSenha) => api.post('/auth/alterar-senha', { senhaAtual, novaSenha });

const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

const resetPassword = (token, novaSenha) => api.post('/auth/reset-password', { token, novaSenha });

const confirmEmail = (token) => api.post('/auth/confirm-email', { token });

const resendConfirmation = () => api.post('/auth/resend-confirmation');

const baixarExemploTimbrado = () => api.get('/auth/me/timbrado-exemplo', { responseType: 'blob' });

const baixarEsalvarExemploTimbrado = async () => {
    const response = await baixarExemploTimbrado();

    const nome = nomeDoAnexo(response, 'exemplo-timbrado.pdf');

    const url = URL.createObjectURL(response.data);

    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = nome;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        URL.revokeObjectURL(url);
    }

    return { nome };
};

export default { 
    register, 
    login, 
    logout, 
    getMe, 
    updateMe, 
    changePassword,
    forgotPassword,
    resetPassword,
    confirmEmail,
    resendConfirmation,
    baixarEsalvarExemploTimbrado
};
