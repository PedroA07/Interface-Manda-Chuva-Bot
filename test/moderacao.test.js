import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ateQuando, tempoRelativo } from '../js/moderacao.js';

const AGORA = Date.UTC(2026, 10, 2, 15, 0);
const MIN = 60_000, H = 60 * MIN, DIA = 24 * H;

test('tempo relativo do livro e do "entrou há…"', () => {
  assert.equal(tempoRelativo(AGORA - 20_000, AGORA), 'agora');
  assert.equal(tempoRelativo(AGORA - 5 * MIN, AGORA), 'há 5 min');
  assert.equal(tempoRelativo(AGORA - 2 * H, AGORA), 'há 2 h');
  assert.equal(tempoRelativo(AGORA - 30 * H, AGORA), 'ontem');
  assert.equal(tempoRelativo(AGORA - 3 * DIA, AGORA), 'há 3 dias');
  assert.equal(tempoRelativo(AGORA - 8 * DIA, AGORA), 'há 1 semana');
  assert.equal(tempoRelativo(AGORA - 20 * DIA, AGORA), 'há 2 semanas');
  assert.equal(tempoRelativo(AGORA - 40 * DIA, AGORA), 'há 1 mês');
  assert.equal(tempoRelativo(AGORA - 200 * DIA, AGORA), 'há 6 meses');
  assert.equal(tempoRelativo(AGORA - 800 * DIA, AGORA), 'há 2 anos');
});

test('até quando fica em silêncio (horário de Brasília)', () => {
  assert.equal(ateQuando(AGORA + 30 * MIN, AGORA), 'até 12:30');
  assert.equal(ateQuando(AGORA + 3 * DIA, AGORA), 'até 05/11');
});
