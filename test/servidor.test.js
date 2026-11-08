import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chave, fancy, formatarNome, PADRAO_SRV, planoDoModelo } from '../js/servidor.js';

test('fontes e nomes iguais aos do bot', () => {
  assert.equal(fancy('Resenha 2', 'negrito'), '𝗥𝗲𝘀𝗲𝗻𝗵𝗮 𝟮');
  assert.equal(fancy('CHN', 'duplo'), 'ℂℍℕ');
  assert.equal(formatarNome('categorias', 'Resenha', '💬', false, PADRAO_SRV.f.categorias), '┏━ 𝗥𝗘𝗦𝗘𝗡𝗛𝗔');
  assert.equal(formatarNome('canais', 'Procurando Time', '🔎', false, { fonte: 'normal', deco: 0, caixa: 'manter' }), 'procurando-time');
  assert.equal(chave('┏━ 𝗥𝗘𝗦𝗘𝗡𝗛𝗔'), 'resenha');
  assert.equal(planoDoModelo({ cats: ['portaria', 'jogatina', 'staff'] }).resumo, '3 categorias, 14 canais e 13 cargos');
});
