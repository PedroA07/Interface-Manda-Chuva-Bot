import assert from 'node:assert/strict';
import { test } from 'node:test';
import { botaoDaCor, fundoDaCor, hexEntrada, origemImagem, paginar, urlImagem } from '../js/logica.js';
import { markdown } from '../js/markdown.js';

const nums = (p) => p.nums.map((n) => n.n);

test('paginação: 20 itens de 6 em 6', () => {
  const p = paginar(Array.from({ length: 20 }, (_, i) => i), 2, 6);
  assert.deepEqual(p.itens, [6, 7, 8, 9, 10, 11]);
  assert.equal(p.paginas, 4);
  assert.equal(p.multi, true);
  assert.equal(p.info, 'Mostrando 7–12 de 20');
  assert.deepEqual(nums(p), [1, 2, 3, 4]);
  assert.equal(p.temAnterior, true);
  assert.equal(p.temProxima, true);
});

test('paginação com mais de 7 páginas usa reticências', () => {
  const p = paginar(Array.from({ length: 100 }, (_, i) => i), 10, 5);
  assert.deepEqual(nums(p), [1, '…', 9, 10, 11, '…', 20]);
});

test('paginação: página fora do limite volta pro limite e lista vazia não quebra', () => {
  assert.equal(paginar([1, 2, 3], 9, 2).pagina, 2);
  const v = paginar([], 1, 5);
  assert.equal(v.vazio, true);
  assert.equal(v.info, '');
  assert.equal(v.multi, false);
});

test('hex digitado: põe # e deixa maiúsculo quando é válido', () => {
  assert.equal(hexEntrada('ff6ec7'), '#FF6EC7');
  assert.equal(hexEntrada(' #abc'), '#abc');
});

test('fundo da cor: sólida ou degradê', () => {
  assert.equal(fundoDaCor({ hex: '#FF6EC7', tipo: 'solida' }), '#FF6EC7');
  assert.equal(fundoDaCor({ hex: '#FF6EC7', tipo: 'degrade', hex2: '#FFD36E' }), 'linear-gradient(120deg, #FF6EC7, #FFD36E)');
});

test('botão da prévia: cor do cargo usa o fundo mais parecido e mostra a bolinha', () => {
  assert.deepEqual(botaoDaCor({ hex: '#E74C3C', estilo: 'Secondary', botaoModo: 'cargo' }), { nome: 'cor do cargo', bg: '#da373c', bolinha: '#E74C3C', base: 'vermelho' });
  assert.deepEqual(botaoDaCor({ hex: '#E74C3C', estilo: 'Success', botaoModo: 'discord' }), { nome: 'verde', bg: '#248046', bolinha: '', base: '' });
});

test('imagem: padrão, modelo, link, anexo e sem imagem', () => {
  const api = 'https://bot.exemplo.com';
  assert.equal(urlImagem('', 'banners/painel-cores.gif', api), 'banners/painel-cores.gif');
  assert.equal(urlImagem('none', 'banners/x.gif', api), null);
  assert.equal(urlImagem('', 'none', api), null);
  assert.equal(urlImagem('https://x.com/a.png', '', api), 'https://x.com/a.png');
  assert.equal(urlImagem('anexo:0123456789abcdef', '', api), 'https://bot.exemplo.com/anexos/0123456789abcdef');
  assert.equal(origemImagem('', 'banners/painel-cores.gif'), 'MODELO · GIF');
  assert.equal(origemImagem('anexo:0123456789abcdef', ''), 'ANEXO');
  assert.equal(origemImagem('https://x.com/a.png', ''), 'LINK');
  assert.equal(origemImagem('none', 'banners/x.gif'), 'NENHUMA');
  assert.equal(origemImagem('banners/eventos/painel.jpg', ''), 'MODELO');
});

test('markdown da prévia: negrito, menção de cargo colorida e escapa HTML', () => {
  const html = markdown('**oi** <@&1> <b>', { cargos: [{ id: '1', nome: 'Azul', cor: '#3498DB' }] });
  assert.match(html, /<b>oi<\/b>/);
  assert.match(html, /@Azul/);
  assert.match(html, /color:#3498DB/);
  assert.match(html, /&lt;b&gt;/);
});

test('markdown da prévia: título ###, letra miúda -# e quebra de linha', () => {
  const html = markdown('### Título\n-# rodapé\nfim', {});
  assert.match(html, /<div class="dc-h3">Título<\/div>/);
  assert.match(html, /<div class="dc-sub">rodapé<\/div>/);
  assert.match(html, /fim/);
});

test('notícias: versões comparadas como números e não lidas', async () => {
  const { compararVersoes, naoLidas, dataCurta } = await import('../js/logica.js');
  assert.ok(compararVersoes('3.10.0', '3.9.0') > 0);
  const lista = [{ versao: '3.1.0' }, { versao: '3.0.0' }, { versao: '2.0.0' }];
  assert.deepEqual(naoLidas(lista, '').map((n) => n.versao), ['3.1.0', '3.0.0', '2.0.0']);
  assert.deepEqual(naoLidas(lista, '3.0.0').map((n) => n.versao), ['3.1.0']);
  assert.deepEqual(naoLidas(lista, '3.1.0'), []);
  assert.equal(dataCurta('02/11/2026'), '02 NOV');
  assert.equal(dataCurta('28/10/2026'), '28 OUT');
});

test('markdown da prévia: @everyone vira pílula', () => {
  assert.match(markdown('@everyone', {}), /class="dc-mencao"[^>]*>@everyone</);
});

test('galeria completa: eventos, todas as festas (GIF e imagem), fundos e clássicos', async () => {
  const { GALERIA, TEMAS } = await import('../js/galeria.js');
  const conta = (lista, cat) => lista.filter((x) => x[2] === cat).length;
  assert.equal(conta(GALERIA.banner, 'Eventos'), 8);
  assert.equal(conta(GALERIA.banner, 'Festas'), 140);
  assert.equal(conta(GALERIA.banner, 'Fundos'), 18);
  assert.equal(conta(GALERIA.banner, 'Clássicos'), 22);
  assert.equal(TEMAS.length, 10);
  assert.ok(GALERIA.banner.some((x) => x[1] === 'banners/festas/natal-silencio.gif' && x[3].tema === 'natal' && x[3].tipo === 'silencio'));
  assert.equal(conta(GALERIA.card, 'Festas'), 10);
  assert.equal(GALERIA.mini.length, 24);
});

test('banner de evento aparece com a placa desenhada pelo bot', () => {
  assert.equal(urlImagem('banners/eventos/entrada.jpg', '', 'https://bot.x'), 'https://bot.x/placas/entrada.jpg');
  assert.equal(urlImagem('banners/eventos/fundo-entrada.jpg', '', 'https://bot.x'), 'banners/eventos/fundo-entrada.jpg');
  assert.equal(urlImagem('banners/eventos/card-entrada.jpg', '', 'https://bot.x'), 'banners/eventos/card-entrada.jpg');
});
