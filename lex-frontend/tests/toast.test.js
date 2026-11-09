// O toast por tipo e o toast global de erro (fase R2, DEC-083 e DEC-084).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { DURACOES, JANELA_DEDUP, duracaoDe, regiaoDe, deveEmitir, toast, subscribe, _limparDeduplicacao } from "../src/utils/toast.js";
import {
  deveExibirToastGlobal, mensagemDoToastGlobal,
  guardarAvisoDeSessao, consumirAvisoDeSessao, CHAVE_AVISO_SESSAO, MENSAGEM_SESSAO_EXPIRADA,
} from "../src/api/toastGlobal.js";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const erroHttp = (status, data = {}) => ({ response: { status, data }, request: {} });
const semResposta = (code) => ({ request: {}, code });

describe("DEC-083 — o toast por tipo", () => {
  test("duração por tipo: sucesso 3 s, info 4 s, erro 6 s", () => {
    assert.equal(duracaoDe("success"), 3000);
    assert.equal(duracaoDe("info"), 4000);
    assert.equal(duracaoDe("error"), 6000);
    assert.equal(duracaoDe("desconhecido"), DURACOES.info);
  });

  test("o erro vai para a região que interrompe; sucesso e info esperam a vez", () => {
    assert.equal(regiaoDe("error"), "alert");
    assert.equal(regiaoDe("success"), "status");
    assert.equal(regiaoDe("info"), "status");
  });

  test("a mesma mensagem do mesmo tipo não se repete dentro da janela", () => {
    const reg = new Map();
    assert.equal(deveEmitir(reg, "error", "caiu", 0), true);
    assert.equal(deveEmitir(reg, "error", "caiu", JANELA_DEDUP - 1), false);
    assert.equal(deveEmitir(reg, "success", "caiu", 10), true, "outro tipo não é repetição");
    assert.equal(deveEmitir(reg, "error", "outra", 10), true, "outra mensagem não é repetição");
    assert.equal(deveEmitir(reg, "error", "caiu", JANELA_DEDUP + 5), true, "passada a janela, volta a aparecer");
  });

  test("toast.info existe (DEC-066) e entrega a duração junto", () => {
    _limparDeduplicacao();
    const recebidos = [];
    const sair = subscribe((t) => recebidos.push(t));
    toast.info("informação");
    toast.info("informação");
    toast.error("falhou");
    sair();
    assert.deepEqual(recebidos.map((t) => [t.type, t.message, t.duracao]), [["info", "informação", 4000], ["error", "falhou", 6000]]);
  });
});

describe("DEC-084 — o toast global de erro, com política estreita", () => {
  test("5xx, sem resposta (com o navegador online) e 429 viram toast", () => {
    assert.equal(deveExibirToastGlobal(erroHttp(500), {}, true), true);
    assert.equal(deveExibirToastGlobal(erroHttp(502), {}, true), true);
    assert.equal(deveExibirToastGlobal(erroHttp(429), {}, true), true);
    assert.equal(deveExibirToastGlobal(semResposta("ERR_NETWORK"), {}, true), true);
  });

  test("400, 404, 409 e 422 ficam com a tela; 401 é a perda de sessão", () => {
    for (const s of [400, 401, 403, 404, 409, 422]) {
      assert.equal(deveExibirToastGlobal(erroHttp(s), {}, true), false, `status ${s}`);
    }
  });

  test("sem sinal, a camada offline já explicou: nada de toast", () => {
    assert.equal(deveExibirToastGlobal(semResposta("ERR_NETWORK"), {}, false), false);
    assert.equal(deveExibirToastGlobal({ offline: true, message: "x" }, {}, true), false);
    assert.equal(deveExibirToastGlobal({ offline: true, enfileirado: true }, {}, true), false);
    assert.equal(deveExibirToastGlobal({ code: "ERR_CANCELED" }, {}, true), false);
  });

  test("semToastGlobal desliga o toast para quem mostra o erro de outro jeito", () => {
    assert.equal(deveExibirToastGlobal(erroHttp(500), { semToastGlobal: true }, true), false);
  });

  test("a frase é a das telas (utils/apiError.js)", () => {
    assert.match(mensagemDoToastGlobal(erroHttp(502, "<html>")), /O servidor encontrou um erro/);
    assert.match(mensagemDoToastGlobal(semResposta("ERR_NETWORK")), /Não foi possível falar com o servidor/);
    assert.match(mensagemDoToastGlobal(semResposta("ECONNABORTED")), /demorou demais/);
    assert.match(mensagemDoToastGlobal(erroHttp(429)), /Muitas tentativas/);
    assert.equal(mensagemDoToastGlobal(erroHttp(503, { message: "Banco em manutenção" })), "Banco em manutenção");
  });

  test("a mensagem do 401 sobrevive ao recarregamento, e aparece uma vez só", () => {
    const mapa = new Map();
    const armazenamento = { getItem: (k) => mapa.get(k) ?? null, setItem: (k, v) => mapa.set(k, v), removeItem: (k) => mapa.delete(k) };
    guardarAvisoDeSessao(armazenamento);
    assert.equal(mapa.get(CHAVE_AVISO_SESSAO), MENSAGEM_SESSAO_EXPIRADA);
    assert.equal(consumirAvisoDeSessao(armazenamento), MENSAGEM_SESSAO_EXPIRADA);
    assert.equal(consumirAvisoDeSessao(armazenamento), null);
  });

  test("storage indisponível (navegação privada) não quebra nada", () => {
    const quebrado = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() {} };
    assert.doesNotThrow(() => guardarAvisoDeSessao(quebrado));
    assert.equal(consumirAvisoDeSessao(quebrado), null);
  });

  test("o interceptor usa a política, e o 401 guarda o aviso antes de recarregar", () => {
    const codigo = readFileSync(resolve(RAIZ, "src/api/axiosConfig.js"), "utf8");
    assert.match(codigo, /deveExibirToastGlobal\(error, error\.config, online\)/);
    const i401 = codigo.indexOf("guardarAvisoDeSessao(");
    const iRedir = codigo.indexOf("window.location.href = '/login'");
    assert.ok(i401 > 0 && i401 < iRedir, "o aviso precisa ser guardado ANTES do redirecionamento");
  });

  test("o contêiner fica sempre montado, com as duas regiões vivas", () => {
    const codigo = readFileSync(resolve(RAIZ, "src/components/ToastContainer/ToastContainer.jsx"), "utf8");
    assert.ok(!/if \(toasts\.length === 0\) return null/.test(codigo), "o contêiner não pode sair do DOM quando vazio");
    assert.match(codigo, /role="status" aria-live="polite"/);
    assert.match(codigo, /role="alert" aria-live="assertive"/);
    assert.match(codigo, /aria-label="Fechar aviso"/);
  });
});
