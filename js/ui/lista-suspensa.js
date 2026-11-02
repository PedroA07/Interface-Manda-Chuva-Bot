// Lista suspensa do design (select próprio). opcoes: [{ v, t, cor?, nota?, desabilitado? }]
import { html, useEffect, useRef, useState } from '../../vendor/preact-htm.js';

export function ListaSuspensa({ valor = '', opcoes = [], onChange, variante = 'padrao', placeholder = 'Escolha…', desabilitada = false, estilo = '' }) {
  const [pos, setPos] = useState(null);
  const caixa = useRef(null);
  const botao = useRef(null);
  const sel = opcoes.find((o) => String(o.v) === String(valor));

  useEffect(() => {
    if (!pos) return;
    const fora = (e) => caixa.current && !caixa.current.contains(e.target) && setPos(null);
    const tecla = (e) => e.key === 'Escape' && setPos(null);
    const rolou = (e) => !(e.target instanceof Node && caixa.current?.contains(e.target)) && setPos(null);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    addEventListener('scroll', rolou, true);
    addEventListener('resize', rolou);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
      removeEventListener('scroll', rolou, true);
      removeEventListener('resize', rolou);
    };
  }, [pos]);

  const abrir = () => {
    if (pos || !botao.current) return setPos(null);
    const r = botao.current.getBoundingClientRect();
    const alto = Math.min(280, opcoes.length * 38 + 16);
    const largura = Math.max(r.width, 210);
    const emCima = innerHeight - r.bottom < alto + 12 && r.top > innerHeight - r.bottom;
    setPos({ left: Math.max(8, Math.min(r.left, innerWidth - largura - 8)), width: largura, top: emCima ? r.top - alto - 6 : r.bottom + 6 });
  };
  const escolher = (o) => {
    if (o.desabilitado) return;
    setPos(null);
    onChange?.(o.v);
  };

  return html`
    <div ref=${caixa} class=${`ls ${variante}${pos ? ' aberta' : ''}`} style=${estilo}>
      <button ref=${botao} type="button" class="ls-botao" onClick=${abrir} disabled=${desabilitada}>
        ${sel?.cor && html`<span class="ls-bola" style=${`--c:${sel.cor}`}></span>`}
        <span class="ls-rotulo">${sel ? sel.t : placeholder}</span>
        <span class="ls-seta">▼</span>
      </button>
      ${pos &&
      html`<div class="ls-menu" role="listbox" style=${`top:${pos.top}px;left:${pos.left}px;width:${pos.width}px`}>
        ${opcoes.map(
          (o) => html`<button type="button" role="option" aria-selected=${sel === o} class=${`ls-item${sel === o ? ' on' : ''}${o.desabilitado ? ' off' : ''}`} onClick=${() => escolher(o)}>
            <span class="ls-check">${sel === o ? '✓' : ''}</span>
            ${o.cor && html`<span class="ls-bola" style=${`--c:${o.cor}`}></span>`}
            <span style="flex:1;min-width:0">${o.t}</span>
            ${o.nota && html`<span class="ls-nota">${o.nota}</span>`}
          </button>`,
        )}
      </div>`}
    </div>`;
}
