// Peças pequenas do design: liga/desliga, botões grudados, paginação, adesivo, campo de cor, emoji
import { html, useState } from '../../vendor/preact-htm.js';
import { hexEntrada, hexOk } from '../logica.js';
import { urlEmoji } from '../markdown.js';

export const Toggle = ({ on, onClick, titulo }) =>
  html`<button type="button" class=${`toggle${on ? ' on' : ''}`} onClick=${onClick} aria-pressed=${!!on} title=${titulo}></button>`;

/** opcoes: [[id, nome], ...] */
export const Segmentado = ({ opcoes, valor, onChange, classe = '' }) => html`
  <div class=${`segmentado ${classe}`}>
    ${opcoes.map(([id, nome]) => html`<button type="button" class=${valor === id ? 'on' : ''} onClick=${() => onChange(id)}>${nome}</button>`)}
  </div>`;

/** Linhas por página de uma lista: [valor, mudar]. Fica guardado neste navegador. */
export function usePorPagina(nome, padrao) {
  const [n, setN] = useState(() => Number(localStorage.getItem(`mc_pp_${nome}`)) || padrao);
  return [n, (v) => (localStorage.setItem(`mc_pp_${nome}`, String(v)), setN(v))];
}

/**
 * p = resultado do paginar(); ir(n) troca de página.
 * por = { valor, opcoes, mudar }: mostra o "por página" (volta pra página 1 ao trocar).
 */
export const Paginacao = ({ p, ir, por }) => {
  const seletor = por && p.total > Math.min(...por.opcoes) && html`<span class="por-pagina">por página
    <${Segmentado} classe="pequeno" opcoes=${por.opcoes.map((n) => [n, String(n)])} valor=${por.valor} onChange=${(v) => (por.mudar(v), ir(1))} />
  </span>`;
  if (!p.multi) return seletor ? html`<div class="paginacao">${seletor}</div>` : null;
  return html`<div class="paginacao">
    <button type="button" class="seta" disabled=${!p.temAnterior} onClick=${() => ir(p.pagina - 1)}>‹ Anterior</button>
    ${p.nums.map((x) =>
      x.n === '…'
        ? html`<span class="pg reticencia">…</span>`
        : html`<button type="button" class=${`pg${x.atual ? ' atual' : ''}`} onClick=${() => ir(x.n)}>${x.n}</button>`,
    )}
    <button type="button" class="seta" disabled=${!p.temProxima} onClick=${() => ir(p.pagina + 1)}>Próxima ›</button>
    <span class="info">${p.info}</span>
    ${seletor}
  </div>`;
};

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

/** Logo do Discord (login, topo e perfil) */
export const LogoDiscord = ({ tam = 24 }) => html`<svg viewBox="0 0 24 24" width=${tam} height=${tam} fill="currentColor" aria-label="Discord"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
