// Central do Bot: abas pelo endereço (#termos, #privacidade...), tabelas, status do bot, convite e o checklist de verificação
import { convite } from './site.js';

const API = localStorage.getItem('mc_api') || window.MANDA_CHUVA?.api || 'https://manda-chuva-bot.onrender.com';
const ABAS = ['apresentacao', 'termos', 'privacidade', 'suporte', 'checklist'];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function mostrarAba() {
  const id = ABAS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'apresentacao';
  for (const a of ABAS) document.getElementById(a).hidden = a !== id;
  for (const el of document.querySelectorAll('.ct-aba')) el.classList.toggle('ativa', el.getAttribute('href') === `#${id}`);
  // Sem pular pra seção: a aba fica no topo
  if (location.hash) scrollTo({ top: 0 });
}
addEventListener('hashchange', mostrarAba);
mostrarAba();

// ---------- Comandos ----------
const QUEM = { todos: '#b9dcb0', staff: '#b6c8ee', admin: '#f5b5a8' };
const COMANDOS = [
  ['/cor', 'Escolhe (ou tira) a cor do seu nome.', 'todos'],
  ['/aniversario cadastrar dia mes [ano]', 'Cadastra seu aniversário. Ano opcional.', 'todos'],
  ['/aniversario ver [@membro]', 'Mostra o aniversário em imagem, do jeito que a pessoa deixou ver.', 'todos'],
  ['/aniversario apagar', 'Tira seu aniversário da lista.', 'todos'],
  ['/perfil [@membro] [completo]', 'Mostra a carteirinha em imagem (GIF se o banner ou a foto for animado). Com completo, vem também aniversário e troféus.', 'todos'],
  ['/trofeus [@membro]', 'Os troféus (medalhas ganhas) em imagem.', 'todos'],
  ['/favoritos [@membro]', 'Jogos, filmes, livros e músicas favoritos, com capa, em imagem.', 'todos'],
  ['/medalhas', 'Lista suas medalhas e o progresso.', 'todos'],
  ['/ticket abrir | fechar', 'Abre ou fecha um ticket com a staff.', 'todos'],
  ['/ticket add | remover | assumir | renomear', 'Gerencia o ticket atual.', 'staff'],
  ['/ticket painel | config', 'Envia o menu de tickets e mostra o link da configuração.', 'admin'],
  ['/medalha @membro medalha', 'Dá (ou tira) uma medalha de evento.', 'staff'],
  ['/tema simular <festa>', 'Prévia de uma festa antes da data.', 'staff'],
  ['/regras', 'Mostra as regras do servidor, só pra você.', 'todos'],
  ['/privacidade ver | apagar', 'Mostra ou apaga os seus dados guardados.', 'todos'],
  ['/painel', 'Link do painel do site.', 'todos'],
];
document.getElementById('comandos').innerHTML = COMANDOS.map(([cmd, desc, quem]) => `<div class="ct-linha comando"><code>${esc(cmd)}</code><span>${esc(desc)}</span><span class="ct-quem" style="--c:${QUEM[quem]}">${quem}</span></div>`).join('');

// ---------- Retenção ----------
const DADOS = [
  ['Configurações do servidor', 'Fazer o bot funcionar no servidor', 'Enquanto o bot estiver no servidor'],
  ['Aniversário', 'Mensagem automática no dia', 'Até você apagar'],
  ['Perfil e medalhas', 'Mostrar no site e no /perfil', 'Até você apagar'],
  ['Imagens enviadas pro perfil', 'Mostrar no site e no /perfil', 'Até você trocar ou apagar; a staff pode tirar antes'],
  ['Transcrição de ticket', 'Comprovante pra staff e pra você', 'Só no canal de logs e na sua DM (o bot guarda o resumo dos últimos 200)'],
  ['Livro de ocorrências', 'Histórico de moderação', 'As últimas 300; avisos valem 30 dias'],
  ['Sessão do painel', 'Manter você logado', '7 dias, no seu navegador'],
];
document.getElementById('retencao').innerHTML = DADOS.map(([o, p, t]) => `<div class="ct-linha dado"><b>${esc(o)}</b><span>${esc(p)}</span><span class="ct-cinza">${esc(t)}</span></div>`).join('');

// ---------- Status e convite (do /saude do bot) ----------
const status = document.getElementById('status');
fetch(`${API}/saude`, { signal: AbortSignal.timeout(60_000) })
  .then((r) => r.json())
  .then((s) => (status.textContent = s.bot === 'online' ? `🟢 acordado · versão ${s.versao}` : `🔴 dormindo · versão ${s.versao}`))
  .catch(() => (status.textContent = '🟡 não respondeu (pode estar acordando)'));
convite().then((link) => link && document.querySelectorAll('.js-convite').forEach((a) => (a.href = link)));

// ---------- Checklist de verificação ----------
const GRUPOS = [
  ['O que o Discord confere no app', [
    ['termos', 'Link público dos Termos de Uso', 'Colado em Developer Portal › General Information › Terms of Service URL (este site, #termos).'],
    ['privacidade', 'Link público da Política de Privacidade', 'Colado em Privacy Policy URL (este site, #privacidade). Precisa citar as intents usadas.'],
    ['descricao', 'Descrição, tags e ícone do app', 'Mascote como ícone, banner do perfil e descrição curta em português.'],
    ['convite', 'Convite com permissões mínimas', 'Sem Administrador. Só o que o bot usa de verdade.'],
    ['suporte', 'Servidor de suporte', 'Link na descrição e na página de suporte.'],
    ['apagar', 'Comando para apagar dados', '/privacidade apagar remove aniversário, perfil e medalhas.'],
  ]],
  ['Dono e equipe', [
    ['dono2fa', 'Autenticação em duas etapas na conta dona', 'Obrigatório para quem gerencia o app.'],
    ['time', 'App dentro de um Time do Developer Portal', 'Facilita trocar de dono e dar acesso à staff técnica.'],
    ['identidade', 'Verificação de identidade do dono', 'O Discord pede no momento da verificação.'],
  ]],
  ['Intents e escala', [
    ['membros', 'Justificativa da intent Server Members', 'Boas-vindas, saídas, aniversários e cargos de cor.'],
    ['conteudo', 'Justificativa da intent Message Content', 'Só a transcrição dos tickets. Se der pra viver sem, melhor.'],
    ['servidores', 'Pedir verificação ao chegar perto de 100 servidores', 'Sem verificação, o bot para de entrar em servidores novos.'],
  ]],
];
// Já prontos no projeto: termos e privacidade públicos aqui, convite sem Administrador e o /privacidade apagar
const PADRAO = { termos: true, privacidade: true, convite: true, apagar: true };
const marcados = { ...PADRAO, ...JSON.parse(localStorage.getItem('mc_checklist') || '{}') };
function desenharChecklist() {
  const todos = GRUPOS.flatMap((g) => g[1]);
  const feitos = todos.filter(([k]) => marcados[k]).length;
  document.getElementById('ck-feitos').textContent = `${feitos}/${todos.length}`;
  document.getElementById('ck-texto').textContent = feitos === todos.length ? 'Tudo pronto. Pode pedir a verificação.' : `Faltam ${todos.length - feitos} itens para pedir a verificação.`;
  document.getElementById('ck-barra').style.width = `${Math.round((feitos / todos.length) * 100)}%`;
  document.getElementById('ck-grupos').innerHTML = GRUPOS.map(([t, itens]) => `<div style="display:grid;gap:8px"><h2 class="ct-h3">${esc(t)}</h2><div class="ct-tabela">${itens
    .map(([k, ti, d]) => `<button type="button" class="ct-item${marcados[k] ? ' feito' : ''}" data-k="${k}"><i>${marcados[k] ? '✓' : ''}</i><span style="display:grid;gap:2px"><b>${esc(ti)}</b><span style="font-size:14px" class="ct-cinza">${esc(d)}</span></span></button>`)
    .join('')}</div></div>`).join('');
}
document.getElementById('ck-grupos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  marcados[b.dataset.k] = !marcados[b.dataset.k];
  localStorage.setItem('mc_checklist', JSON.stringify(marcados));
  desenharChecklist();
});
desenharChecklist();
