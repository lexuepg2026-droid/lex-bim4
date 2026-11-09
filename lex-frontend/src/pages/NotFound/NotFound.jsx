import { Link } from "react-router-dom"

import LEX_horizontal from "../../assets/images/logos/LEX_horizontal.svg";

import "./NotFound.css"

function NotFound() {
    return (
        <div className="tela telaNotFound">
            <h1 className="txtNotFound text-lg">Opa! Parece que essa página não está disponível no momento.</h1>

            <p className="txtNotFound">Deseja ir até a página inicial?</p>

            <Link className="button buttonHover" to={"/"}>
                Voltar a tela inicial
            </Link>

            <div className="logoPortal logoNotFound">
                <img src={LEX_horizontal} alt="Logo LEX"/>
            </div>
        </div>
    )
}

export default NotFound