import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"

import "./BotaoVoltar.css";

function BotaoVoltar({ onClick }) {
    const navigate = useNavigate();
    const [escondido, setEscondido] = useState(false);
    const ultimoScrollY = useRef(0);

    useEffect(() => {
        const header = document.querySelector(".headerAdvogada");
        if (!header) return;

        ultimoScrollY.current = window.scrollY;
        let ticking = false;

        const aoRolar = () => {
            const atual = window.scrollY;

            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const descendo = atual > ultimoScrollY.current;
                    const passouDoTopo = atual > 80;

                    setEscondido(descendo && passouDoTopo);

                    ultimoScrollY.current = atual;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", aoRolar, { passive: true });
        return () => window.removeEventListener("scroll", aoRolar);
    }, []);

    return (
        <button title="Voltar para a tela anterior"
            className={`botaoVoltar ${escondido ? "botaoVoltar--escondido" : ""}`}
            onClick={() => navigate(-1)}
        >
            <span className="seta">‹</span>
            <span>Voltar</span>
        </button>
    );
}

export default BotaoVoltar