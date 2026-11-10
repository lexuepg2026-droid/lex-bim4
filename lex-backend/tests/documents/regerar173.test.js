// ═══════════════════════════════════════════════════════════════════════════
// DEC-173 — regerar SEMPRE substitui o anterior (fase R6)
//
// Os três caminhos da regeração (peça protegida):
//   • sem anterior               → cria;
//   • anterior sem edição à mão  → cria e substitui, direto (era: o anterior
//                                  continuava ativo ao lado do novo);
//   • anterior editado à mão     → 409 sem `confirmarSobrescrita`; com ela,
//                                  cria e substitui.
// Nos três, o novo nasce fora do portal. "O mesmo documento" continua sendo
// modelo + processo + cliente: outro cliente do mesmo processo é documento novo.
// ═══════════════════════════════════════════════════════════════════════════

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";

import { Types } from "mongoose";

import { subirApp, derrubarApp } from "../helpers/server.js";
import { limparColecoes, TODAS_AS_COLECOES, desconectar, acharEm, COLECOES } from "../helpers/db.js";
import {
  registrarUsuario, criarClientePF, criarProcesso, criarSecao, criarModelo, vincularSecao, esperado
} from "../helpers/setup.js";

const { ObjectId } = Types;

const TEXTO = "{{nomeCliente}}, portador(a) do CPF {{cpfCliente}}, nos autos do processo {{numeroProcesso}}.";

describe("DEC-173 — regerar sempre substitui o anterior", () => {
  let api;

  before(async () => {
    await subirApp();
    await limparColecoes(TODAS_AS_COLECOES);
    api = await registrarUsuario("regerar");
  });

  after(async () => {
    await limparColecoes(TODAS_AS_COLECOES);
    await derrubarApp();
    await desconectar();
  });

  const cenario = async () => {
    const secao = await criarSecao(api, { texto: TEXTO });
    const modelo = await criarModelo(api);
    await vincularSecao(api, modelo._id, secao._id);
    const cliente = await criarClientePF(api);
    const processo = await criarProcesso(api, [{ clienteId: cliente._id, papel: "autor", principal: true }]);
    return { modelo, cliente, processo };
  };

  const gerar = (modelo, processo, cliente, extra = {}) =>
    api.post(`/documents/modelos/${modelo._id}/gerar`, { processoId: processo._id, clienteId: cliente._id, ...extra });

  const ativosDoProcesso = async (processo) =>
    esperado(await api.get(`/documents?processoId=${processo._id}&limit=100`), 200, "lista do processo").data;

  const doBanco = async (id) => (await acharEm(COLECOES.DOCUMENTS, { _id: new ObjectId(String(id)) }))[0];

  test("sem edição à mão: regera direto, fica um documento ativo só, e o anterior aponta para o novo", async () => {
    const { modelo, cliente, processo } = await cenario();
    const primeiro = esperado(await gerar(modelo, processo, cliente), 201, "geração");
    const segundo = esperado(await gerar(modelo, processo, cliente), 201, "regeração sem edição");

    assert.notEqual(String(segundo._id), String(primeiro._id));
    const ativos = await ativosDoProcesso(processo);
    assert.deepEqual(ativos.map((d) => String(d._id)), [String(segundo._id)], "só o novo fica na lista");

    const anterior = await doBanco(primeiro._id);
    assert.equal(anterior.ativo, false, "o anterior sai por soft delete");
    assert.equal(String(anterior.substituidoPorId), String(segundo._id));
    assert.equal((await api.get(`/documents/${primeiro._id}`)).status, 404);

    // A terceira regeração encadeia de novo: um ativo, e o segundo aponta para o terceiro.
    const terceiro = esperado(await gerar(modelo, processo, cliente), 201, "terceira geração");
    assert.deepEqual((await ativosDoProcesso(processo)).map((d) => String(d._id)), [String(terceiro._id)]);
    assert.equal(String((await doBanco(segundo._id)).substituidoPorId), String(terceiro._id));
  });

  test("com edição à mão: o 409 continua, e a confirmação substitui", async () => {
    const { modelo, cliente, processo } = await cenario();
    const original = esperado(await gerar(modelo, processo, cliente), 201, "geração");
    esperado(
      await api.patch(`/documents/${original._id}/texto`, { textoResolvido: `${original.textoResolvido}\n\nFEITO A MÃO` }),
      200,
      "edição à mão"
    );

    const recusa = await gerar(modelo, processo, cliente);
    assert.equal(recusa.status, 409);
    assert.match(recusa.body.message, /confirmarSobrescrita/);
    assert.deepEqual((await ativosDoProcesso(processo)).map((d) => String(d._id)), [String(original._id)], "o 409 não mexe em nada");

    const novo = esperado(await gerar(modelo, processo, cliente, { confirmarSobrescrita: true }), 201, "regeração confirmada");
    assert.deepEqual((await ativosDoProcesso(processo)).map((d) => String(d._id)), [String(novo._id)]);
    const anterior = await doBanco(original._id);
    assert.equal(anterior.ativo, false);
    assert.equal(String(anterior.substituidoPorId), String(novo._id));
    assert.ok(anterior.textoResolvido.includes("FEITO A MÃO"), "o texto revisado fica preservado no anterior");
  });

  test("o regerado nasce fora do portal, com e sem edição, mesmo que o anterior estivesse visível", async () => {
    const { modelo, cliente, processo } = await cenario();

    const visivel = esperado(await gerar(modelo, processo, cliente), 201, "geração");
    esperado(await api.patch(`/documents/${visivel._id}/visibilidade-portal`, { visivelPortal: true }), 200, "libera");
    const semEdicao = esperado(await gerar(modelo, processo, cliente), 201, "regeração sem edição");
    assert.equal(semEdicao.visivelPortal, false, "sem edição: nasce fora do portal");

    esperado(await api.patch(`/documents/${semEdicao._id}/visibilidade-portal`, { visivelPortal: true }), 200, "libera de novo");
    esperado(
      await api.patch(`/documents/${semEdicao._id}/texto`, { textoResolvido: `${semEdicao.textoResolvido}\n\nREVISADO` }),
      200,
      "edição"
    );
    const recusa = await gerar(modelo, processo, cliente);
    assert.equal(recusa.status, 409);
    assert.equal(recusa.body.errors.sairaDoPortal, true, "o 409 avisa que sai do portal");
    const comEdicao = esperado(await gerar(modelo, processo, cliente, { confirmarSobrescrita: true }), 201, "confirmada");
    assert.equal(comEdicao.visivelPortal, false, "com edição: nasce fora do portal");

    assert.deepEqual(
      esperado(await api.get(`/documents?processoId=${processo._id}&visivelPortal=true`), 200, "visíveis").data,
      [],
      "nenhum documento do processo fica no portal sem ser liberado de novo"
    );
  });

  test("outro cliente do mesmo processo é documento novo, não substituição", async () => {
    const { modelo, cliente, processo } = await cenario();
    const outro = await criarClientePF(api, { nomeCompleto: "Outro Participante" });
    esperado(await api.post(`/processes/${processo._id}/clientes`, { clienteId: outro._id, papel: "litisconsorte" }), 201, "vínculo");

    const deUm = esperado(await gerar(modelo, processo, cliente), 201, "do primeiro");
    const deOutro = esperado(await gerar(modelo, processo, outro), 201, "do segundo");
    const ids = (await ativosDoProcesso(processo)).map((d) => String(d._id)).sort();
    assert.deepEqual(ids, [String(deUm._id), String(deOutro._id)].sort());
  });
});
