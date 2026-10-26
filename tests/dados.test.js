import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analisar, escolherMantidos, estatisticas, rolar, ErroDeRolagem } from '../src/dados.js';

// Gera números "aleatórios" previsíveis: cada valor vira a face pedida.
function dadosViciados(faces, ...valores) {
  const fila = [...valores];
  return () => (fila.shift() - 1) / faces;
}

test('entende expressões comuns', () => {
  assert.deepEqual(analisar('1d20+5'), [
    { tipo: 'dados', sinal: 1, quantidade: 1, faces: 20, manter: null },
    { tipo: 'fixo', sinal: 1, valor: 5 },
  ]);
  assert.equal(analisar('d%')[0].faces, 100);
  assert.equal(analisar(' 2D6 - 1 ')[1].sinal, -1);
  assert.deepEqual(analisar('4d6kh3')[0].manter, { modo: 'kh', n: 3 });
});

test('recusa expressões inválidas com mensagem clara', () => {
  for (const ruim of ['', '2d', 'd1', '2d6+', '--5', 'abc', '101d6', '2d6kh3']) {
    assert.throws(() => analisar(ruim), ErroDeRolagem, `deveria recusar "${ruim}"`);
  }
});

test('soma dados e modificadores', () => {
  const r = rolar('2d6+3', dadosViciados(6, 4, 5));
  assert.equal(r.total, 12);
  assert.deepEqual(r.termos[0].resultados, [4, 5]);
});

test('vantagem mantém o maior dado e desvantagem o menor', () => {
  assert.equal(rolar('2d20kh1', dadosViciados(20, 7, 15)).total, 15);
  assert.equal(rolar('2d20kl1', dadosViciados(20, 7, 15)).total, 7);
});

test('empate ao manter dados descarta pela ordem de rolagem', () => {
  assert.deepEqual(escolherMantidos([3, 6, 6, 1], { modo: 'kh', n: 2 }), [false, true, true, false]);
});

test('detecta crítico e falha crítica só num d20 que conta', () => {
  assert.equal(rolar('1d20+2', dadosViciados(20, 20)).critico, 'sucesso');
  assert.equal(rolar('2d20kh1', dadosViciados(20, 1, 1)).critico, 'falha');
  assert.equal(rolar('2d20', dadosViciados(20, 20, 20)).critico, null);
  assert.equal(rolar('1d6', dadosViciados(6, 6)).critico, null);
});

test('calcula mínimo, máximo e média', () => {
  assert.deepEqual(estatisticas('2d6+3'), { minimo: 5, maximo: 15, media: 10 });
  assert.deepEqual(estatisticas('1d8-1d4'), { minimo: -3, maximo: 7, media: 2 });
  assert.equal(estatisticas('4d6kh3').media, null);
});

test('rolagens reais ficam dentro dos limites', () => {
  for (let i = 0; i < 500; i++) {
    const { total } = rolar('3d6');
    assert.ok(total >= 3 && total <= 18);
  }
});
