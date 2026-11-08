// Casca do painel: login (Discord ou senha), cabeçalho, abas de cada papel, barra de salvar e avisos
import { html, useCallback, useEffect, useMemo, useRef, useState } from '../vendor/preact-htm.js';
import { AbaCargos } from './abas/cargos.js';
import { AbaCores } from './abas/cores.js';
import { AbaNoticias } from './abas/noticias.js';
import { AbaPerfil } from './abas/perfil.js';
import { AbaPortaria } from './abas/portaria.js';
import { AbaRegras } from './abas/regras.js';
import { AbaServidor } from './abas/servidor.js';
import { AbaTemas } from './abas/temas.js';
import { AbaTickets } from './abas/tickets.js';
import { AbaTurma } from './abas/turma.js';
import { AbaPainel } from './abas/painel.js';
import { apiNestePc, chamar, conexao, entrarComDiscord, ErroSenha, esquecerAcesso, guardarAcesso, lerVoltaDoLogin, saude } from './api.js';
import { Ctx } from './estado.js';
import { hexOk, naoLidas } from './logica.js';
import { temaDaPrevia } from './temas.js';
import { Adesivo, LogoDiscord, Toggle } from './ui/basicos.js';
import { ListaSuspensa } from './ui/lista-suspensa.js';

const NOTICIAS = { id: 'news', nome: 'Notícias', cor: '#b6c8ee', Tela: AbaNoticias, badge: (estado, ui) => naoLidas(estado.noticias ?? [], ui.lido).length };
const PERFIL = { id: 'perfil', nome: 'Meu perfil', cor: '#f5c6d6', Tela: AbaPerfil };
const ABAS_STAFF = [
  NOTICIAS,
  { id: 'servidor', nome: 'Servidor', cor: '#e6d2b5', Tela: AbaServidor },
  { id: 'cores', nome: 'Cores', cor: '#f5b5a8', Tela: AbaCores },
  { id: 'cargos', nome: 'Cargos', cor: '#d9c2ec', Tela: AbaCargos },
  { id: 'regras', nome: 'Regras', cor: '#a8d8cf', Tela: AbaRegras },
  { id: 'painel', nome: 'Painel', cor: '#f3d48a', Tela: AbaPainel },
  { id: 'boas', nome: 'Portaria', cor: '#b9dcb0', Tela: AbaPortaria },
  { id: 'temas', nome: 'Temas', cor: '#f2b880', Tela: AbaTemas },
  { id: 'tickets', nome: 'Tickets', cor: '#c9e4f2', Tela: AbaTickets },
];
const ABAS_MEMBRO = [NOTICIAS, { id: 'membros', nome: 'Membros', cor: '#d9c2ec', Tela: AbaTurma }, PERFIL];
const ehStaff = (eu) => eu?.papel === 'staff' || eu?.papel === 'admin';
/** Abas de quem entrou: staff vê tudo (e Meu perfil, se entrou com o Discord); membro vê Notícias, Membros e Meu perfil */
const abasDe = (eu) => (ehStaff(eu) ? [...ABAS_STAFF, ...(eu.usuario ? [PERFIL] : [])] : ABAS_MEMBRO);


const Marca = () => html`
  <a class="marca" href="./" title="Página inicial" style="text-decoration:none">
    <img class="selo-mc" src="banners/bot/mascote-256.png" alt="Manda Chuva" />
    <div style="display:grid;gap:2px">
      <div class="marca-nome">MANDA CHUVA</div>
      <div class="marca-sub">PAINEL OFICIAL · EST. 2026</div>
    </div>
  </a>`;

/** Entrar com a senha do painel (o jeito antigo: dono do bot) */
function FormSenha({ aoEntrar, setMsg }) {
  const [api, setApi] = useState(conexao.api);
  const [senha, setSenha] = useState(conexao.senha);
  const [lembrar, setLembrar] = useState(true);
  const [indo, setIndo] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    if (/[^\x20-\x7e]/.test(senha)) return setMsg('Use na senha só letras sem acento, números e símbolos comuns.');
    setIndo(true);
    setMsg('');
    try {
      await aoEntrar(api.trim().replace(/\/+$/, ''), senha, lembrar);
    } catch (e2) {
      setMsg(e2.message);
    } finally {
      setIndo(false);
    }
  }
  return html`<form class="login-senha" onSubmit=${enviar}>
    <label class="rotulo">Endereço do bot
      <input class="campo" type="url" required placeholder="https://manda-chuva-bot.onrender.com" value=${api} onInput=${(e) => setApi(e.target.value)} />
    </label>
    <label class="rotulo">Senha do painel
      <input class="campo" type="password" autocomplete="current-password" placeholder="Vazio se o bot roda no seu PC sem senha" value=${senha} onInput=${(e) => setSenha(e.target.value)} />
    </label>
    <div class="linha-toggle"><${Toggle} on=${lembrar} onClick=${() => setLembrar(!lembrar)} titulo="Lembrar neste navegador" /><span>Lembrar neste navegador</span></div>
    <button class="btn navy sombra" style="padding:10px 16px" disabled=${indo}>${indo ? 'Conectando…' : 'Entrar com a senha'}</button>
  </form>`;
}

/** Tela de entrada (v9): mascote à esquerda, check-in com o Discord à direita */
function TelaLogin({ erro, aoEntrar }) {
  const [msg, setMsg] = useState(erro);
  const [login, setLogin] = useState(null); // null = conferindo; true/false = login com Discord ligado no bot
  const [comSenha, setComSenha] = useState(!!conexao.senha);
  useEffect(() => {
    saude().then((s) => setLogin(s ? !!s.login : null)); // bot dormindo: não sabe, deixa tentar
  }, []);
  return html`
    <div class="login-fundo">
      <div class="login-cartao">
        <div class="login-arte">
          <img src="banners/bot/mascote.png" alt="Mascote do Manda Chuva" />
          <span class="login-adesivo">matrícula aberta!</span>
        </div>
        <div class="login-lado">
          <div style="display:grid;gap:8px">
            <span class="rotulo" style="font-size:12px">Painel oficial · Manda Chuva</span>
            <h1 class="login-titulo">FAZ O CHECK-IN, CALOURO</h1>
            <p class="sub" style="max-width:44ch">Entra com a sua conta do Discord pra ver as notícias do servidor, quem tá na resenha e montar o seu perfil com banner e medalhas.</p>
          </div>
          <button type="button" class="btn-discord" disabled=${login === false} onClick=${entrarComDiscord}><${LogoDiscord} />Entrar com Discord</button>
          ${login === false && html`<span class="sb-erro" style="margin-top:-8px">O dono do bot ainda não ligou o login com Discord. Quem tem a senha do painel entra por ela aí embaixo.</span>`}
          <div class="login-veja">
            <b>O que o bot vai ver:</b>
            <span>✓ seu nome, foto e ID do Discord</span>
            <span>✓ os servidores em que você está (só pra achar o servidor do bot)</span>
            <span style="color:var(--cinza)">Nada de mensagens privadas, senha ou e-mail. Palavra de veterano.</span>
          </div>
          ${msg && html`<div class="erro-caixa">${msg}</div>`}
          ${comSenha ? html`<${FormSenha} aoEntrar=${aoEntrar} setMsg=${setMsg} />` : null}
          <div class="login-rodape">
            <button type="button" class="btn-link" style="font-size:13px" onClick=${() => setComSenha(!comSenha)}>${comSenha ? 'Esconder a senha do painel' : 'Entrar com a senha do painel'}</button>
            <span style="margin-left:auto"><a href="central.html#termos">Termos</a> · <a href="central.html#privacidade">Privacidade</a></span>
          </div>
        </div>
      </div>
    </div>`;
}

/** Quem entrou, no topo: foto (ou inicial), nome, ícone do Discord e o papel */
function QuemSou({ eu }) {
  const u = eu.usuario;
  const nome = u?.nome ?? 'Reitoria';
  return html`<div class="quem-sou">
    <span class="quem-sou-foto">${u?.avatar ? html`<img src=${u.avatar} alt="" />` : u ? nome.charAt(0).toUpperCase() : '🔑'}<i></i></span>
    <span style="display:grid;gap:1px;line-height:1.1"><b>${nome}</b><span class="quem-sou-papel">${u ? html`<${LogoDiscord} tam=${13} />` : ''}${eu.papelTxt}</span></span>
  </div>`;
}

function Topo({ estado, cfg, eu, trocarServidor, sair }) {
  const b = estado.bot;
  return html`
    <header class="topo">
      <div class="topo-dentro">
        <${Marca} />
        <span class=${`status-bot${b.online ? ' on' : ''}`}>
          <span class="ponto"></span>
          ${b.online ? `${b.nome} acordado` : 'Bot dormindo: confira o DISCORD_TOKEN'}
          ${b.soPainel && html`<span class="selo-so-painel">SÓ PAINEL</span>`}
        </span>
        <div class="topo-direita">
          ${cfg && html`<${ListaSuspensa}
            variante="destaque"
            estilo="min-width:220px;width:auto"
            valor=${cfg.servidorId ?? ''}
            opcoes=${estado.servidores.map((s) => ({ v: s.id, t: s.nome, img: s.icone, sigla: s.sigla || s.nome.split(/\s+/).map((p) => p[0]).join('') }))}
            placeholder=${estado.servidores.length ? 'Escolha o servidor' : 'O bot não está em nenhum servidor'}
            desabilitada=${!estado.servidores.length || eu.papel !== 'admin'}
            onChange=${trocarServidor}
          />`}
          ${eu.papel === 'admin' && b.convite && html`<a href=${b.convite} target="_blank" rel="noopener">Adicionar a um servidor ↗</a>`}
          <${QuemSou} eu=${eu} />
          <button type="button" class="btn-sair" onClick=${sair} title="Sair deste navegador">Sair</button>
        </div>
      </div>
    </header>`;
}

export function App() {
  const volta = useMemo(() => lerVoltaDoLogin(), []);
  const [fase, setFase] = useState(() => (volta?.erro ? 'entrada' : conexao.sessao || conexao.senha || apiNestePc() ? 'carregando' : 'entrada'));
  const [erroEntrada, setErroEntrada] = useState(volta?.erro ?? '');
  const [eu, setEu] = useState(null);
  const [estado, setEstado] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [ui, setUiBruto] = useState({ aba: localStorage.getItem('mc_aba') || 'news', selCor: 0, emojiCat: 'Cores', lido: localStorage.getItem('mc_lido') || '' });
  const atual = useRef({});
  atual.current = { sujo, cfg, salvando, fase, estado, eu };
  const relogio = useRef(0);
  const ultimaCarga = useRef(0);

  const aviso = useCallback((texto, meme, { erro = false, link } = {}) => {
    clearTimeout(relogio.current);
    setToast({ texto, meme, erro, link });
    relogio.current = setTimeout(() => setToast(null), erro ? 9000 : 4500);
  }, []);

  // Staff carrega o estado completo (com a config); membro, só o público (bot, servidor e jornal)
  const carregar = useCallback(async (servidorId, { trocarConfig = false, quem } = {}) => {
    const e2 = quem ?? atual.current.eu;
    if (!ehStaff(e2)) {
      const p = await chamar('/api/publico');
      ultimaCarga.current = Date.now();
      setEstado({ ...p, servidores: [] });
      setCfg(null);
      return p;
    }
    const e = await chamar(`/api/estado${servidorId ? `?servidor=${encodeURIComponent(servidorId)}` : ''}`);
    ultimaCarga.current = Date.now();
    setEstado(e);
    if (trocarConfig || !atual.current.sujo) setCfg(structuredClone(e.config));
    return e;
  }, []);

  /** Quem sou (papel e perfil) e depois o estado do meu papel */
  const iniciar = useCallback(async () => {
    // Bot de antes do login com Discord não tem /api/eu: quem entrou pela senha é admin
    const quem = await chamar('/api/eu').catch((e) => {
      if (e.status === 404) return { papel: 'admin', papelTxt: 'Senha do painel', usuario: null };
      throw e;
    });
    setEu(quem);
    atual.current.eu = quem;
    await carregar(null, { trocarConfig: true, quem });
    return quem;
  }, [carregar]);

  const voltarPraEntrada = useCallback((msg) => {
    esquecerAcesso();
    setErroEntrada(msg);
    setEu(null);
    setFase('entrada');
  }, []);

  const tratar = useCallback(
    (e) => {
      if (e instanceof ErroSenha) voltarPraEntrada(e.message);
      else aviso(e.message, 'deu ruim', { erro: true });
    },
    [aviso, voltarPraEntrada],
  );

  async function entrarComSenha(api, senha, lembrar) {
    conexao.api = api;
    conexao.senha = senha;
    conexao.sessao = '';
    await iniciar();
    guardarAcesso(api, senha, lembrar);
    setSujo(false);
    setFase('pronto');
  }

  // Primeira carga: com sessão ou senha guardada (ou bot neste PC) entra direto
  useEffect(() => {
    if (fase !== 'carregando') return;
    iniciar()
      .then(() => setFase('pronto'))
      .catch((e) => {
        // Sessão vencida ou fora do servidor: esquece. Bot acordando ou fora do ar: guarda a senha pra tentar de novo.
        if (e instanceof ErroSenha || e.status === 403) return voltarPraEntrada(e.message);
        setErroEntrada(e.message);
        setFase('entrada');
      });
  }, []);

  const salvar = useCallback(async () => {
    const { cfg: c, salvando: ocupado, estado: e } = atual.current;
    if (ocupado || !c) return false;
    // Apagar cargo no Discord não tem volta: confirma antes
    const apagar = c.hierarquia?.apagar ?? [];
    if (apagar.length) {
      const nomes = apagar.map((id) => {
        const x = e?.servidor?.hierarquia?.lista.find((y) => y.id === id);
        return x ? (x.k === 'sep' ? `━━ ${x.nome} ━━` : `@${x.nome}`) : id;
      });
      if (!confirm(`Vai apagar no Discord: ${nomes.join(', ')}. Quem tem esses cargos perde. Continuar?`)) return false;
    }
    setSalvando(true);
    try {
      const r = await chamar('/api/salvar', c);
      atual.current.sujo = false;
      setSujo(false);
      setCfg(structuredClone(r.config));
      aviso(['Salvo!', ...r.relatorio].join('\n'), 'já acabou, Jéssica?');
      await carregar(r.config.servidorId, { trocarConfig: true });
      return true;
    } catch (e2) {
      tratar(e2);
      return false;
    } finally {
      setSalvando(false);
    }
  }, [aviso, carregar, tratar]);

  // Ctrl+S salva; sair com alteração pergunta; voltar pra aba atualiza canais, cargos e hierarquia
  useEffect(() => {
    const tecla = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (atual.current.sujo) salvar();
      }
    };
    const fechar = (e) => atual.current.sujo && e.preventDefault();
    const foco = () => {
      if (atual.current.fase === 'pronto' && Date.now() - ultimaCarga.current > 3000) carregar(atual.current.cfg?.servidorId).catch(() => {});
    };
    addEventListener('keydown', tecla);
    addEventListener('beforeunload', fechar);
    addEventListener('focus', foco);
    return () => {
      removeEventListener('keydown', tecla);
      removeEventListener('beforeunload', fechar);
      removeEventListener('focus', foco);
    };
  }, [salvar, carregar]);

  const mudar = useCallback((fn) => {
    setCfg((c) => {
      const novo = structuredClone(c);
      fn(novo);
      return novo;
    });
    setSujo(true);
  }, []);

  const setUi = useCallback((patch) => {
    if (patch.aba) localStorage.setItem('mc_aba', patch.aba);
    if ('lido' in patch) localStorage.setItem('mc_lido', patch.lido);
    setUiBruto((u) => ({ ...u, ...patch }));
  }, []);

  const valor = useMemo(
    () => ({ cfg, estado, ui, sujo, eu, setEu, mudar, setUi, aviso, salvar, tratar, recarregar: () => carregar(cfg?.servidorId), api: conexao.api }),
    [cfg, estado, ui, sujo, eu, mudar, setUi, aviso, salvar, tratar, carregar],
  );

  if (fase === 'entrada') return html`<${TelaLogin} erro=${erroEntrada} aoEntrar=${entrarComSenha} />`;
  if (!estado || !eu || (ehStaff(eu) && !cfg)) {
    return html`<div class="pagina"><div class="caderno"></div><div class="carregando"><img class="selo-mc" style="margin:0 auto" src="banners/bot/mascote-256.png" alt="" /><b>CHAMANDO O BOT…</b><p class="sub">Na hospedagem grátis ele pode levar até 1 minuto pra acordar.</p></div></div>`;
  }

  const trocarServidor = (id) => {
    mudar((c) => {
      c.servidorId = id || null;
      delete c.hierarquia; // o rascunho da hierarquia é do servidor anterior
    });
    carregar(id).catch(tratar);
  };
  const sair = () => {
    if (sujo && !confirm('Tem alterações não salvas. Sair mesmo assim?')) return;
    setSujo(false);
    voltarPraEntrada('');
  };
  const abas = abasDe(eu);
  const aba = abas.find((a) => a.id === ui.aba) ?? abas[0];
  const staff = ehStaff(eu);

  return html`
    <${Ctx.Provider} value=${valor}>
      <div class=${`pagina${staff ? '' : ' sem-barra'}`}>
        <div class="caderno"></div>
        <${Topo} estado=${estado} cfg=${cfg} eu=${eu} trocarServidor=${trocarServidor} sair=${sair} />
        <div class="miolo">
          <nav class="abas">
            ${abas.map((a) => {
              const badge = a.badge?.(estado, ui) ?? 0;
              return html`<button type="button" class=${`aba${a === aba ? ' ativa' : ''}`} style=${`--cor-aba:${a.cor}`} onClick=${() => setUi({ aba: a.id })}>${a.nome}${badge > 0 && html`<span class="aba-badge">${badge}</span>`}</button>`;
            })}
          </nav>
          <section class="secao">
            ${staff &&
            (() => {
              const t = temaDaPrevia(cfg, estado, ui);
              return t && html`<div class="faixa-tema">
                <span class="faixa-tema-bola" style=${`--c:${hexOk(t.cor)}`}></span>
                <b>${ui.tmSim ? 'SIMULAÇÃO · ' : 'NO AR · '}${t.nome.toUpperCase()}</b>
                <span style="font-size:14px">As mensagens do bot estão com o visual do tema.</span>
                ${ui.tmSim && html`<button type="button" class="btn mostarda pequeno" style="margin-left:auto" onClick=${() => setUi({ tmSim: '' })}>Parar simulação</button>`}
              </div>`;
            })()}
            <${aba.Tela} />
          </section>
        </div>
        ${staff &&
        html`<div class="barra-salvar">
          <div class="barra-dentro">
            <span class="barra-atalho">Ctrl+S salva</span>
            ${sujo && html`<${Adesivo} solto texto="calma, calabreso" estilo="box-shadow:none" />`}
            <span class=${`barra-estado${sujo ? ' sujo' : ''}`}>${salvando ? 'Salvando…' : sujo ? 'Alterações não salvas' : 'Tudo salvo'}</span>
            <button type="button" class="btn-salvar" disabled=${!sujo || salvando} onClick=${salvar}>Salvar</button>
          </div>
        </div>`}
        ${toast &&
        html`<div class=${`toast${toast.erro ? ' erro' : ''}`} role="status" onClick=${() => setToast(null)}>
          <span>${toast.texto}</span>
          ${toast.link && html`<a href=${toast.link} target="_blank" rel="noopener" onClick=${(e) => e.stopPropagation()}>Abrir no Discord ↗</a>`}
          ${toast.meme && html`<span class="toast-meme">${toast.meme}</span>`}
        </div>`}
      </div>
    <//>`;
}
