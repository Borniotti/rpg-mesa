import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adicionar, alterarPv, estadoInicial, proximoTurno, reiniciar, remover } from '../src/iniciativa.js';

function mesa() {
  let e = estadoInicial();
  e = adicionar(e, { nome: 'Goblin', iniciativa: 12, pv: 7 });
  e = adicionar(e, { nome: 'Ayla', iniciativa: 18, pv: 20 });
  e = adicionar(e, { nome: 'Benício', iniciativa: 12, pv: 25 });
  return e;
}

test('ordena por iniciativa e desempata pelo nome', () => {
  assert.deepEqual(
    mesa().combatentes.map((c) => c.nome),
    ['Ayla', 'Benício', 'Goblin'],
  );
});

test('passa os turnos e conta as rodadas', () => {
  let e = mesa();
  e = proximoTurno(proximoTurno(e));
  assert.equal(e.combatentes[e.turno].nome, 'Goblin');
  e = proximoTurno(e);
  assert.equal(e.turno, 0);
  assert.equal(e.rodada, 2);
});

test('quem chega no meio do combate não rouba a vez de ninguém', () => {
  let e = proximoTurno(mesa()); // vez de Benício
  e = adicionar(e, { nome: 'Dragão', iniciativa: 25, pv: 100 });
  assert.equal(e.combatentes[e.turno].nome, 'Benício');
});

test('remover alguém antes da vez atual mantém o turno certo', () => {
  let e = proximoTurno(proximoTurno(mesa())); // vez do Goblin
  const ayla = e.combatentes.find((c) => c.nome === 'Ayla');
  e = remover(e, ayla.id);
  assert.equal(e.combatentes[e.turno].nome, 'Goblin');
});

test('dano e cura respeitam os limites de PV', () => {
  let e = mesa();
  const goblin = e.combatentes.find((c) => c.nome === 'Goblin');
  e = alterarPv(e, goblin.id, -50);
  assert.equal(e.combatentes.find((c) => c.id === goblin.id).pv, 0);
  e = alterarPv(e, goblin.id, 99);
  assert.equal(e.combatentes.find((c) => c.id === goblin.id).pv, 7);
});

test('não altera o estado original', () => {
  const antes = mesa();
  const copia = structuredClone(antes);
  proximoTurno(antes);
  alterarPv(antes, 1, -3);
  assert.deepEqual(antes, copia);
});

test('valida os dados do combatente', () => {
  assert.throws(() => adicionar(estadoInicial(), { nome: '  ', iniciativa: 3, pv: 5 }));
  assert.throws(() => adicionar(estadoInicial(), { nome: 'X', iniciativa: NaN, pv: 5 }));
  assert.throws(() => adicionar(estadoInicial(), { nome: 'X', iniciativa: 3, pv: 0 }));
});

test('reiniciar volta à rodada 1 com vida cheia', () => {
  let e = proximoTurno(alterarPv(mesa(), 1, -5));
  e = reiniciar(e);
  assert.equal(e.rodada, 1);
  assert.equal(e.turno, 0);
  assert.ok(e.combatentes.every((c) => c.pv === c.pvMax));
});
