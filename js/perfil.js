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
