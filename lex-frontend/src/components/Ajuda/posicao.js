// Onde o balão da Ajuda fica (DEC-172). Função pura, sem DOM, para o teste.
//
// Prefere abaixo do botão, alinhado à esquerda dele. Vira para cima quando não
// cabe embaixo e há mais espaço em cima; e nunca sai da tela na horizontal: a
// esquerda é presa entre a margem e a borda direita menos a largura do balão.
// A largura máxima (a tela menos as margens) é do CSS; aqui ela só é lida.
export const MARGEM = 8;
export const FOLGA = 8;

export function posicionarBalao({ ancora, balao, janela, margem = MARGEM, folga = FOLGA }) {
    const cabeAbaixo = ancora.bottom + folga + balao.height + margem <= janela.height;
    const espacoAcima = ancora.top - folga - margem;
    const espacoAbaixo = janela.height - ancora.bottom - folga - margem;
    const lado = cabeAbaixo || espacoAbaixo >= espacoAcima ? "abaixo" : "acima";

    let top = lado === "abaixo" ? ancora.bottom + folga : ancora.top - folga - balao.height;
    top = Math.max(margem, Math.min(top, janela.height - balao.height - margem));

    const maxLeft = janela.width - balao.width - margem;
    const left = Math.max(margem, Math.min(ancora.left, maxLeft));

    return { top: Math.round(top), left: Math.round(left), lado };
}

// O que cada gesto faz com o balão. Também pura, pelo mesmo motivo.
//   alternar: o próprio botão (clique, Enter, Espaço);
//   esc:      fecha e devolve o foco ao botão;
//   fora:     clique fora do botão e do balão, fecha sem mexer no foco.
export function proximoEstado(aberto, gesto) {
    switch (gesto) {
        case "alternar": return { aberto: !aberto, focarBotao: false };
        case "esc": return { aberto: false, focarBotao: aberto };
        case "fora": return { aberto: false, focarBotao: false };
        default: return { aberto, focarBotao: false };
    }
}
