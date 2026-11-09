import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useFiltroNaUrl(nome, padrao = "") {
    const [params, setParams] = useSearchParams();
    const valor = params.get(nome) ?? padrao;

    const definir = useCallback((novo) => {
        const proximos = new URLSearchParams(window.location.search);
        const limpo = novo === null || novo === undefined ? "" : String(novo);

        if ((proximos.get(nome) ?? padrao) === (limpo === "" ? padrao : limpo)) return;

        if (limpo === "" || limpo === padrao) proximos.delete(nome);
        else proximos.set(nome, limpo);

        setParams(proximos, { replace: true });
    }, [nome, padrao, setParams]);

    return [valor, definir];
}
