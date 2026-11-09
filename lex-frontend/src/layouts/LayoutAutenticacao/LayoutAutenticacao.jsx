import { Outlet, useLocation, useNavigate } from "react-router-dom";

import LEX_horizontal from "../../assets/images/logos/LEX_horizontal.svg";

import "./LayoutAutenticacao.css";

import BotaoVoltar from "../../components/BotaoVoltar/BotaoVoltar";

function LayoutAutenticacao() {
    const location = useLocation();
    const navigate = useNavigate();

    const mostrarBotaoVoltar = location.pathname !== "/";

    return (
        <div className="tela telaAutenticacao">
            <div className="esquerdaAutenticacao">
                {mostrarBotaoVoltar && ( <BotaoVoltar /> )}

                <img src={LEX_horizontal} alt="Logo LEX" className="logoAutenticacao" />
            </div>

            <div className="direitaAutenticacao">
                <main>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default LayoutAutenticacao;