import { useState } from "react";

import BotaoVoltar from "../../../components/BotaoVoltar/BotaoVoltar";

import Perfil from "../Perfil/Perfil";
import Aparencia from "./Aparencia";

import "./Configuracoes.css";

const SECOES = [
    { valor: "perfil", rotulo: "Perfil", dica: "Seus dados, OAB, advocacia, timbrado e senha" },
    { valor: "aparencia", rotulo: "Aparência", dica: "Tema claro, escuro ou de acordo com o dispositivo" },
];

function Configuracoes() {
    const [secao, setSecao] = useState("perfil");

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
            </div>
        </div>
    );
}

export default Configuracoes;
