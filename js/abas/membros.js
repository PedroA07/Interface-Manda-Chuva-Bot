// Aba Cargos › Membros: busca, filtro por cargo, dar/tirar cargo e Avisar/Silenciar/Expulsar (valem na hora).
import { html, useEffect, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { paginar } from '../logica.js';
import { ateQuando, SILENCIOS, tempoRelativo } from '../moderacao.js';
import { Paginacao, Segmentado } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';

const POR_PAGINA = 6;
const MEME = { avisar: 'anotado na caderneta', silenciar: 'shhh, biblioteca', expulsar: 'foi pra diretoria', dessilenciar: 'pode falar' };

/** Foto com anel da cor do cargo mais alto; inicial se não tiver foto */
const Avatar = ({ m }) => html`<span class="membro-avatar" style=${`--c:${m.cor ?? '#99AAB5'}`}>
  ${m.nome.charAt(0).toUpperCase()}
  ${m.avatar && html`<img src=${m.avatar} alt="" loading="lazy" onError=${(e) => (e.target.style.display = 'none')} />`}
</span>`;

export function TelaMembros() {
  const { cfg, estado, ui, setUi, aviso, tratar, recarregar } = useApp();
  const s = estado.servidor;
  const [texto, setTexto] = useState(ui.mbBusca ?? '');
  const [res, setRes] = useState(null);
  const [indo, setIndo] = useState(false);
  const [acao, setAcao] = useState(null); // { tipo, m }
  const q = ui.mbBusca ?? '', cargo = ui.mbCargo ?? '', pg = ui.mbPagina ?? 1;

  // Busca só depois de parar de digitar
  useEffect(() => {
    const t = setTimeout(() => texto !== q && setUi({ mbBusca: texto, mbPagina: 1 }), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const carregar = () => {
    if (!s) return;
    setIndo(true);
    chamar(`/api/membros?q=${encodeURIComponent(q)}&cargo=${encodeURIComponent(cargo)}&pagina=${pg}`)
      .then(setRes, tratar)
      .finally(() => setIndo(false));
  };
  useEffect(carregar, [q, cargo, pg, s?.id]);

  if (!estado.bot.online || !s) return html`<div class="cartao sombra"><b>${estado.bot.online ? 'Escolha o servidor lá em cima.' : 'Bot dormindo.'}</b><span class="sub">A lista vem direto do Discord.</span></div>`;

  const porId = new Map(s.cargos.map((c) => [c.id, c]));
  const corDe = (c) => (c?.cor && c.cor !== '#000000' ? c.cor : '#e4dccb');
  const trocarLinha = (novo, id) => setRes((r) => ({ ...r, itens: novo ? r.itens.map((x) => (x.id === id ? novo : x)) : r.itens.filter((x) => x.id !== id) }));

  async function fazer(corpo, meme) {
    try {
      const r = await chamar('/api/membros/acao', corpo);
      trocarLinha(r.membro, corpo.userId);
      aviso(r.mensagem, meme);
      recarregar().catch(() => {}); // o livro de ocorrências mudou
      return true;
    } catch (e) {
      tratar(e);
      return false;
    }
  }
  const darCargo = (m, id) => {
    const c = porId.get(id);
    if (c?.perigoso && !confirm(`"${c.nome}" tem permissões de moderação/admin. Dar pra ${m.nome} mesmo assim?`)) return;
    fazer({ acao: 'dar', userId: m.id, cargoId: id }, 'carimbado');
  };

  const filtros = [{ v: '', t: 'Todos os cargos' }, ...s.cargos.map((c) => ({ v: c.id, t: c.nome, cor: corDe(c) }))];
  const nav = res ? paginar(Array.from({ length: res.total }), res.pagina, POR_PAGINA) : null;

  return html`<div style="display:grid;gap:14px">
    ${!estado.bot.recursos?.membros &&
    html`<div class="aviso-faixa" style="margin:0"><b>Sem a lista completa.</b><span>Ligue a "Server Members Intent" no portal do Discord (seu bot → Bot → Privileged Gateway Intents) pra ver todo mundo. Até lá, dá pra buscar pelo nome.</span></div>`}
    ${s.moderacaoFaltando?.length > 0 && html`<div class="aviso-faixa" style="margin:0"><b>Faltam permissões pro bot:</b><span>${s.moderacaoFaltando.join(', ')}. Dá pra dar no cargo do bot nas configurações do servidor.</span></div>`}
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
      <input class="campo" style="flex:1 1 240px;width:auto" placeholder="Buscar membro…" value=${texto} onInput=${(e) => setTexto(e.target.value)} />
      <${ListaSuspensa} estilo="flex:0 1 240px;min-width:200px" valor=${cargo} opcoes=${filtros} onChange=${(v) => setUi({ mbCargo: v, mbPagina: 1 })} />
      <span style="font:400 14px var(--titulo)">${res ? `${res.total} ${res.total === 1 ? 'MEMBRO' : 'MEMBROS'}` : '…'}</span>
    </div>
    <div class=${`membros${indo ? ' carregando-lista' : ''}`}>
      ${res?.precisaBusca && html`<p class="dica" style="padding:16px">Digite um nome pra buscar.</p>`}
      ${res && !res.precisaBusca && !res.itens.length && html`<p class="dica" style="padding:16px">Ninguém com esse nome${cargo ? ' nesse cargo' : ''}.</p>`}
      ${res?.itens.map((m) => {
        const opcoes = s.cargos.filter((c) => !c.acima && !m.cargos.includes(c.id)).map((c) => ({ v: c.id, t: c.nome, cor: corDe(c), nota: c.perigoso ? 'moderação' : '' }));
        return html`<div class="membro">
          <div class="membro-quem">
            <${Avatar} m=${m} />
            <div style="display:grid;min-width:0">
              <b class="membro-nome">${m.nome}${m.bot && html` <span class="hier-etiqueta" style="background:#b6c8ee">BOT</span>`}</b>
              <span style="font-size:12px;color:var(--cinza)">@${m.usuario}${m.entrou ? ` · entrou ${tempoRelativo(m.entrou)}` : ''}</span>
            </div>
          </div>
          <div class="membro-cargos">
            ${m.cargos.filter((id) => porId.has(id)).map((id) => {
              const c = porId.get(id);
              return html`<span class="membro-cargo"><span class="ls-bola" style=${`--c:${corDe(c)}`}></span>${c.nome}
                ${!c.acima && html`<button type="button" title="Tirar cargo" onClick=${() => fazer({ acao: 'tirar', userId: m.id, cargoId: id }, 'tirado')}>×</button>`}</span>`;
            })}
            ${opcoes.length > 0 && html`<${ListaSuspensa} variante="pilula" estilo="flex:none;width:auto" placeholder="+ cargo" valor="" opcoes=${opcoes} onChange=${(v) => v && darCargo(m, v)} />`}
          </div>
          <div class="membro-acoes">
            ${m.avisos > 0 && html`<span class="membro-selo">${m.avisos} ${m.avisos === 1 ? 'aviso' : 'avisos'}</span>`}
            ${m.silenciadoAte && html`<button type="button" class="membro-selo azul" title="Tirar o silêncio" onClick=${() => fazer({ acao: 'dessilenciar', userId: m.id }, MEME.dessilenciar)}>🔇 ${ateQuando(m.silenciadoAte)} ×</button>`}
            <button type="button" class="btn pequeno" disabled=${m.bot} onClick=${() => setAcao({ tipo: 'avisar', m })}>Avisar</button>
            <button type="button" class="btn pequeno" disabled=${!m.podeSilenciar} title=${m.podeSilenciar ? '' : 'Admin, dono ou acima do bot: não dá'} onClick=${() => setAcao({ tipo: 'silenciar', m })}>Silenciar</button>
            <button type="button" class="btn-perigo pequeno" disabled=${!m.podeExpulsar} title=${m.podeExpulsar ? '' : 'Admin, dono ou acima do bot: não dá'} onClick=${() => setAcao({ tipo: 'expulsar', m })}>Expulsar</button>
          </div>
        </div>`;
      })}
    </div>
    ${nav && html`<${Paginacao} p=${nav} ir=${(n) => setUi({ mbPagina: n })} />`}
    ${acao && html`<${FichaAcao} acao=${acao} regras=${cfg.moderacao} fechar=${() => setAcao(null)} fazer=${fazer} />`}
  </div>`;
}

/** Confirmação de Avisar/Silenciar/Expulsar, com motivo (e duração no silêncio) */
function FichaAcao({ acao, regras, fechar, fazer }) {
  const { tipo, m } = acao;
  const [motivo, setMotivo] = useState('');
  const [duracao, setDuracao] = useState('10min');
  const [indo, setIndo] = useState(false);
  const titulo = { avisar: 'AVISAR', silenciar: 'SILENCIAR', expulsar: 'EXPULSAR' }[tipo];
  const limites = [regras.silenciar && `com ${regras.silenciar} o bot silencia por 1 hora`, regras.expulsar && `com ${regras.expulsar}, expulsa`].filter(Boolean).join('; ');
  const explica = {
    avisar: `${m.nome} tem ${m.avisos} ${m.avisos === 1 ? 'aviso valendo' : 'avisos valendo'}${limites ? `: ${limites}` : ''}. Cada aviso some depois de 30 dias. Ele recebe uma DM com o motivo.`,
    silenciar: `${m.nome} não vai conseguir mandar mensagem nem falar em call até o tempo acabar.`,
    expulsar: `${m.nome} sai do servidor e só volta com um convite novo. Isso não tem desfazer.`,
  }[tipo];
  const ir = async (e) => {
    e.preventDefault();
    setIndo(true);
    if (await fazer({ acao: tipo, userId: m.id, motivo, duracao }, MEME[tipo])) fechar();
    else setIndo(false);
  };
  return html`<div class="fundo-ficha" onClick=${(e) => e.target === e.currentTarget && fechar()}>
    <form class="cartao sombra ficha-acao" onSubmit=${ir}>
      <h2 class="h2">${titulo} @${m.nome}</h2>
      <p style="margin:0;font-size:14px;text-wrap:pretty">${explica}</p>
      ${tipo === 'silenciar' && html`<div class="rotulo">Por quanto tempo<${Segmentado} classe="pequeno" opcoes=${SILENCIOS} valor=${duracao} onChange=${setDuracao} /></div>`}
      <label class="rotulo">Motivo (opcional)
        <input class="campo" maxlength="300" placeholder=${tipo === 'avisar' ? 'tipo: flood no #geral' : 'vai pro registro de auditoria'} value=${motivo} onInput=${(e) => setMotivo(e.target.value)} />
      </label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button type="button" class="btn" onClick=${fechar}>Cancelar</button>
        <button class=${`btn sombra ${tipo === 'expulsar' ? 'vermelho' : 'navy'}`} disabled=${indo}>${indo ? 'Indo…' : { avisar: 'Avisar', silenciar: 'Silenciar', expulsar: 'Expulsar' }[tipo]}</button>
      </div>
    </form>
  </div>`;
}
