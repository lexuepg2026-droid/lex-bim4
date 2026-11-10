// O que o número do sino soma (fase R6, DEC-174): o `aria-label` e o `title`
// dizem os grupos, para o número deixar de ser um total sem nome. Só as
// notificações ainda não lidas, as mesmas que o número conta.

const contar = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

const juntar = (partes) =>
    partes.length <= 1 ? partes.join("") : `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;

export const resumoDoSino = (naoLidos) => {
    if (!Array.isArray(naoLidos)) return "Notificações";
    const por = (grupo) => naoLidos.filter((item) => item.grupo === grupo).length;
    const hoje = por("Hoje");
    const atrasados = por("Atrasado");
    const vencidas = por("Parcela vencida");
    const partes = [];
    if (hoje) partes.push(contar(hoje, "compromisso de hoje", "compromissos de hoje"));
    if (atrasados) partes.push(contar(atrasados, "compromisso atrasado", "compromissos atrasados"));
    if (vencidas) partes.push(contar(vencidas, "parcela vencida", "parcelas vencidas"));
    return partes.length ? `Notificações: ${juntar(partes)}` : "Notificações: nada novo";
};

export default resumoDoSino;
