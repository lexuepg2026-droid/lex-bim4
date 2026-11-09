import { Link } from "react-router-dom"

import "./Inicio.css"

function Inicio() {
    return (
        <div className="inicio">            
            <Link title="Entrar na área da advogada(o)" to="/login" className="button buttonHover">
                Fazer login
            </Link>

            <Link title="Cadastrar uma nova conta de advogada(o)" to="/cadastrar" className="button buttonHover">
                Criar nova conta
            </Link>

            <Link title="Entrar no portal do cliente com o código de acesso" to="/portal" className="button buttonHover">
                Acompanhe seu processo
            </Link>
        </div>
    )
}

export default Inicio