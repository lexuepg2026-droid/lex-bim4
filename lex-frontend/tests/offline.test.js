import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildKey, buildQueueKey, parseKey, belongsToUser, keysOfOtherUsers, isCacheableResource, serializeParams } from '../src/offline/cacheKey.js';
import { isStorable, chooseEvictions, decideSource, MAX_ENTRY_BYTES } from '../src/offline/cachePolicy.js';
import { identificarOperacao, caminhoDaRequisicao } from '../src/offline/outboxOperations.js';
import { ordenarFila, proximaEntrada, filaTravada, planejarReenvio, contarFalhas } from '../src/offline/outboxPlan.js';
import { montarEntrada, marcarFalha, marcarPendente } from '../src/offline/outboxEntry.js';
import { shouldBlockWrite, offlineWriteError, offlineQueuedError } from '../src/offline/writeGuard.js';
import { offlineNoticeText } from '../src/offline/dataAge.js';
import { cabecalhoDeVersao, CABECALHO_VERSAO } from '../src/offline/versionHeader.js';

test('só caminhos da lista vão para o cache', () => {
  assert.equal(isCacheableResource('/clients'), true);
  assert.equal(isCacheableResource('/processes/abc/timeline'), true);
  assert.equal(isCacheableResource('/auth/me'), false);
  assert.equal(isCacheableResource('/portal/processos'), false);
  assert.equal(isCacheableResource('/documents/abc/download'), false);
});

test('chave do cache é escopada pelo usuário e ordena os parâmetros', () => {
  const a = buildKey({ userId: 'u1', resource: '/clients', params: { b: 2, a: 1, vazio: '' } });
  const b = buildKey({ userId: 'u1', resource: '/clients', params: { a: 1, b: 2 } });
  assert.equal(a, b);
  assert.deepEqual(parseKey(a), { userId: 'u1', resource: '/clients', params: 'a=1&b=2' });
  assert.throws(() => buildKey({ resource: '/clients' }));
  assert.throws(() => buildKey({ userId: 'u1', resource: '/auth/me' }));
  assert.throws(() => serializeParams({ filtro: { x: 1 } }));
});

test('chaves de outro usuário são identificadas para limpeza', () => {
  const minha = buildKey({ userId: 'u1', resource: '/fees' });
  const dele = buildKey({ userId: 'u2', resource: '/fees' });
  const filaDele = buildQueueKey({ userId: 'u2', chave: 'k1' });
  assert.equal(belongsToUser(minha, 'u1'), true);
  assert.deepEqual(keysOfOtherUsers([minha, dele, filaDele], 'u1'), [dele, filaDele]);
});

test('política de armazenamento descarta os mais antigos primeiro', () => {
  assert.equal(isStorable({ resource: '/clients', value: { itens: [] } }).ok, true);
  assert.equal(isStorable({ resource: '/clients', value: 'x'.repeat(MAX_ENTRY_BYTES + 10) }).ok, false);
  const entries = [
    { chave: 'velha', bytes: 10, atualizadoEm: 1 },
    { chave: 'nova', bytes: 10, atualizadoEm: 5 },
  ];
  assert.deepEqual(chooseEvictions({ entries, incomingKey: 'outra', incomingBytes: 10, maxEntries: 2 }), ['velha']);
  assert.equal(decideSource({ online: false, hasCache: true }), 'cache');
  assert.equal(decideSource({ online: false, hasCache: false }), 'unavailable');
  assert.equal(decideSource({ online: true, hasCache: true }), 'network');
});

test('só as quatro operações entram na fila', () => {
  assert.equal(identificarOperacao({ method: 'post', url: '/events' }).id, 'criarEvento');
  assert.equal(identificarOperacao({ method: 'PATCH', url: '/api/events/e1' }).id, 'atualizarEvento');
  assert.equal(identificarOperacao({ method: 'patch', url: '/events/e1/concluir' }).id, 'concluirEvento');
  assert.equal(identificarOperacao({ method: 'patch', url: 'http://x.com/api/processes/p1/fase?a=1' }).id, 'mudarFase');
  assert.equal(identificarOperacao({ method: 'delete', url: '/events/e1' }), null);
  assert.equal(identificarOperacao({ method: 'post', url: '/clients' }), null);
  assert.equal(caminhoDaRequisicao('/api/events/'), '/events');
});

test('entrada da fila carrega chave de idempotência e versão vista', () => {
  const e = montarEntrada({ method: 'PATCH', url: '/events/e1', body: { titulo: 'x' }, versaoVista: '2026-01-01T00:00:00.000Z', agora: 10 });
  assert.match(e.chaveIdempotencia, /^[0-9a-f-]{36}$/);
  assert.equal(e.id, e.chaveIdempotencia);
  assert.equal(e.estado, 'pendente');
  assert.equal(e.versaoVista, '2026-01-01T00:00:00.000Z');
  assert.throws(() => montarEntrada({ method: 'delete', url: '/events/e1' }));
  const falhou = marcarFalha(e, { classificacao: 'conflito' });
  assert.equal(falhou.estado, 'falhou');
  assert.equal(falhou.tentativas, 1);
  assert.equal(marcarPendente(falhou).estado, 'pendente');
});

test('a fila para na primeira falha e nunca pula ninguém', () => {
  const fila = [
    { id: 'c', criadoEm: 3, estado: 'pendente' },
    { id: 'a', criadoEm: 1, estado: 'pendente' },
    { id: 'b', criadoEm: 2, estado: 'falhou' },
  ];
  assert.deepEqual(ordenarFila(fila).map((e) => e.id), ['a', 'b', 'c']);
  assert.deepEqual(planejarReenvio(fila), { ordem: ['a', 'b', 'c'], enviaveis: ['a'], travadaPor: 'b' });
  assert.equal(proximaEntrada(fila).id, 'a');
  assert.equal(filaTravada(fila), false);
  assert.equal(filaTravada(fila.filter((e) => e.id !== 'a')), true);
  assert.equal(contarFalhas(fila), 1);
});

test('escrita sem conexão é barrada ou enfileirada com mensagem clara', () => {
  assert.equal(shouldBlockWrite({ method: 'post', online: false }), true);
  assert.equal(shouldBlockWrite({ method: 'get', online: false }), false);
  assert.equal(shouldBlockWrite({ method: 'post', online: true }), false);
  const barrada = offlineWriteError({});
  assert.equal(barrada.offline, true);
  assert.match(barrada.message, /não registrar/);
  const enfileirada = offlineQueuedError({}, { id: 'k' });
  assert.equal(enfileirada.enfileirado, true);
  assert.match(enfileirada.message, /fila/);
});

test('aviso informa a idade do dado guardado', () => {
  const agora = new Date(2026, 10, 8, 15, 0).getTime();
  assert.match(offlineNoticeText(new Date(2026, 10, 8, 9, 5).getTime(), agora), /hoje às 09:05/);
  assert.match(offlineNoticeText(new Date(2026, 10, 7, 9, 5).getTime(), agora), /ontem/);
});

test('cabeçalho de versão só vai quando há updatedAt', () => {
  assert.deepEqual(cabecalhoDeVersao(null), {});
  assert.deepEqual(cabecalhoDeVersao('2026-01-01'), { [CABECALHO_VERSAO]: '2026-01-01' });
});
