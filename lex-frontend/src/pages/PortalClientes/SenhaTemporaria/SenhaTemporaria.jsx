import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { usePortalAuth } from "../../../contexts/PortalAuthContext";

import { getApiErrorMessage } from "../../../utils/apiError";

function SenhaTemporaria() {
    const navigate = useNavigate();

    const { trocarSenha } = usePortalAuth();

    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const salvar = async (evento) => {
        evento.preventDefault();

        setErro("");

        if (novaSenha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        setCarregando(true);

        try {
            await trocarSenha(senhaAtual, novaSenha);

            navigate("/portal/processo", { replace: true });
        } catch (erro) {
            setErro(getApiErrorMessage(erro, "Não foi possível alterar a senha."));
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="telaPortal">
            <h1 className="tituloPortal">Defina sua senha</h1>

            <div className="cardPortal">
                <p className="info">
                    Essa é sua primeira vez aqui. Troque a senha provisória por uma só sua.
                </p>

                <form onSubmit={salvar}>
                    <div className="divLabelTop">
                        <label htmlFor="senhaAtual">Senha provisória</label>
                        <input className="input"
                            id="senhaAtual"
                            type="password"
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            required
                        />
                    </div>

                    <div className="divLabelTop">
                        <label htmlFor="novaSenha">Nova senha</label>
                        <input className="input"
                            id="novaSenha"
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            required
                        />
                    </div>

                    <div className="divLabelTop">
                        <label htmlFor="confirmarSenha">Confirmar nova senha</label>
                        <input className="input"
                            id="confirmarSenha"
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                        />
                    </div>

                    {erro && <p className="erroPortal">{erro}</p>}

                    <button
                        type="submit"
                        className="button buttonConsultar"
                        disabled={carregando}
                    >
                        {carregando ? "Salvando..." : "Definir senha"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SenhaTemporaria;