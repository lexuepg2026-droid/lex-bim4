import { useEffect } from "react";

import "./Modal.css";

function Modal({
    aberto,
    titulo,
    mensagem,
    onConfirmar,
    onCancelar,
    perigo = false,
    somenteInfo = false,
    labelConfirmar = "Confirmar",
    labelCancelar = "Cancelar",
}) {
    useEffect(() => {
        if (!aberto) return;

        const aoTeclar = (e) => {
            if (e.key === "Escape") (onCancelar ?? onConfirmar)?.();
        };

        document.addEventListener("keydown", aoTeclar);
        return () => document.removeEventListener("keydown", aoTeclar);
    }, [aberto, onCancelar, onConfirmar]);

    if (!aberto) return null;

    return (
        <div className="modalOverlay" onClick={somenteInfo ? onConfirmar : onCancelar}>
            <div className="modalCaixa"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {titulo && <h2 className="modalTitulo">{titulo}</h2>}
                {mensagem && <p className="modalMensagem">{mensagem}</p>}

                <div className="modalAcoes">
                    {!somenteInfo && (
                        <button className="buttonOutlined modalBotao" onClick={onCancelar}>
                            {labelCancelar}
                        </button>
                    )}

                    <button className={perigo ? "modalBotao modalBotaoPerigo" : "buttonOutlined modalBotao"}
                        onClick={onConfirmar}
                    >
                        {labelConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Modal;