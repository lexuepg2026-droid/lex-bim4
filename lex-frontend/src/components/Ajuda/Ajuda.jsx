import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import iconeAjuda from "../../assets/images/icons/ajuda.svg";
import { posicionarBalao, proximoEstado } from "./posicao";

import "./Ajuda.css";

// O botão "?" com balão (DEC-172). Fica ao lado de um título ou de um rótulo.
//
// - Abre com clique, Enter ou Espaço (é um <button>); fecha com Esc, com
//   clique fora ou com o mesmo botão. Fechar com Esc devolve o foco ao botão.
// - O balão vai para o <body> (portal): não herda o text-transform das barras,
//   não é cortado pelo overflow dos cartões e fica acima dos modais.
// - O Esc é ouvido na captura e não se propaga: com o balão aberto dentro de um
//   modal, o Esc fecha só o balão.
function Ajuda({ assunto, children }) {
    const [aberto, setAberto] = useState(false);
    const [posicao, setPosicao] = useState(null);
    const botao = useRef(null);
    const balao = useRef(null);
    const id = `ajuda-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

    useLayoutEffect(() => {
        if (!aberto) return undefined;
        const medir = () => {
            if (!botao.current || !balao.current) return;
            const r = botao.current.getBoundingClientRect();
            setPosicao(posicionarBalao({
                ancora: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
                balao: { width: balao.current.offsetWidth, height: balao.current.offsetHeight },
                janela: { width: document.documentElement.clientWidth, height: window.innerHeight },
            }));
        };
        medir();
        window.addEventListener("resize", medir);
        window.addEventListener("scroll", medir, true);
        return () => {
            window.removeEventListener("resize", medir);
            window.removeEventListener("scroll", medir, true);
        };
    }, [aberto]);

    useEffect(() => {
        if (!aberto) return undefined;
        const aoTeclar = (e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopPropagation();
            const proximo = proximoEstado(true, "esc");
            setAberto(proximo.aberto);
            if (proximo.focarBotao) botao.current?.focus();
        };
        const aoTocarFora = (e) => {
            if (botao.current?.contains(e.target) || balao.current?.contains(e.target)) return;
            setAberto(proximoEstado(true, "fora").aberto);
        };
        document.addEventListener("keydown", aoTeclar, true);
        document.addEventListener("pointerdown", aoTocarFora, true);
        return () => {
            document.removeEventListener("keydown", aoTeclar, true);
            document.removeEventListener("pointerdown", aoTocarFora, true);
        };
    }, [aberto]);

    return (
        <>
            <button
                ref={botao}
                type="button"
                className="ajudaBotao"
                aria-label={`Ajuda: ${assunto}`}
                aria-expanded={aberto}
                aria-controls={id}
                onClick={(e) => {
                    // O "?" mora dentro de rótulos e de linhas clicáveis: o clique
                    // é só dele.
                    e.preventDefault();
                    e.stopPropagation();
                    setAberto(proximoEstado(aberto, "alternar").aberto);
                }}
            >
                <img src={iconeAjuda} alt="" aria-hidden="true" />
            </button>
            {createPortal(
                <div
                    ref={balao}
                    id={id}
                    className="ajudaBalao"
                    hidden={!aberto}
                    aria-live="polite"
                    data-lado={posicao?.lado}
                    style={posicao ? { top: posicao.top, left: posicao.left } : { top: 0, left: 0, visibility: "hidden" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {aberto && children}
                </div>,
                document.body
            )}
        </>
    );
}

export default Ajuda;

// Para títulos longos: a última palavra e o "?" não se separam na quebra de
// linha (o "?" sozinho numa linha nova parece solto).
//
// pendurado: o "?" não ocupa largura na linha (margem negativa) e fica no
// padding à direita. Serve para um título que já enche a linha, como o do
// Extrato: o "?" não o faz quebrar e o tamanho do título não muda.
export function TextoComAjuda({ texto, assunto, pendurado = false, children }) {
    const partes = String(texto ?? "").trimEnd().split(" ");
    const ultima = partes.pop();
    return (
        <>
            {partes.length > 0 && `${partes.join(" ")} `}
            <span className={pendurado ? "ajudaJunto ajudaPendurada" : "ajudaJunto"}>
                {ultima}
                <Ajuda assunto={assunto}>{children}</Ajuda>
            </span>
        </>
    );
}
