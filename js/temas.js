// Datas festivas no painel: as mesmas regras do bot (lib/temas.js lá), pra prévia, calendário e simulação

export const FESTAS = ['natal', 'ano', 'halloween', 'carnaval', 'pascoa', 'namorados', 'junina', 'estudante', 'criancas', 'niver'];
const ONDE = { painel: 'painel', news: 'news', entrada: 'portaria', saida: 'portaria', expulsao: 'portaria', ban: 'portaria', silencio: 'portaria' };
const dois = (n) => String(n).padStart(2, '0');

export function pascoaDe(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return { dia: (n % 31) + 1, mes: Math.floor(n / 31), ano };
}

const somarDias = ({ dia, mes, ano }, dias) => {
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias));
  return `${dois(d.getUTCDate())}/${dois(d.getUTCMonth() + 1)}`;
};

/** Período do tema naquele ano (Carnaval: Páscoa −50 a −46; Páscoa: −2 a 0) */
export function datasDoTema(t, ano) {
  if (t.movel === 'carnaval') return { ini: somarDias(pascoaDe(ano), -50), fim: somarDias(pascoaDe(ano), -46) };
  if (t.movel === 'pascoa') return { ini: somarDias(pascoaDe(ano), -2), fim: somarDias(pascoaDe(ano), 0) };
  return { ini: t.ini, fim: t.fim };
}

/** 'dd/mm' → mmdd, ou null */
export function chaveDia(x) {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec((x || '').trim());
  return m && +m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31 ? +m[2] * 100 + +m[1] : null;
}

const diaDoAno = (k) => Math.round((Date.UTC(2025, Math.floor(k / 100) - 1, k % 100) - Date.UTC(2025, 0, 1)) / 864e5);
const duracao = (a, b) => (diaDoAno(b) >= diaDoAno(a) ? diaDoAno(b) - diaDoAno(a) + 1 : 365 - diaDoAno(a) + diaDoAno(b) + 1);

function cobre(t, dia, mes, ano) {
  const { ini, fim } = datasDoTema(t, ano);
  const a = chaveDia(ini), b = chaveDia(fim), k = mes * 100 + dia;
  if (a == null || b == null) return null;
  return (a <= b ? k >= a && k <= b : k >= a || k <= b) ? duracao(a, b) : null;
}

/** Tema que vale no dia (o de período menor ganha; empate: aviso personalizado, depois a ordem) */
export function temaAtivo(temas, hoje) {
  if (!temas?.auto) return null;
  const c = [];
  temas.lista.forEach((t, i) => {
    const dias = t.on ? cobre(t, hoje.dia, hoje.mes, hoje.ano) : null;
    if (dias != null) c.push({ t, i, dias });
  });
  c.sort((x, y) => x.dias - y.dias || (y.t.custom ? 1 : 0) - (x.t.custom ? 1 : 0) || x.i - y.i);
  return c[0]?.t ?? null;
}

/** Dias até o tema começar de novo (0 = hoje) e em que ano */
export function diasAte(t, hoje) {
  const hoje0 = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
  for (const ano of [hoje.ano, hoje.ano + 1]) {
    const k = chaveDia(datasDoTema(t, ano).ini);
    if (k == null) return null;
    const d = Date.UTC(ano, Math.floor(k / 100) - 1, k % 100);
    if (d >= hoje0) return Math.round((d - hoje0) / 864e5);
  }
  return null;
}

/** Ano da próxima vez que o tema acontece (pra mostrar as datas móveis) */
export function anoDoProximo(t, hoje) {
  const fimEsteAno = chaveDia(datasDoTema(t, hoje.ano).fim);
  return fimEsteAno != null && fimEsteAno < hoje.mes * 100 + hoje.dia && !(chaveDia(datasDoTema(t, hoje.ano).ini) > fimEsteAno) ? hoje.ano + 1 : hoje.ano;
}

/** Temas ligados que caem em algum dia do mês (pro calendário; olha todos os dias, senão data de 1 dia some) */
export const temasDoMes = (temas, mes, ano) => temas.lista.filter((t) => t.on && Array.from({ length: 31 }, (_, i) => i + 1).some((d) => cobre(t, d, mes, ano) != null));

export const bannerDoTema = (t, tipo) => t.msgs?.[tipo] || (FESTAS.includes(t.id) ? `banners/festas/${t.id}-${tipo}.gif` : t.banner || 'banners/tema-aviso.gif');
export const padraoDoTema = (t, tipo) => (FESTAS.includes(t.id) ? `banners/festas/${t.id}-${tipo}.gif` : t.banner || 'banners/tema-aviso.gif');

/** Como o tema muda uma mensagem (null quando não vale pra ela). respeitar: só troca imagem que está no padrão. */
export function aplicarTema(tipo, imgs, t, respeitar) {
  if (!t || !t.onde?.[ONDE[tipo]]) return null;
  const festa = FESTAS.includes(t.id);
  const troca = (ref) => !respeitar || !ref;
  return {
    imgs: { ...imgs, topo: troca(imgs.topo) ? bannerDoTema(t, tipo) : imgs.topo, mini: festa && troca(imgs.mini) ? `banners/mini/${t.id}.jpg` : imgs.mini },
    cor: t.cor,
    frase: t.frase,
    cardBg: festa ? `banners/festas/card-${t.id}.jpg` : null,
  };
}

/** Hoje (do bot, que conta no horário de Brasília; sem bot, o do navegador) */
export function hojeDe(estado) {
  if (estado?.servidor?.hoje) return estado.servidor.hoje;
  const d = new Date();
  return { dia: d.getDate(), mes: d.getMonth() + 1, ano: d.getFullYear() };
}

/** Tema que as prévias mostram: o simulado ou o do dia */
export function temaDaPrevia(cfg, estado, ui) {
  if (ui.tmSim) return cfg.temas.lista.find((t) => t.id === ui.tmSim) ?? null;
  return temaAtivo(cfg.temas, hojeDe(estado));
}
