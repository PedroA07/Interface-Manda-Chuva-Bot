// Regras pequenas da aba Cargos › Membros e Moderação

/** Cor da etiqueta de cada tipo de ocorrência (README do design) */
export const COR_TIPO = { AVISO: '#f3d48a', SILÊNCIO: '#b6c8ee', EXPULSÃO: '#f5b5a8', BAN: '#c4363c', 'AUTO-MOD': '#d9c2ec' };

export const SILENCIOS = [['10min', '10 min'], ['1h', '1 hora'], ['1d', '1 dia'], ['7d', '7 dias'], ['28d', '28 dias']];

const MIN = 60_000, H = 60 * MIN, DIA = 24 * H;
const plural = (n, um, varios) => `há ${n} ${n === 1 ? um : varios}`;

/** "há 2 h", "ontem", "há 3 semanas"... */
export function tempoRelativo(ts, agora = Date.now()) {
  const d = agora - ts;
  if (d < MIN) return 'agora';
  if (d < H) return `há ${Math.floor(d / MIN)} min`;
  if (d < DIA) return `há ${Math.floor(d / H)} h`;
  if (d < 2 * DIA) return 'ontem';
  if (d < 7 * DIA) return `há ${Math.floor(d / DIA)} dias`;
  if (d < 30 * DIA) return plural(Math.floor(d / (7 * DIA)), 'semana', 'semanas');
  if (d < 365 * DIA) return plural(Math.floor(d / (30 * DIA)), 'mês', 'meses');
  return plural(Math.floor(d / (365 * DIA)), 'ano', 'anos');
}

/** Fim do silêncio, no horário de Brasília: "até 14:30" (hoje) ou "até 05/11" */
export function ateQuando(ts, agora = Date.now()) {
  const fmt = (o) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(ts);
  const mesmoDia = fmt({ dateStyle: 'short' }) === new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short' }).format(agora);
  return `até ${mesmoDia ? fmt({ hour: '2-digit', minute: '2-digit' }) : fmt({ day: '2-digit', month: '2-digit' })}`;
}
