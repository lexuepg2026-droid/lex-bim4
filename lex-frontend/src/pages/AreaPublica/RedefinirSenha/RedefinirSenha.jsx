import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import authService from "../../../services/authService";
import { getApiErrorMessage, getApiErrorCode } from "../../../utils/apiError";
import { toast } from "../../../utils/toast";

import "../Login/Login.css";

const lerTokenDaUrl = () => new URLSearchParams(window.location.search).get("token") ?? "";

const senhaValida = (senha) => senha.length >= 8 && /[a-zA-Z]/.test(senha) && /\d/.test(senha);

function RedefinirSenha() {
    const navigate = useNavigate();
    const [token] = useState(lerTokenDaUrl);

    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [linkMorto, setLinkMorto] = useState(false);

    const senhasDiferentes = confirmarSenha.length > 0 && novaSenha !== confirmarSenha;

    useEffect(() => {
        if (window.location.search) navigate(window.location.pathname, { replace: true });
    }, [navigate]);

    const redefinir = async (evento) => {
        evento.preventDefault();

        if (novaSenha !== confirmarSenha) return;

        if (!senhaValida(novaSenha)) {
            setErro("A senha deve ter no mínimo 8 caracteres, com ao menos uma letra e um número.");
            return;
        }

        setErro("");
        setCarregando(true);

        try {
            await authService.resetPassword(token, novaSenha);
            toast.success("Senha redefinida. Por segurança, todos os aparelhos conectados à sua conta foram desconectados.");
            navigate("/login", { replace: true });
        } catch (err) {
            const codigo = getApiErrorCode(err);
            if (codigo === "tokenInvalido" || codigo === "tokenExpirado") setLinkMorto(true);
            setErro(getApiErrorMessage(err, "Não foi possível redefinir a senha."));
        } finally {
            setCarregando(false);
        }
    };

    if (!token || linkMorto) {
        return (
            <div className="login">
                <h1>Link inválido</h1>
                <p className="erroLogin">{linkMorto && erro ? erro : "Este link de redefinição de senha está incompleto ou já foi utilizado."}</p>
                <Link title="Receber outro link de redefinição por e-mail" className="button buttonLogin" to="/senha/reset">
                    Pedir um novo link
                </Link>
            </div>
        );
    }

    return (
        <div className="login">
            <h1>Escolher nova senha</h1>

            <form onSubmit={redefinir}>
                <div className="divLabelInLine">
                    <input className="input login"
                        id="novaSenha"
                        type="password"
                        value={novaSenha}
                        placeholder=" "
                        autoComplete="new-password"
                        onChange={(e) => setNovaSenha(e.target.value)}
                        required
                    />
                    <label htmlFor="novaSenha">Nova senha</label>
                </div>
                <small className="notaCampo">Mínimo de 8 caracteres, com pelo menos uma letra e um número.</small>

                <div className="divLabelInLine">
                    <input className="input login"
                        id="confirmarSenha"
                        type="password"
                        value={confirmarSenha}
                        placeholder=" "
                        autoComplete="new-password"
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        required
                    />
                    <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                </div>

                {senhasDiferentes && <p className="erroLogin">As senhas não conferem.</p>}
                {erro && <p className="erroLogin">{erro}</p>}

                <button
                    className="button buttonLogin"
                    type="submit"
                    disabled={!novaSenha || !confirmarSenha || carregando}
                >
                    {carregando ? "Salvando..." : "Redefinir senha"}
                </button>
            </form>

            <Link className="buttonNoBorder" to="/login">
                Voltar para o login
            </Link>
        </div>
    );
}

export default RedefinirSenha;
