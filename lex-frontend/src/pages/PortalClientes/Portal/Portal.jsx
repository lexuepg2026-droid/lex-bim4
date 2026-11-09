import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { usePortalAuth } from "../../../contexts/PortalAuthContext";

import formatarCodProcesso from "../../../utils/formatarCodProcesso";
import { getApiErrorMessage } from "../../../utils/apiError";

import "./Portal.css";
import Ajuda from "../../../components/Ajuda/Ajuda";
import { AJUDA } from "../../../components/Ajuda/textos";

function Portal() {
    const navigate = useNavigate();

    const { entrar } = usePortalAuth();

    const [codProcesso, setCodProcesso] = useState("");
    const [senhaProcesso, setSenhaProcesso] = useState("");

    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const realizarLogin = async (evento) => {
        evento.preventDefault();

        setErro("");
        setCarregando(true);

        try {
            await entrar(codProcesso, senhaProcesso);

            navigate("/portal/processo");
        } catch (erro) {
            setErro(getApiErrorMessage(erro, "Código de acesso ou senha inválidos."));
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="telaPortal">

            <h1 className="tituloPortal">
                Acompanhe seus processos
            </h1>

            <div className="cardPortal">

                <p className="info">
                    Utilize o código de acesso fornecido pela(o) advogada(o)
                </p>

                <form onSubmit={realizarLogin}>

                    <div className="divLabelTop">
                        <label htmlFor="codProcesso">
                            Código de acesso
                            <Ajuda assunto={AJUDA.portalCodigo.assunto}>{AJUDA.portalCodigo.texto}</Ajuda>
                        </label>

                        <input className="input"
                            id="codProcesso"
                            type="text"
                            placeholder="LEX-0000-0000"
                            value={codProcesso}
                            onChange={(e) =>
                                setCodProcesso(formatarCodProcesso(e.target.value))
                                
                            }
                            required
                        />
                    </div>

                    <div className="divLabelTop">
                        <label htmlFor="senhaProcesso">
                            Senha
                        </label>

                        <input className="input"
                            id="senhaProcesso"
                            type="password"
                            placeholder=" "
                            value={senhaProcesso}
                            onChange={(e) =>
                                setSenhaProcesso(e.target.value)
                            }
                            required
                        />
                    </div>

                    {erro && (
                        <p className="erroPortal">
                            {erro}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="button buttonConsultar"
                        disabled={
                            !codProcesso ||
                            !senhaProcesso ||
                            carregando
                        }
                    >
                        {carregando ? "Consultando..." : "Consultar"}
                    </button>

                </form>

                <Link title="Saiba como receber uma nova senha"
                    to="senha/reset"
                    className="buttonNoBorder buttonEsqueciSenhaPortal"
                >
                    Esqueceu a senha?
                </Link>

            </div>
        </div>
    );
}

export default Portal;