import { useEffect, useRef } from "react";

export function useRolagemInfinita(temMais, carregando, carregarMais) {
    const sentinela = useRef(null);

    useEffect(() => {
        const alvo = sentinela.current;
        if (!alvo || !temMais || carregando) return;

        const observador = new IntersectionObserver((entradas) => {
            if (entradas[0].isIntersecting) carregarMais();
        }, { rootMargin: "200px" });

        observador.observe(alvo);
        return () => observador.disconnect();
    }, [temMais, carregando, carregarMais]);

    return sentinela;
}
