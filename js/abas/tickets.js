// Aba Tickets: onde ficam os canais, motivos do menu, regras, fila de abertos e prévia (painel → aberto → fechado)
import { html, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { urlImagem } from '../logica.js';
import { Emoji, Segmentado, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';
import { SeletorBanner } from '../ui/seletor-banner.js';

const PADRAO_IMAGEM = 'banners/eventos/news.jpg';
const MAX_MOTIVOS = 25;
const LIMITES = [{ v: 1, t: '1 por vez' }, { v: 2, t: '2 por vez' }, { v: 3, t: '3 por vez' }];
const PARADOS = [{ v: '12h', t: '12 horas' }, { v: '24h', t: '24 horas' }, { v: '48h', t: '2 dias' }, { v: 'nunca', t: 'Nunca' }];
const APAGARES = [{ v: 'agora', t: 'Na hora' }, { v: '5s', t: '5 segundos' }, { v: '10s', t: '10 segundos' }, { v: '1min', t: '1 minuto' }, { v: '5min', t: '5 minutos' }];
const texto = (lista, v) => lista.find((x) => x.v === v)?.t.toLowerCase() ?? '';
const COMANDOS = [
  ['/ticket abrir [motivo]', 'Abre um ticket sem precisar do botão.', 'todo mundo'],
  ['/ticket fechar [motivo]', 'Fecha o ticket atual, salva a transcrição e apaga o canal.', 'staff e quem abriu'],
  ['/ticket add @membro', 'Coloca alguém na conversa.', 'staff'],
  ['/ticket remover @membro', 'Tira alguém do ticket.', 'staff'],
  ['/ticket assumir', 'Você vira o responsável pelo ticket.', 'staff'],
  ['/ticket renomear nome', 'Muda o nome do canal do ticket.', 'staff'],
  ['/ticket painel #canal', 'Manda (ou reenvia) o painel com o menu.', 'admin'],
  ['/ticket config', 'Manda o link das configurações aqui do site.', 'admin'],
];
const COR_QUEM = { 'todo mundo': '#2f8f5b', admin: 'var(--vermelho)' };

export function AbaTickets() {
  const { cfg, estado, mudar, aviso, tratar, recarregar, api } = useApp();
  const [etapa, setEtapa] = useState('painel');
  const [nota, setNota] = useState(0);
  const t = cfg.tickets;
  if (!t) return html`<p class="sub">Atualize o bot pra versão nova: esta aba precisa dele.</p>`;
  const s = estado.servidor, b = estado.bot;
  const muda = (patch) => mudar((c) => Object.assign(c.tickets, patch));
  const mudaMotivo = (i, patch) => mudar((c) => Object.assign(c.tickets.motivos[i], patch));

  const canais = s?.canais ?? [];
  const opCanais = (vazio, novo) => [
    { v: '', t: vazio },
    ...canais.map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' })),
    { v: 'novo', t: `Criar #${novo}`, nota: 'o bot cria ao salvar' },
  ];
  const opCategorias = [{ v: '', t: 'Sem categoria' }, ...(s?.categorias ?? []).map((c) => ({ v: c.id, t: c.nome.toUpperCase(), nota: 'categoria' })), { v: 'nova', t: 'Criar categoria nova', nota: 'o bot cria ao salvar' }];
  const opStaff = [{ v: '', t: 'Só quem gerencia o servidor' }, ...(s?.cargos ?? []).map((r) => ({ v: r.id, t: `@${r.nome}`, cor: r.cor }))];
  // 'novo' = o bot cria ao salvar: a prévia já mostra com o nome que vai ter
  const canal = t.canalId === 'novo' ? { nome: 'abrir-ticket' } : canais.find((c) => c.id === t.canalId);
  const logs = t.logsId === 'novo' ? { nome: 'registros-tickets' } : canais.find((c) => c.id === t.logsId);
  const staff = s?.cargos.find((r) => r.id === t.staffId);
  const categoria = t.categoriaId === 'nova' ? '🎫 TICKETS' : (s?.categorias ?? []).find((c) => c.id === t.categoriaId)?.nome.toUpperCase();

  const fila = estado.tickets ?? [];
  const semDono = fila.filter((f) => !f.resp).length;
  const fechar = async (f) => {
    if (!confirm(`Fechar o ticket #${f.num} de ${f.quem}? A transcrição é salva e o canal some.`)) return;
    try {
      const r = await chamar('/api/tickets/acao', { num: f.num, acao: 'fechar' });
      aviso(r.mensagem, 'transcrição salva');
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  };

  // Prévia: gente de exemplo, servidor e cargos de verdade
  const ctx = { cargos: s?.cargos ?? [], usuarios: { 1: 'pedrinho', 2: 'marina.exe' } };
  const motivosOn = t.motivos.filter((m) => m.on);
  const ex = t.motivos.find((m) => m.on && /den[uú]ncia/i.test(m.nome)) ?? motivosOn[0] ?? { emoji: '🎫', nome: 'Dúvida' };
  const canalTicket = `${categoria ? `🎫 ${categoria.replace(/^🎫\s*/, '')} › ` : ''}#ticket-0042-pedrinho`;
  const transc = [t.transLog && logs && `Transcrição salva em #${logs.nome}`, t.transDm && 'cópia enviada na DM de @pedrinho'].filter(Boolean);
  const etapas = {
    painel: {
      rotulo: `#${canal?.nome ?? 'escolha-o-canal'}`,
      msg: { cor: '#F2C14E', titulo: t.titulo, texto: t.desc, imagem: urlImagem(t.imagem, PADRAO_IMAGEM, api) },
      depois: html`<div class="dc-menu"><span>Escolha o motivo do ticket</span><span>▾</span></div>
        <div class="dc-menu-lista">${motivosOn.map((m) => html`<div class="dc-menu-op"><${Emoji} texto=${m.emoji} classe="dc-emoji" /><span style="display:grid"><b>${m.nome}</b>${m.desc && html`<span>${m.desc}</span>`}</span></div>`)}</div>`,
    },
    aberto: {
      rotulo: canalTicket,
      msg: {
        acima: ['<@1>', t.mencionar && staff && `<@&${staff.id}>`].filter(Boolean).join(' '),
        cor: '#C4363C',
        titulo: `${ex.emoji.startsWith('<') ? '' : `${ex.emoji} `}Ticket #0042 · ${ex.nome}`,
        texto: 'Valeu por abrir, pedrinho! Conta o que rolou com print se tiver. A staff já foi chamada.',
        rodape: t.parado === 'nunca' ? '' : `Fecha sozinho depois de ${texto(PARADOS, t.parado)} sem mensagem.`,
        linhas: [[{ emoji: '🙋', texto: 'Assumir', bg: '#248046' }, { emoji: '➕', texto: 'Adicionar membro', bg: '#4e5058' }, { emoji: '🔒', texto: 'Fechar', bg: '#da373c' }]],
      },
      depois: html`<div class="dc-msg" style="margin-top:14px"><span class="dc-avatar" style="background:#9B59B6;font:800 16px var(--corpo);color:#fff">M</span><div><div class="dc-autor" style="color:#c39bd3">marina.exe<span class="dc-hora">agora</span></div><div>Assumi! Manda o print aí 👀</div></div></div>`,
    },
    fechado: {
      rotulo: canalTicket,
      msg: { cor: '#4E5058', texto: `**🔒 Ticket fechado por <@2>**\n${transc.length ? `${transc.join(' e ')}.` : 'Sem transcrição.'}\n\`Este canal some em ${texto(APAGARES, t.apagar)}…\`` },
      depois: t.avaliacao && html`<div class="dc-dm">
        <div class="dc-sub" style="font-weight:700">MENSAGEM DIRETA · Manda Chuva</div>
        <div class="dc-caixa" style="--c:#f2c14e;margin-top:0">
          <b style="color:#f2f3f5">Como foi o atendimento?</b><span>Dá uma nota pra staff. É anônimo (mais ou menos).</span>
          <div style="display:flex;gap:6px">${[1, 2, 3, 4, 5].map((n) => html`<button type="button" class="dc-estrela" style=${`--c:${n <= nota ? '#f2c14e' : '#4e5058'}`} onClick=${() => setNota(n)}>⭐</button>`)}</div>
          <span class="dc-sub">${nota ? `Nota ${nota}/5 enviada pra staff. Valeu!` : 'Toque numa estrela.'}</span>
        </div>
      </div>`,
    },
  };
  const e = etapas[etapa];

  return html`<div class="colunas">
    <div class="col-editor" style="gap:22px">
      <div class="cabeca">
        <div class="cabeca-texto">
          <div class="cabeca-linha"><h1 class="h1">TICKETS</h1><span class="rabisco">senta que lá vem treta</span></div>
          <p class="sub">O membro escolhe o motivo no menu e ganha um canal privado com a staff dentro de uma categoria. Ao fechar, o bot salva a transcrição e apaga o canal sozinho.</p>
        </div>
        <div class="caixa-liga"><span style="font-weight:800">${t.on ? 'Ligado' : 'Desligado'}</span><${Toggle} on=${t.on} onClick=${() => muda({ on: !t.on })} /></div>
      </div>
      ${s?.ticketsFaltando?.length > 0 && html`<div class="aviso-faixa" style="margin:0"><b>Falta permissão pro bot:</b><span>${s.ticketsFaltando.join(', ')}. Sem ela o bot não cria os canais dos tickets.</span></div>`}
      ${b.online && b.recursos && b.recursos.conteudo === false && html`<div class="aviso-faixa" style="margin:0;background:var(--aviso)"><b>Transcrição sem texto:</b><span>ligue a <b>Message Content Intent</b> no Developer Portal do Discord (Bot → Privileged Gateway Intents). Até lá a transcrição mostra quem falou e quando, sem o texto.</span></div>`}
      ${t.on && !t.canalId && html`<span class="sb-erro">Escolha o canal do botão: é lá que o bot põe o menu.</span>`}

      <div class="cartao">
        <h2 class="h2">ONDE FICA</h2>
        <div class="grade-campos">
          <div class="rotulo">Categoria dos tickets<${ListaSuspensa} valor=${t.categoriaId ?? ''} opcoes=${opCategorias} onChange=${(v) => muda({ categoriaId: v || null })} /></div>
          <div class="rotulo">Canal do botão<${ListaSuspensa} valor=${t.canalId ?? ''} opcoes=${opCanais('Escolha um canal', 'abrir-ticket')} onChange=${(v) => muda({ canalId: v || null })} /></div>
          <div class="rotulo">Cargo da staff<${ListaSuspensa} valor=${t.staffId ?? ''} opcoes=${opStaff} onChange=${(v) => muda({ staffId: v || null })} /></div>
          <div class="rotulo">Canal de transcrições<${ListaSuspensa} valor=${t.logsId ?? ''} opcoes=${opCanais('Nenhum', 'registros-tickets')} onChange=${(v) => muda({ logsId: v || null })} /></div>
        </div>
        <span style="font-size:13px;color:var(--cinza);text-wrap:pretty">Cada ticket vira um canal <code class="mono-pilula">#ticket-0042-pedrinho</code> dentro da categoria escolhida. Só quem abriu e a staff veem. Ao salvar com os tickets ligados, o bot põe (ou atualiza) o menu no canal do botão. "Criar" faz o canal na categoria: o do botão todo mundo vê mas só o bot escreve; o de transcrições só a staff vê.</span>
      </div>

      <div class="cartao">
        <h2 class="h2">MENSAGEM DO MENU</h2>
        <label class="rotulo">Título <input class="campo" maxlength="200" value=${t.titulo} onInput=${(ev) => muda({ titulo: ev.target.value })} /></label>
        <label class="rotulo">Texto <textarea class="campo" rows="3" maxlength="1500" value=${t.desc} onInput=${(ev) => muda({ desc: ev.target.value })}></textarea></label>
        <div style="display:grid;gap:6px"><span class="rotulo">Imagem</span><${SeletorBanner} valor=${t.imagem} padrao=${PADRAO_IMAGEM} tipo="banner" mensagem="news" opcional onChange=${(v) => muda({ imagem: v })} /></div>
      </div>

      <div class="cartao">
        <div style="display:flex;align-items:center;gap:12px"><h2 class="h2" style="flex:1">MOTIVOS</h2>
          <button type="button" class="btn vermelho sombra pequeno" style="font-size:13px;font-weight:800;padding:7px 12px" disabled=${t.motivos.length >= MAX_MOTIVOS} onClick=${() => mudar((c) => c.tickets.motivos.push({ emoji: '📌', nome: 'Outro motivo', desc: 'Escreva o que é', on: true }))}>+ Motivo</button>
        </div>
        <div style="display:grid">
          ${t.motivos.map((m, i) => html`<div class="tk-motivo">
            <input class="tk-emoji" value=${m.emoji} maxlength="64" title="Emoji (cole um emoji)" onInput=${(ev) => mudaMotivo(i, { emoji: ev.target.value.trim() })} />
            <div style="flex:1;min-width:0;display:grid;gap:4px">
              <input class="campo tk-nome" maxlength="100" placeholder="Nome do motivo" value=${m.nome} onInput=${(ev) => mudaMotivo(i, { nome: ev.target.value })} />
              <input class="campo tk-desc" maxlength="100" placeholder="Descrição curta (opcional)" value=${m.desc} onInput=${(ev) => mudaMotivo(i, { desc: ev.target.value })} />
            </div>
            <${Toggle} on=${m.on} titulo=${m.on ? 'Aparece no menu' : 'Escondido'} onClick=${() => mudaMotivo(i, { on: !m.on })} />
            <button type="button" class="btn-x" title="Tirar motivo" disabled=${t.motivos.length <= 1} onClick=${() => mudar((c) => c.tickets.motivos.splice(i, 1))}>×</button>
          </div>`)}
        </div>
        <span style="font-size:12px;color:var(--cinza)">Até ${MAX_MOTIVOS} motivos (limite do menu do Discord). Desligado = some do menu e do /ticket abrir.</span>
      </div>

      <div class="cartao">
        <h2 class="h2">REGRAS</h2>
        <div class="grade-campos" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          <div class="rotulo">Tickets abertos por membro<${ListaSuspensa} valor=${t.limite} opcoes=${LIMITES} onChange=${(v) => muda({ limite: Number(v) })} /></div>
          <div class="rotulo">Fechar se ficar parado<${ListaSuspensa} valor=${t.parado} opcoes=${PARADOS} onChange=${(v) => muda({ parado: v })} /></div>
          <div class="rotulo">Apagar o canal depois de<${ListaSuspensa} valor=${t.apagar} opcoes=${APAGARES} onChange=${(v) => muda({ apagar: v })} /></div>
        </div>
        <div style="display:grid">
          ${[
            ['transLog', 'Transcrição no canal de logs', `Arquivo .html com a conversa inteira em ${logs ? `#${logs.nome}` : 'o canal de transcrições'}.`],
            ['transDm', 'Transcrição na DM do membro', 'Pra ele guardar o comprovante da treta.'],
            ['avaliacao', 'Pedir avaliação no fim', 'O membro dá de 1 a 5 estrelas na DM.'],
            ['mencionar', 'Mencionar a staff ao abrir', `Pinga ${staff ? `@${staff.nome}` : 'o cargo da staff'} no canal novo.`],
          ].map(([k, titulo, txt]) => html`<div class="mod-linha">
            <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">${titulo}</b><span style="font-size:13px;color:var(--cinza)">${txt}</span></div>
            <${Toggle} on=${t[k]} titulo=${titulo} onClick=${() => muda({ [k]: !t[k] })} />
          </div>`)}
        </div>
      </div>

      <div class="cartao">
        <div style="display:flex;align-items:center;gap:12px"><h2 class="h2">FILA</h2><span class="pilula-mostarda">${fila.length} aberto${fila.length === 1 ? '' : 's'} · ${semDono} sem dono</span></div>
        <div style="display:grid">
          ${fila.map((f) => html`<div class="tk-fila">
            <span class="tk-num">#${f.num}</span>
            <span style="flex:none;font-size:18px"><${Emoji} texto=${f.emoji} classe="dc-emoji" /></span>
            <div style="flex:1 1 160px;min-width:0;display:grid;gap:1px"><b style="font-weight:800">@${f.quem} · ${f.motivo}</b><span style="font-size:13px;color:var(--cinza)">aberto ${f.quando} · ${f.resp ? `com @${f.resp}` : 'ninguém assumiu'}</span></div>
            <a class="btn navy pequeno" style="text-decoration:none;font-size:13px;font-weight:800" href=${f.link} target="_blank" rel="noopener">Abrir ↗</a>
            <button type="button" class="btn-perigo pequeno" onClick=${() => fechar(f)}>Fechar</button>
          </div>`)}
          ${!fila.length && html`<div style="padding:18px;text-align:center;color:var(--cinza)">Fila zerada. A staff pode ir jogar.</div>`}
        </div>
      </div>

      <div class="cartao">
        <h2 class="h2">COMANDOS</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px">
          ${COMANDOS.map(([cmd, desc, quem]) => html`<div class="tk-cmd"><code>${cmd}</code><span>${desc}</span><b style=${`color:${COR_QUEM[quem] ?? 'var(--navy)'}`}>Quem usa: ${quem}</b></div>`)}
        </div>
      </div>
    </div>

    <aside class="col-lado" style="gap:14px">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px"><span style="font:400 16px var(--titulo)">PRÉVIA</span>
        <${Segmentado} classe="pequeno" opcoes=${[['painel', 'Painel'], ['aberto', 'Ticket aberto'], ['fechado', 'Fechado']]} valor=${etapa} onChange=${setEtapa} />
      </div>
      <${Previa} ctx=${ctx} msg=${e.msg} antes=${html`<div class="dc-sub" style="font-weight:700;letter-spacing:.04em;margin-bottom:12px">${e.rotulo}</div>`} depois=${e.depois} />
    </aside>
  </div>`;
}
