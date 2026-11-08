// Coisas da página inicial e da Central que conversam com o bot (sem login)
const API = localStorage.getItem('mc_api') || window.MANDA_CHUVA?.api || 'https://manda-chuva-bot.onrender.com';

/**
 * Link de convite do bot (vem do /saude). Bot dormindo ou sem resposta: o /convite do próprio bot, que acorda ele,
 * monta o link do Discord na hora e confirma a entrada no servidor.
 */
export async function convite() {
  try {
    const r = await fetch(`${API}/saude`, { signal: AbortSignal.timeout(60_000) });
    return (r.ok && (await r.json()).convite) || `${API}/convite`;
  } catch {
    return `${API}/convite`;
  }
}
