// Coisas da página inicial e da Central que conversam com o bot (sem login)
const API = localStorage.getItem('mc_api') || window.MANDA_CHUVA?.api || 'https://manda-chuva-bot.onrender.com';

/** Link de convite do bot (vem do /saude). null se o bot estiver dormindo. */
export async function convite() {
  try {
    const r = await fetch(`${API}/saude`, { signal: AbortSignal.timeout(60_000) });
    return r.ok ? ((await r.json()).convite ?? null) : null;
  } catch {
    return null;
  }
}
