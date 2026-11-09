import { Link } from "react-router-dom";

import "./ResetSenhaPortal.css";

function ResetSenhaPortal() {
    return (
        <div className="telaPortal">
            <h1 className="tituloPortal">Esqueceu a senha?</h1>

            <div className="cardPortal">
                <p className="info">
                    Fale com a sua advogada. Ela define uma nova senha provisória para você e o seu código de acesso continua o mesmo.
                </p>

                <p className="info infoReset">
                    No primeiro acesso com a senha provisória, o portal pede que você troque por uma senha que só você conheça.
                </p>

                <Link className="button buttonConsultar buttonHover" to="/portal">
                    Voltar para o acesso
                </Link>
            </div>
        </div>
    );
}

export default ResetSenhaPortal;
