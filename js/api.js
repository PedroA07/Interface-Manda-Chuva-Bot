// Conversa com a API do bot. O endereço e a senha ficam salvos neste navegador; o endereço padrão vem do config.js.
const NESTE_PC = ['localhost', '127.0.0.1'].includes(location.hostname);

export const conexao = {
  api: localStorage.getItem('mc_api') || (NESTE_PC ? 'http://localhost:3000' : window.MANDA_CHUVA?.api) || 'http://localhost:3000',
  senha: localStorage.getItem('mc_senha') ?? sessionStorage.getItem('mc_senha') ?? '',
};

/** Bot rodando neste PC: lá ele pode não ter senha, então dá pra tentar entrar direto */
export const apiNestePc = () => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(conexao.api);

export class ErroSenha extends Error {}

export async function chamar(caminho, corpo) {
  let r;
  try {
    r = await fetch(conexao.api + caminho, {
      method: corpo ? 'POST' : 'GET',
      headers: { 'X-Painel': '1', 'Content-Type': 'application/json', ...(conexao.senha && { Authorization: `Bearer ${conexao.senha}` }) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new Error(`Não consegui falar com o bot em ${conexao.api}. Na hospedagem grátis ele pode estar acordando (leva até 1 minuto): tente de novo. Se continuar, confira o endereço e se este site está no PAINEL_ORIGENS do bot.`);
  }
  const json = await r.json().catch(() => ({}));
  if (r.status === 401) throw new ErroSenha(json.erro || 'Senha errada.');
  if (!r.ok) throw new Error(json.erro || `Erro ${r.status}`);
  return json;
}

export function guardarAcesso(api, senha, lembrar) {
  conexao.api = api;
  conexao.senha = senha;
  localStorage.setItem('mc_api', api);
  const [guardar, limpar] = lembrar ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  guardar.setItem('mc_senha', senha);
  limpar.removeItem('mc_senha');
}

export function esquecerSenha() {
  localStorage.removeItem('mc_senha');
  sessionStorage.removeItem('mc_senha');
  conexao.senha = '';
}
