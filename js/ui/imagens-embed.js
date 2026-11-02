// Grupo de imagens de uma mensagem: banner do topo, miniatura e imagem grande (dentro da caixa) e até 4 no final
import { html } from '../../vendor/preact-htm.js';
import { SeletorBanner } from './seletor-banner.js';

export const MAX_FINAIS = 4;

/** imgs = { topo, mini, imagem, finais[] }; padroes = { topo, mini, imagem, final } */
export function ImagensEmbed({ imgs, padroes, onChange }) {
  const muda = (patch) => onChange({ ...imgs, ...patch });
  const finais = imgs.finais ?? [];
  return html`
    <div style="display:grid;gap:16px">
      <div style="display:grid;gap:6px">
        <span class="rotulo">Banner do topo</span>
        <${SeletorBanner} valor=${imgs.topo} padrao=${padroes.topo} tipo="banner" opcional onChange=${(v) => muda({ topo: v })} />
      </div>
      <div class="bloco-dentro">
        <span style="font:400 15px/1.1 var(--titulo)">DENTRO DO EMBED</span>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;align-items:start">
          <div style="display:grid;gap:6px">
            <span class="rotulo">Miniatura (canto)</span>
            <${SeletorBanner} valor=${imgs.mini} padrao=${padroes.mini} tipo="mini" opcional onChange=${(v) => muda({ mini: v })} />
          </div>
          <div style="display:grid;gap:6px">
            <span class="rotulo">Imagem grande (embaixo)</span>
            <${SeletorBanner} valor=${imgs.imagem} padrao=${padroes.imagem} tipo="banner" opcional onChange=${(v) => muda({ imagem: v })} />
          </div>
        </div>
      </div>
      <div style="display:grid;gap:10px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">
          <span class="rotulo">Imagens no final (opcional)</span>
          <span style="font:400 13px var(--titulo)">${finais.length}/${MAX_FINAIS}</span>
        </div>
        ${finais.map(
          (src, k) => html`<div class="bloco-final">
            <div style="display:flex;align-items:center;gap:8px">
              <b style="flex:1;font-weight:800">Imagem ${k + 1}</b>
              <button type="button" class="btn-perigo" style="padding:4px 10px;font:700 12px var(--corpo)" onClick=${() => muda({ finais: finais.filter((_, j) => j !== k) })}>Tirar</button>
            </div>
            <${SeletorBanner} valor=${src} padrao=${padroes.final} tipo="rodape" onChange=${(v) => muda({ finais: finais.map((x, j) => (j === k ? v : x)) })} />
          </div>`,
        )}
        <button type="button" class="btn-tracejado" disabled=${finais.length >= MAX_FINAIS} onClick=${() => muda({ finais: [...finais, ''] })}>+ Adicionar imagem no final</button>
        <span style="font-size:12px;color:var(--cinza)">Aparecem embaixo do embed, antes dos botões. Até 4.</span>
      </div>
    </div>`;
}
