import assert from 'node:assert/strict';
import { test } from 'node:test';
import { urlImagem } from '../js/logica.js';
import { erroDoArquivo, erroDoLink, nomeDaCarteirinha } from '../js/perfil.js';

const MB = 1024 * 1024;

test('link precisa ser https e não pode ter espaço', () => {
  assert.equal(erroDoLink('https://i.imgur.com/a.gif'), '');
  assert.equal(erroDoLink('  https://i.imgur.com/a.gif  '), '');
  for (const ruim of ['', 'http://i.imgur.com/a.gif', 'i.imgur.com/a.gif', 'https://com espaco.png', 'https://']) {
    assert.match(erroDoLink(ruim), /https:\/\//, ruim);
  }
});

test('anexo: só PNG, JPG, GIF ou WEBP de até 8 MB', () => {
  for (const type of ['image/png', 'image/jpeg', 'image/gif', 'image/webp']) assert.equal(erroDoArquivo({ type, size: 8 * MB }), '');
  assert.match(erroDoArquivo({ type: 'image/gif', size: 8 * MB + 1 }), /8 MB/);
  for (const type of ['image/svg+xml', 'application/pdf', '']) assert.match(erroDoArquivo({ type, size: 10 }), /PNG, JPG, GIF ou WEBP/);
});

test('nome do arquivo igual ao que o bot manda', () => {
  assert.equal(nomeDaCarteirinha('Pedrão da Silva', false), 'perfil-pedrao-da-silva.png');
  assert.equal(nomeDaCarteirinha('--rafa_cringe!!', true), 'perfil-rafa-cringe.gif');
  assert.equal(nomeDaCarteirinha('⚜️🔥', false), 'perfil-membro.png');
  assert.equal(nomeDaCarteirinha('𝓟𝓮𝓭𝓻𝓸', false), 'perfil-pedro.png');
});

test('imagem que passa pelo bot ganha o endereço dele', () => {
  assert.equal(urlImagem('/perfis/123/banner?v=ab', '', 'https://bot.exemplo.com'), 'https://bot.exemplo.com/perfis/123/banner?v=ab');
});
