import Installment from "../models/Installment.js";
import { recalcularStatusInstallment } from "./paymentService.js";
import { ORIGEM_STATUS } from "./statusHistory.js";
import { hojeNoEscritorio, inicioDoDiaUTC } from "../utils/dataDeCalendario.js";
import { logError } from "../utils/logError.js";

// ═══════════════════════════════════════════════════════════════════════════
// O STATUS "vencido" GRAVADO ANTES DE LER — Fase 4a3 (DEC-174)
//
// O status da parcela é derivado na GRAVAÇÃO (`definirStatusInstallment`, em
// `paymentService.js`). Uma parcela `pendente` cujo vencimento passa sem que
// ninguém mexa no honorário continuava `pendente` no banco — e o Início
// ("Parcelas vencidas"), o sino, os filtros do Financeiro e a Agenda contavam
// o que estava gravado. Era a causa 3 da investigação da 4a2 (opção B).
//
// Antes das leituras que dependem do status, este passo grava como `vencido`
// as parcelas `pendente` da advogada da sessão cujo vencimento já passou:
//
//   • "já passou" é DATA DE CALENDÁRIO no fuso do escritório: vencimento
//     anterior a hoje em `America/Sao_Paulo`. No dia do vencimento a parcela
//     continua `pendente`; vence à meia-noite de Brasília;
//   • só `pendente` entra: `parcial` continua parcial (o dinheiro recebido
//     diz mais que a data), `pago` e `cancelado` não são tocados;
//   • a gravação é a cadeia de SEMPRE — `recalcularStatusInstallment`, origem
//     `recalculo` —, uma parcela por vez. Não há segunda fórmula: o que esta
//     varredura grava é exatamente o que o próximo recálculo gravaria, e o
//     honorário é recalculado junto, com o mesmo registro no `historicoStatus`
//     que uma mudança comum deixaria;
//   • escopo: só as parcelas da advogada da sessão (`usuarioId`).
//
// ── O freio de 10 minutos ────────────────────────────────────────────────
// A varredura roda no máximo uma vez a cada 10 minutos por advogada. O Início
// dispara várias leituras ao mesmo tempo; a primeira faz o trabalho e as
// outras esperam a MESMA promessa, em vez de varrer em paralelo. O freio é da
// memória do processo: num reinício (o Render gratuito hiberna), a primeira
// leitura varre de novo — que é o comportamento desejado.
//
// Se a varredura falhar, a leitura segue com o que está gravado (o erro vai
// para o log): uma manutenção não derruba a tela que a pediu.
// ═══════════════════════════════════════════════════════════════════════════

export const FREIO_MS = 10 * 60 * 1000;

const ultimaVarredura = new Map(); // usuarioId → { em: number, promessa }

// As parcelas que esta varredura gravaria agora. Exportada para os testes.
export const filtroDeVencidasPendentes = (usuarioId, agora = new Date()) => ({
  usuarioId,
  ativo: true,
  status: "pendente",
  // Meia-noite UTC do dia de hoje no escritório: o vencimento é gravado como
  // meia-noite UTC da data, então `$lt` deixa de fora o próprio dia.
  dataVencimento: { $lt: inicioDoDiaUTC(hojeNoEscritorio(agora)) }
});

const varrer = async (usuarioId, agora) => {
  const parcelas = await Installment.find(filtroDeVencidasPendentes(usuarioId, agora))
    .select("_id")
    .lean();
  for (const p of parcelas) {
    await recalcularStatusInstallment(p._id, usuarioId, ORIGEM_STATUS.RECALCULO, agora);
  }
  return parcelas.length;
};

// Devolve quantas parcelas foram gravadas como `vencido` (0 quando o freio
// segurou). `agora` e `forcar` existem para os testes.
export const marcarVencidas = async (usuarioId, { agora = new Date(), forcar = false } = {}) => {
  const chave = String(usuarioId);
  const anterior = ultimaVarredura.get(chave);
  if (!forcar && anterior && agora.getTime() - anterior.em < FREIO_MS) {
    await anterior.promessa.catch(() => {});
    return 0;
  }

  const promessa = varrer(usuarioId, agora);
  ultimaVarredura.set(chave, { em: agora.getTime(), promessa });
  try {
    return await promessa;
  } catch (error) {
    // A próxima leitura tenta de novo, sem esperar o freio.
    ultimaVarredura.delete(chave);
    throw error;
  }
};

// Só para os testes: esquece os freios.
export const esquecerFreios = () => ultimaVarredura.clear();

// O middleware das leituras que dependem do status. Vai DEPOIS do
// `authMiddleware` (precisa de `req.user`).
export const atualizarVencidas = async (req, res, next) => {
  try {
    if (req.user?._id) await marcarVencidas(req.user._id);
  } catch (error) {
    logError(error, req, 500);
  }
  return next();
};

export default { marcarVencidas, atualizarVencidas, filtroDeVencidasPendentes, esquecerFreios, FREIO_MS };
