// Markdown do Discord → HTML, só pra prévia. Escapa tudo antes de formatar.

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const urlEmoji = (id, animado) => `https://cdn.discordapp.com/emojis/${id}.${animado ? 'gif' : 'png'}?size=48`;
export const pilula = (texto, cor = '#c9cdfb', fundo = '#5865f24d') => `<span class="dc-mencao" style="color:${cor};background:${fundo}">${texto}</span>`;

/** @param {{ cargos?: { id: string, nome: string, cor: string }[], canais?: { id: string, nome: string }[], usuarios?: Record<string, string> }} ctx */
function linha(t, { cargos = [], canais = [], usuarios = {} }) {
  return esc(t)
    .replace(/&lt;(a?):\w+:(\d+)&gt;/g, (_, a, id) => `<img class="dc-emoji" src="${urlEmoji(id, a)}" alt="">`)
    .replace(/&lt;@&amp;(\d+)&gt;/g, (_, id) => {
      const r = cargos.find((x) => x.id === id);
      const cor = r && r.cor !== '#000000' ? r.cor : '#C9CDFB';
      return pilula(`@${esc(r ? r.nome : 'cargo')}`, cor, `${cor}26`);
    })
    .replace(/&lt;@!?(\d+)&gt;/g, (_, id) => pilula(`@${esc(usuarios[id] ?? 'usuário')}`))
    .replace(/&lt;#(\d+)&gt;/g, (_, id) => pilula(`#${esc(canais.find((c) => c.id === id)?.nome ?? 'canal')}`))
    .replace(/@(everyone|here)\b/g, (_, quem) => pilula(`@${quem}`))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>');
}

/** Texto do Discord em HTML: negrito, itálico, código, menções coloridas, emojis do servidor, #/##/### e -# */
export function markdown(texto, ctx = {}) {
  let html = '';
  let antesTexto = false;
  for (const l of String(texto ?? '').split('\n')) {
    const bloco = /^(#{1,3}|-#)\s+(.*)$/.exec(l);
    if (bloco) {
      const classe = { '#': 'dc-h1', '##': 'dc-h2', '###': 'dc-h3', '-#': 'dc-sub' }[bloco[1]];
      html += `<div class="${classe}">${linha(bloco[2], ctx)}</div>`;
      antesTexto = false;
    } else {
      html += (antesTexto ? '<br>' : '') + linha(l, ctx);
      antesTexto = true;
    }
  }
  return html;
}
