// A guarda de resposta tardia (fase R2): useIsMounted em TextoFinal e MontagemModelo.
//
// Reproduzido na auditoria de paridade (B.2): regerar e ir para Clientes levava
// a advogada de volta ao documento 3 s depois; adicionar uma seção e sair
// mostrava o toast em Processos. O hook vem do front LEX (fase 4.4), com o teste
// da sentinela que pegou o defeito do StrictMode.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { simularSentinela } from "../src/hooks/useIsMounted.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (relativo) => readFileSync(resolve(RAIZ, relativo), "utf8");

describe("useIsMounted — o ciclo de vida", () => {
  test("a sentinela sobrevive ao monta-desmonta-monta do StrictMode", () => {
    const { ref, efeito } = simularSentinela();
    assert.equal(ref.current, true, "render inicial");
    const limpar1 = efeito();
    assert.equal(ref.current, true, "depois do primeiro efeito");
    limpar1();
    assert.equal(ref.current, false, "a limpeza nega a montagem");
    efeito();
    assert.equal(ref.current, true, "a remontagem do StrictMode precisa voltar a true");
  });

  test("o desmonte de verdade continua negando a montagem", () => {
    const { ref, efeito } = simularSentinela();
    efeito()();
    assert.equal(ref.current, false);
  });
});

// Em cada tela: a função assíncrona que navega, mostra toast ou muda estado
// depois de um await precisa conferir a montagem antes. A varredura olha o
// texto entre cada `await` e o primeiro navigate/toast/set que vem depois.
const semGuardaDepoisDoAwait = (codigo) => {
  const ofensas = [];
  for (const m of codigo.matchAll(/await [^;]+;/g)) {
    const resto = codigo.slice(m.index + m[0].length, m.index + m[0].length + 400);
    const acao = resto.search(/\b(navigate\(|toast\.|set[A-Z]\w*\()/);
    if (acao < 0) continue;
    const antes = resto.slice(0, acao);
    // Outro await no meio: a guarda pertence a ele.
    if (/\bawait\b/.test(antes)) continue;
    if (!/if \(!montado\.current\) return;/.test(antes)) ofensas.push(m[0].slice(0, 80));
  }
  return ofensas;
};

describe("as telas da regeração e da montagem conferem a montagem depois do await", () => {
  for (const tela of ["src/pages/PortalAdvogada/Documentos/TextoFinal.jsx", "src/pages/PortalAdvogada/Documentos/MontagemModelo.jsx"]) {
    test(`${tela}: usa o hook`, () => {
      const codigo = ler(tela);
      assert.match(codigo, /import useIsMounted from "\.\.\/\.\.\/\.\.\/hooks\/useIsMounted"/);
      assert.match(codigo, /const montado = useIsMounted\(\);/);
    });

    test(`${tela}: nenhuma ação depois de await sem a guarda`, () => {
      // O efeito de carga tem a guarda própria (let ativo), e fica de fora:
      // ele termina em `return () => { ativo = false; }`.
      const codigo = ler(tela).replace(/useEffect\(\(\) => \{\s*let ativo = true;[\s\S]*?return \(\) => \{ ativo = false; \};\s*\}, \[[^\]]*\]\);/g, "");
      assert.deepEqual(semGuardaDepoisDoAwait(codigo), []);
    });

    test(`${tela}: o catch confere a montagem antes de avisar`, () => {
      const codigo = ler(tela);
      const catches = [...codigo.matchAll(/\} catch \(err\) \{\n(.*)\n/g)];
      assert.ok(catches.length > 0);
      for (const [, primeira] of catches) {
        assert.match(primeira, /if \(!montado\.current\) return;/, `catch sem guarda: ${primeira.trim()}`);
      }
    });
  }

  test("a varredura pega a ausência da guarda (contraprova)", () => {
    const ruim = "const f = async () => {\n  const res = await api.get('/x');\n  navigate('/y');\n};";
    assert.equal(semGuardaDepoisDoAwait(ruim).length, 1);
    const boa = "const f = async () => {\n  const res = await api.get('/x');\n  if (!montado.current) return;\n  navigate('/y');\n};";
    assert.equal(semGuardaDepoisDoAwait(boa).length, 0);
  });
});
