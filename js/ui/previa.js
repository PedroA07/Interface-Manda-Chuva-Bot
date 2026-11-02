// Prévia imitando o Discord, no mesmo formato das mensagens do bot (lib/mensagem.js lá no bot):
// texto de cima → banner do topo → texto de fora → caixa colorida (título, texto, miniatura, imagem, rodapé) → card → finais → botões
import { html } from '../../vendor/preact-htm.js';
import { useApp } from '../estado.js';
import { esc, markdown } from '../markdown.js';
import { Emoji } from './basicos.js';

const agora = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/**
 * msg: { acima?, topo?, fora?, cor?, titulo?, texto?, mini?, imagem?, rodape?, card? (nó), finais?: string[], linhas?: { texto, emoji, bg, bolinha }[][] }
 * ctx: { cargos, canais } pras menções; antes: nó mostrado acima (ex.: "fulano entrou no servidor")
 */
export function Previa({ msg, ctx = {}, hora, antes, depois }) {
  const { estado } = useApp();
  const b = estado?.bot ?? {};
  const md = (t) => ({ __html: markdown(t, ctx) });
  const corpo = [msg.titulo && `### ${msg.titulo}`, msg.texto].filter(Boolean).join('\n');
  const temCaixa = corpo || msg.mini || msg.imagem || msg.rodape;
  return html`
    <div class="dc">
      ${antes}
      <div class="dc-msg">
        ${b.avatar ? html`<img class="dc-avatar" src=${b.avatar} alt="" />` : html`<div class="dc-avatar">🎨</div>`}
        <div class="dc-corpo">
          <div class="dc-autor">${b.nome || 'Manda Chuva'}<span class="dc-app">APP</span><span class="dc-hora">hoje às ${hora ?? agora()}</span></div>
          ${msg.acima && html`<div class="dc-texto" dangerouslySetInnerHTML=${md(msg.acima)}></div>`}
          ${msg.topo && html`<img class="dc-img" src=${msg.topo} alt="" />`}
          ${msg.fora && html`<div class="dc-texto" style="margin-top:4px" dangerouslySetInnerHTML=${md(msg.fora)}></div>`}
          ${temCaixa &&
          html`<div class="dc-caixa" style=${`--c:${msg.cor || '#2b2d31'}`}>
            <div class=${msg.mini ? 'dc-secao' : ''}>
              ${corpo ? html`<div class="dc-texto" dangerouslySetInnerHTML=${md(corpo)}></div>` : html`<div></div>`}
              ${msg.mini && html`<img class="dc-mini" src=${msg.mini} alt="" />`}
            </div>
            ${msg.imagem && html`<img class="dc-img" style="margin-top:0" src=${msg.imagem} alt="" />`}
            ${msg.rodape && html`<div class="dc-sub" dangerouslySetInnerHTML=${{ __html: esc(msg.rodape) }}></div>`}
          </div>`}
          ${msg.card}
          ${(msg.finais ?? []).map((src) => html`<img class="dc-img" src=${src} alt="" />`)}
          ${msg.linhas?.length > 0 &&
          html`<div class="dc-botoes">
            ${msg.linhas.map(
              (linha) => html`<div class="dc-linha">
                ${linha.map(
                  (bt) => html`<span class="dc-btn" style=${`--c:${bt.bg}`}>
                    ${bt.bolinha && html`<span class="dc-bolinha" style=${`--c:${bt.bolinha}`}></span>`}
                    ${bt.emoji && html`<${Emoji} texto=${bt.emoji} classe="dc-emoji" />`}
                    ${bt.texto && html`<span>${bt.texto}</span>`}
                  </span>`,
                )}
              </div>`,
            )}
          </div>`}
          ${depois}
        </div>
      </div>
    </div>`;
}
