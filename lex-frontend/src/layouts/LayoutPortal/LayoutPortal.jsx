import { Outlet, useLocation } from "react-router-dom"

import LEX_horizontal from "../../assets/images/logos/LEX_horizontal.svg";

import BotaoVoltar from "../../components/BotaoVoltar/BotaoVoltar";

import "./LayoutPortal.css"

function LayoutPortal() {
    const location = useLocation();

    const ocultarBotaoVoltar = location.pathname === "/Portal/Senha/Reset/Solicitado";

    return (
        <div className="telaLayoutPortal">
            {!ocultarBotaoVoltar && <BotaoVoltar />}

            <main>
                <Outlet />
            </main>

            <div className="logoPortal">
                <img src={LEX_horizontal} alt="Logo LEX"/>
            </div>
        </div>
    )
}

export default LayoutPortal