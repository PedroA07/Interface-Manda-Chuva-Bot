// Página inicial: hero com 48 quadros no canvas conforme o scroll, listas de recursos/comandos/medalhas e o link de convite
import { convite } from './site.js';

const N = 48;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- Hero ----------
const secao = document.getElementById('topo');
const tela = secao.querySelector('canvas');
const quadros = Array.from({ length: N }, (_, i) => {
  const im = new Image();
  im.src = `banners/landing/f/${String(i).padStart(2, '0')}.jpg`;
  im.onload = () => desenhar(true);
  return im;
});
let ultimo = -1, pedido = 0;

function desenhar(forcar) {
  const b = secao.getBoundingClientRect(), vao = Math.max(1, b.height - innerHeight);
  const p = Math.min(1, Math.max(0, -b.top / vao));
  // Cada texto aparece numa janela do scroll: sobe, fica e some
  const janela = (a, c, d, e) => Math.max(0, Math.min(1, p < c ? (p - a) / (c - a) : p <= d ? 1 : (e - p) / (e - d)));
  secao.style.setProperty('--p', p.toFixed(4));
  secao.style.setProperty('--o1', janela(-1, 0, 0.12, 0.26).toFixed(3));
  secao.style.setProperty('--o2', janela(0.3, 0.4, 0.56, 0.68).toFixed(3));
  secao.style.setProperty('--o3', janela(0.78, 0.9, 1.1, 1.2).toFixed(3));
  const i = Math.round(p * (N - 1));
  const dpr = Math.min(devicePixelRatio, 2), W = Math.round(tela.clientWidth * dpr), H = Math.round(tela.clientHeight * dpr);
  if (!forcar && i === ultimo && tela.width === W) return;
  // Quadro ainda baixando: usa o último que já chegou
  const im = [quadros[i], ...quadros.slice(0, i).reverse()].find((f) => f?.complete && f.naturalWidth);
  if (!im) return;
  ultimo = i;
  if (tela.width !== W || tela.height !== H) [tela.width, tela.height] = [W, H];
  const ctx = tela.getContext('2d'), e = Math.max(W / im.naturalWidth, H / im.naturalHeight);
  const w = im.naturalWidth * e, h = im.naturalHeight * e;
  ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
}
const agendar = () => (pedido ||= requestAnimationFrame(() => ((pedido = 0), desenhar())));
addEventListener('scroll', agendar, { passive: true });
addEventListener('resize', agendar);
desenhar(true);

// ---------- Recursos ----------
const RECURSOS = [
  ['CORES', 'Pinte seu nome do jeito que quiser.', '24 cargos de cor com degradê, emoji e botão no painel. O membro clica e pronto: nome colorido sem pedir pra staff.', 'banners/painel-cores.gif', '3 / 1'],
  ['PORTARIA', 'Calouro chegou? Tem card com a foto dele.', 'Boas-vindas com card de foto e nome, mais mensagens de saída, expulsão, ban e silêncio com a cara do servidor.', 'banners/festas/natal-entrada.gif', '3 / 1'],
  ['FESTAS', 'Dezembro virou Natal sozinho.', 'Natal, Ano Novo, Carnaval, Junina, Halloween e mais: o bot troca banners e mensagens na data certa, sem ninguém lembrar.', 'banners/festas/junina-painel.gif', '3 / 1'],
  ['ANIVERSÁRIOS', 'Ninguém esquece o parabéns.', 'Cada um cadastra a data com /aniversario. No dia, o bot posta o card com foto, nome e idade, e dá um cargo especial por 24 horas.', 'banners/festas/card-niver.jpg', '600 / 260'],
  ['TICKETS', 'Treta resolvida no privado.', 'Menu de abrir ticket com motivos, canal privado com a staff, fila, transcrição e avaliação. Fechou, o canal some sozinho.', 'banners/eventos/fundo-news.jpg', '3 / 1'],
  ['PERFIL', 'Banner, bio e medalhas.', 'Cada membro monta a carteirinha no site: 48 banners de jogos, música, animais, desenhos e código, mais as medalhas que ganhou.', 'banners/perfil/jogos-2.jpg', '21 / 9'],
];
document.getElementById('lista-recursos').innerHTML = RECURSOS.map(([tag, titulo, texto, img, prop], i) => `
  <article class="ld-recurso">
    <span class="ld-recurso-num">${String(i + 1).padStart(2, '0')} · ${tag}</span>
    <h2>${esc(titulo)}</h2>
    <p>${esc(texto)}</p>
    <div class="ld-recurso-img" style="aspect-ratio:${prop}"><img src="${img}" alt="" loading="lazy"></div>
  </article>`).join('');

// ---------- Faixa de banners (passa sozinha) ----------
const FAIXA = ['jogos-1', 'musica-3', 'animais-3', 'desenhos-6', 'codigo-7', 'diversos-3', 'jogos-5', 'musica-7', 'animais-2', 'jogos-6'].map((b) => `banners/perfil/${b}.jpg`);
document.getElementById('faixa').innerHTML = [...FAIXA, ...FAIXA].map((src) => `<span><img src="${src}" alt="" loading="lazy"></span>`).join('');

// ---------- Comandos ----------
const COMANDOS = [
  ['/cor', 'Escolhe (ou tira) a cor do seu nome.'],
  ['/aniversario dia mes ano', 'Cadastra seu aniversário (o ano é opcional).'],
  ['/perfil @membro', 'Mostra o perfil com banner e medalhas.'],
  ['/medalhas', 'Lista as suas medalhas e o que falta.'],
  ['/ticket abrir', 'Abre um ticket com a staff.'],
  ['/ticket fechar', 'Fecha o ticket, salva a transcrição e apaga o canal.'],
  ['/ticket painel #canal', 'Envia o menu de tickets (admin).'],
  ['/tema simular natal', 'Mostra como fica uma festa antes da data (staff).'],
  ['/painel', 'Link do painel do site.'],
];
document.getElementById('lista-comandos').innerHTML = COMANDOS.map(([cmd, desc]) => `<div class="ld-comando"><code>${esc(cmd)}</code><span>${esc(desc)}</span></div>`).join('');

// ---------- Medalhas ----------
const MEDALHAS = [['calouro', 'Calouro'], ['veterano', 'Veterano'], ['lenda', 'Lenda do Campus'], ['tagarela', 'Tagarela'], ['rei-resenha', 'Rei da Resenha'], ['rato-call', 'Rato de Call'], ['construtor', 'Mestre dos Blocos'], ['detetive', 'Detetive Espacial'], ['mira-ouro', 'Mira de Ouro'], ['sobrevivente', 'Último de Pé'], ['foliao', 'Folião'], ['aniversario', 'Parabéns!'], ['moderador', 'Guardião'], ['coruja', 'Coruja da Madrugada'], ['capivara', 'Capivara Zen'], ['pintor', 'Pintor de Nomes']];
document.getElementById('lista-medalhas').innerHTML = MEDALHAS.map(([id, nome]) => `<div class="ld-medalha"><img src="banners/medalhas/${id}.png" alt="" loading="lazy"><span>${esc(nome)}</span></div>`).join('');

// ---------- Convite: link de verdade do bot (vem do /saude) ----------
convite().then((link) => link && document.querySelectorAll('.js-convite').forEach((a) => (a.href = link)));
