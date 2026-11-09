import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const [erro, setError] = useState("");
    const [carregando, setCarregando] = useState(false);
    
    const realizarLogin = async (evento) => {
        evento.preventDefault();

        setError("");
        setCarregando(true);

        try {
            await login(email, senha);
            navigate("/home");
        } catch(erro) {
            if (erro.response?.status === 401) {
                setError("E-mail ou senha inválidos.");
            } else if (erro.response?.status === 429) {
                setError("Muitas tentativas. Tente novamente mais tarde.");
            } else {
                setError("Não foi possível realizar o login.");
            }
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login">
            <h1>Fazer login</h1>

            <form onSubmit={realizarLogin}>
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

                <div className="divLabelInLine">
                    <input className="input login"
                        id="senha"
                        type="password"
                        value={senha}
                        placeholder=" "
                        onChange={(e) => setSenha(e.target.value)}
                        required
                    />
                    <label htmlFor="senha">Senha</label>
                </div>

                {erro && (
                    <p className="erroLogin">
                        {erro}
                    </p>
                )}

                <button className="button buttonLogin" type="submit" disabled={!email || !senha || carregando}>
                    {carregando ? "Entrando..." : "Fazer login"}
                </button>
            </form>

            <Link title="Receber por e-mail um link para criar uma nova senha" className="buttonNoBorder" to="/senha/reset">
                Esqueceu sua senha?
            </Link>

            <Link title="Cadastrar uma nova conta de advogada(o)" className="buttonOutlined" to="/cadastrar">
                Criar conta
            </Link>
        </div>
    );
}

export default Login;