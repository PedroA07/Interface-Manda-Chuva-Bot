// Aba Portaria: quem entra, quem sai, quem vai pra diretoria — mensagem de cada evento, card de boas-vindas e prévia
import { html } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { PADROES } from '../galeria.js';
import { urlImagem } from '../logica.js';
import { aplicarTema, temaDaPrevia } from '../temas.js';
import { CORES_CARD, CORES_EVENTO, DURACOES, EVENTOS, MODELOS_ENTRADA, MODELOS_EVENTO, TEMPOS, TEXTO_EVENTO } from '../modelos.js';
import { Adesivo, Segmentado, Toggle } from '../ui/basicos.js';
import { ImagensEmbed } from '../ui/imagens-embed.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';
import { SeletorBanner } from '../ui/seletor-banner.js';

const PUNICAO = ['expulsao', 'ban', 'silencio'];
// Gente de exemplo da prévia (o bot usa a pessoa de verdade)
const EXEMPLO = { novato: 'pedrinho', alvo: 'rafa_cringe', moderador: 'marina.exe', motivo: 'spam de figurinha' };

const preencher = (texto, vars) => String(texto ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

function Amostras({ cores, valor, onEscolher }) {
  return html`<div style="display:flex;flex-wrap:wrap;gap:10px">
    ${cores.map((v) => html`<button type="button" class=${`amostra${valor?.toUpperCase() === v.toUpperCase() ? ' marcada' : ''}`} style=${`--c:${v}`} title=${v} onClick=${() => onEscolher(v)}></button>`)}
  </div>`;
}

function LinhaExtra({ titulo, texto, on, onClick, ultimo, children }) {
  return html`<div style=${`display:grid;gap:10px;padding:12px 0;border-bottom:${ultimo ? 'none' : '2px dashed var(--tracejado)'}`}>
    <div style="display:flex;align-items:center;gap:14px">
      <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">${titulo}</b><span style="font-size:13px;color:var(--cinza)">${texto}</span></div>
      <${Toggle} on=${on} onClick=${onClick} />
    </div>
    ${children}
  </div>`;
}

/** Card de boas-vindas em HTML, nas mesmas proporções do que o bot desenha (lib/card.js): placa creme no meio do fundo */
function CardPrevia({ card, nome, vars, api }) {
  const noCard = { ...vars, usuario: nome };
  const lado = card.layout === 'lado';
  return html`<div class="card-previa" style=${`--borda-foto:${card.borda}`}>
    <img src=${urlImagem(card.bg, PADROES.entrada.card, api)} alt="" />
    <div class="card-previa-dentro">
      <div class=${`card-placa${lado ? ' lado' : ''}`}>
        <span class="card-previa-foto" style=${`border-radius:${card.forma === 'quadrado' ? '18%' : '50%'}`}>${nome.charAt(0).toUpperCase()}</span>
        <div class="card-previa-textos">
          ${card.cima && html`<span class="card-previa-cima">${preencher(card.cima, noCard)}</span>`}
          <span class="card-previa-nome">${nome}</span>
          ${card.baixo && html`<span class="card-previa-baixo">${preencher(card.baixo, noCard)}</span>`}
        </div>
      </div>
    </div>
  </div>`;
}

export function AbaPortaria() {
  const { cfg, estado, ui, setUi, mudar, salvar, sujo, aviso, tratar, api } = useApp();
  const id = ui.ev ?? 'entrada';
  const ev = cfg.portaria[id];
  const muda = (patch) => mudar((x) => Object.assign(x.portaria[id], patch));
  const s = estado.servidor, b = estado.bot;
  const punicao = PUNICAO.includes(id);
  const canal = s?.canais.find((c) => c.id === ev.canalId);
  const opCanais = [{ v: '', t: 'Escolha um canal' }, ...(s?.canais ?? []).map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' }))];
  const modelos = id === 'entrada' ? MODELOS_ENTRADA : MODELOS_EVENTO[id];
  const P = PADROES[id];
  // Data festiva no ar (ou simulada na aba Temas): a prévia já mostra o visual do tema
  const tema = aplicarTema(id, ev.imgs, temaDaPrevia(cfg, estado, ui), cfg.temas.respeitar);
  const imgs = tema?.imgs ?? ev.imgs;
  const card = id === 'entrada' && tema?.cardBg && (!cfg.temas.respeitar || !ev.card.bg) ? { ...ev.card, bg: tema.cardBg } : ev.card;
  const semMembros = !b.recursos?.membros && (id === 'entrada' || id === 'saida');
  const semAuditoria = punicao && s?.permissoesFaltando?.includes('Ver o registro de auditoria');

  // Prévia: gente de exemplo, servidor de verdade
  const quem = id === 'entrada' ? EXEMPLO.novato : EXEMPLO.alvo;
  const servidor = s?.nome ?? 'Seu servidor';
  const numero = String(s?.membros ?? 128);
  const vars = { usuario: '<@1>', nome: quem, servidor, numero, moderador: '<@2>', motivo: EXEMPLO.motivo, tempo: TEMPOS[ev.duracao ?? '1h'] };
  const ctx = { cargos: s?.cargos ?? [], usuarios: { 1: quem, 2: EXEMPLO.moderador } };
  const texto = preencher(ev.msg, vars);
  const campos = [ev.motivo && `**Motivo:** ${vars.motivo}`, ev.mod && `**Moderador:** ${vars.moderador}`, id === 'silencio' && `**Duração:** ${vars.tempo}`].filter(Boolean);
  const dentro = ev.textoPos === 'dentro';
  const msg = {
    topo: urlImagem(imgs.topo, P.topo, api),
    fora: dentro ? '' : texto,
    cor: tema?.cor ?? ev.cor,
    titulo: preencher(ev.titulo, vars),
    texto: [tema?.frase && `**${tema.frase}**`, dentro ? texto : '', campos.join('\n')].filter(Boolean).join('\n\n'),
    mini: urlImagem(imgs.mini, P.mini, api),
    imagem: urlImagem(imgs.imagem, P.imagem, api),
    rodape: id === 'entrada' ? `Membro nº ${numero} · ${servidor}` : `${servidor} · agora`,
    card: id === 'entrada' && ev.card.on && html`<${CardPrevia} card=${card} nome=${quem} vars=${vars} api=${api} />`,
    finais: imgs.finais.map((f) => urlImagem(f, P.final, api)).filter(Boolean),
  };
  const linhaSistema = id === 'entrada' && html`<div class="dc-sistema"><span>→</span><span><b>${quem}</b> entrou no servidor.</span></div>`;

  async function testar() {
    if (sujo && !(await salvar())) return;
    try {
      await chamar('/api/portaria/testar', { evento: id });
      aviso('Mandei a mensagem de teste na sua DM.', 'confia');
    } catch (e) {
      tratar(e);
    }
  }
  const inserir = (v) => muda({ msg: `${ev.msg} ${v}` });
  const variaveis = [['{usuario}', id === 'entrada' ? 'menção de quem entrou' : 'quem foi'], ['{servidor}', 'nome do servidor'], ...(punicao ? [['{motivo}', 'motivo'], ['{moderador}', 'quem puniu']] : [['{numero}', id === 'entrada' ? 'número do membro' : 'quantos sobraram']]), ...(id === 'silencio' ? [['{tempo}', 'duração']] : [])];
  const cargoAuto = s?.cargos.find((r) => r.id === ev.cargoAuto?.cargoId);
  const [titulo, sub, meme] = id === 'entrada' ? ['QUANDO ALGUÉM ENTRA', 'O bot recebe quem entra no servidor com uma mensagem no canal que você escolher.', 'ele chegou, galera'] : TEXTO_EVENTO[id];

  return html`
    <div style="display:grid;gap:22px">
      <div style="display:grid;gap:6px">
        <div class="cabeca-linha"><h1 class="h1">PORTARIA</h1><span class="rabisco">quem entra, quem sai, quem vai pra diretoria</span></div>
        <p class="sub">Mensagens automáticas pra cada vez que alguém entra, sai ou leva uma punição.</p>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${EVENTOS.map(([eid, nome, cor]) => {
          const on = cfg.portaria[eid].on, ativo = eid === id;
          return html`<button type="button" class=${`aba-evento${ativo ? ' ativo' : ''}`} onClick=${() => setUi({ ev: eid })}>
            <span class="aba-evento-bola" style=${`--c:${cor}`}></span>
            <span style="display:grid;gap:2px"><span style="font:800 15px/1.1 var(--corpo)">${nome}</span><span class="aba-evento-estado" style=${`--c:${ativo ? '#c9cbe0' : on ? '#2f8f5b' : '#9a917c'}`}>${on ? 'ligado' : 'desligado'}</span></span>
          </button>`;
        })}
      </div>

      <div class="colunas">
        <div class="col-editor">
          <div class="cabeca">
            <div class="cabeca-texto">
              <div class="cabeca-linha"><h2 class="h1" style="font-size:26px">${titulo}</h2>${id === 'entrada' && html`<span class="rabisco">trote liberado (do bem)</span>`}</div>
              <p class="sub" style="max-width:56ch">${sub}</p>
            </div>
            <div class="caixa-liga">
              <span style="font-weight:800">${ev.on ? 'Ligado' : 'Desligado'}</span>
              <${Toggle} on=${ev.on} onClick=${() => muda({ on: !ev.on })} />
            </div>
          </div>
          ${semMembros && html`<div class="aviso-faixa" style="margin:0"><b>O bot ainda não vê quem entra e sai.</b> Ligue a "Server Members Intent" no portal do Discord (seu bot → Bot → Privileged Gateway Intents).</div>`}
          ${semAuditoria && html`<div class="aviso-faixa" style="margin:0"><b>Falta uma permissão.</b> Dê ao cargo do bot "Ver o registro de auditoria" pra ele saber de expulsões, bans e silêncios, com moderador e motivo.</div>`}
          ${ev.on && !ev.canalId && html`<span class="sb-erro">Escolha o canal pro bot postar.</span>`}

          <div class="cartao" style="gap:16px">
            <div class="grade-campos">
              <div class="rotulo">Canal <${ListaSuspensa} valor=${ev.canalId ?? ''} opcoes=${opCanais} onChange=${(v) => muda({ canalId: v || null })} /></div>
              <label class="rotulo">Título do embed <input class="campo" maxlength="256" value=${ev.titulo} onInput=${(e) => muda({ titulo: e.target.value })} /></label>
            </div>
            ${id === 'silencio' &&
            html`<div style="display:grid;gap:8px">
              <span class="rotulo">Duração padrão</span>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${DURACOES.map(([d, nome]) => html`<button type="button" class=${`chip navy${ev.duracao === d ? ' on' : ''}`} style="padding:7px 12px;font-size:13px" onClick=${() => muda({ duracao: d })}>${nome}</button>`)}
              </div>
              ${ev.duracao === 'sem' && html`<span style="font-size:12px;color:var(--cinza);text-wrap:pretty">O castigo do Discord vai até 28 dias. Sem prazo, o bot usa um cargo “Silenciado” até alguém tirar.</span>`}
            </div>`}
            <div style="display:grid;gap:8px">
              <span class="rotulo">Modelos prontos</span>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${modelos.map(([nome, m]) => html`<button type="button" class=${`modelo${ev.msg === m ? ' on' : ''}`} onClick=${() => muda({ msg: m })}>${nome}</button>`)}
              </div>
            </div>
            <label class="rotulo">Mensagem
              <textarea class="campo" rows=${id === 'entrada' ? 4 : 3} maxlength="2000" value=${ev.msg} onInput=${(e) => muda({ msg: e.target.value })}></textarea>
            </label>
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
              <span style="font-size:13px;color:var(--cinza);font-weight:700">Inserir:</span>
              ${variaveis.map(([v, dica]) => html`<button type="button" class="variavel" title=${dica} onClick=${() => inserir(v)}>${v}</button>`)}
              <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                <span style="font-size:13px;color:var(--cinza);font-weight:700">Texto:</span>
                <${Segmentado} classe="pequeno" opcoes=${[['fora', 'Fora do embed'], ['dentro', 'Dentro do embed']]} valor=${ev.textoPos} onChange=${(t) => muda({ textoPos: t })} />
              </div>
            </div>
            ${id !== 'entrada' &&
            html`<div style="display:grid;gap:8px"><span class="rotulo">Cor do embed</span><${Amostras} cores=${CORES_EVENTO} valor=${ev.cor} onEscolher=${(v) => muda({ cor: v })} /></div>`}
            <div style="display:grid;gap:6px">
              <span class="rotulo">${id === 'entrada' ? 'Imagens da mensagem' : 'Imagens'}</span>
              <${ImagensEmbed} imgs=${ev.imgs} padroes=${P} mensagem=${id} onChange=${(imgs) => muda({ imgs })} />
            </div>
          </div>

          ${id === 'entrada' &&
          html`<div class="cartao">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="flex:1;display:grid;gap:2px"><h2 class="h2">CARD DE BOAS-VINDAS</h2><span style="font-size:13px;color:var(--cinza);text-wrap:pretty">Imagem com a foto de perfil e o nome de quem entrou, embaixo do embed.</span></div>
              <${Toggle} on=${ev.card.on} onClick=${() => mudar((x) => (x.portaria.entrada.card.on = !ev.card.on))} />
            </div>
            ${ev.card.on &&
            html`<div style="display:grid;gap:14px">
              <div style="display:grid;gap:6px"><span class="rotulo">Fundo do card</span>
                <${SeletorBanner} valor=${ev.card.bg} padrao=${PADROES.entrada.card} tipo="card" onChange=${(v) => mudar((x) => (x.portaria.entrada.card.bg = v))} />
              </div>
              <div class="grade-campos">
                <label class="rotulo">Texto de cima <input class="campo" maxlength="100" value=${ev.card.cima} onInput=${(e) => mudar((x) => (x.portaria.entrada.card.cima = e.target.value))} /></label>
                <label class="rotulo">Texto de baixo <input class="campo" maxlength="100" value=${ev.card.baixo} onInput=${(e) => mudar((x) => (x.portaria.entrada.card.baixo = e.target.value))} /></label>
              </div>
              <div class="grade-campos">
                <div style="display:grid;gap:6px"><span class="rotulo">Layout</span><${Segmentado} opcoes=${[['centro', 'Centralizado'], ['lado', 'Foto ao lado']]} valor=${ev.card.layout} onChange=${(v) => mudar((x) => (x.portaria.entrada.card.layout = v))} /></div>
                <div style="display:grid;gap:6px"><span class="rotulo">Formato da foto</span><${Segmentado} opcoes=${[['circulo', 'Círculo'], ['quadrado', 'Quadrado']]} valor=${ev.card.forma} onChange=${(v) => mudar((x) => (x.portaria.entrada.card.forma = v))} /></div>
              </div>
              <div class="grade-campos">
                <div style="display:grid;gap:8px"><span class="rotulo">Borda da foto</span><${Amostras} cores=${CORES_CARD} valor=${ev.card.borda} onEscolher=${(v) => mudar((x) => (x.portaria.entrada.card.borda = v))} /></div>
              </div>
              <span style="font-size:12px;color:var(--cinza)">A foto e o nome vêm do perfil de quem entrou. {usuario}, {servidor} e {numero} funcionam nos textos.</span>
            </div>`}
          </div>`}

          <div class="cartao" style="gap:4px;padding:8px 20px">
            <${LinhaExtra} titulo=${id === 'entrada' ? 'Mandar também na DM' : 'Mandar na DM da pessoa'} texto=${id === 'entrada' ? 'Uma cópia vai direto no privado de quem entrou.' : punicao ? 'Ela recebe o aviso com o motivo.' : 'Uma mensagem de tchau no privado.'} on=${ev.dm} onClick=${() => muda({ dm: !ev.dm })} ultimo=${!punicao && id !== 'entrada'} />
            ${id === 'entrada' &&
            html`<${LinhaExtra} titulo=${cargoAuto ? `Dar o cargo @${cargoAuto.nome}` : 'Dar um cargo automático'} texto="Cargo automático assim que a pessoa entra." on=${ev.cargoAuto.on} onClick=${() => mudar((x) => (x.portaria.entrada.cargoAuto.on = !ev.cargoAuto.on))}>
                ${ev.cargoAuto.on && html`<${ListaSuspensa} valor=${ev.cargoAuto.cargoId ?? ''} placeholder="Escolha o cargo"
                  opcoes=${(s?.cargos ?? []).map((r) => ({ v: r.id, t: r.nome, cor: r.cor !== '#000000' ? r.cor : undefined, desabilitado: r.perigoso || r.acima, nota: r.perigoso ? 'tem moderação' : r.acima ? 'acima do bot' : '' }))}
                  onChange=${(v) => mudar((x) => (x.portaria.entrada.cargoAuto.cargoId = v || null))} />`}
              <//>
              <${LinhaExtra} titulo="Avisar quando alguém sai" texto="“{usuario} trancou a matrícula.” no mesmo canal." on=${cfg.portaria.saida.on} ultimo
                onClick=${() => mudar((x) => {
                  x.portaria.saida.on = !x.portaria.saida.on;
                  if (x.portaria.saida.on && !x.portaria.saida.canalId) x.portaria.saida.canalId = x.portaria.entrada.canalId;
                })} />`}
            ${punicao &&
            html`<${LinhaExtra} titulo="Mostrar quem puniu" texto="Aparece como campo no embed." on=${ev.mod} onClick=${() => muda({ mod: !ev.mod })} />
              <${LinhaExtra} titulo="Mostrar o motivo" texto="Aparece como campo no embed." on=${ev.motivo} onClick=${() => muda({ motivo: !ev.motivo })} ultimo />`}
          </div>
        </div>

        <aside class="col-lado">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="font:400 16px var(--titulo)">PRÉVIA · #${canal?.nome ?? 'canal'}</span>
            <button type="button" class="btn mostarda sombra" style="font-size:13px;padding:8px 14px" disabled=${!b.online || !s} onClick=${testar}>Testar comigo</button>
          </div>
          <${Previa} msg=${msg} ctx=${ctx} antes=${linhaSistema} />
          <div style="display:flex;justify-content:flex-end"><${Adesivo} solto texto=${meme} cor=${id === 'entrada' ? '#b9dcb0' : '#f5b5a8'} giro="-3deg" estilo="font-size:15px;padding:6px 10px" /></div>
        </aside>
      </div>
    </div>`;
}
