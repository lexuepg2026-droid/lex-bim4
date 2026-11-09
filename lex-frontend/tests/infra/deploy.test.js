// ═══════════════════════════════════════════════════════════════════════════
// D-1 — O QUE O DEPLOY PRECISA QUE ESTEJA ESCRITO (frontend)
//
// Adaptado na fase R1 (DEC-168) para o front da Raniele dentro do monorepo
// lex-bim4: o RAIZ é calculado aqui (o helper antigo lia a estrutura do front
// LEX), e o render.yaml passou para a raiz do monorepo (DEC-061).
//
// A fase não muda comportamento: ela faz o repositório rodar fora do
// `localhost`. O que dá para travar aqui é o que só apareceria depois de
// publicado — o endereço de desenvolvimento viajando dentro do bundle, a
// variável que ninguém configurou, e a versão de Node que o hospedeiro
// escolheria por nós.
// ═══════════════════════════════════════════════════════════════════════════

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MONOREPO = resolve(RAIZ, "..");

const ler = (relativo) => readFileSync(resolve(RAIZ, relativo), "utf8");

const arquivosFonte = (dir = resolve(RAIZ, "src"), acc = []) => {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivosFonte(caminho, acc);
    else if (/\.jsx?$/.test(nome)) acc.push(caminho);
  }
  return acc;
};

describe("D-1 — o modelo de variáveis do build de produção", () => {
  const CAMINHO = ".env.production.example";

  test("o arquivo existe e lista TODA variável `VITE_` que o código lê", () => {
    assert.ok(existsSync(resolve(RAIZ, CAMINHO)), `falta ${CAMINHO}`);
    const modelo = ler(CAMINHO);

    const lidas = new Set();
    for (const arquivo of arquivosFonte()) {
      const codigo = readFileSync(arquivo, "utf8");
      for (const m of codigo.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]+)/g)) lidas.add(m[1]);
    }
    // `vite.config.js` também lê variável — é lá que mora a guarda de build.
    for (const m of ler("vite.config.js").matchAll(/(VITE_[A-Z0-9_]+)/g)) lidas.add(m[1]);

    const ausentes = [...lidas].filter((nome) => !modelo.includes(nome)).sort();
    assert.deepEqual(
      ausentes, [],
      `o código lê estas variáveis e o modelo não as menciona: ${ausentes.join(", ")}`
    );
  });

  test("`VITE_API_URL` de produção é um CAMINHO relativo — é isso que o rewrite exige", () => {
    // Uma URL absoluta de outro domínio aqui faria o cookie `lex-token` virar
    // cross-site, e ele passaria a exigir `SameSite=None; Secure` — que parte
    // dos navegadores e dos bloqueadores recusa. Ver DEC-061.
    const linha = ler(CAMINHO).split("\n").find((l) => l.startsWith("VITE_API_URL="));
    assert.ok(linha, "o modelo precisa trazer a chave, com valor");

    const valor = linha.split("=").slice(1).join("=").trim();
    assert.equal(
      valor, "/api",
      `VITE_API_URL do modelo de produção é "${valor}" — precisa ser o caminho relativo /api`
    );
  });

  test("o `.env.example` de desenvolvimento continua apontando para o localhost", () => {
    // Os dois modelos existem para ambientes diferentes, e trocar um pelo
    // outro quebra o outro lado: `/api` em desenvolvimento chamaria o próprio
    // Vite, que não tem API nenhuma.
    assert.match(ler(".env.example"), /VITE_API_URL=http:\/\/localhost:3001\/api/);
  });
});

describe("D-1 — a guarda do build continua valendo (passo 148)", () => {
  const config = ler("vite.config.js").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

  test("o build de produção aborta com a variável VAZIA", () => {
    // A mudança para caminho relativo não pode ter afrouxado a checagem: o que
    // ela recusa é a AUSÊNCIA, e `/api` é um valor tão presente quanto uma URL.
    assert.match(config, /url\s*===\s*['"]{2}/, "a guarda precisa testar a string vazia");
    assert.match(config, /throw new Error/, "faltando a variável, o build ABORTA");
  });

  test("a guarda não exige que o valor seja uma URL absoluta", () => {
    // Se alguém acrescentar `startsWith("http")` aqui, o deploy desta fase
    // para de buildar — e o erro vai parecer um problema de configuração.
    assert.ok(
      !/startsWith\(\s*['"]http/.test(config),
      "a guarda passou a exigir URL absoluta — o valor de produção é `/api`, um caminho"
    );
  });
});

describe("D-1 — o endereço de desenvolvimento não sobrevive ao build", () => {
  const assets = resolve(RAIZ, "dist");

  test("nenhum `localhost` COM PORTA em dist/", (t) => {
    if (!existsSync(assets)) {
      // `skip` explícito, e não passar em silêncio: sem `dist/` esta é a
      // verificação que não foi feita.
      t.skip("dist/ não existe — rode `VITE_API_URL=/api npm run build`");
      return;
    }

    // ── Por que "com porta", e não `localhost` cru ────────────────────────
    //
    // O alvo é o endereço de desenvolvimento DESTE projeto: `localhost:3001`
    // (API), `localhost:5173` (Vite) e `localhost:4173` (preview). Ele é o que
    // faria o deploy subir e falhar em toda requisição.
    //
    // `localhost` CRU sobrevive ao build, e não é nosso: `react-router` usa
    // `"http://localhost"` como base ao construir URLs quando não há
    // `window.location`, e o `axios` faz o mesmo para decidir se está num
    // navegador. Nos dois casos o valor real vem de `window.location` quando
    // ele existe — em produção, existe. Exigir zero ocorrências obrigaria a
    // remendar dependência de terceiro para satisfazer um `grep`.
    const arquivos = [];
    const varrer = (dir) => {
      for (const nome of readdirSync(dir)) {
        const caminho = join(dir, nome);
        if (statSync(caminho).isDirectory()) varrer(caminho);
        else arquivos.push(caminho);
      }
    };
    varrer(assets);

    const ofensores = [];
    for (const caminho of arquivos) {
      const conteudo = readFileSync(caminho, "utf8");
      for (const m of conteudo.matchAll(/localhost:(\d+)/g)) {
        ofensores.push(`${caminho.replace(`${RAIZ}/`, "")} → localhost:${m[1]}`);
      }
    }

    assert.deepEqual(
      ofensores, [],
      "o endereço de desenvolvimento entrou no bundle publicado:\n" + ofensores.join("\n")
    );
  });
});

describe("D-1 — a versão do Node é DECLARADA, e com teto", () => {
  const pkg = JSON.parse(ler("package.json"));

  test("`engines.node` existe e tem limite superior", () => {
    // O Render usa a versão DELE quando o repositório não declara nenhuma —
    // hoje a série 24 —, e a documentação dele pede explicitamente um teto:
    // faixa aberta resolve para o `latest`, que muda de major sozinho. O build
    // do frontend roda no Node do hospedeiro tanto quanto o backend.
    assert.ok(pkg.engines?.node, "sem `engines.node`, o hospedeiro escolhe por nós");
    assert.match(pkg.engines.node, /</, `"${pkg.engines.node}" não tem teto`);
  });

  test("a faixa aceita a versão em que a suíte roda", () => {
    const [major] = process.versions.node.split(".").map(Number);
    const min = Number(pkg.engines.node.match(/>=\s*(\d+)/)?.[1]);
    const max = Number(pkg.engines.node.match(/<\s*(\d+)/)?.[1]);
    assert.ok(major >= min && major < max, `Node ${process.versions.node} fora de "${pkg.engines.node}"`);
  });
});

describe("DEC-061 (monorepo) — o render.yaml da raiz", () => {
  const caminho = resolve(MONOREPO, "render.yaml");
  const yaml = existsSync(caminho) ? readFileSync(caminho, "utf8") : "";
  // Os blocos de cada serviço, sem parser de YAML (nenhuma dependência nova):
  // o texto entre um "  - type:" de serviço (2 espaços) e o próximo. As regras
  // de rewrite também são "- type:", mas mais indentadas, e ficam dentro do bloco.
  const servicos = yaml.split(/\n {2}- type:/).slice(1);
  const servico = (nome) => servicos.find((b) => new RegExp(`name:\\s*${nome}\\b`).test(b)) ?? "";

  test("existe na raiz do monorepo", () => {
    assert.ok(existsSync(caminho), "falta render.yaml na raiz do lex-bim4");
  });

  test("os dois serviços, com os nomes reais e o rootDir de cada um", () => {
    assert.match(servico("lex-uepg-api"), /rootDir:\s*lex-backend\b/);
    assert.match(servico("lex-uepg-app"), /rootDir:\s*lex-frontend\b/);
  });

  test("o back: npm ci, npm start e as variáveis que o código lê", () => {
    const api = servico("lex-uepg-api");
    assert.match(api, /buildCommand:\s*npm ci\s*$/m);
    assert.match(api, /startCommand:\s*npm start/);
    for (const chave of ["NODE_ENV", "MONGO_URI", "JWT_SECRET", "JWT_PORTAL_SECRET", "CORS_ORIGIN", "APP_URL",
      "EMAIL_PROVIDER", "EMAIL_API_KEY", "EMAIL_FROM", "EMAIL_FROM_NAME"]) {
      assert.match(api, new RegExp(`key:\\s*${chave}\\b`), `falta a variável ${chave}`);
    }
  });

  test("nenhum segredo com valor no render.yaml: só nomes, com sync: false", () => {
    for (const chave of ["MONGO_URI", "JWT_SECRET", "JWT_PORTAL_SECRET", "EMAIL_API_KEY"]) {
      const bloco = yaml.match(new RegExp(`key:\\s*${chave}\\b[^\\n]*\\n([^\\n]*)`))?.[1] ?? "";
      assert.match(bloco, /sync:\s*false/, `${chave} precisa vir com sync: false, sem valor`);
    }
    assert.ok(!/mongodb(\+srv)?:\/\//.test(yaml), "uma URI de banco no render.yaml");
  });

  test("o front: build, dist, VITE_API_URL=/api, o rewrite de /api e a regra de SPA", () => {
    const app = servico("lex-uepg-app");
    assert.match(app, /buildCommand:\s*npm ci && npm run build/);
    assert.match(app, /staticPublishPath:\s*\.\/dist/);
    assert.match(app, /key:\s*VITE_API_URL\s*\n\s*value:\s*\/api\s*$/m);
    assert.match(app, /source:\s*\/api\/\*\s*\n\s*destination:\s*https:\/\/lex-uepg-api\.onrender\.com\/api\/\*/);
    assert.match(app, /source:\s*\/\*\s*\n\s*destination:\s*\/index\.html/);
    // A ordem importa: o rewrite de /api vem antes do /* da SPA.
    assert.ok(app.indexOf("/api/*") < app.indexOf("/index.html"), "o /* da SPA engoliria o /api");
  });
});
