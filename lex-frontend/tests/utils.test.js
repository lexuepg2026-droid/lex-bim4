import { test } from 'node:test';
import assert from 'node:assert/strict';

import { maskMoney, parseMoney, formatMoneyInput } from '../src/utils/masks.js';
import { filtrarOpcoes } from '../src/utils/filtrarOpcoes.js';
import { derivarValorHonorario, validarHonorario } from '../src/utils/feeCalc.js';
import { ehSessaoPerdida } from '../src/api/sessionLoss.js';

test('máscara de dinheiro agrupa milhar e limita centavos', () => {
  assert.equal(maskMoney('1234567'), '1.234.567');
  assert.equal(maskMoney('1234,567'), '1.234,56');
  assert.equal(maskMoney(',5'), '0,5');
  assert.equal(maskMoney('00012'), '12');
  assert.equal(maskMoney('R$ 12a3'), '123');
});

test('leitura de dinheiro aceita os formatos comuns', () => {
  assert.equal(parseMoney('1.234,56'), 1234.56);
  assert.equal(parseMoney('R$ 2.500,00'), 2500);
  assert.equal(parseMoney('1234.5'), 1234.5);
  assert.equal(parseMoney('1.234.567'), 1234567);
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney(42), 42);
  assert.equal(formatMoneyInput(1234.5), '1.234,50');
  assert.equal(formatMoneyInput(''), '');
});

test('filtro de opções ignora acento e mantém o selecionado', () => {
  const lista = [{ _id: '1', nome: 'João' }, { _id: '2', nome: 'Maria' }];
  assert.deepEqual(filtrarOpcoes(lista, 'joao', (i) => i.nome).map((i) => i._id), ['1']);
  assert.deepEqual(filtrarOpcoes(lista, 'joao', (i) => i.nome, '2').map((i) => i._id), ['1', '2']);
  assert.equal(filtrarOpcoes(lista, '  ', (i) => i.nome), lista);
});

test('honorário percentual nunca passa de 100%', () => {
  assert.equal(derivarValorHonorario(30, 10000), 3000);
  assert.equal(derivarValorHonorario(101, 10000), null);
  assert.equal(validarHonorario({ tipo: 'percentual', percentual: '150', valorBase: '1000' }).campo, 'percentual');
});

test('perda de sessão só conta quando havia sessão', () => {
  assert.equal(ehSessaoPerdida(401, true), true);
  assert.equal(ehSessaoPerdida(401, false), false);
  assert.equal(ehSessaoPerdida(403, true), false);
});
