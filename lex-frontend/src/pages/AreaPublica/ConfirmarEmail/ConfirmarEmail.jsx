import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

import authService from "../../../services/authService";

import { getApiErrorMessage, getApiErrorCode } from "../../../utils/apiError";

import "../Login/Login.css";

const TITULO_DO_ERRO = {
    tokenExpirado: "Este link expirou",
    tokenInvalido: "Link inválido ou já usado",
};

function ConfirmarEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, checkAuth } = useAuth();

    const [estado, setEstado] = useState("carregando");
    const [mensagem, setMensagem] = useState("");
    const [codigo, setCodigo] = useState(null);
    const [reenvio, setReenvio] = useState(null);
    const [reenviando, setReenviando] = useState(false);

    const enviado = useRef(false);

    useEffect(() => {
        if (enviado.current) return;
        enviado.current = true;

        const token = searchParams.get("token") ?? "";
        navigate("/confirmar-email", { replace: true });

        if (!token) {
            setEstado("erro");
            setCodigo("tokenInvalido");
            setMensagem("Este link está incompleto. Use o link do e-mail mais recente.");
            return;
        }

        authService.confirmEmail(token)
            .then(async () => {
                setEstado("ok");
                await checkAuth();
            })
            .catch(async (err) => {
                const usuario = await checkAuth();
                if (usuario?.emailConfirmadoEm) {
                    setEstado("jaConfirmado");
                    return;
                }
                setEstado("erro");
                setCodigo(getApiErrorCode(err));
                setMensagem(getApiErrorMessage(err, "Não foi possível confirmar o e-mail. Tente novamente."));
            });
    }, [navigate, searchParams, checkAuth]);

    const pedirNovoLink = async () => {
        setReenviando(true);
        setReenvio(null);
        try {
            const res = await authService.resendConfirmation();
            if (res.data?.jaConfirmado) {
                await checkAuth();
                setEstado("jaConfirmado");
            } else {
                setReenvio({ tipo: "ok", texto: `Enviamos um novo link para ${user?.email}. Ele vale por 24 horas.` });
            }
        } catch (err) {
            setReenvio({ tipo: "erro", texto: getApiErrorMessage(err, "Não foi possível enviar o e-mail agora.") });
        } finally {
            setReenviando(false);
        }
    };

    const destino = isAuthenticated ? "/home" : "/login";
    const rotuloDestino = isAuthenticated ? "Ir para o sistema" : "Entrar";

    if (estado === "carregando") {
        return (
            <div className="login">
                <p className="infoLogin">Confirmando seu e-mail...</p>
            </div>
        );
    }

    if (estado === "ok" || estado === "jaConfirmado") {
        return (
            <div className="login">
                <h1>E-mail confirmado</h1>
                <p className="infoLogin">
                    {estado === "ok"
                        ? "Obrigado! A partir de agora você recebe os avisos e pode recuperar a senha por este e-mail."
                        : "Seu e-mail já estava confirmado. Não é preciso fazer mais nada."}
                </p>
                <Link className="button buttonLogin" to={destino}>{rotuloDestino}</Link>
            </div>
        );
    }

    return (
        <div className="login">
            <h1>{TITULO_DO_ERRO[codigo] ?? "Não foi possível confirmar"}</h1>
            <p className="erroLogin">{mensagem}</p>

            {isAuthenticated ? (
                <>
                    <p className="infoLogin">Peça um novo link: ele chega no seu e-mail e vale por 24 horas.</p>
                    {reenvio && <p className={reenvio.tipo === "ok" ? "infoLogin" : "erroLogin"}>{reenvio.texto}</p>}
                    <button type="button" className="button buttonLogin" onClick={pedirNovoLink} disabled={reenviando} title="Envia um novo link de confirmação; o anterior deixa de valer">
                        {reenviando ? "Enviando..." : "Enviar um novo link"}
                    </button>
                    <Link className="buttonNoBorder" to="/home">Ir para o sistema</Link>
                </>
            ) : (
                <>
                    <p className="infoLogin">
                        Entre no sistema: enquanto o e-mail não estiver confirmado, um aviso no topo da tela permite pedir um novo link.
                    </p>
                    <Link className="button buttonLogin" to="/login">Entrar</Link>
                </>
            )}
        </div>
    );
}

export default ConfirmarEmail;
