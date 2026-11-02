// Regras sem tela (testadas com node --test): cores, botões, imagens e paginação

export const HEX = /^#[0-9a-f]{6}$/i;
export const MAX_CORES = 24;
export const hexOk = (h) => (HEX.test(h || '') ? h : '#99AAB5');

/** O que a pessoa digitou num campo de cor: põe # e deixa maiúsculo quando já é uma cor válida */
export function hexEntrada(v) {
  let t = String(v ?? '').trim();
  if (t && !t.startsWith('#')) t = `#${t}`;
  return HEX.test(t) ? t.toUpperCase() : t;
}

export const rgbDe = (h) => [1, 3, 5].map((k) => parseInt(hexOk(h).slice(k, k + 2), 16));
export const hexDeRgb = (a) => `#${a.map((n) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

// O Discord só tem 4 estilos de botão
export const ESTILOS = { Secondary: ['cinza', '#4e5058'], Primary: ['azul', '#5865f2'], Success: ['verde', '#248046'], Danger: ['vermelho', '#da373c'] };

/** Estilo de botão mais parecido com a cor, pelo matiz (a mesma regra do bot) */
export function estiloMaisProximo(hex) {
  const [r, g, b] = rgbDe(hex);
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  if (d < 40) return 'Secondary';
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 20 || h >= 330) return 'Danger';
  if (h >= 75 && h < 170) return 'Success';
  if (h >= 185 && h < 290) return 'Primary';
  return 'Secondary';
}

/** Como o botão da cor aparece: nome do modo, fundo, bolinha (cor) e o fundo usado quando tem bolinha */
export function botaoDaCor(c) {
  const modo = c.botaoModo || 'discord';
  if (modo === 'discord') return { nome: ESTILOS[c.estilo][0], bg: ESTILOS[c.estilo][1], bolinha: '', base: '' };
  const hex = modo === 'cargo' ? hexOk(c.hex) : hexOk(c.botaoHex || c.hex);
  const [base, bg] = ESTILOS[estiloMaisProximo(hex)];
  return { nome: modo === 'cargo' ? 'cor do cargo' : 'cor própria', bg, bolinha: hex, base };
}

export const fundoDaCor = (c) => (c.tipo === 'degrade' ? `linear-gradient(120deg, ${hexOk(c.hex)}, ${hexOk(c.hex2 || '#FFFFFF')})` : hexOk(c.hex));

// ---------- Imagens ----------
// Na config: '' = padrão do lugar, 'none' = sem imagem, 'banners/…' (modelo), 'https://…' ou 'anexo:<id>'

// Banners "Eventos" que o bot desenha com o nome do servidor na placa
const PLACA = /^banners\/eventos\/(painel|entrada|saida|expulsao|ban|silencio|news|aniversario)\.jpg$/;

/** Endereço pra mostrar a imagem no painel, ou null quando é "sem imagem" */
export function urlImagem(ref, padrao, api) {
  const r = ref || padrao;
  if (!r || r === 'none') return null;
  if (r.startsWith('anexo:')) return `${api}/anexos/${r.slice(6)}`;
  const placa = PLACA.exec(r);
  if (placa) return `${api}/placas/${placa[1]}.jpg`;
  return r;
}

export function origemImagem(ref, padrao) {
  const r = ref || padrao;
  if (!r || r === 'none') return 'NENHUMA';
  if (r.startsWith('anexo:')) return 'ANEXO';
  if (/^https?:/.test(r)) return 'LINK';
  return /\.gif$/i.test(r) ? 'MODELO · GIF' : 'MODELO';
}

// ---------- Paginação ----------
/** Uma página da lista. nums tem '…' quando são mais de 7 páginas (1, atual±1, última). */
export function paginar(lista, pagina, porPagina) {
  const n = lista.length;
  const paginas = Math.max(1, Math.ceil(n / porPagina));
  const pg = Math.min(Math.max(1, pagina || 1), paginas);
  let ids = Array.from({ length: paginas }, (_, i) => i + 1);
  if (paginas > 7) {
    const mostrar = [...new Set([1, paginas, pg - 1, pg, pg + 1])].filter((x) => x >= 1 && x <= paginas).sort((a, b) => a - b);
    ids = [];
    let ultimo = 0;
    for (const x of mostrar) {
      if (x - ultimo > 1) ids.push('…');
      ids.push(x);
      ultimo = x;
    }
  }
  return {
    itens: lista.slice((pg - 1) * porPagina, pg * porPagina),
    pagina: pg,
    paginas,
    multi: paginas > 1,
    vazio: n === 0,
    info: n ? `Mostrando ${(pg - 1) * porPagina + 1}–${Math.min(pg * porPagina, n)} de ${n}` : '',
    temAnterior: pg > 1,
    temProxima: pg < paginas,
    nums: ids.map((x) => ({ n: x, atual: x === pg })),
  };
}

// ---------- Notícias ----------
/** Compara "3.10.0" com "3.9.0" como números */
export function compararVersoes(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

/** Notícias mais novas que a última lida (sem nada lido: todas) */
export const naoLidas = (lista, lido) => lista.filter((n) => !lido || compararVersoes(n.versao, lido) > 0);

const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
/** '02/11/2026' → '02 NOV' */
export function dataCurta(data) {
  const [d, m] = String(data).split('/');
  return `${d} ${MESES_CURTOS[Number(m) - 1] ?? ''}`.trim();
}
