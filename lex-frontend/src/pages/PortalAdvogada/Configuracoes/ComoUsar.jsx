import { COMO_USAR } from "../../../components/Ajuda/textos";

// "Como usar" (DEC-172): um resumo de cada fluxo, na mesma estrutura de
// Aparência. As classes são as dela (conteinerPerfil, perfil, notaForm).
function ComoUsar() {
    return (
        <div className="conteinerPerfil">
            <h1 className="perfil">Como usar</h1>
            <p className="campoAjuda">
                Um resumo de cada parte do sistema. Nas telas, o botão &quot;?&quot; ao lado de um título explica aquele ponto.
            </p>

            {COMO_USAR.map((secao) => (
                <section key={secao.titulo} aria-labelledby={`como-usar-${secao.titulo}`}>
                    <h2 className="perfil" id={`como-usar-${secao.titulo}`}>{secao.titulo}</h2>
                    <ul className="comoUsarLista">
                        {secao.linhas.map((linha) => (
                            <li key={linha} className="notaForm">{linha}</li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}

export default ComoUsar;
