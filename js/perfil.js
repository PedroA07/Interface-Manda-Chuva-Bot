// Meu perfil e a lista da turma: categorias e nomes dos 48 banners (banners/perfil/<categoria>-<1..8>.jpg) e as cores da raridade
export const CATEGORIAS = [
  ['jogos', 'Jogos', ['Mundo de blocos', 'Nave suspeita', 'Mapa do deserto', 'Arena neon', 'Ilha do battle royale', 'Obby nas nuvens', 'Fliperama', 'Corrida de kart']],
  ['musica', 'Música e álbuns', ['Lo-fi de madrugada', 'Show de rock', 'Baile do grave', 'Pôr do sol sertanejo', 'Palco de k-pop', 'Trap na quebrada', 'Synthwave', 'Bossa na praia']],
  ['diversos', 'Temas diversos', ['Galáxia', 'Praia', 'Cidade na chuva', 'Aurora na montanha', 'Beco cyberpunk', 'Floresta mágica', 'Café chuvoso', 'Recife de coral']],
  ['animais', 'Animais', ['Pilha de gatos', 'Vira-lata caramelo', 'Capivaras zen', 'Pinguins', 'Raposas no outono', 'Axolotes', 'Pandas', 'Sapo de touca']],
  ['desenhos', 'Desenhos', ['Céu de anime', 'Cartoon anos 30', 'Kawaii', 'Pop art', 'Aquarela', 'Pixel art', 'Grafite', 'Recorte de papel']],
  ['codigo', 'Código e dev', ['Terminal', 'Editor dark', 'Placa de circuito', 'Sala de servidores', 'Caçando bug', 'Árvore do git', 'Setup pixel', 'Galáxia binária']],
];

/** 'banners/perfil/animais-3.jpg' → ['animais', 3] */
export function partesDoBanner(src) {
  const m = /^banners\/perfil\/([a-z]+)-([1-8])\.jpg$/.exec(src ?? '');
  return m ? [m[1], Number(m[2])] : [CATEGORIAS[0][0], 1];
}

export const nomeDoBanner = (src) => {
  const [cat, n] = partesDoBanner(src);
  return CATEGORIAS.find((c) => c[0] === cat)?.[2][n - 1] ?? '';
};

/** [fundo, letra] da etiqueta de raridade */
export const RARIDADE = { COMUM: ['#efe8d8', '#1b1f33'], RARA: ['#b6c8ee', '#1b1f33'], 'ÉPICA': ['#d9c2ec', '#1b1f33'], 'LENDÁRIA': ['#f2c14e', '#1b1f33'], SECRETA: ['#1b1f33', '#f2c14e'] };

/** Medalhas que a staff dá depois de um evento: [id, nome, quantas pra ganhar] */
export const MEDALHAS_EVENTO = [['construtor', 'Mestre dos Blocos', 10], ['detetive', 'Detetive Espacial', 5], ['mira-ouro', 'Mira de Ouro', 1], ['sobrevivente', 'Último de Pé', 1], ['foliao', 'Folião', 3]];

export const imagemDaMedalha = (id) => `banners/medalhas/${id}.png`;

/** "1.284", "32 h" */
export const numeroBonito = (n) => Number(n || 0).toLocaleString('pt-BR');

// ---------- Banner e foto: de onde vêm ----------
export const COR_SEM_BANNER = '#4a63c9';
export const TIPOS_DE_IMAGEM = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_ARQUIVO = 8 * 1024 * 1024;

/** Mensagem do que está errado no link, ou '' se ele serve */
export const erroDoLink = (texto) => (/^https:\/\/\S+$/i.test(texto.trim()) ? '' : 'O link tem que começar com https://');

/** Mensagem do que está errado no arquivo, ou '' se ele serve */
export function erroDoArquivo(arquivo) {
  if (!TIPOS_DE_IMAGEM.includes(arquivo.type)) return 'Formato não rola. Usa PNG, JPG, GIF ou WEBP.';
  return arquivo.size > MAX_ARQUIVO ? 'Passou de 8 MB. O Discord não deixa.' : '';
}

/** Nome do arquivo que o /perfil manda (a mesma regra do bot) */
export function nomeDaCarteirinha(nome, gif) {
  const limpo = String(nome ?? '')
    .normalize('NFKC')
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}‍️⃣]/gu, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
  return `perfil-${limpo.slice(0, 40).replace(/^-+|-+$/g, '') || 'membro'}.${gif ? 'gif' : 'png'}`;
}

// ---------- Aparência do cartão (v12): as mesmas listas do bot (lib/aparencia.js) ----------
/** [fonte, nome, tamanho no cartão grande (px), tamanho na amostra (px)] */
export const FONTES_NOME = [
  ['Graduate', 'Uniforme', 24, 20], ['Bricolage Grotesque', 'Moderna', 26, 20], ['Permanent Marker', 'Marcador', 26, 20], ['Caveat', 'Caderno', 32, 24],
  ['Pacifico', 'Cursiva', 24, 19], ['Bungee', 'Fliperama', 22, 17], ['Press Start 2P', 'Pixel', 15, 11], ['JetBrains Mono', 'Código', 22, 18],
];
export const DEGRADES = [['#C4363C', '#F2C14E'], ['#5865F2', '#FF6EC7'], ['#2ECC71', '#3498DB'], ['#FF8A00', '#E52E71'], ['#9B59B6', '#F1C40F'], ['#00C9FF', '#92FE9D']];
export const FUNDOS = ['#FFFCF4', '#EFE8D8', '#F5C6D6', '#C8E6C0', '#B6C8EE', '#F3D48A', '#D9C2EC', '#1F2A5C', '#1B1F33'];
export const CORES_NOME = ['#1B1F33', '#FFFCF4', '#C4363C', '#F2C14E', '#5865F2', '#2ECC71', '#FF6EC7', '#9B59B6'];
export const DESTAQUES = ['#C4363C', '#F2C14E', '#1F2A5C', '#2F8F5B', '#5865F2', '#FF6EC7', '#9B59B6'];
// nome '' = a cor do texto do cartão (clara ou escura, conforme o fundo)
export const AP_PADRAO = { fundo: '#FFFCF4', nome: '', nomeTipo: 'solida', grad: 0, fonte: 'Graduate', destaque: '#C4363C' };
export const VISIBILIDADES = [['oculto', 'Esconder'], ['data', 'Só dia e mês'], ['idade', 'Data e idade']];

/** Cor do texto do cartão: clara em fundo escuro (luminância abaixo de 0,3), tinta em fundo claro */
export function textoSobre(fundo) {
  const canal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const ok = /^#[0-9a-f]{6}$/i.test(fundo ?? '');
  const lum = ok ? [1, 3, 5].reduce((a, i, k) => a + canal(parseInt(fundo.slice(i, i + 2), 16) / 255) * [0.2126, 0.7152, 0.0722][k], 0) : 1;
  const escuro = lum < 0.3;
  return { escuro, txt: escuro ? '#FFFCF4' : '#1B1F33', sub: escuro ? '#C9CBE0' : '#5A5E6E' };
}

/**
 * CSS do nome: fonte, tamanho e cor (ou degradê recortado no texto).
 * escala: 1 no cartão grande, 0.72 no pequeno e na prévia do Discord. unidade: 'px' ou 'var(--u)' (prévia que encolhe junto).
 */
export function estiloDoNome(ap, corDoTexto, escala = 1, unidade = 'px') {
  const [fonte, , tam] = FONTES_NOME.find((f) => f[0] === ap.fonte) ?? FONTES_NOME[0];
  const n = Math.round(tam * escala);
  const tamanho = unidade === 'px' ? `${n}px` : `calc(${n} * ${unidade})`;
  const [c1, c2] = DEGRADES[ap.grad] ?? DEGRADES[0];
  const cor = ap.nomeTipo === 'degrade'
    ? `color:transparent;background-image:linear-gradient(90deg, ${c1}, ${c2});-webkit-background-clip:text;background-clip:text;`
    : `color:${ap.nome || corDoTexto};`;
  return `font-family:'${fonte}', sans-serif;font-size:${tamanho};font-weight:400;${cor}`;
}

/** "14/05 · 22 anos", "14/05" ou null (escondido ou sem cadastro). niver = { d: 'dd/mm', ano } */
export function textoDoAniversario(niver, vis, hoje = new Date()) {
  if (!niver || vis === 'oculto') return null;
  if (vis !== 'idade' || !niver.ano) return niver.d;
  const [dia, mes] = niver.d.split('/').map(Number);
  const m = hoje.getMonth() + 1, d = hoje.getDate();
  return `${niver.d} · ${hoje.getFullYear() - niver.ano - (m < mes || (m === mes && d < dia) ? 1 : 0)} anos`;
}

/** Cor dos rótulos (ANIVERSÁRIO, TROFÉUS…): o destaque, ou a cor do texto se o destaque some no fundo (a mesma regra do bot) */
export function corDeDestaque(ap) {
  const canal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = (h) => (/^#[0-9a-f]{6}$/i.test(h ?? '') ? [1, 3, 5].reduce((a, i, k) => a + canal(parseInt(h.slice(i, i + 2), 16) / 255) * [0.2126, 0.7152, 0.0722][k], 0) : 1);
  const a = lum(ap.destaque), b = lum(ap.fundo);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) < 3 ? textoSobre(ap.fundo).txt : ap.destaque;
}

/** Comandos do perfil que respondem com imagem: [id, como aparece, o que mostra] */
export const COMANDOS_PERFIL = [
  ['perfil', '/perfil', 'Carteirinha resumida'],
  ['completo', '/perfil completo', 'Tudo: aniversário e troféus'],
  ['trofeus', '/trofeus', 'Medalhas e troféus do servidor'],
  ['niver', '/aniversario ver', 'Data e idade, se for público'],
];
