// "Precisa de atenção" na Home (fase R3): o prazo por datas de calendário
// (DEC-165), e a linha com processo, cliente e link (DEC-164).
//
// Adaptado de tests/regressions/fase4a2.test.js e fase31.test.js do front LEX.
// Roda em qualquer fuso: `npm test` usa o do sistema, e a suíte também é
// conferida com TZ=America/Sao_Paulo e TZ=UTC (o defeito era de fuso).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { dataDeCalendario, hojeLocal, diaLocalDaquiA, diasAteOVencimento, prazoDaParcela, venceAte } from "../src/utils/datas.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// "Agora" = 09/11/2026 às 23 h no relógio do navegador. É a hora em que a conta
// antiga mais errava em Brasília: meia-noite UTC do vencimento cai às 21 h do
// dia anterior.
const AGORA = new Date(2026, 10, 9, 23, 0, 0);
const UTC = (data) => `${data}T00:00:00.000Z`;

describe("DEC-165 — o prazo por datas de calendário", () => {
  test("lê a data do vencimento pelos dez primeiros caracteres", () => {
    assert.equal(dataDeCalendario("2026-11-11T00:00:00.000Z"), "2026-11-11");
    assert.equal(dataDeCalendario("2026-11-11"), "2026-11-11");
    assert.equal(dataDeCalendario(""), null);
    assert.equal(dataDeCalendario(null), null);
  });

  test("hoje e daqui a 7 dias, no relógio do navegador", () => {
    assert.equal(hojeLocal(AGORA), "2026-11-09");
    assert.equal(diaLocalDaquiA(7, AGORA), "2026-11-16");
  });

  test("os casos que a auditoria reproduziu em Brasília", () => {
    // Na tela: a parcela de 11/11 saía "Vence amanhã", e a de 14/11, "em 4 dias".
    assert.equal(prazoDaParcela(UTC("2026-11-11"), AGORA), "Vence em 2 dias");
    assert.equal(prazoDaParcela(UTC("2026-11-14"), AGORA), "Vence em 5 dias");
  });

  test("hoje, amanhã, ontem e o vencido há muito tempo", () => {
    assert.equal(prazoDaParcela(UTC("2026-11-09"), AGORA), "Vence hoje");
    assert.equal(prazoDaParcela(UTC("2026-11-10"), AGORA), "Vence amanhã");
    assert.equal(prazoDaParcela(UTC("2026-11-08"), AGORA), "Venceu ontem");
    assert.equal(prazoDaParcela(UTC("2026-10-09"), AGORA), "Venceu há 31 dias");
    assert.equal(prazoDaParcela("", AGORA), "");
  });

  test("a virada do mês e do ano", () => {
    const fimDoAno = new Date(2026, 11, 31, 22, 0, 0);
    assert.equal(diasAteOVencimento(UTC("2027-01-01"), fimDoAno), 1);
    assert.equal(diasAteOVencimento(UTC("2026-12-01"), fimDoAno), -30);
  });

  test("o recorte dos 7 dias inclui as vencidas e para no sétimo dia", () => {
    assert.equal(venceAte(UTC("2026-11-16"), 7, AGORA), true);
    assert.equal(venceAte(UTC("2026-11-17"), 7, AGORA), false);
    assert.equal(venceAte(UTC("2026-10-01"), 7, AGORA), true);
    assert.equal(venceAte(null, 7, AGORA), false);
  });
});

describe("DEC-164 — a linha de \"Precisa de atenção\"", () => {
  const home = readFileSync(resolve(RAIZ, "src/pages/PortalAdvogada/Home/Home.jsx"), "utf8");

  test("a Home usa as datas de calendário, e não mais new Date(dataVencimento)", () => {
    assert.match(home, /prazoDaParcela\(parcela\.dataVencimento\)/);
    assert.match(home, /venceAte\(parcela\.dataVencimento, 7\)/);
    assert.ok(!/new Date\(parcela\.dataVencimento\)/.test(home), "voltou a leitura no fuso do navegador");
    assert.ok(!/const rotuloDeVencimento/.test(home), "a conta antiga voltou");
  });

  test("a linha inteira é um link para o processo da parcela", () => {
    assert.match(home, /<Link to=\{rotaDaParcela\(parcela\)\} className="homeItemLinkParcela">/);
    assert.match(home, /`\/processos\/detalhes\/\$\{processoId\}`/);
  });

  test("a linha diz processo e cliente", () => {
    assert.match(home, /processo\.clientePrincipalNome/);
    assert.match(home, /\{contextoDaParcela\(parcela\)\}/);
  });
});
