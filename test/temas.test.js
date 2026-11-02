import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aplicarTema, datasDoTema, diasAte, temaAtivo, temasDoMes } from '../js/temas.js';

const tema = (id, ini, fim, extra = {}) => ({ id, nome: id, ini, fim, on: true, cor: '#C4363C', frase: 'oi', onde: { painel: true, portaria: true, news: true }, msgs: {}, ...extra });
const LISTA = [tema('carnaval', '', '', { movel: 'carnaval' }), tema('namorados', '12/06', '12/06'), tema('junina', '01/06', '30/06'), tema('natal', '01/12', '26/12'), tema('ano', '27/12', '02/01')];
const T = { auto: true, respeitar: true, lista: LISTA };
const dia = (d, m, ano = 2026) => ({ dia: d, mes: m, ano });

test('painel calcula o tema do dia igual ao bot', () => {
  assert.equal(temaAtivo(T, dia(12, 6)).id, 'namorados');
  assert.equal(temaAtivo(T, dia(1, 1, 2027)).id, 'ano');
  assert.equal(temaAtivo(T, dia(16, 2)).id, 'carnaval');
  assert.equal(temaAtivo(T, dia(2, 11)), null);
  assert.deepEqual(datasDoTema(LISTA[0], 2026), { ini: '14/02', fim: '18/02' });
});

test('dias até o tema começar (o ano vira se já passou)', () => {
  assert.equal(diasAte(LISTA[3], dia(2, 11)), 29);
  assert.equal(diasAte(LISTA[1], dia(2, 11)), 222);
});

test('calendário: temas de cada mês', () => {
  assert.deepEqual(temasDoMes(T, 6, 2026).map((t) => t.id), ['namorados', 'junina']);
  assert.deepEqual(temasDoMes(T, 1, 2026).map((t) => t.id), ['ano']);
});

test('tema troca o banner padrão e respeita o que a pessoa trocou', () => {
  const r = aplicarTema('entrada', { topo: '', mini: '', imagem: '', finais: [] }, LISTA[3], true);
  assert.equal(r.imgs.topo, 'banners/festas/natal-entrada.gif');
  assert.equal(r.cardBg, 'banners/festas/card-natal.jpg');
  assert.equal(aplicarTema('entrada', { topo: 'banners/x.gif', mini: '', imagem: '', finais: [] }, LISTA[3], true).imgs.topo, 'banners/x.gif');
});
