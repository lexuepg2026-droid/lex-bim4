import { useState } from "react";
import { Link } from "react-router-dom";

import authService from "../../../services/authService";

import "../Login/Login.css";

function EsqueciSenha() {
    const [email, setEmail] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [erro, setErro] = useState("");

    const solicitar = async (evento) => {
        evento.preventDefault();

        setErro("");
        setCarregando(true);

        try {
            await authService.forgotPassword(email);
            setEnviado(true);
        } catch {
            setErro("Não foi possível enviar o e-mail agora. Tente novamente.");
        } finally {
            setCarregando(false);
        }
    };

    if (enviado) {
        return (
            <div className="login">
                <h1>Verifique seu e-mail</h1>

                <p className="infoLogin">
                    Se o e-mail informado tiver uma conta, enviaremos as instruções
                    para redefinir a senha. O link vale por 60 minutos.
                </p>

                <Link className="button buttonLogin" to="/login">
                    Voltar para o login
                </Link>
            </div>
        );
    }

    return (
        <div className="login">
            <h1>Esqueceu sua senha?</h1>

            <p className="infoLogin">
                Informe o e-mail da sua conta. Enviaremos um link para você escolher uma nova senha.
            </p>

            <form onSubmit={solicitar}>
                <div className="divLabelInLine">
                    <input className="input login"
                        id="email"
                        type="email"
                        value={email}
                        placeholder=" "
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="email">Email</label>
                </div>

                {erro && <p className="erroLogin">{erro}</p>}

                <button className="button buttonLogin" type="submit" disabled={!email || carregando}>
                    {carregando ? "Enviando..." : "Enviar link de recuperação"}
                </button>
            </form>

            <Link className="buttonNoBorder" to="/login">
                Voltar para o login
            </Link>
        </div>
    );
}

export default EsqueciSenha;