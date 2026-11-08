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

test('aparência: texto claro no fundo escuro e nome em degradê recortado', async () => {
  const { textoSobre, estiloDoNome, AP_PADRAO, textoDoAniversario } = await import('../js/perfil.js');
  assert.equal(textoSobre('#1F2A5C').txt, '#FFFCF4');
  assert.equal(textoSobre('#FFFCF4').txt, '#1B1F33');
  assert.match(estiloDoNome(AP_PADRAO, '#1B1F33'), /font-family:'Graduate'.*font-size:24px.*color:#1B1F33/);
  assert.match(estiloDoNome({ ...AP_PADRAO, nome: '#FF6EC7' }, '#1B1F33'), /color:#FF6EC7/);
  const deg = estiloDoNome({ ...AP_PADRAO, nomeTipo: 'degrade', grad: 1, fonte: 'Press Start 2P' }, '#1B1F33', 0.72, 'var(--u)');
  assert.match(deg, /font-size:calc\(11 \* var\(--u\)\)/);
  assert.match(deg, /linear-gradient\(90deg, #5865F2, #FF6EC7\).*background-clip:text/);
  const hoje = new Date(2026, 10, 8);
  assert.equal(textoDoAniversario({ d: '14/05', ano: 2004 }, 'idade', hoje), '14/05 · 22 anos');
  assert.equal(textoDoAniversario({ d: '14/12', ano: 2004 }, 'idade', hoje), '14/12 · 21 anos');
  assert.equal(textoDoAniversario({ d: '14/05', ano: 2004 }, 'data', hoje), '14/05');
  assert.equal(textoDoAniversario({ d: '14/05', ano: 2004 }, 'oculto', hoje), null);
});
