// Peças pequenas do design: liga/desliga, botões grudados, paginação, adesivo, campo de cor, emoji
import { html } from '../../vendor/preact-htm.js';
import { hexEntrada, hexOk } from '../logica.js';
import { urlEmoji } from '../markdown.js';

export const Toggle = ({ on, onClick, titulo }) =>
  html`<button type="button" class=${`toggle${on ? ' on' : ''}`} onClick=${onClick} aria-pressed=${!!on} title=${titulo}></button>`;

/** opcoes: [[id, nome], ...] */
export const Segmentado = ({ opcoes, valor, onChange, classe = '' }) => html`
  <div class=${`segmentado ${classe}`}>
    ${opcoes.map(([id, nome]) => html`<button type="button" class=${valor === id ? 'on' : ''} onClick=${() => onChange(id)}>${nome}</button>`)}
  </div>`;

/** p = resultado do paginar(); ir(n) troca de página */
export const Paginacao = ({ p, ir }) =>
  p.multi &&
  html`<div class="paginacao">
    <button type="button" class="seta" disabled=${!p.temAnterior} onClick=${() => ir(p.pagina - 1)}>‹ Anterior</button>
    ${p.nums.map((x) =>
      x.n === '…'
        ? html`<span class="pg reticencia">…</span>`
        : html`<button type="button" class=${`pg${x.atual ? ' atual' : ''}`} onClick=${() => ir(x.n)}>${x.n}</button>`,
    )}
    <button type="button" class="seta" disabled=${!p.temProxima} onClick=${() => ir(p.pagina + 1)}>Próxima ›</button>
    <span class="info">${p.info}</span>
  </div>`;

/** Adesivo de "meme" colado no canto. cor = fundo, giro = rotação */
export const Adesivo = ({ texto, cor = '#f2c14e', giro = '-3deg', estilo = '', solto = false }) =>
  texto && html`<span class=${`adesivo${solto ? ' solto' : ''}`} style=${`--cor-adesivo:${cor};--giro:${giro};${estilo}`}>${texto}</span>`;

/** Seletor de cor + campo hex lado a lado */
export const CampoCor = ({ valor, onChange, placeholder = '#RRGGBB', alto = 42 }) => html`
  <div class="par-cor">
    <input type="color" class="cor-input" style=${`height:${alto}px`} value=${hexOk(valor).toLowerCase()} onInput=${(e) => onChange(e.target.value.toUpperCase())} />
    <input class="campo mono" value=${valor} placeholder=${placeholder} maxlength="7" onInput=${(e) => onChange(hexEntrada(e.target.value))} />
  </div>`;

/** Bolinhas de cor pra clicar. marcada = cor escolhida (ganha anel) */
export const Amostras = ({ cores, onEscolher, tamanho = '', marcada }) => html`
  <div class="amostras">
    ${cores.map((v) => html`<button type="button" class=${`amostra ${tamanho}${marcada === v ? ' marcada' : ''}`} style=${`--c:${v}`} title=${v} onClick=${() => onEscolher(v)}></button>`)}
  </div>`;

/** Emoji unicode ou do servidor (<a:nome:id>) */
export function Emoji({ texto, classe = '' }) {
  const m = /^<(a?):\w+:(\d+)>$/.exec(texto || '');
  return m ? html`<img class=${classe} src=${urlEmoji(m[2], m[1])} alt="" />` : texto || '';
}
