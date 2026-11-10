// A ajuda ao usuário (DEC-172, fase R5): o botão "?" com balão, os textos de
// apoio ligados por aria-describedby e a página "Como usar".
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { posicionarBalao, proximoEstado, MARGEM } from "../src/components/Ajuda/posicao.js";
import { AJUDA, APOIO, COMO_USAR } from "../src/components/Ajuda/textos.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(RAIZ, "src");
const ler = (relativo) => readFileSync(resolve(RAIZ, relativo), "utf8");
const jsx = (dir = SRC, acc = []) => {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) jsx(caminho, acc);
    else if (nome.endsWith(".jsx")) acc.push(caminho);
  }
  return acc;
};
const ARQUIVOS = jsx().map((f) => ({ f: relative(SRC, f), codigo: readFileSync(f, "utf8") }));

describe("Ajuda — abrir, fechar e Esc", () => {
  test("o botão alterna: fechado abre, aberto fecha", () => {
    assert.deepEqual(proximoEstado(false, "alternar"), { aberto: true, focarBotao: false });
    assert.deepEqual(proximoEstado(true, "alternar"), { aberto: false, focarBotao: false });
  });

  test("Esc fecha e devolve o foco ao botão", () => {
    assert.deepEqual(proximoEstado(true, "esc"), { aberto: false, focarBotao: true });
  });

  test("Esc com o balão já fechado não rouba o foco", () => {
    assert.deepEqual(proximoEstado(false, "esc"), { aberto: false, focarBotao: false });
  });

  test("clique fora fecha sem mexer no foco", () => {
    assert.deepEqual(proximoEstado(true, "fora"), { aberto: false, focarBotao: false });
  });

  const comp = ler("src/components/Ajuda/Ajuda.jsx");

  test("o botão tem aria-label 'Ajuda: <assunto>', aria-expanded e aria-controls apontando o balão", () => {
    assert.match(comp, /aria-label=\{`Ajuda: \$\{assunto\}`\}/);
    assert.match(comp, /aria-expanded=\{aberto\}/);
    assert.match(comp, /aria-controls=\{id\}/);
    assert.match(comp, /id=\{id\}\s*\n\s*className="ajudaBalao"/);
  });

  test("é um <button type=button> (Enter e Espaço abrem sem código extra)", () => {
    assert.match(comp, /<button[\s\S]*?type="button"[\s\S]*?className="ajudaBotao"/);
  });

  test("o '?' guarda 1rem dentro dos contêineres dela que dão tamanho a todo 'button' (classe repetida, antes do :hover)", () => {
    const css = ler("src/components/Ajuda/Ajuda.css");
    const bloco = css.match(/\.ajudaBotao\.ajudaBotao \{([^}]*)\}/);
    assert.ok(bloco, "falta a regra .ajudaBotao.ajudaBotao");
    for (const decl of ["width: 1rem", "height: 1rem", "padding: 0", "min-width: 0"]) assert.ok(bloco[1].includes(decl), decl);
    assert.ok(css.indexOf(".ajudaBotao.ajudaBotao {") < css.indexOf(".ajudaBotao:hover"), "o :hover tem de vir depois");
    // os contêineres que motivaram a regra continuam com o "?" dentro
    assert.match(ler("src/pages/PortalAdvogada/Processos/ProcessosDetalhes.jsx"), /<Ajuda assunto=\{AJUDA\.processoParticipantes\.assunto\}/);
    assert.match(ler("src/pages/PortalAdvogada/Processos/Processos.css"), /\.formNovoParticipante button \{/);
  });

  test("o Esc é ouvido na captura e não se propaga (não fecha o modal junto)", () => {
    assert.match(comp, /addEventListener\("keydown", aoTeclar, true\)/);
    assert.match(comp, /e\.stopPropagation\(\);/);
  });

  test("o clique fora é ouvido no documento, e o balão fica fora da árvore do cartão (portal)", () => {
    assert.match(comp, /addEventListener\("pointerdown", aoTocarFora, true\)/);
    assert.match(comp, /createPortal\(/);
  });
});

describe("Ajuda — o balão nunca sai da tela", () => {
  const janela = { width: 1280, height: 800 };
  const balao = { width: 288, height: 120 };

  test("abaixo do botão, alinhado à esquerda dele, quando cabe", () => {
    const r = posicionarBalao({ ancora: { top: 100, bottom: 116, left: 200, right: 216 }, balao, janela });
    assert.deepEqual(r, { top: 124, left: 200, lado: "abaixo" });
  });

  test("vira para cima quando não cabe embaixo", () => {
    const r = posicionarBalao({ ancora: { top: 740, bottom: 756, left: 200, right: 216 }, balao, janela });
    assert.equal(r.lado, "acima");
    assert.equal(r.top, 740 - 8 - 120);
  });

  test("perto da borda direita, a esquerda é puxada para dentro", () => {
    const r = posicionarBalao({ ancora: { top: 100, bottom: 116, left: 1260, right: 1276 }, balao, janela });
    assert.equal(r.left, 1280 - 288 - MARGEM);
  });

  test("no celular (360 px), com o balão na largura máxima do CSS, ele fica entre as margens", () => {
    const cel = { width: 360, height: 740 };
    const largo = { width: 360 - 32, height: 160 };
    for (const left of [0, 100, 340]) {
      const r = posicionarBalao({ ancora: { top: 300, bottom: 316, left, right: left + 16 }, balao: largo, janela: cel });
      assert.ok(r.left >= MARGEM && r.left + largo.width <= cel.width - MARGEM, `left=${left} → ${r.left}`);
    }
  });

  test("o CSS limita a largura à tela menos as margens", () => {
    assert.match(ler("src/components/Ajuda/Ajuda.css"), /max-width: min\(18rem, calc\(100vw - 2rem\)\)/);
  });
});

describe("Ajuda — os textos", () => {
  const frases = (t) => t.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ"])/).filter(Boolean);

  // Exceção aprovada pelo Daniel na revisão dos textos: o "Resumo geral" é uma
  // lista de quatro definições curtas, uma por cartão ("Processos ativos: …").
  const LIMITE = { inicioResumo: 4 };

  for (const [chave, { assunto, texto }] of Object.entries(AJUDA)) {
    const limite = LIMITE[chave] ?? 3;
    test(`${chave}: até ${limite} frases e assunto em minúsculas`, () => {
      assert.ok(frases(texto).length <= limite, `${chave} tem ${frases(texto).length} frases`);
      assert.ok(assunto && assunto === assunto.toLowerCase(), chave);
    });
  }

  test("todo texto de balão é usado em alguma tela, e toda tela usa uma chave que existe", () => {
    const usadas = new Set();
    for (const { f, codigo } of ARQUIVOS) {
      for (const [, chave] of codigo.matchAll(/AJUDA\.(\w+)\.assunto/g)) {
        assert.ok(AJUDA[chave], `${f} usa AJUDA.${chave}, que não existe`);
        usadas.add(chave);
      }
    }
    const sobrando = Object.keys(AJUDA).filter((k) => !usadas.has(k));
    assert.deepEqual(sobrando, [], `textos sem tela: ${sobrando.join(", ")}`);
  });

  test("todo texto de apoio novo é usado", () => {
    const codigo = ARQUIVOS.map((a) => a.codigo).join("\n");
    for (const chave of Object.keys(APOIO)) assert.match(codigo, new RegExp(`APOIO\\.${chave}\\b`), chave);
  });

  test("'Como usar': os seis fluxos, de 4 a 8 linhas cada", () => {
    assert.deepEqual(COMO_USAR.map((s) => s.titulo), ["Clientes e portal", "Processos", "Financeiro", "Documentos", "Agenda", "Sem internet"]);
    for (const s of COMO_USAR) assert.ok(s.linhas.length >= 4 && s.linhas.length <= 8, `${s.titulo}: ${s.linhas.length}`);
  });

  test("'Como usar' é um item ao lado de 'Aparência', no mesmo menu", () => {
    const conf = ler("src/pages/PortalAdvogada/Configuracoes/Configuracoes.jsx");
    assert.match(conf, /\{ valor: "aparencia"[^\n]*\n\s*\{ valor: "como-usar", rotulo: "Como usar"/);
  });
});

describe("textos de apoio: todos ligados ao campo por aria-describedby", () => {
  test("todo id 'apoio-…' é apontado por um aria-describedby no mesmo arquivo, e vice-versa", () => {
    let total = 0;
    for (const { f, codigo } of ARQUIVOS) {
      const ids = [...codigo.matchAll(/\bid="(apoio-[\w-]+)"/g)].map((m) => m[1]);
      const refs = [...codigo.matchAll(/aria-describedby="(apoio-[\w-]+)"/g)].map((m) => m[1]);
      for (const id of ids) assert.ok(refs.includes(id), `${f}: o texto de apoio #${id} não está ligado a nenhum campo`);
      for (const ref of refs) assert.ok(ids.includes(ref), `${f}: aria-describedby="${ref}" aponta para um id que não existe`);
      assert.equal(new Set(ids).size, ids.length, `${f}: id de apoio repetido`);
      total += ids.length;
    }
    assert.ok(total >= 10, `esperava ao menos 10 textos de apoio ligados, achei ${total}`);
  });

  test("contraprova: a varredura acusa um texto de apoio solto", () => {
    const codigo = '<input /><small className="notaCampo" id="apoio-x">oi</small>';
    const ids = [...codigo.matchAll(/\bid="(apoio-[\w-]+)"/g)].map((m) => m[1]);
    const refs = [...codigo.matchAll(/aria-describedby="(apoio-[\w-]+)"/g)].map((m) => m[1]);
    assert.ok(ids.some((id) => !refs.includes(id)));
  });
});

describe("o ícone ajuda.svg segue o traço dos ícones dela", () => {
  test("mesma cor e espessura do relogio.svg (40×40, traço 3.5, #EDE3CF, pontas redondas)", () => {
    const icone = ler("src/assets/images/icons/ajuda.svg");
    const dela = ler("src/assets/images/icons/relogio.svg");
    for (const atributo of ['viewBox="0 0 40 40"', 'stroke="#EDE3CF"', 'stroke-width="3.5"', 'stroke-linecap="round"', 'stroke-linejoin="round"']) {
      assert.ok(dela.includes(atributo), `a referência mudou: ${atributo}`);
      assert.ok(icone.includes(atributo), `ajuda.svg sem ${atributo}`);
    }
  });
});
