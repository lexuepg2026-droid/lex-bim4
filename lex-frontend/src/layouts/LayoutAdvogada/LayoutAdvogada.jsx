import { Outlet } from "react-router-dom";

import HeaderAdvogada from "../../components/HeaderAdvogada/HeaderAdvogada";
import AvisoEmail from "../../components/AvisoEmail/AvisoEmail";
import AvisoOffline from "../../components/AvisoOffline/AvisoOffline";

import "./LayoutAdvogada.css";

function LayoutAdvogada() {
    return (
        <div className="layoutAdvogada">

            <a href="#conteudo" className="pularConteudo">Pular para o conteúdo</a>

            <HeaderAdvogada />

            <main className="mainAdvogada" id="conteudo" tabIndex={-1}>
                <AvisoOffline />
                <AvisoEmail />
                <Outlet />
            </main>

        </div>
    );
}

export default LayoutAdvogada;