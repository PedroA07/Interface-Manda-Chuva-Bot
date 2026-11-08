import assert from 'node:assert/strict';
import { test } from 'node:test';
import { escadaDePunicoes, modeloDasRegras, MODELOS_REGRAS, textoDasRegras } from '../js/regras.js';

test('escada igual à do bot', () => {
  assert.equal(escadaDePunicoes({ silenciar: 3, expulsar: 5 }), '1º aviso → 2º aviso → 3º aviso: silêncio de 1 h → 5º aviso: expulsão → ban');
  assert.equal(escadaDePunicoes({ silenciar: 0, expulsar: 0 }), 'aviso → silêncio → expulsão → ban');
  assert.equal(escadaDePunicoes({ silenciar: 5, expulsar: 8 }), '1º ao 4º aviso → 5º aviso: silêncio de 1 h → 8º aviso: expulsão → ban');
  assert.equal(escadaDePunicoes({ silenciar: 6, expulsar: 2 }), '1º aviso → 2º aviso: expulsão → ban');
});

test('texto: regra sem título não entra e a numeração pula ela', () => {
  const r = { intro: 'Leia.', escada: false, regras: [{ t: 'A', d: 'a' }, { t: '', d: 'x' }, { t: 'B', d: '' }] };
  assert.equal(textoDasRegras(r, { silenciar: 3, expulsar: 5 }), 'Leia.\n\n**1. A**\na\n\n**2. B**');
});

test('modelo atual: reconhece o modelo e -1 quando mexeram', () => {
  const lista = MODELOS_REGRAS[1][1].map(([t, d]) => ({ t, d }));
  assert.equal(modeloDasRegras(lista), 1);
  lista[0].t = 'mexi';
  assert.equal(modeloDasRegras(lista), -1);
});
