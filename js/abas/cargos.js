// Aba Cargos: a reitoria. Sub-abas Hierarquia (ordem, separadores, criar/editar/apagar cargos, consertar as cores;
// rascunho até o Salvar), Membros (ações que valem na hora) e Moderação (avisos e livro de ocorrências).
import { html } from '../../vendor/preact-htm.js';
import { useApp } from '../estado.js';
import { chave, COR_ETIQUETA, conflitos, consertar, etiquetas, indiceDoBot, inserir, listaDe, mover, movivel, PERMS, tirar } from '../hierarquia.js';
import { fundoDaCor } from '../logica.js';
import { Amostras, CampoCor, Toggle } from '../ui/basicos.js';
import { TelaMembros } from './membros.js';
import { TelaModeracao } from './moderacao.js';

const AMOSTRAS = ['#E74C3C', '#E91E63', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#5865F2', '#9B59B6', '#FF6EC7', '#99AAB5', '#2C2F33', '#111111', '#FFFFFF'];
const VISTAS = [['hierarquia', 'Hierarquia'], ['membros', 'Membros'], ['moderacao', 'Moderação']];
// Linha da lista que funciona com clique e com Enter/espaço
const clicavel = (fn) => ({ role: 'button', tabindex: 0, onClick: fn, onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), fn()) });

export function AbaCargos() {
  const { ui, setUi } = useApp();
  const v = ui.cargosView ?? 'hierarquia';
  return html`<div style="display:grid;gap:22px">
    <div class="cabeca">
      <div class="cabeca-texto">
        <div class="cabeca-linha"><h1 class="h1">CARGOS</h1><span class="rabisco">a reitoria</span></div>
        <p class="sub">Hierarquia, membros e moderação do servidor num lugar só.</p>
      </div>
      <div class="segmentado sombra" style="margin-left:auto">
        ${VISTAS.map(([id, nome]) => html`<button type="button" class=${v === id ? 'on' : ''} onClick=${() => setUi({ cargosView: id })}>${nome}</button>`)}
      </div>
    </div>
    ${v === 'membros' ? html`<${TelaMembros} />` : v === 'moderacao' ? html`<${TelaModeracao} />` : html`<${TelaHierarquia} />`}
  </div>`;
}

const Setas = ({ lista, k, mexer }) => {
  const ir = (d) => (e) => {
    e.stopPropagation();
    mexer((h) => (h.lista = mover(h.lista, k, d) ?? h.lista), chave(lista[k]));
  };
  return html`<span class="hier-setas">
    <button type="button" class="hier-seta" title="Subir" disabled=${!mover(lista, k, -1)} onClick=${ir(-1)}>↑</button>
    <button type="button" class="hier-seta" title="Descer" disabled=${!mover(lista, k, 1)} onClick=${ir(1)}>↓</button>
  </span>`;
};

function TelaHierarquia() {
  const { cfg, estado, ui, setUi, mudar, aviso } = useApp();
  const s = estado.servidor;
  if (!estado.bot.online || !s) {
    return html`<div class="cartao sombra"><b>${estado.bot.online ? 'Escolha o servidor lá em cima.' : 'Bot dormindo.'}</b><span class="sub">A hierarquia vem direto do Discord: precisa do bot online e de um servidor escolhido.</span></div>`;
  }
  const h = s.hierarquia;
  const lista = listaDe(cfg, estado);
  const b = indiceDoBot(lista);
  const conf = conflitos(lista);
  const membrosDe = (id) => s.cargos.find((c) => c.id === id)?.membros;
  const qtd = (n) => (n == null ? '' : `${n} membro${n === 1 ? '' : 's'}`);

  // Toda mudança vira rascunho (cfg.hierarquia); o primeiro clique copia a lista do servidor
  const mexer = (fn, sel) => {
    mudar((c) => {
      c.hierarquia ??= { lista: structuredClone(h.lista), apagar: [] };
      fn(c.hierarquia);
    });
    if (sel !== undefined) setUi({ cargoSel: sel });
  };
  const novo = (item) => {
    const id = `novo-${Date.now()}`;
    mexer((r) => (r.lista = inserir(r.lista, { ...item, id })), id);
  };

  // Selecionado: o que foi clicado ou, de começo, o primeiro abaixo do bot
  let ks = lista.findIndex((x) => chave(x) === ui.cargoSel);
  if (ks < 0) ks = lista[b + 1] ? b + 1 : 0;
  const sel = lista[ks];

  const linhas = [];
  lista.forEach((x, i) => {
    const marcado = x === sel;
    const selecionar = () => setUi({ cargoSel: chave(x) });
    const mexe = movivel(lista, i);
    if (x.k === 'sep') {
      linhas.push(html`<div class=${`hier-linha hier-sep${marcado ? ' sel' : ''}`} ...${clicavel(selecionar)}>
        <span class="hier-traco"></span><span class="hier-sep-nome">${x.nome || ' '}</span><span class="hier-traco"></span>
        ${mexe && html`<${Setas} lista=${lista} k=${i} mexer=${mexer} />`}
      </div>`);
    } else if (x.k === 'cores') {
      linhas.push(html`<div class=${`hier-linha hier-bloco${marcado ? ' sel' : ''}`} ...${clicavel(selecionar)}>
        <span class="hier-bolinhas">${cfg.cores.map((c) => html`<span style=${`background:${fundoDaCor(c)}`}></span>`)}</span>
        <b style="flex:1;font-weight:800;font-size:14px">Bloco de cores · ${cfg.cores.length} cargos</b>
        <span style="font-size:12px;color:var(--cinza)">ordem na aba Cores</span>
        ${mexe && html`<${Setas} lista=${lista} k=${i} mexer=${mexer} />`}
      </div>`);
      cfg.cores.forEach((c, ci) =>
        linhas.push(html`<div class="hier-linha hier-cargo hier-da-cor" ...${clicavel(() => setUi({ aba: 'cores', selCor: ci }))} title="Abrir na aba Cores">
          <span class="hier-bola" style=${`background:${fundoDaCor(c)}`}></span>
          <div class="hier-nome"><b>${c.nome}</b><span class="hier-etiqueta" style=${`background:${COR_ETIQUETA.COR}`}>COR</span></div>
          <span class="hier-membros">${qtd(c.cargoId ? membrosDe(c.cargoId) : null)}</span>
          <span></span>
        </div>`),
      );
    } else {
      linhas.push(html`<div class=${`hier-linha hier-cargo${marcado ? ' sel' : ''}${x.bot ? ' do-bot' : ''}`} ...${clicavel(selecionar)}>
        <span class="hier-bola" style=${`background:${x.hex || 'var(--desligado)'}`}></span>
        <div class="hier-nome"><b>${x.nome}${x.bot ? ' (bot)' : ''}</b>${etiquetas(x).map((t) => html`<span class="hier-etiqueta" style=${`background:${COR_ETIQUETA[t]}`}>${t}</span>`)}</div>
        <span class="hier-membros">${qtd(x.membros)}</span>
        <span class="hier-setas">
          ${mexe && html`<${Setas} lista=${lista} k=${i} mexer=${mexer} />`}
          ${x.travado && !x.bot && html`<span class="hier-travado" title="O bot não consegue mexer em cargos acima dele">ACIMA DO BOT</span>`}
        </span>
      </div>`);
      if (x.bot) linhas.push(html`<div class="hier-linha-bot"><span></span><span class="rabisco" style="font-size:13px">daqui pra baixo o bot manda</span><span></span></div>`);
    }
  });

  return html`<div class="colunas">
    <div style="flex:999 1 520px;min-width:0;display:grid;gap:14px">
      ${!h.temPermissao && html`<div class="aviso-faixa" style="margin:0"><b>O bot está sem "Gerenciar cargos".</b><span>Dá pra ver a lista, mas ele não consegue mudar nada até ganhar essa permissão.</span></div>`}
      ${conf.length > 0 &&
      html`<div class="hier-conflito">
        <div style="flex:1 1 240px;display:grid;gap:2px">
          <b style="font-weight:800">${conf.length} cargo${conf.length > 1 ? 's' : ''} colorido${conf.length > 1 ? 's' : ''} acima das cores</b>
          <span style="font-size:14px;text-wrap:pretty">${conf.map((n) => `@${n}`).join(', ')} pinta${conf.length > 1 ? 'm' : ''} o nome por cima. Quem tiver não vê a cor mudar.</span>
        </div>
        <button type="button" class="btn escuro" onClick=${() => {
          mexer((r) => (r.lista = consertar(r.lista)));
          aviso('Pronto: as cores agora ficam logo abaixo do bot. Falta só o Salvar.', 'resolvido, chefe');
        }}>Consertar sozinho</button>
      </div>`}
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
        <button type="button" class="btn vermelho sombra" disabled=${b < 0} onClick=${() => novo({ k: 'role', nome: 'Novo cargo', hex: '', perms: [], hoist: false, mencionavel: false, membros: 0 })}>+ Novo cargo</button>
        <button type="button" class="btn sombra" disabled=${b < 0} onClick=${() => novo({ k: 'sep', nome: 'NOVO GRUPO' })}>+ Separador</button>
        <span style="margin-left:auto;font-size:13px;color:var(--cinza)">Topo = mais poder. O bot só mexe no que está abaixo dele.</span>
      </div>
      <div class="hier">${linhas}</div>
    </div>
    <aside style="flex:1 1 360px;min-width:0;position:sticky;top:16px;display:grid;gap:18px">
      ${sel && html`<${Editor} x=${sel} k=${ks} lista=${lista} mexer=${mexer} permsDoBot=${h.permsDoBot ?? []} membros=${sel.k === 'role' ? sel.membros : null} />`}
      <p class="nota-amarela">Clicou num cargo de cor? Ele abre direto na aba Cores. Separadores não precisam ter ninguém. Nada muda no Discord até você clicar em Salvar.</p>
    </aside>
  </div>`;
}

function Editor({ x, k, lista, mexer, permsDoBot, membros }) {
  const { setUi, aviso } = useApp();
  const muda = (patch) => mexer((r) => Object.assign(r.lista[k], patch));
  const apagar = () => {
    mexer((r) => tirar(r, k), chave(lista[k - 1] ?? lista[k + 1] ?? {}));
    aviso(`${x.k === 'sep' ? `Separador ${x.nome}` : x.nome} sai da lista. No Discord ele só some quando você salvar.`, 'F no chat');
  };

  if (x.k === 'cores') {
    return html`<div class="cartao sombra">
      <h2 class="h2">BLOCO DE CORES</h2>
      <p style="margin:0;text-wrap:pretty">Os cargos de cor andam juntos aqui. Pra mudar a ordem entre eles ou editar uma cor, vá pra aba Cores.</p>
      <button type="button" class="btn" style="justify-self:start;background:#f5b5a8" onClick=${() => setUi({ aba: 'cores' })}>Ir pra aba Cores</button>
    </div>`;
  }
  if (x.bot) {
    return html`<div class="cartao sombra" style="background:#e8ecfb">
      <h2 class="h2">O CARGO DO BOT</h2>
      <p style="margin:0;text-wrap:pretty">Tudo que estiver abaixo dele, o Manda Chuva consegue dar e tirar. Pra subir ou descer ele, use as configurações do servidor no Discord.</p>
    </div>`;
  }
  if (x.travado) {
    return html`<div class="cartao sombra">
      <h2 class="h2">ACIMA DO BOT</h2>
      <p style="margin:0;text-wrap:pretty"><b>${x.k === 'sep' ? `━━ ${x.nome} ━━` : x.nome}</b> está acima do cargo do bot, então ele não consegue mexer. Pra editar, use as configurações do servidor no Discord (ou suba o cargo do bot pra cima dele).</p>
    </div>`;
  }
  if (x.k === 'sep') {
    return html`<div class="cartao sombra">
      <h2 class="h2">SEPARADOR</h2>
      <div class="hier-sep-previa"><span class="hier-traco"></span><span class="hier-sep-nome" style="font-size:14px">${x.nome || ' '}</span><span class="hier-traco"></span></div>
      <label class="rotulo">Nome do grupo
        <input class="campo" value=${x.nome} maxlength="94" onInput=${(e) => muda({ nome: e.target.value.toUpperCase() })} />
      </label>
      <p style="margin:0;font-size:13px;color:var(--cinza);text-wrap:pretty">É um cargo vazio que só organiza a lista. No Discord ele aparece como “━━ ${x.nome} ━━”.</p>
      <button type="button" class="btn-perigo" style="justify-self:end" onClick=${apagar}>Apagar separador</button>
    </div>`;
  }
  if (x.gerenciado) {
    return html`<div class="cartao sombra">
      <h2 class="h2">${x.gerenciado === 'impulso' ? 'CARGO DO IMPULSO' : 'CARGO DE INTEGRAÇÃO'}</h2>
      <p style="margin:0;text-wrap:pretty"><b>${x.nome}</b> é ${x.gerenciado === 'impulso' ? 'o cargo de quem impulsiona o servidor' : 'de um bot ou integração'}: o Discord não deixa editar nem apagar, só mudar de lugar.</p>
    </div>`;
  }

  const pos = String(k + 1).padStart(2, '0');
  return html`<div class="cartao sombra" style="padding:0;gap:0;overflow:hidden">
    <div style=${`padding:14px 18px;background:${x.hex || 'var(--desligado)'};border-bottom:var(--borda)`}>
      <div class="hier-cracha">
        <span>CARGO Nº ${pos}${membros != null ? ` · ${membros} MEMBROS` : ''}</span>
        <b>${x.nome}</b>
      </div>
    </div>
    <div style="display:grid;gap:16px;padding:18px">
      <label class="rotulo">Nome
        <input class="campo" value=${x.nome} maxlength="100" onInput=${(e) => muda({ nome: e.target.value })} />
      </label>
      <div class="rotulo">Cor
        <${CampoCor} valor=${x.hex} placeholder="sem cor" onChange=${(v) => muda({ hex: v })} alto=${40} />
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
          <${Amostras} cores=${AMOSTRAS} tamanho="m" marcada=${x.hex} onEscolher=${(v) => muda({ hex: v })} />
          <button type="button" class="hier-sem-cor" onClick=${() => muda({ hex: '' })}>Sem cor</button>
        </div>
      </div>
      <div style="display:grid">
        ${[['hoist', 'Mostrar membros separados', 'Aparecem num grupo próprio na lista de membros.'], ['mencionavel', 'Qualquer um pode mencionar', 'Libera o @ desse cargo pra todo mundo.']].map(
          ([campo, titulo, texto]) => html`<div class="hier-toggle">
            <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800;font-size:14px">${titulo}</b><span style="font-size:12px;color:var(--cinza)">${texto}</span></div>
            <${Toggle} on=${!!x[campo]} onClick=${() => muda({ [campo]: !x[campo] })} titulo=${titulo} />
          </div>`,
        )}
      </div>
      <div style="display:grid;gap:8px">
        <span class="rotulo">Permissões</span>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${PERMS.map(([p, nome]) => {
            const on = (x.perms ?? []).includes(p);
            const bloqueada = !on && !permsDoBot.includes(p);
            return html`<button type="button" class=${`hier-perm${on ? ' on' : ''}`} disabled=${bloqueada}
              title=${bloqueada ? 'O bot não tem essa permissão, então não consegue dar' : ''}
              onClick=${() => muda({ perms: on ? x.perms.filter((q) => q !== p) : [...(x.perms ?? []), p] })}><span>${on ? '✓' : '+'}</span>${nome}</button>`;
          })}
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
        ${/^\d{17,20}$/.test(x.id) && html`<button type="button" class="btn mostarda" onClick=${() => setUi({ cargosView: 'membros', mbCargo: x.id, mbBusca: '', mbPagina: 1 })}>Ver membros</button>`}
        <button type="button" class="btn-perigo" style="margin-left:auto" onClick=${apagar}>Apagar cargo</button>
      </div>
    </div>
  </div>`;
}
