import assert from 'node:assert/strict';
import { test } from 'node:test';
import { conflitos, consertar, etiquetas, inserir, mover, tirar } from '../js/hierarquia.js';

const ID = (n) => `10000000000000000${n}`;
const LISTA = [
  { k: 'sep', id: ID(1), nome: 'STAFF', travado: true },
  { k: 'role', id: ID(2), nome: 'Dono', hex: '#F1C40F', perms: ['admin'], travado: true },
  { k: 'role', id: ID(3), nome: 'Manda Chuva', hex: '', perms: ['cargos'], bot: true, gerenciado: 'bot', travado: true },
  { k: 'role', id: ID(4), nome: 'VIP', hex: '#F39C12', perms: [], hoist: true },
  { k: 'role', id: ID(5), nome: 'Outro bot', hex: '#123456', perms: [], gerenciado: 'bot' },
  { k: 'sep', id: ID(6), nome: 'CORES' },
  { k: 'cores' },
  { k: 'role', id: ID(7), nome: 'Calouro', hex: '', perms: [] },
];
const nomes = (l) => l.map((x) => (x.k === 'cores' ? 'BLOCO' : x.nome));

test('mover: só abaixo do bot, sem passar por cima dele', () => {
  assert.deepEqual(nomes(mover(LISTA, 4, -1)), ['STAFF', 'Dono', 'Manda Chuva', 'Outro bot', 'VIP', 'CORES', 'BLOCO', 'Calouro']);
  assert.equal(mover(LISTA, 3, -1), null);
  assert.equal(mover(LISTA, 1, 1), null);
  assert.equal(mover(LISTA, 7, 1), null);
});

test('conflito: cargo com cor entre o bot e as cores (integração de bot não conta)', () => {
  assert.deepEqual(conflitos(LISTA), ['VIP']);
  assert.deepEqual(conflitos(consertar(LISTA)), []);
});

test('consertar leva o bloco e o separador dele pra logo abaixo do bot', () => {
  assert.deepEqual(nomes(consertar(LISTA)), ['STAFF', 'Dono', 'Manda Chuva', 'CORES', 'BLOCO', 'VIP', 'Outro bot', 'Calouro']);
});

test('novo item entra abaixo do bot; apagar guarda o id de quem já existe', () => {
  assert.deepEqual(nomes(inserir(LISTA, { k: 'sep', id: 'novo-1', nome: 'NOVO GRUPO' })).slice(2, 5), ['Manda Chuva', 'NOVO GRUPO', 'VIP']);
  const r = { lista: inserir(LISTA, { k: 'role', id: 'novo-1', nome: 'X' }), apagar: [] };
  tirar(r, 3);
  tirar(r, 3);
  assert.deepEqual(r.apagar, [ID(4)]);
  assert.deepEqual(nomes(r.lista).slice(2, 5), ['Manda Chuva', 'Outro bot', 'CORES']);
});

test('etiquetas do protótipo', () => {
  assert.deepEqual(etiquetas(LISTA[1]), ['ADMIN']);
  assert.deepEqual(etiquetas(LISTA[2]), ['BOT']);
  assert.deepEqual(etiquetas({ perms: ['banir'], hoist: true }), ['MOD', 'À PARTE']);
  assert.deepEqual(etiquetas({ perms: [], gerenciado: 'impulso' }), ['IMPULSO']);
  assert.deepEqual(etiquetas(LISTA[4]), ['INTEGRAÇÃO']);
});
