import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";

import Perfil from "../Perfil/Perfil";
import Aparencia from "./Aparencia";
import ComoUsar from "./ComoUsar";

import "./Configuracoes.css";

const SECOES = [
    { valor: "perfil", rotulo: "Perfil", dica: "Seus dados, OAB, advocacia, timbrado e senha" },
    { valor: "aparencia", rotulo: "Aparência", dica: "Tema claro, escuro ou de acordo com o dispositivo" },
    { valor: "como-usar", rotulo: "Como usar", dica: "Um resumo de cada parte do sistema" },
];

function Configuracoes() {
    // `?secao=como-usar` abre direto numa seção (DEC-172).
    const [parametros] = useSearchParams();
    const pedida = parametros.get("secao");
    const [secao, setSecao] = useState(SECOES.some((s) => s.valor === pedida) ? pedida : "perfil");

    return (
        <div className="tela telaConfiguracoes">
            <BotaoVoltar />

            <nav className="configuracoesMenu">
                {SECOES.map((item) => (
                    <button
                        key={item.valor}
                        type="button"
                        className={`configuracoesOpcao ${secao === item.valor ? "configuracoesOpcaoAtiva" : ""}`}
                        onClick={() => setSecao(item.valor)}
                        title={item.dica}
                    >
                        {item.rotulo}
                    </button>
                ))}
            </nav>

            <div className="configuracoesConteudo">
                {secao === "perfil" && <Perfil />}
                {secao === "aparencia" && <Aparencia />}
                {secao === "como-usar" && <ComoUsar />}
            </div>
        </div>
    );
}

export default Configuracoes;
