// Casca do painel: entrada (senha), cabeçalho, abas, barra de salvar e avisos
import { html, useCallback, useEffect, useMemo, useRef, useState } from '../vendor/preact-htm.js';
import { AbaCargos } from './abas/cargos.js';
import { AbaCores } from './abas/cores.js';
import { AbaNoticias } from './abas/noticias.js';
import { AbaPortaria } from './abas/portaria.js';
import { AbaTemas } from './abas/temas.js';
import { AbaPainel } from './abas/painel.js';
import { apiNestePc, chamar, conexao, ErroSenha, esquecerSenha, guardarAcesso } from './api.js';
import { Ctx } from './estado.js';
import { hexOk, naoLidas } from './logica.js';
import { temaDaPrevia } from './temas.js';
import { Adesivo, Toggle } from './ui/basicos.js';
import { ListaSuspensa } from './ui/lista-suspensa.js';

const ABAS = [
  { id: 'news', nome: 'Notícias', cor: '#b6c8ee', Tela: AbaNoticias, badge: (estado, ui) => naoLidas(estado.noticias ?? [], ui.lido).length },
  { id: 'cores', nome: 'Cores', cor: '#f5b5a8', Tela: AbaCores },
  { id: 'cargos', nome: 'Cargos', cor: '#d9c2ec', Tela: AbaCargos },
  { id: 'painel', nome: 'Painel', cor: '#f3d48a', Tela: AbaPainel },
  { id: 'boas', nome: 'Portaria', cor: '#b9dcb0', Tela: AbaPortaria },
  { id: 'temas', nome: 'Temas', cor: '#f2b880', Tela: AbaTemas },
];

const Marca = () => html`
  <div class="marca">
    <img class="selo-mc" src="banners/bot/mascote-256.png" alt="Manda Chuva" />
    <div style="display:grid;gap:2px">
      <div class="marca-nome">MANDA CHUVA</div>
      <div class="marca-sub">PAINEL OFICIAL · EST. 2026</div>
    </div>
  </div>`;

function Entrada({ erro, aoEntrar }) {
  const [api, setApi] = useState(conexao.api);
  const [senha, setSenha] = useState(conexao.senha);
  const [lembrar, setLembrar] = useState(true);
  const [indo, setIndo] = useState(false);
  const [msg, setMsg] = useState(erro);
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
  return html`
    <div class="pagina">
      <div class="caderno"></div>
      <div class="entrada">
        <form onSubmit=${enviar}>
          <${Adesivo} texto="só pra reitoria" cor="#f5b5a8" giro="4deg" estilo="top:-14px;right:16px" />
          <div class="entrada-marca"><${Marca} /></div>
          <p class="sub">Entre com o endereço do bot e a senha do painel (a <code>PAINEL_SENHA</code> configurada no bot).</p>
          <label class="rotulo">Endereço do bot
            <input class="campo" type="url" required placeholder="https://manda-chuva-bot.onrender.com" value=${api} onInput=${(e) => setApi(e.target.value)} />
          </label>
          <label class="rotulo">Senha
            <input class="campo" type="password" autocomplete="current-password" placeholder="Vazio se o bot roda no seu PC sem senha" value=${senha} onInput=${(e) => setSenha(e.target.value)} />
          </label>
          <div class="linha-toggle"><${Toggle} on=${lembrar} onClick=${() => setLembrar(!lembrar)} titulo="Lembrar neste navegador" /><span>Lembrar neste navegador</span></div>
          ${msg && html`<div class="erro-caixa">${msg}</div>`}
          <button class="btn vermelho sombra" style="padding:11px 16px;font-size:15px" disabled=${indo}>${indo ? 'Conectando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>`;
}

function Topo({ estado, cfg, trocarServidor, sair }) {
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
          <${ListaSuspensa}
            variante="destaque"
            estilo="min-width:240px;width:auto"
            valor=${cfg.servidorId ?? ''}
            opcoes=${estado.servidores.map((s) => ({ v: s.id, t: s.nome }))}
            placeholder=${estado.servidores.length ? 'Escolha o servidor' : 'O bot não está em nenhum servidor'}
            desabilitada=${!estado.servidores.length}
            onChange=${trocarServidor}
          />
          ${b.convite && html`<a href=${b.convite} target="_blank" rel="noopener">Adicionar a um servidor ↗</a>`}
          <button type="button" class="btn-sair" onClick=${sair} title="Trocar de bot ou de senha">Sair</button>
        </div>
      </div>
    </header>`;
}

export function App() {
  const [fase, setFase] = useState(conexao.senha || apiNestePc() ? 'carregando' : 'entrada');
  const [erroEntrada, setErroEntrada] = useState('');
  const [estado, setEstado] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [sujo, setSujo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  const [ui, setUiBruto] = useState({ aba: localStorage.getItem('mc_aba') || 'news', selCor: 0, emojiCat: 'Cores', lido: localStorage.getItem('mc_lido') || '' });
  const atual = useRef({});
  atual.current = { sujo, cfg, salvando, fase, estado };
  const relogio = useRef(0);
  const ultimaCarga = useRef(0);

  const aviso = useCallback((texto, meme, { erro = false, link } = {}) => {
    clearTimeout(relogio.current);
    setToast({ texto, meme, erro, link });
    relogio.current = setTimeout(() => setToast(null), erro ? 9000 : 4500);
  }, []);

  const carregar = useCallback(async (servidorId, { trocarConfig = false } = {}) => {
    const e = await chamar(`/api/estado${servidorId ? `?servidor=${encodeURIComponent(servidorId)}` : ''}`);
    ultimaCarga.current = Date.now();
    setEstado(e);
    if (trocarConfig || !atual.current.sujo) setCfg(structuredClone(e.config));
    return e;
  }, []);

  const tratar = useCallback(
    (e) => {
      if (e instanceof ErroSenha) {
        setErroEntrada(e.message);
        setFase('entrada');
      } else aviso(e.message, 'deu ruim', { erro: true });
    },
    [aviso],
  );

  async function entrar(api, senha, lembrar) {
    conexao.api = api;
    conexao.senha = senha;
    await carregar(atual.current.cfg?.servidorId, { trocarConfig: true });
    guardarAcesso(api, senha, lembrar);
    setSujo(false);
    setFase('pronto');
  }

  // Primeira carga: com senha guardada (ou bot neste PC) entra direto
  useEffect(() => {
    if (fase !== 'carregando') return;
    carregar(null, { trocarConfig: true })
      .then(() => setFase('pronto'))
      .catch((e) => {
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
    } catch (e) {
      tratar(e);
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
    () => ({ cfg, estado, ui, sujo, mudar, setUi, aviso, salvar, tratar, recarregar: () => carregar(cfg?.servidorId), api: conexao.api }),
    [cfg, estado, ui, sujo, mudar, setUi, aviso, salvar, tratar, carregar],
  );

  if (fase === 'entrada') return html`<${Entrada} erro=${erroEntrada} aoEntrar=${entrar} />`;
  if (!cfg || !estado) {
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
    esquecerSenha();
    setSujo(false);
    setErroEntrada('');
    setFase('entrada');
  };
  const aba = ABAS.find((a) => a.id === ui.aba) ?? ABAS[0];

  return html`
    <${Ctx.Provider} value=${valor}>
      <div class="pagina">
        <div class="caderno"></div>
        <${Topo} estado=${estado} cfg=${cfg} trocarServidor=${trocarServidor} sair=${sair} />
        <div class="miolo">
          <nav class="abas">
            ${ABAS.map((a) => {
              const badge = a.badge?.(estado, ui) ?? 0;
              return html`<button type="button" class=${`aba${a === aba ? ' ativa' : ''}`} style=${`--cor-aba:${a.cor}`} onClick=${() => setUi({ aba: a.id })}>${a.nome}${badge > 0 && html`<span class="aba-badge">${badge}</span>`}</button>`;
            })}
          </nav>
          <section class="secao">
            ${(() => {
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
        <div class="barra-salvar">
          <div class="barra-dentro">
            <span class="barra-atalho">Ctrl+S salva</span>
            ${sujo && html`<${Adesivo} solto texto="calma, calabreso" estilo="box-shadow:none" />`}
            <span class=${`barra-estado${sujo ? ' sujo' : ''}`}>${salvando ? 'Salvando…' : sujo ? 'Alterações não salvas' : 'Tudo salvo'}</span>
            <button type="button" class="btn-salvar" disabled=${!sujo || salvando} onClick=${salvar}>Salvar</button>
          </div>
        </div>
        ${toast &&
        html`<div class=${`toast${toast.erro ? ' erro' : ''}`} role="status" onClick=${() => setToast(null)}>
          <span>${toast.texto}</span>
          ${toast.link && html`<a href=${toast.link} target="_blank" rel="noopener" onClick=${(e) => e.stopPropagation()}>Abrir no Discord ↗</a>`}
          ${toast.meme && html`<span class="toast-meme">${toast.meme}</span>`}
        </div>`}
      </div>
    <//>`;
}
