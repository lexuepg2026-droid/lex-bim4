import { Link } from "react-router-dom"

import "./ResetSenhaPortalSolicitado.css"

function ResetSenhaPortalSolicitado() {
    return (
        <div className="telaPortal">
            <h1 className="tituloPortal">Alteração de senha solicitada com sucesso!</h1>

            <div className="cardPortal">
                <p className="txtSenhaSolicitadaPortal">
                    Sua solicitação de alteração de senha foi realizada com sucesso! Entre em contato com a(o) advogada(o) e aguarde para receber a nova senha temporária.
                </p>
                
                <Link className="button buttonConsultar buttonHover" to={"/"}>
                    Voltar a tela inicial
                </Link>
            </div>
        </div>
    )
}

export default ResetSenhaPortalSolicitado