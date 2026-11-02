// Aba Temas › Datas festivas: o bot se fantasia sozinho (calendário, lista de datas, editor e prévia)
import { html } from '../../vendor/preact-htm.js';
import { useApp } from '../estado.js';
import { hexOk, urlImagem } from '../logica.js';
import { anoDoProximo, bannerDoTema, chaveDia, datasDoTema, diasAte, hojeDe, padraoDoTema, temaAtivo, temasDoMes } from '../temas.js';
import { Adesivo, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';
import { SeletorBanner } from '../ui/seletor-banner.js';
import { ListaAniversarios, TelaAniversarios } from './aniversarios.js';

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const CORES = ['#C4363C', '#2F6B4A', '#F2C14E', '#E67E22', '#9B59B6', '#3498DB', '#FF6EC7', '#111111'];
const TIPOS = [['painel', 'Painel', 'painel'], ['entrada', 'Entrou', 'portaria'], ['saida', 'Saiu', 'portaria'], ['expulsao', 'Expulso', 'portaria'], ['ban', 'Banido', 'portaria'], ['silencio', 'Silenciado', 'portaria'], ['news', 'Notícias', 'news']];
const dois = (n) => String(n).padStart(2, '0');
const quandoTxt = (d) => (d === 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`);

// Sub-abas: Datas festivas, Aniversários e Lista de aniversários
export function AbaTemas() {
  const { ui, setUi } = useApp();
  const v = ui.tmView ?? 'datas';
  return html`<div style="display:grid;gap:22px">
    <div style="display:flex;flex-wrap:wrap;gap:10px">
      ${[['datas', 'Datas festivas'], ['niver', 'Aniversários'], ['lista', 'Lista de aniversários']].map(([id, nome]) => html`<button type="button" class=${`sub-aba${v === id ? ' on' : ''}`} onClick=${() => setUi({ tmView: id })}>${nome}</button>`)}
    </div>
    ${v === 'niver' ? html`<${TelaAniversarios} />` : v === 'lista' ? html`<${ListaAniversarios} />` : html`<${TelaDatas} />`}
  </div>`;
}

function TelaDatas() {
  const { cfg, estado, ui, setUi, mudar, api } = useApp();
  const T = cfg.temas;
  const hoje = hojeDe(estado);
  const servidor = estado.servidor?.nome ?? 'Seu servidor';
  const comDatas = T.lista.map((t) => ({ ...t, ...datasDoTema(t, anoDoProximo(t, hoje)) }));
  const ativo = temaAtivo(T, hoje);
  const sel = comDatas.find((t) => t.id === ui.tmSel) ?? comDatas[0];
  const muda = (id, patch) => mudar((x) => Object.assign(x.temas.lista.find((t) => t.id === id), patch));
  const simulado = ui.tmSim ? comDatas.find((t) => t.id === ui.tmSim) : null;

  const proximo = comDatas.filter((t) => t.on && t.id !== ativo?.id).map((t) => ({ t, d: diasAte(t, hoje) })).filter((x) => x.d != null).sort((a, b) => a.d - b.d)[0];
  const proxTxt = proximo ? `Próximo: ${proximo.t.nome}, ${quandoTxt(proximo.d)} (${proximo.t.ini}).` : 'Nenhuma data agendada.';
  const ativoDatas = ativo && comDatas.find((t) => t.id === ativo.id);
  const status = simulado
    ? { cls: 'sim', titulo: `Simulando: ${simulado.nome}`, texto: `Como se hoje fosse ${simulado.ini}. Abra as outras abas pra ver.`, dot: simulado.cor }
    : !T.auto
      ? { cls: 'off', titulo: 'Temas desligados', texto: 'As mensagens usam sempre as imagens normais.', dot: '#9a917c' }
      : ativo
        ? { cls: 'no-ar', titulo: `${ativo.nome} no ar`, texto: `Até ${ativoDatas.fim}. ${proxTxt}`, dot: ativo.cor }
        : { cls: '', titulo: 'Sem tema hoje', texto: proxTxt, dot: '#e4dccb' };

  const tipo = TIPOS.find((x) => x[0] === ui.tmPrevMsg) ?? TIPOS[0];
  const usa = sel && sel.onde[tipo[2]];
  const PREV = {
    painel: ['Escolha sua cor', 'Clique num botão aqui embaixo pra pintar seu nome.'],
    entrada: ['Calouro na área!', `<@1> acabou de entrar. Bem-vindo(a) ao ${servidor}!`],
    saida: ['Matrícula trancada', '<@1> saiu do servidor.'],
    expulsao: ['Expulsão', '<@1> foi expulso(a) por <@2>.'],
    ban: ['Banimento', '<@1> foi banido(a) do servidor.'],
    silencio: ['Silenciado', '<@1> ficou em silêncio por 1 hora.'],
    news: ['Notícias do bot', 'Saiu atualização nova. Leia tudo no painel.'],
  }[tipo[0]];
  const novoAviso = () => {
    const id = `av${Date.now().toString(36)}`, d = `${dois(hoje.dia)}/${dois(hoje.mes)}`;
    mudar((x) => x.temas.lista.push({ id, custom: true, nome: 'Aviso novo', ini: d, fim: d, on: true, cor: '#F2C14E', banner: '', frase: 'Escreva aqui o aviso.', onde: { painel: true, portaria: true, news: true }, msgs: {} }));
    setUi({ tmSel: id });
  };
  const apagar = () => {
    mudar((x) => (x.temas.lista = x.temas.lista.filter((t) => t.id !== sel.id)));
    setUi({ tmSel: T.lista[0]?.id, ...(ui.tmSim === sel.id && { tmSim: '' }) });
  };

  return html`
    <div class="colunas">
      <div class="col-editor">
        <div style="display:grid;gap:6px">
          <div class="cabeca-linha"><h1 class="h1">TEMAS</h1><span class="rabisco">o bot se fantasia sozinho</span></div>
          <p class="sub" style="max-width:62ch">Em cada data, o bot troca o banner, a cor do embed e coloca uma frase nas mensagens. Quando a data acaba, tudo volta ao normal.</p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">
          <div class=${`tema-status ${status.cls}`}>
            <span class="tema-status-bola" style=${`--c:${hexOk(status.dot)}`}></span>
            <div style="display:grid;gap:3px;min-width:0">
              <span class="tema-status-sub">HOJE · ${dois(hoje.dia)} ${MESES[hoje.mes - 1]}</span>
              <b class="tema-status-titulo">${status.titulo}</b>
              <span class="tema-status-texto">${status.texto}</span>
            </div>
          </div>
          <div class="rotulo cartao" style="padding:14px 18px;gap:6px">Simular uma data
            <${ListaSuspensa} valor=${ui.tmSim ?? ''} onChange=${(v) => setUi({ tmSim: v })}
              opcoes=${[{ v: '', t: 'Hoje (data real)' }, ...comDatas.map((t) => ({ v: t.id, t: t.nome, nota: t.ini, cor: hexOk(t.cor) }))]} />
            <span style="font-size:12px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--cinza)">Veja como ficam as outras abas naquele dia. Não muda nada no servidor.</span>
          </div>
          <div class="cartao" style="gap:4px;padding:8px 18px">
            <div style="display:flex;align-items:center;gap:14px;padding:8px 0;border-bottom:2px dashed var(--tracejado)">
              <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">Trocar tema sozinho</b><span style="font-size:13px;color:var(--cinza)">Desligado, nada muda nas datas.</span></div>
              <${Toggle} on=${T.auto} onClick=${() => mudar((x) => (x.temas.auto = !T.auto))} />
            </div>
            <div style="display:flex;align-items:center;gap:14px;padding:8px 0">
              <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">Manter minhas imagens</b><span style="font-size:13px;color:var(--cinza)">Se você trocou o banner de uma mensagem, o tema não mexe nele.</span></div>
              <${Toggle} on=${T.respeitar} onClick=${() => mudar((x) => (x.temas.respeitar = !T.respeitar))} />
            </div>
          </div>
        </div>

        <div style="display:grid;gap:10px">
          <span class="rotulo">Calendário</span>
          <div class="calendario">
            ${MESES.map((nome, i) => {
              const atual = i + 1 === hoje.mes;
              return html`<div class=${`mes${atual ? ' atual' : ''}`}>
                <span class="mes-nome">${nome}</span>
                ${temasDoMes(T, i + 1, hoje.ano).map((t) => html`<span class="mes-tema"><i style=${`--c:${hexOk(t.cor)}`}></i>${t.nome}</span>`)}
              </div>`;
            })}
          </div>
        </div>

        <div style="display:grid;gap:10px">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span class="rotulo">Datas e avisos</span>
            <button type="button" class="btn mostarda sombra" style="margin-left:auto" onClick=${novoAviso}>+ Aviso personalizado</button>
          </div>
          <div style="display:grid;gap:8px">
            ${comDatas.map((t) => {
              const noAr = ativo?.id === t.id;
              return html`<div class=${`tema-linha${sel?.id === t.id ? ' sel' : ''}`}>
                <button type="button" class="tema-linha-botao" onClick=${() => setUi({ tmSel: t.id })}>
                  <img src=${urlImagem(bannerDoTema(t, 'entrada'), '', api)} alt="" loading="lazy" />
                  <span style="flex:1;min-width:0;display:grid;gap:3px">
                    <span style="display:flex;align-items:center;gap:8px;font:800 16px/1.1 var(--corpo)"><i class="tema-bola" style=${`--c:${hexOk(t.cor)}`}></i>${t.nome}</span>
                    <span style="font:500 13px var(--mono);color:var(--cinza)">${t.ini === t.fim ? `${t.ini} · 1 dia` : `${t.ini} → ${t.fim}`}</span>
                  </span>
                  <span class=${`tema-estado${!t.on ? ' off' : noAr ? ' no-ar' : ''}`}>${!t.on ? 'DESLIGADO' : noAr ? 'NO AR' : 'AGENDADO'}</span>
                </button>
                <${Toggle} on=${t.on} onClick=${() => muda(t.id, { on: !t.on })} />
              </div>`;
            })}
          </div>
        </div>
      </div>

      ${sel &&
      html`<aside class="col-lado">
        <div class="cartao">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font:400 20px/1 var(--titulo)">${(sel.nome || 'Sem nome').toUpperCase()}</span>
            ${sel.custom && html`<button type="button" class="btn-perigo pequeno" style="margin-left:auto;font-size:12px;padding:5px 10px" onClick=${apagar}>Apagar</button>`}
          </div>
          <label class="rotulo">Nome <input class="campo" maxlength="60" value=${sel.nome} onInput=${(e) => muda(sel.id, { nome: e.target.value })} /></label>
          ${sel.movel
            ? html`<div class="nota-movel"><b>Data móvel:</b> muda todo ano e o bot calcula sozinho. Em ${anoDoProximo(sel, hoje)}: ${sel.ini} → ${sel.fim}.</div>`
            : html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <label class="rotulo">Começa (dia/mês) <input class="campo mono" placeholder="01/12" value=${sel.ini} onInput=${(e) => muda(sel.id, { ini: e.target.value })} /></label>
                <label class="rotulo">Termina (dia/mês) <input class="campo mono" placeholder="26/12" value=${sel.fim} onInput=${(e) => muda(sel.id, { fim: e.target.value })} /></label>
              </div>`}
          ${!sel.movel && (chaveDia(sel.ini) == null || chaveDia(sel.fim) == null) && html`<span class="sb-erro" style="font-size:12px">Use dia/mês, tipo 25/12.</span>`}
          <label class="rotulo">Frase extra nas mensagens <textarea class="campo" rows="2" maxlength="300" value=${sel.frase} onInput=${(e) => muda(sel.id, { frase: e.target.value })}></textarea></label>
          <div style="display:grid;gap:8px"><span class="rotulo">Cor do embed</span>
            <div style="display:flex;flex-wrap:wrap;gap:10px">${CORES.map((v) => html`<button type="button" class=${`amostra${sel.cor.toUpperCase() === v ? ' marcada' : ''}`} style=${`--c:${v}`} title=${v} onClick=${() => muda(sel.id, { cor: v })}></button>`)}</div>
          </div>
          <div style="display:grid;gap:8px"><span class="rotulo">Usar em</span>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              ${[['painel', 'Painel de cores'], ['portaria', 'Portaria'], ['news', 'Notícias']].map(([k, nome]) => html`<button type="button" class=${`chip navy${sel.onde[k] ? ' on' : ''}`} style="padding:6px 12px;font-size:13px" onClick=${() => muda(sel.id, { onde: { ...sel.onde, [k]: !sel.onde[k] } })}>${sel.onde[k] ? '✓ ' : ''}${nome}</button>`)}
            </div>
          </div>
          <div style="display:grid;gap:8px"><span class="rotulo">Imagem de cada mensagem</span>
            <div class="tema-msgs">
              ${TIPOS.map(([id, nome]) => html`<button type="button" class=${`tema-msg${tipo[0] === id ? ' on' : ''}`} onClick=${() => setUi({ tmPrevMsg: id })}>
                <img src=${urlImagem(bannerDoTema(sel, id), '', api)} alt="" loading="lazy" /><span>${nome}</span>
              </button>`)}
            </div>
            <span style="font-size:13px;color:var(--cinza)">Trocando a imagem de: <b style="color:var(--tinta)">${tipo[1]}</b></span>
            <${SeletorBanner} valor=${sel.msgs?.[tipo[0]] ?? ''} padrao=${padraoDoTema(sel, tipo[0])} tipo="banner" mensagem=${tipo[0]}
              onChange=${(v) => mudar((x) => {
                const t = x.temas.lista.find((y) => y.id === sel.id);
                t.msgs = { ...t.msgs };
                if (v) t.msgs[tipo[0]] = v;
                else delete t.msgs[tipo[0]];
              })} />
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font:400 16px var(--titulo)">PRÉVIA</span>
          <span class="pilula-navy" style="margin-left:auto">${tipo[1]}</span>
        </div>
        <${Previa} hora=${'09:00'} ctx=${{ cargos: estado.servidor?.cargos ?? [], usuarios: { 1: 'rafa_cringe', 2: 'marina.exe' } }}
          msg=${usa
            ? { topo: urlImagem(bannerDoTema(sel, tipo[0]), '', api), cor: hexOk(sel.cor), titulo: PREV[0], texto: [sel.frase && `**${sel.frase}**`, PREV[1]].filter(Boolean).join('\n'), rodape: `${servidor} · tema ${sel.nome}` }
            : {}}
          depois=${!usa && html`<div class="tema-desligado">Este tema está desligado para esta mensagem. Ela sai com as imagens normais.</div>`} />
        <div style="display:flex;justify-content:flex-end"><${Adesivo} solto texto="vestiu a fantasia sozinho" cor="#b9dcb0" estilo="font-size:15px;padding:6px 10px" /></div>
      </aside>`}
    </div>`;
}
