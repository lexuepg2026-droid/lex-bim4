import { useState, useEffect } from "react";

import { useAuth } from "../../contexts/AuthContext";

import authService from "../../services/authService";

import { getApiErrorMessage } from "../../utils/apiError";
import { toast } from "../../utils/toast";

import "./AvisoEmail.css";

const CHAVE_DISPENSADO = "lex:aviso-email-dispensado:";

const lerDispensado = (id) => {
    try {
        return sessionStorage.getItem(`${CHAVE_DISPENSADO}${id}`) === "1";
    } catch {
        return false;
    }
};

const gravarDispensado = (id) => {
    try {
        sessionStorage.setItem(`${CHAVE_DISPENSADO}${id}`, "1");
    } catch {
        return;
    }
};

function AvisoEmail() {
    const { user, checkAuth } = useAuth();

    const [enviando, setEnviando] = useState(false);
    const [conferindo, setConferindo] = useState(false);
    const [aviso, setAviso] = useState(null);
    const [dispensado, setDispensado] = useState(false);

    const pendente = Boolean(user) && !user.emailConfirmadoEm;

    useEffect(() => {
        if (!pendente) return;

        const aoVoltarParaAba = () => {
            checkAuth().then((usuario) => {
                if (usuario?.emailConfirmadoEm) toast.success("E-mail confirmado.");
            });
        };

        window.addEventListener("focus", aoVoltarParaAba);
        return () => window.removeEventListener("focus", aoVoltarParaAba);
    }, [pendente, checkAuth]);

    if (!pendente) return null;

    const idUsuario = user._id ?? user.id;
    if (dispensado || lerDispensado(idUsuario)) return null;

    const reenviar = async () => {
        setEnviando(true);
        setAviso(null);
        try {
            const res = await authService.resendConfirmation();
            if (res.data?.jaConfirmado) {
                await checkAuth();
                toast.success("Seu e-mail já está confirmado.");
            } else {
                setAviso({ tipo: "ok", texto: `Enviamos um novo link para ${user.email}. Ele vale por 24 horas, e o link anterior deixa de funcionar. Confira também o spam.` });
            }
        } catch (err) {
            setAviso({ tipo: "erro", texto: getApiErrorMessage(err, "Não foi possível enviar o e-mail agora.") });
        } finally {
            setEnviando(false);
        }
    };

    const conferir = async () => {
        setConferindo(true);
        setAviso(null);
        const usuario = await checkAuth();
        setConferindo(false);
        if (usuario?.emailConfirmadoEm) {
            toast.success("E-mail confirmado.");
        } else {
            setAviso({ tipo: "erro", texto: "Ainda não consta a confirmação. Abra o link do e-mail mais recente e tente de novo. Se ele passou de 24 horas, peça outro em \"Reenviar\"." });
        }
    };

    const dispensar = () => {
        gravarDispensado(idUsuario);
        setDispensado(true);
    };

    return (
        <div className="avisoEmail" role="status">
            <p className="avisoEmailTexto">
                <strong>Confirme seu e-mail</strong> ({user.email}). Enviamos um link quando você criou a conta. Ele é necessário para receber os avisos e recuperar a senha.
            </p>

            <div className="avisoEmailAcoes">
                <button title="Envia um novo link de confirmação; o anterior deixa de valer" type="button" className="buttonOutlined avisoEmailBotao" onClick={reenviar} disabled={enviando || conferindo}>
                    {enviando ? "Enviando..." : "Reenviar"}
                </button>
                <button title="Clique depois de abrir o link do e-mail para atualizar este aviso" type="button" className="buttonOutlined avisoEmailBotao" onClick={conferir} disabled={enviando || conferindo}>
                    {conferindo ? "Conferindo..." : "Já confirmei"}
                </button>
                <button type="button" className="avisoEmailFechar" onClick={dispensar} title="Dispensar até o próximo login" aria-label="Dispensar aviso">
                    ×
                </button>
            </div>

            {aviso && <p className={`avisoEmailRetorno avisoEmailRetorno--${aviso.tipo}`}>{aviso.texto}</p>}
        </div>
    );
}

export default AvisoEmail;
