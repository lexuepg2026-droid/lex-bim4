// As listas com busca e filtro (fase R2): o foco da busca e a corrida das respostas.
//
// Dois defeitos reproduzidos na tela na auditoria de paridade (B.5):
//   - Clientes e Processos trocavam a tela inteira por <Loading /> a cada busca:
//     o campo de busca desmontava e o foco se perdia no meio da digitação;
//   - nas listas financeiras, a resposta de um filtro antigo chegava depois da
//     do filtro novo e sobrescrevia a lista (filtro "Dinheiro", lista em Pix).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGINAS = resolve(RAIZ, "src/pages");

const jsx = (dir = PAGINAS, acc = []) => {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) jsx(caminho, acc);
    else if (nome.endsWith(".jsx")) acc.push(caminho);
  }
  return acc;
};

describe("o campo de busca não desmonta durante a busca", () => {
  // Uma tela "tem busca" quando guarda o texto digitado num estado de busca.
  // Exceção: a busca da Home não filtra a própria tela, ela leva para
  // /processos (pesquisar → navigate); o Loading da Home é só da primeira carga.
  const EXCECOES = new Set(["PortalAdvogada/Home/Home.jsx"]);
  const comBusca = jsx()
    .filter((f) => !EXCECOES.has(relative(PAGINAS, f)))
    .filter((f) => /\bsetBusca\(e\.target\.value\)/.test(readFileSync(f, "utf8")));

  test("a exceção continua verdadeira: a busca da Home leva para /processos", () => {
    const home = readFileSync(resolve(PAGINAS, "PortalAdvogada/Home/Home.jsx"), "utf8");
    assert.match(home, /navigate\("\/processos", \{ state: \{ busca/);
  });

  test("a varredura acha as telas com busca (contraprova)", () => {
    const nomes = comBusca.map((f) => relative(PAGINAS, f));
    for (const esperado of ["PortalAdvogada/Clientes/Clientes.jsx", "PortalAdvogada/Processos/Processos.jsx"]) {
      assert.ok(nomes.includes(esperado), `não achei a busca em ${esperado}`);
    }
  });

  // R4: a tela inteira dá lugar ao Loading só na PRIMEIRA carga, como no desenho
  // dela; ali o campo de busca ainda não existe, então não há foco a perder.
  const PRIMEIRA_CARGA = /if \(primeiraCarga\) return <Loading \/>;/;

  test("nenhuma tela com busca troca a tela inteira por <Loading /> durante a busca", () => {
    const ofensoras = comBusca
      .filter((f) => /return\s*\(?\s*<Loading\b/.test(readFileSync(f, "utf8").replace(PRIMEIRA_CARGA, "")))
      .map((f) => relative(PAGINAS, f));
    assert.deepEqual(ofensoras, [], `estas telas desmontam a busca durante a carga: ${ofensoras.join(", ")}`);
  });

  test("a primeira carga não volta: depois da primeira resposta, o Loading é só o da lista", () => {
    for (const f of comBusca) {
      const codigo = readFileSync(f, "utf8");
      if (!PRIMEIRA_CARGA.test(codigo)) continue;
      assert.match(codigo, /const \[primeiraCarga, setPrimeiraCarga\] = useState\(true\)/, relative(PAGINAS, f));
      assert.doesNotMatch(codigo, /setPrimeiraCarga\(true\)/, `${relative(PAGINAS, f)} volta à primeira carga`);
      assert.match(codigo, /\{carregando \? \(\s*<Loading \/>/, `${relative(PAGINAS, f)}: falta o Loading na área da lista`);
    }
  });
});

describe("só a resposta da busca mais recente vale", () => {
  const LISTAS = [
    "PortalAdvogada/Clientes/Clientes.jsx",
    "PortalAdvogada/Processos/Processos.jsx",
    "PortalAdvogada/Financeiro/HonorariosLista.jsx",
    "PortalAdvogada/Financeiro/ParcelasLista.jsx",
    "PortalAdvogada/Financeiro/PagamentosLista.jsx",
    "PortalAdvogada/Documentos/SecoesLista.jsx",
  ];

  for (const lista of LISTAS) {
    test(`${lista}: a carga leva um número e só a última altera a tela`, () => {
      const codigo = readFileSync(resolve(PAGINAS, lista), "utf8");
      assert.match(codigo, /const ultimaBusca = useRef\(0\)/);
      assert.match(codigo, /const numero = \+\+ultimaBusca\.current/);
      assert.match(codigo, /if \(numero !== ultimaBusca\.current\) return;/, "a resposta antiga precisa ser descartada");
      const guardas = codigo.match(/numero === ultimaBusca\.current/g) ?? [];
      assert.ok(guardas.length >= 2, "o erro e o carregando também precisam da guarda");
    });
  }
});

describe("erro do back não vira lista vazia", () => {
  const LISTAS = [
    "PortalAdvogada/Clientes/Clientes.jsx",
    "PortalAdvogada/Processos/Processos.jsx",
    "PortalAdvogada/Financeiro/HonorariosLista.jsx",
    "PortalAdvogada/Financeiro/ParcelasLista.jsx",
    "PortalAdvogada/Financeiro/PagamentosLista.jsx",
    "PortalAdvogada/Documentos/DocumentosLista.jsx",
    "PortalAdvogada/Documentos/MeusModelos.jsx",
    "PortalAdvogada/Documentos/SecoesLista.jsx",
  ];

  for (const lista of LISTAS) {
    test(`${lista}: o EmptyState da lista só aparece sem erro`, () => {
      const codigo = readFileSync(resolve(PAGINAS, lista), "utf8");
      assert.match(codigo, /\.length === 0 \? \(\s*!erro && <EmptyState/);
    });
  }

  test("Home: \"Todas as parcelas estão em dia\" e \"Sem dados mensais\" só com a resposta na mão", () => {
    const codigo = readFileSync(resolve(PAGINAS, "PortalAdvogada/Home/Home.jsx"), "utf8");
    const iErro = codigo.indexOf("{erroParcelas ? (");
    const iVazio = codigo.lastIndexOf("Todas as parcelas estão em dia");
    assert.ok(iErro > 0 && iErro < iVazio, "o erro das parcelas precisa vir antes do estado vazio");
    assert.match(codigo, /!parcelasCarregadas \? \(/);
    assert.match(codigo, /\{erroMensal \? \(/);
    assert.match(codigo, /!mensalCarregado \? \(/);
    assert.match(codigo, /\{erroStatus \? \(/);
  });

  test("Detalhe do cliente: as abas mostram o erro em vez de \"nenhum\"", () => {
    const codigo = readFileSync(resolve(PAGINAS, "PortalAdvogada/Clientes/ClientesDetalhes.jsx"), "utf8");
    assert.ok(!/\.catch\(\(\) => setProcessos\(\[\]\)\)/.test(codigo));
    assert.ok(!/\.catch\(\(\) => setFichas\(\[\]\)\)/.test(codigo));
    assert.match(codigo, /erroProcessos \? \(/);
    assert.match(codigo, /erroFichas \? \(/);
  });
});
