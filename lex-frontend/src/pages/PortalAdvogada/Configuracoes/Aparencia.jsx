import { useState, useEffect } from "react";

import { getTheme } from "../../../utils/storage";
import { escolherTema } from "../../../utils/tema";

const OPCOES_TEMA = [
    { valor: "light", rotulo: "Claro", descricao: "Fundo bege com texto escuro." },
    { valor: "dark", rotulo: "Escuro", descricao: "Fundo verde-escuro com texto claro." },
    { valor: "sistema", rotulo: "De acordo com o dispositivo", descricao: "Segue o tema do seu celular ou computador e muda sozinho quando ele mudar." },
];

function Aparencia() {
    const [tema, setTema] = useState(getTheme());
    const [temaAtual, setTemaAtual] = useState(document.documentElement.dataset.theme);

    useEffect(() => {
        const sincronizar = () => {
            setTema(getTheme());
            setTemaAtual(document.documentElement.dataset.theme);
        };
        window.addEventListener("temaalterado", sincronizar);
        return () => window.removeEventListener("temaalterado", sincronizar);
    }, []);

    return (
        <div className="conteinerPerfil">
            <h1 className="perfil">Aparência</h1>

            <h2 className="perfil">Tema</h2>
            <p className="campoAjuda">A escolha fica salva neste navegador e vale para todas as telas do sistema.</p>

            <div className="opcoesTema" role="radiogroup" aria-label="Tema">
                {OPCOES_TEMA.map((opcao) => (
                    <label key={opcao.valor} className={`opcaoTema ${tema === opcao.valor ? "opcaoTemaAtiva" : ""}`}>
                        <input
                            type="radio"
                            name="tema"
                            value={opcao.valor}
                            checked={tema === opcao.valor}
                            onChange={() => escolherTema(opcao.valor)}
                        />
                        <span className="opcaoTemaTexto">
                            <span>{opcao.rotulo}</span>
                            <small className="campoNota">
                                {opcao.descricao}
                                {opcao.valor === "sistema" && tema === "sistema" && ` Agora: ${temaAtual === "dark" ? "escuro" : "claro"}.`}
                            </small>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

export default Aparencia;
