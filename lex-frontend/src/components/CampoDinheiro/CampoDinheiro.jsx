import { useState } from "react";

import { maskMoney, parseMoney, formatMoneyInput } from "../../utils/masks";

import "./CampoDinheiro.css";

function CampoDinheiro({ id, name, value, onChange, required = false, disabled = false, className, placeholder = "0,00" }) {
    const [texto, setTexto] = useState(() => formatMoneyInput(value));
    const [valorExterno, setValorExterno] = useState(value);

    if (value !== valorExterno) {
        setValorExterno(value);
        if (parseMoney(value) !== parseMoney(texto)) setTexto(formatMoneyInput(value));
    }

    const emitir = (novoTexto) => {
        setTexto(novoTexto);
        const numero = parseMoney(novoTexto);
        onChange(numero === null ? "" : numero);
    };

    const aoDigitar = (e) => emitir(maskMoney(e.target.value));

    const aoTeclar = (e) => {
        if (e.key !== "." && e.key !== "Decimal") return;
        e.preventDefault();
        const campo = e.target;
        const inicio = campo.selectionStart ?? campo.value.length;
        const fim = campo.selectionEnd ?? inicio;
        emitir(maskMoney(`${campo.value.slice(0, inicio)},${campo.value.slice(fim)}`));
    };

    const aoColar = (e) => {
        const colado = e.clipboardData?.getData("text");
        if (colado == null) return;
        const numero = parseMoney(colado);
        if (numero == null) return;
        e.preventDefault();
        setTexto(formatMoneyInput(numero));
        onChange(numero);
    };

    const aoSair = () => setTexto(formatMoneyInput(parseMoney(texto)));

    return (
        <div className={`campoDinheiro${disabled ? " campoDinheiro--desativado" : ""}`}>
            <span className="campoDinheiroPrefixo" aria-hidden="true">R$</span>
            <input
                id={id}
                name={name}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={texto}
                onChange={aoDigitar}
                onKeyDown={aoTeclar}
                onPaste={aoColar}
                onBlur={aoSair}
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                className={className}
            />
        </div>
    );
}

export default CampoDinheiro;
