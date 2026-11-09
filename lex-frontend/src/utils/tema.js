import { getTheme, setTheme } from "./storage";

const midiaEscura = window.matchMedia("(prefers-color-scheme: dark)");

export const resolverTema = (preferencia) => {
    if (preferencia === "sistema") return midiaEscura.matches ? "dark" : "light";
    return preferencia;
};

export const aplicarTema = (preferencia = getTheme()) => {
    document.documentElement.dataset.theme = resolverTema(preferencia);
    window.dispatchEvent(new Event("temaalterado"));
};

export const escolherTema = (preferencia) => {
    setTheme(preferencia);
    aplicarTema(preferencia);
};

export const iniciarTema = () => {
    aplicarTema();
    midiaEscura.addEventListener("change", () => {
        if (getTheme() === "sistema") aplicarTema("sistema");
    });
};
