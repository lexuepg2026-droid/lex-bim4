// Reativar sem adivinhar (fase R3, DEC-052 reescrita), adaptado de
// tests/regressions/dec052.test.js do front LEX para as telas da Raniele.
//
//   - processo: a prévia (GET /processes/:id/activation-preview) vem ANTES do
//     modal, e a frase diz quantos vínculos voltam;
//   - cliente: NÃO consulta prévia (ele não cascateia); a frase diz que os
//     processos dele não voltam junto;
//   - compromisso: a Agenda mostra os desativados e reativa pelo popup
//     (PATCH /events/:id/reactivate), que o front LEX também não tinha.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { mensagemReativarProcesso } from "../src/utils/ativacaoProcesso.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (relativo) => readFileSync(resolve(RAIZ, relativo), "utf8");

describe("processo — a contagem vem antes da confirmação", () => {
  const codigo = ler("src/pages/PortalAdvogada/Processos/Processos.jsx");

  test("o modal de reativar abre depois da prévia do servidor", () => {
    const iReativar = codigo.indexOf("const confirmarReativacao");
    assert.ok(iReativar > 0, "não achei a função de reativar processo");
    const trecho = codigo.slice(iReativar, iReativar + 800);
    assert.match(trecho, /await processService\.getActivationPreview\(id\)/);
  });

  test("a frase diz quantos voltam, no singular e no plural, e não promete quem não existe", () => {
    assert.match(mensagemReativarProcesso(1), /1 participante/);
    assert.ok(!/participante\(s\)/.test(mensagemReativarProcesso(2)));
    assert.match(mensagemReativarProcesso(0), /Nenhum participante volta com ele/);
  });
});

describe("cliente — sem prévia, e a frase diz que os processos não voltam", () => {
  const codigo = ler("src/pages/PortalAdvogada/Clientes/Clientes.jsx");

  test("o modal de reativar cliente avisa que os processos não voltam junto", () => {
    assert.match(codigo, /titulo="Reativar cliente"/);
    assert.match(codigo, /Os processos dele não voltam junto/);
  });

  test("não consulta prévia: o cliente não cascateia (DEC-052)", () => {
    const iHandle = codigo.indexOf("const handleReativar");
    const trecho = codigo.slice(iHandle, iHandle + 600);
    assert.ok(!/activation-preview|getActivationPreview/.test(trecho));
    assert.match(trecho, /clientService\.reactivateClient\(id\)/);
  });
});

describe("compromisso — a Agenda mostra os desativados e reativa", () => {
  const servico = ler("src/services/eventService.js");
  const agenda = ler("src/pages/PortalAdvogada/Calendario/Calendario.jsx");

  test("o serviço lista por situação e reativa", () => {
    assert.match(servico, /const listEvents = \(params = \{\}\) => api\.get\('\/events', \{ params \}\)/);
    assert.match(servico, /const reactivateEvent = \(id\) => api\.patch\(`\/events\/\$\{id\}\/reactivate`\)/);
  });

  test("o seletor de situação tem o padrão de sempre e os desativados", () => {
    assert.match(agenda, /useState\("ativos"\)/);
    assert.match(agenda, /<option value="ativos">Somente ativos<\/option>/);
    assert.match(agenda, /<option value="inativos">Somente desativados<\/option>/);
  });

  test("os desativados vêm de GET /events?situacao=inativos, marcados", () => {
    assert.match(agenda, /buscarTudo\(eventService\.listEvents, \{ situacao: "inativos" \}\)/);
    assert.match(agenda, /desativado: true/);
  });

  test("no popup do desativado, só Reativar: sem Editar e sem Excluir", () => {
    assert.match(agenda, /eventoPopup\.item\.desativado \? null : eventoPopup\.item\.natureza === "evento"/);
    assert.match(agenda, /onClick=\{\(\) => reativarCompromisso\(eventoPopup\.item\._id\)\}/);
    assert.match(agenda, /className="buttonOutlined botaoReativar"/);
  });

  test("o erro do back (409 do processo desativado, DEC-053) aparece com a frase dele", () => {
    const i = agenda.indexOf("const reativarCompromisso");
    const trecho = agenda.slice(i, i + 700);
    assert.match(trecho, /toast\.error\(getApiErrorMessage\(err, /);
    assert.match(trecho, /buscarCalendario\(\)/);
  });
});
