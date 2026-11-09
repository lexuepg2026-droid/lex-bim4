// ═══════════════════════════════════════════════════════════════════════════
// A TRAVA DE CONTRATO FRONT × BACK (fase R1, DEC-168)
//
// Três perguntas, respondidas lendo o código dos dois lados do monorepo:
//
//   1. toda chamada de `src/services/*` (e `src/api/*`) existe nas rotas do
//      back, com o mesmo método?
//   2. as enumerações que o front oferece (status, fase, tipo, forma) são
//      valores que o back aceita?
//   3. os valores dos FILTROS das listas (situação, liminar, portal, tipo de
//      pessoa, ordem) são os que o back aceita?
//
// A pergunta 3 nasceu de um defeito real: "Somente desativados" mandava
// `situacao=desativados`, o back só aceita ativos/inativos/todos, e o filtro
// devolvia 400 (auditoria de paridade, A.7). Pior ainda é o filtro que o back
// IGNORA em silêncio quando o valor é desconhecido (o de liminar): sem esta
// trava, um valor errado vira uma lista que não filtra, sem erro nenhum.
//
// O back é lido como TEXTO (rotas, listas `Object.freeze([...])`, `enum: [...]`)
// e não importado: importar os models e as rotas puxaria o mongoose e as
// variáveis de ambiente do back para dentro da suíte do front. Só os módulos de
// configuração puros (sem import nenhum) são importados.
// ═══════════════════════════════════════════════════════════════════════════

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BACK = resolve(RAIZ, "..", "lex-backend", "src");
const ler = (caminho) => readFileSync(caminho, "utf8");
const importarBack = (relativo) => import(pathToFileURL(resolve(BACK, relativo)).href);

// ── Leitura do back como texto ────────────────────────────────────────────

const strings = (trecho) => [...trecho.matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);

// `export const NOME = Object.freeze([ "a", "b" ])` → ["a", "b"]
const listaCongelada = (relativo, nome) => {
  const texto = ler(resolve(BACK, relativo));
  const m = texto.match(new RegExp(`export const ${nome}\\s*=\\s*Object\\.freeze\\(\\s*\\[([^\\]]*)\\]`));
  assert.ok(m, `não achei ${nome} em ${relativo}`);
  return strings(m[1]);
};

// `export const NOME = Object.freeze({ PF: "fisica", ... })` → ["PF", ...]
const chavesCongeladas = (relativo, nome) => {
  const texto = ler(resolve(BACK, relativo));
  const m = texto.match(new RegExp(`export const ${nome}\\s*=\\s*Object\\.freeze\\(\\s*\\{([^}]*)\\}`));
  assert.ok(m, `não achei ${nome} em ${relativo}`);
  return [...m[1].matchAll(/([A-Za-z_]\w*)\s*:/g)].map((x) => x[1]);
};

// O primeiro `enum: [ ... ]` depois de `campo: {` num model.
const enumDoModel = (relativo, campo) => {
  const texto = ler(resolve(BACK, relativo));
  const ini = texto.search(new RegExp(`\\n\\s*${campo}:\\s*\\{`));
  assert.ok(ini >= 0, `não achei o campo ${campo} em ${relativo}`);
  const m = texto.slice(ini).match(/enum:\s*\[([^\]]*)\]/);
  assert.ok(m, `o campo ${campo} de ${relativo} não tem enum literal`);
  return strings(m[1]);
};

// As rotas: `app.use("/api/x", xRoutes)` + `import xRoutes from "./routes/x.js"`
// + `router.metodo("/caminho", ...)` em cada arquivo de rotas.
const rotasDoBack = () => {
  const app = ler(resolve(BACK, "app.js"));
  const modulos = Object.fromEntries(
    [...app.matchAll(/import\s+(\w+)\s+from\s+["']\.\/(routes\/[^"']+)["']/g)].map((m) => [m[1], m[2]])
  );
  const rotas = new Set();
  for (const [, prefixo, nome] of app.matchAll(/app\.use\(\s*["'](\/api\/[^"']+)["']\s*,\s*(\w+)\s*\)/g)) {
    assert.ok(modulos[nome], `app.js monta ${nome}, mas não achei o import dele`);
    const texto = ler(resolve(BACK, modulos[nome]));
    for (const [, metodo, caminho] of texto.matchAll(/router\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/g)) {
      const completo = (prefixo + (caminho === "/" ? "" : caminho)).replace(/^\/api/, "");
      rotas.add(`${metodo.toUpperCase()} ${normalizar(completo)}`);
    }
  }
  return rotas;
};

// `/clients/:id/x` e `/clients/${id}/x` ficam iguais: `/clients/:p/x`.
const normalizar = (caminho) => caminho.replace(/\$\{[^}]+\}/g, ":p").replace(/:[A-Za-z_]\w*/g, ":p").replace(/\/$/, "") || "/";

// ── Leitura do front ──────────────────────────────────────────────────────

const chamadasDoFront = () => {
  const chamadas = new Map();
  for (const pasta of ["services", "api"]) {
    const dir = resolve(RAIZ, "src", pasta);
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir).filter((n) => n.endsWith(".js"))) {
      const texto = ler(join(dir, nome));
      for (const [, metodo, caminho] of texto.matchAll(/\b(?:api|portalApi)\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"?]+)/g)) {
        chamadas.set(`${metodo.toUpperCase()} ${normalizar(caminho)}`, `src/${pasta}/${nome}`);
      }
    }
  }
  return chamadas;
};

// Os valores das <option> do <select> cujo onChange chama `setter`, numa página.
const opcoesDoFiltro = (pagina, setter) => {
  const texto = ler(resolve(RAIZ, "src/pages/PortalAdvogada", pagina));
  const valores = [];
  for (const [bloco] of texto.matchAll(/<select\b[\s\S]*?<\/select>/g)) {
    if (!new RegExp(`\\b${setter}\\(e\\.target\\.value\\)`).test(bloco)) continue;
    valores.push(...[...bloco.matchAll(/<option\s+value="([^"]*)"/g)].map((m) => m[1]));
  }
  return valores;
};

// ── 1. Rotas ──────────────────────────────────────────────────────────────

describe("contrato — toda chamada do front existe no back", () => {
  const rotas = rotasDoBack();
  const chamadas = chamadasDoFront();

  test("a leitura achou rotas e chamadas (contraprova contra regex podre)", () => {
    assert.ok(rotas.size >= 100, `só ${rotas.size} rotas lidas do back`);
    assert.ok(chamadas.size >= 90, `só ${chamadas.size} chamadas lidas do front`);
  });

  test("nenhuma chamada sem rota", () => {
    const sem = [...chamadas].filter(([chave]) => !rotas.has(chave)).map(([chave, arq]) => `${chave}  (${arq})`);
    assert.deepEqual(sem, [], `chamadas do front que o back não tem:\n${sem.join("\n")}`);
  });

  test("a comparação pega uma rota inexistente (contraprova)", () => {
    assert.ok(!rotas.has("GET /clients/:p/nao-existe"));
    assert.ok(rotas.has("PATCH /processes/:p/fase"));
  });
});

// ── 2. Enumerações ────────────────────────────────────────────────────────

describe("contrato — as enumerações do front são valores que o back aceita", async () => {
  const enums = await import(pathToFileURL(resolve(RAIZ, "src/utils/enums.js")).href);
  const { FASES_PROCESSO } = await importarBack("config/fasesProcesso.js");
  const { TIPOS_HONORARIO } = await importarBack("config/tiposHonorario.js");
  const valores = (opcoes) => opcoes.map((o) => o.value);
  const contido = (nome, front, back) => {
    const fora = front.filter((v) => !back.includes(v));
    assert.deepEqual(fora, [], `${nome}: o front oferece ${JSON.stringify(fora)}, que o back não aceita (${JSON.stringify(back)})`);
  };

  test("status do processo", () => contido("STATUS_PROCESSO_OPTIONS", valores(enums.STATUS_PROCESSO_OPTIONS), enumDoModel("models/Process.js", "status")));
  test("fase do processo", () => contido("FASE_PROCESSO_OPTIONS", valores(enums.FASE_PROCESSO_OPTIONS), [...FASES_PROCESSO]));
  test("tipo do honorário", () => contido("TIPO_HONORARIO_OPTIONS", valores(enums.TIPO_HONORARIO_OPTIONS), [...TIPOS_HONORARIO]));
  test("status do honorário", () => contido("STATUS_HONORARIO_OPTIONS", valores(enums.STATUS_HONORARIO_OPTIONS), listaCongelada("models/Fee.js", "STATUS_HONORARIO")));
  test("status da parcela", () => contido("STATUS_PARCELA_OPTIONS", valores(enums.STATUS_PARCELA_OPTIONS), enumDoModel("models/Installment.js", "status")));
  test("forma de pagamento", () => contido("FORMA_PAGAMENTO_OPTIONS", valores(enums.FORMA_PAGAMENTO_OPTIONS), listaCongelada("models/Payment.js", "FORMAS_PAGAMENTO")));
  test("tipo de pagamento", () => contido("TIPO_PAGAMENTO_OPTIONS", valores(enums.TIPO_PAGAMENTO_OPTIONS), listaCongelada("models/Payment.js", "TIPOS_PAGAMENTO")));
});

// ── 3. Valores dos filtros das listas ─────────────────────────────────────

describe("contrato — os valores dos filtros das listas são os que o back aceita", () => {
  const F = "utils/filtrosDeConsulta.js";
  const liminarAceito = [...ler(resolve(BACK, "services/processService.js")).matchAll(/liminar === "(\w+)"/g)].map((m) => m[1]);

  // [página, setter do <select>, o que o back aceita, de onde vem]
  const FILTROS = [
    ["Processos/Processos.jsx", "setFiltroSituacao", listaCongelada(F, "SITUACOES"), "SITUACOES"],
    ["Processos/Processos.jsx", "setFiltroLiminar", liminarAceito, "filtroLiminar (processService.js)"],
    ["Processos/Processos.jsx", "setFiltroPortal", listaCongelada(F, "PORTAIS"), "PORTAIS"],
    ["Clientes/Clientes.jsx", "setFiltroSituacao", listaCongelada(F, "SITUACOES"), "SITUACOES"],
    ["Clientes/Clientes.jsx", "setFiltroTipo", chavesCongeladas(F, "TIPOS_PESSOA_NA_QUERY"), "TIPOS_PESSOA_NA_QUERY"],
    ["Clientes/Clientes.jsx", "setFiltroPortal", listaCongelada(F, "PORTAIS_DO_CLIENTE"), "PORTAIS_DO_CLIENTE"],
    ["Clientes/Clientes.jsx", "setOrdem", listaCongelada(F, "ORDENACOES_CLIENTE"), "ORDENACOES_CLIENTE"],
  ];

  for (const [pagina, setter, aceitos, origem] of FILTROS) {
    test(`${pagina} — ${setter} só manda valores de ${origem}`, () => {
      const opcoes = opcoesDoFiltro(pagina, setter);
      assert.ok(opcoes.length > 0, `não achei o <select> de ${setter} em ${pagina}`);
      // "" é "sem filtro": o front não manda o parâmetro.
      const fora = opcoes.filter((v) => v !== "" && !aceitos.includes(v));
      assert.deepEqual(fora, [], `${pagina}: ${setter} oferece ${JSON.stringify(fora)}; o back aceita ${JSON.stringify(aceitos)}`);
    });
  }

  test("a conferência recusaria o valor antigo do defeito (contraprova)", () => {
    assert.ok(!listaCongelada(F, "SITUACOES").includes("desativados"));
    assert.deepEqual(liminarAceito.sort(), ["com", "sem"]);
  });
});
