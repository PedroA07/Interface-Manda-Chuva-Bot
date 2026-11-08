// Conversa com a API do bot. O endereço, a sessão do Discord e a senha ficam salvos neste navegador;
// o endereço padrão vem do config.js.
const NESTE_PC = ['localhost', '127.0.0.1'].includes(location.hostname);

export const conexao = {
  api: localStorage.getItem('mc_api') || (NESTE_PC ? 'http://localhost:3000' : window.MANDA_CHUVA?.api) || 'http://localhost:3000',
  sessao: localStorage.getItem('mc_sessao') ?? '',
  senha: localStorage.getItem('mc_senha') ?? sessionStorage.getItem('mc_senha') ?? '',
  // Servidor que o painel está mexendo (cada servidor tem a própria config e os próprios dados)
  servidor: localStorage.getItem('mc_servidor') ?? '',
};

/** Troca o servidor da vez: vai em toda chamada como X-Servidor e fica lembrado neste navegador */
export function usarServidor(id) {
  conexao.servidor = id || '';
  if (id) localStorage.setItem('mc_servidor', id);
  else localStorage.removeItem('mc_servidor');
}

/** Bot rodando neste PC: lá ele pode não ter senha, então dá pra tentar entrar direto */
export const apiNestePc = () => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(conexao.api);

export class ErroSenha extends Error {}

/** Pede ao bot. semServidor: não manda o X-Servidor (a lista de servidores da pessoa não depende dele) */
export async function chamar(caminho, corpo, { semServidor = false } = {}) {
  let r;
  const auth = conexao.sessao ? `Sessao ${conexao.sessao}` : conexao.senha ? `Bearer ${conexao.senha}` : null;
  try {
    r = await fetch(conexao.api + caminho, {
      method: corpo ? 'POST' : 'GET',
      headers: { 'X-Painel': '1', 'Content-Type': 'application/json', ...(auth && { Authorization: auth }), ...(conexao.servidor && !semServidor && { 'X-Servidor': conexao.servidor }) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error(`Não consegui falar com o bot em ${conexao.api}. Na hospedagem grátis ele pode estar acordando (leva até 1 minuto): tente de novo. Se continuar, confira o endereço e se este site está no PAINEL_ORIGENS do bot.`);
  }
  const json = await r.json().catch(() => ({}));
  if (r.status === 401) throw new ErroSenha(json.erro || 'Senha errada.');
  if (!r.ok) throw Object.assign(new Error(json.erro || `Erro ${r.status}`), { status: r.status });
  return json;
}

/** /saude do bot (público): diz se o login com Discord está ligado */
export async function saude() {
  try {
    const r = await fetch(`${conexao.api}/saude`);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** Manda pro Discord: o bot autoriza e volta pra esta página com #sessao=... */
export function entrarComDiscord() {
  const volta = location.href.split('#')[0];
  location.href = `${conexao.api}/auth/entrar?volta=${encodeURIComponent(volta)}`;
}

const ERROS_LOGIN = {
  'login-desligado': 'O login com Discord ainda não foi ligado no bot (falta o DISCORD_CLIENT_SECRET). Por enquanto, entre com a senha do painel.',
  cancelado: 'Login cancelado. Quando quiser, é só clicar de novo.',
  'fora-do-servidor': 'Sua conta não está em nenhum servidor do bot. Entre num deles e tente de novo.',
  discord: 'O Discord não respondeu direito. Tente de novo daqui a pouco.',
};

/** Volta do Discord: guarda a sessão (#sessao=) ou devolve o erro (#erro=), e limpa o endereço */
export function lerVoltaDoLogin() {
  const h = new URLSearchParams(location.hash.slice(1));
  const sessao = h.get('sessao'), erro = h.get('erro');
  if (!sessao && !erro) return null;
  history.replaceState(null, '', location.pathname + location.search);
  if (sessao) {
    guardarSessao(sessao);
    return { ok: true };
  }
  return { erro: ERROS_LOGIN[erro] ?? 'Não deu pra entrar com o Discord.' };
}

export function guardarSessao(token) {
  conexao.sessao = token;
  localStorage.setItem('mc_sessao', token);
}

export function guardarAcesso(api, senha, lembrar) {
  conexao.api = api;
  conexao.senha = senha;
  conexao.sessao = '';
  localStorage.removeItem('mc_sessao');
  localStorage.setItem('mc_api', api);
  const [guardar, limpar] = lembrar ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  guardar.setItem('mc_senha', senha);
  limpar.removeItem('mc_senha');
}

/** Sair: esquece a sessão e a senha deste navegador */
export function esquecerAcesso() {
  localStorage.removeItem('mc_senha');
  sessionStorage.removeItem('mc_senha');
  localStorage.removeItem('mc_sessao');
  conexao.senha = '';
  conexao.sessao = '';
}
