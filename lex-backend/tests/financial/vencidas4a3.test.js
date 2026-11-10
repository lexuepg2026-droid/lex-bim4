// ═══════════════════════════════════════════════════════════════════════════
// FASE 4a3 — o status "vencido" gravado antes das leituras (DEC-174)
//
// Uma parcela `pendente` cujo vencimento passa sem nenhuma gravação ficava
// `pendente` no banco, e o Início, o sino, o Financeiro e a Agenda contavam
// errado. Agora, antes dessas leituras, `marcarVencidas` grava `vencido` nas
// pendentes da advogada da sessão cujo vencimento já passou — por data de
// calendário em `America/Sao_Paulo`, com freio de 10 minutos por advogada.
// ═══════════════════════════════════════════════════════════════════════════

import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { subirApp, derrubarApp } from "../helpers/server.js";
import { limparColecoes, desconectar } from "../helpers/db.js";
import {
  registrarUsuario, criarProcesso, criarClientePF, criarHonorario, criarParcela, criarPagamento, esperado
} from "../helpers/setup.js";
import Installment from "../../src/models/Installment.js";
import Fee from "../../src/models/Fee.js";
import { marcarVencidas, esquecerFreios, FREIO_MS } from "../../src/services/vencimentoService.js";
import { definirStatusInstallment } from "../../src/services/paymentService.js";

const statusDe = async (parcela) => (await Installment.findById(parcela._id).lean()).status;
const idDe = (api) => api.usuario.id ?? api.usuario._id;

// Instantes em UTC; Brasília é UTC−3 (sem horário de verão desde 2019).
const BRT = (dataHora) => new Date(`${dataHora}-03:00`);

describe("Fase 4a3 — o vencido gravado antes de ler (DEC-174)", () => {
  let adv;
  let outra;
  let fee;
  let feeOutra;
  let numero = 0;

  // Uma parcela que vence em 15/12/2026 — no futuro quando é criada, então
  // nasce `pendente`. O relógio injetado em `marcarVencidas` faz o tempo passar.
  const parcelaDe = async (api = adv, honorario = fee, extra = {}) =>
    criarParcela(api, honorario._id, ++numero, { valor: 1000, dataVencimento: "2026-12-15", ...extra });

  before(async () => {
    await subirApp();
    await limparColecoes();
    adv = await registrarUsuario("advogada do vencimento");
    outra = await registrarUsuario("outra advogada");

    const cliente = await criarClientePF(adv, { nomeCompleto: "Cliente Vencimento" });
    const processo = await criarProcesso(adv, [{ clienteId: cliente._id, papel: "autor", principal: true }]);
    fee = await criarHonorario(adv, processo._id, { valor: 100000, descricao: "Honorário do vencimento" });

    const clienteOutra = await criarClientePF(outra, { nomeCompleto: "Cliente da Outra" });
    const processoOutra = await criarProcesso(outra, [{ clienteId: clienteOutra._id, papel: "autor", principal: true }]);
    feeOutra = await criarHonorario(outra, processoOutra._id, { valor: 100000, descricao: "Honorário da outra" });
  });

  beforeEach(() => esquecerFreios());

  after(async () => {
    await derrubarApp();
    await desconectar();
  });

  test("no próprio dia do vencimento continua pendente; no dia seguinte vira vencida", async () => {
    const p = await parcelaDe();
    assert.equal(p.status, "pendente");

    assert.equal(await marcarVencidas(idDe(adv), { agora: BRT("2026-12-15T10:00:00"), forcar: true }), 0);
    assert.equal(await statusDe(p), "pendente", "15/12 às 10h: vence hoje, não venceu");

    assert.equal(await marcarVencidas(idDe(adv), { agora: BRT("2026-12-15T23:59:00"), forcar: true }), 0);
    assert.equal(await statusDe(p), "pendente", "15/12 às 23h59");

    assert.equal(await marcarVencidas(idDe(adv), { agora: BRT("2026-12-16T00:00:00"), forcar: true }), 1);
    assert.equal(await statusDe(p), "vencido", "16/12 à meia-noite");
  });

  test("a meia-noite que conta é a de Brasília, não a de UTC", async () => {
    const p = await parcelaDe();
    // 16/12 às 00h30 UTC ainda é 15/12 às 21h30 em Brasília.
    await marcarVencidas(idDe(adv), { agora: new Date("2026-12-16T00:30:00Z"), forcar: true });
    assert.equal(await statusDe(p), "pendente", "já é 16/12 em UTC, mas ainda é 15/12 em Brasília");

    // 16/12 às 03h00 UTC é meia-noite de 16/12 em Brasília.
    await marcarVencidas(idDe(adv), { agora: new Date("2026-12-16T03:00:00Z"), forcar: true });
    assert.equal(await statusDe(p), "vencido");
  });

  test("a regra do recálculo é a mesma: data de calendário em Brasília", () => {
    const parcela = { status: "pendente", valor: 1000, dataVencimento: new Date("2026-12-15T00:00:00Z") };
    assert.equal(definirStatusInstallment(parcela, 0, BRT("2026-12-15T08:00:00")), "pendente");
    assert.equal(definirStatusInstallment(parcela, 0, new Date("2026-12-16T02:59:00Z")), "pendente");
    assert.equal(definirStatusInstallment(parcela, 0, new Date("2026-12-16T03:00:00Z")), "vencido");
    assert.equal(definirStatusInstallment(parcela, 400, BRT("2026-12-20T08:00:00")), "parcial");
  });

  test("a parcela parcial continua parcial", async () => {
    const p = await parcelaDe(adv, fee, { dataVencimento: "2026-12-20" });
    // O pagamento é alocado na parcela vigente mais antiga; para ele cair só
    // nesta, as outras abertas do honorário ficam pagas antes.
    const abertas = await Installment.find({ feeId: fee._id, status: { $in: ["pendente", "vencido", "parcial"] } }).lean();
    const antes = abertas.filter((x) => String(x._id) !== String(p._id)).reduce((t, x) => t + (x.valor - (x.valorPago || 0)), 0);
    await criarPagamento(adv, fee._id, { valor: antes + 300, data: "2026-11-01" });
    assert.equal(await statusDe(p), "parcial");

    await marcarVencidas(idDe(adv), { agora: BRT("2027-01-10T09:00:00"), forcar: true });
    assert.equal(await statusDe(p), "parcial");
  });

  test("o freio: uma varredura a cada 10 minutos por advogada", async () => {
    const t0 = BRT("2027-02-01T09:00:00");
    const a = await parcelaDe(adv, fee, { dataVencimento: "2027-01-20" });
    assert.equal(await marcarVencidas(idDe(adv), { agora: t0 }), 1);
    assert.equal(await statusDe(a), "vencido");

    // Uma pendente nova, já vencida pelo relógio injetado.
    const b = await parcelaDe(adv, fee, { dataVencimento: "2027-01-25" });
    assert.equal(await marcarVencidas(idDe(adv), { agora: new Date(t0.getTime() + FREIO_MS - 1000) }), 0);
    assert.equal(await statusDe(b), "pendente", "dentro dos 10 minutos, o freio segura");

    assert.equal(await marcarVencidas(idDe(adv), { agora: new Date(t0.getTime() + FREIO_MS) }), 1);
    assert.equal(await statusDe(b), "vencido", "aos 10 minutos, varre de novo");
  });

  test("leituras ao mesmo tempo esperam a mesma varredura", async () => {
    const agora = BRT("2027-03-01T09:00:00");
    await parcelaDe(adv, fee, { dataVencimento: "2027-02-10" });
    const resultados = await Promise.all([1, 2, 3].map(() => marcarVencidas(idDe(adv), { agora })));
    assert.deepEqual(resultados.sort(), [0, 0, 1]);
  });

  test("isolamento: só as parcelas da advogada da sessão", async () => {
    const minha = await parcelaDe(adv, fee, { dataVencimento: "2027-03-05" });
    const dela = await parcelaDe(outra, feeOutra, { dataVencimento: "2027-03-05" });
    await marcarVencidas(idDe(adv), { agora: BRT("2027-04-01T09:00:00"), forcar: true });
    assert.equal(await statusDe(minha), "vencido");
    assert.equal(await statusDe(dela), "pendente", "a da outra advogada não é tocada");

    // E o freio de uma não segura a outra.
    await marcarVencidas(idDe(outra), { agora: BRT("2027-04-01T09:01:00") });
    assert.equal(await statusDe(dela), "vencido");
  });

  test("pela API: o Início, o sino e o filtro do Financeiro contam a parcela que venceu sem gravação", async () => {
    // Uma advogada nova, para os números serem só os desta parcela.
    const api = await registrarUsuario("advogada da leitura");
    const cliente = await criarClientePF(api, { nomeCompleto: "Cliente da Leitura" });
    const processo = await criarProcesso(api, [{ clienteId: cliente._id, papel: "autor", principal: true }]);
    const honorario = await criarHonorario(api, processo._id, { valor: 1000, descricao: "Honorário da leitura" });
    const p = await criarParcela(api, honorario._id, 1, { valor: 1000, dataVencimento: "2099-01-10" });
    assert.equal(p.status, "pendente");
    const historicoAntes = (await Fee.findById(honorario._id).lean()).historicoStatus.length;

    // O tempo passou sem ninguém mexer no honorário: o vencimento ficou para
    // trás com o status gravado ainda `pendente` (o caso de produção).
    await Installment.updateOne({ _id: p._id }, { $set: { dataVencimento: new Date("2026-01-10T00:00:00Z") } });
    assert.equal(await statusDe(p), "pendente");

    const resumo = esperado(await api.get("/dashboard"), 200, "resumo do Início");
    assert.equal(resumo.parcelasVencidas, 1);
    assert.equal(await statusDe(p), "vencido");

    const avisos = esperado(await api.get("/calendar/avisos"), 200, "avisos do sino");
    assert.ok(JSON.stringify(avisos).includes(String(p._id)), "o sino lista a parcela vencida");

    const lista = esperado(await api.get("/installments?status=vencido"), 200, "filtro vencidas");
    assert.deepEqual(lista.data.map((x) => String(x._id)), [String(p._id)]);

    // O honorário continua `pendente` (nada recebido): a cadeia comum não
    // grava linha de histórico quando o status do honorário não muda.
    const feeDepois = await Fee.findById(honorario._id).lean();
    assert.equal(feeDepois.status, "pendente");
    assert.equal(feeDepois.historicoStatus.length, historicoAntes);
  });
});
