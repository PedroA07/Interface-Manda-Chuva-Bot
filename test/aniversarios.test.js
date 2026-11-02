import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listaNiver, textoDoNiver } from '../js/aniversarios.js';

const hoje = { dia: 2, mes: 11, ano: 2026 };
const L = [{ userId: '1', nome: 'rafa', d: '14/11', ano: 2004 }, { userId: '2', nome: 'joao', d: '22/01', ano: null }, { userId: '3', nome: 'lu', d: '02/11', ano: 2003 }];

test('lista em ordem dos próximos, com idade que vai fazer e quando', () => {
  const l = listaNiver(L, hoje);
  assert.deepEqual(l.map((p) => p.nome), ['lu', 'rafa', 'joao']);
  assert.equal(l[0].quando, 'HOJE');
  assert.equal(l[0].idadeTxt, 'vai fazer 23 anos');
  assert.equal(l[1].quando, 'em 12 dias');
  assert.equal(l[2].idadeTxt, 'sem ano: sai sem idade');
  assert.equal(listaNiver([{ userId: '9', nome: 'x', d: '03/11', ano: null }], hoje)[0].quando, 'AMANHÃ');
});

test('texto da prévia: {idade} some sem ano', () => {
  assert.equal(textoDoNiver('{nome} faz {idade} anos', { nome: 'joao', idade: null }, true), 'joao faz anos');
  assert.equal(textoDoNiver('{idade} ANOS', { idade: 22 }, true), '22 ANOS');
});
