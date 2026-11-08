// Página inicial: hero com os 121 quadros do vídeo no canvas conforme o scroll, listas de recursos/comandos/medalhas e o link de convite
import { convite } from './site.js';

const N = 121; // todos os quadros do vídeo (5 s a 24 por segundo)
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- Hero ----------
const secao = document.getElementById('topo');
const tela = secao.querySelector('canvas');
const ctx = tela.getContext('2d');
// Tela grande ganha os quadros em 1920; celular, em 960 (metade do peso)
const pasta = innerWidth * Math.min(devicePixelRatio, 2) > 1300 ? 'q' : 'qp';
const quadros = new Array(N);
const pronto = (i) => quadros[i]?.complete && quadros[i].naturalWidth > 0;
// Baixa primeiro uns quadros espalhados e depois preenche os buracos: qualquer ponto do scroll já tem um quadro perto
const ordem = [];
for (const passo of [30, 15, 8, 4, 2, 1]) for (let i = 0; i < N; i += passo) if (!ordem.includes(i)) ordem.push(i);
for (const i of ordem) {
  const im = new Image();
  im.decoding = 'async';
  im.onload = () => desenhar(true);
  im.src = `banners/landing/${pasta}/${String(i).padStart(3, '0')}.webp`;
  quadros[i] = im;
}
/** Quadro baixado mais perto de i */
function maisPerto(i) {
  for (let d = 0; d < N; d++) {
    if (pronto(i - d)) return quadros[i - d];
    if (pronto(i + d)) return quadros[i + d];
  }
  return null;
}

let alvo = 0, atual = 0, rodando = 0;
function progresso() {
  const b = secao.getBoundingClientRect();
  return Math.min(1, Math.max(0, -b.top / Math.max(1, b.height - innerHeight)));
}
function textos(p) {
  // Cada texto aparece numa janela do scroll: sobe, fica e some
  const janela = (a, c, d, e) => Math.max(0, Math.min(1, p < c ? (p - a) / (c - a) : p <= d ? 1 : (e - p) / (e - d)));
  secao.style.setProperty('--p', p.toFixed(4));
  secao.style.setProperty('--o1', janela(-1, 0, 0.12, 0.26).toFixed(3));
  secao.style.setProperty('--o2', janela(0.3, 0.4, 0.56, 0.68).toFixed(3));
  secao.style.setProperty('--o3', janela(0.78, 0.9, 1.1, 1.2).toFixed(3));
}
/** Desenha a posição "atual" (com fração): o quadro de baixo e o de cima por cima, misturados pela fração */
function desenhar(forcar) {
  const dpr = Math.min(devicePixelRatio, 2), W = Math.round(tela.clientWidth * dpr), H = Math.round(tela.clientHeight * dpr);
  if (tela.width !== W || tela.height !== H) [tela.width, tela.height] = [W, H];
  const i = Math.floor(atual), t = atual - i;
  const a = maisPerto(i);
  if (!a) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const cobrir = (im, alfa) => {
    const e = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * e, h = im.naturalHeight * e;
    ctx.globalAlpha = alfa;
    ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  };
  cobrir(a, 1);
  if (t > 0.02 && pronto(i + 1) && quadros[i + 1] !== a) cobrir(quadros[i + 1], t);
  ctx.globalAlpha = 1;
}
/** O quadro anda atrás do scroll com inércia: rolar rápido não pula, rolar devagar fica liso */
function passo() {
  atual += (alvo - atual) * 0.2;
  if (Math.abs(alvo - atual) < 0.005) atual = alvo;
  desenhar();
  rodando = atual === alvo ? 0 : requestAnimationFrame(passo);
}
function rolou() {
  const p = progresso();
  textos(p);
  alvo = p * (N - 1);
  if (!rodando) rodando = requestAnimationFrame(passo);
}
addEventListener('scroll', rolou, { passive: true });
addEventListener('resize', () => desenhar(true));
alvo = atual = progresso() * (N - 1);
textos(progresso());
desenhar(true);

// ---------- Recursos ----------
const RECURSOS = [
  ['CORES', 'Pinte seu nome do jeito que quiser.', '24 cargos de cor com degradê, emoji e botão no painel. O membro clica e pronto: nome colorido sem pedir pra staff.', 'banners/painel-cores.gif', '3 / 1'],
  ['PORTARIA', 'Calouro chegou? Tem card com a foto dele.', 'Boas-vindas com card de foto e nome, mais mensagens de saída, expulsão, ban e silêncio com a cara do servidor.', 'banners/festas/natal-entrada.gif', '3 / 1'],
  ['FESTAS', 'Dezembro virou Natal sozinho.', 'Natal, Ano Novo, Carnaval, Junina, Halloween e mais: o bot troca banners e mensagens na data certa, sem ninguém lembrar.', 'banners/festas/junina-painel.gif', '3 / 1'],
  ['ANIVERSÁRIOS', 'Ninguém esquece o parabéns.', 'Cada um cadastra a data com /aniversario. No dia, o bot posta o card com foto, nome e idade, e dá um cargo especial por 24 horas.', 'banners/festas/card-niver.jpg', '600 / 260'],
  ['TICKETS', 'Treta resolvida no privado.', 'Menu de abrir ticket com motivos, canal privado com a staff, fila, transcrição e avaliação. Fechou, o canal some sozinho.', 'banners/eventos/fundo-news.jpg', '3 / 1'],
  ['PERFIL', 'Banner, foto e medalhas.', 'Cada membro monta a carteirinha no site: 48 banners de jogos, música, animais, desenhos e código (ou o banner do Discord, um link, um GIF seu), mais as medalhas que ganhou.', 'banners/perfil/jogos-2.jpg', '21 / 9'],
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
  ['/aniversario cadastrar', 'Cadastra seu aniversário (o ano é opcional).'],
  ['/perfil @membro', 'Mostra a carteirinha com banner, medalhas e as cores da pessoa.'],
  ['/trofeus @membro', 'Os troféus da pessoa, em imagem.'],
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
