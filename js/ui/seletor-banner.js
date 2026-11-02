// Escolher uma imagem: modelos da galeria (com filtro e páginas), link direto ou arquivo enviado (vira anexo no bot)
import { html, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { GALERIA, TEMAS } from '../galeria.js';
import { origemImagem, urlImagem } from '../logica.js';
import { Segmentado } from './basicos.js';

const MAX = 8 * 1024 * 1024;
const TIPOS = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const PROPORCAO = { mini: '1 / 1', card: '600 / 260', rodape: 'auto', banner: '3 / 1' };

const lerBase64 = (arquivo) =>
  new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] ?? '');
    r.onerror = () => falha(new Error('Não consegui ler o arquivo.'));
    r.readAsDataURL(arquivo);
  });

/** mensagem: 'painel', 'entrada', 'news'... — a versão de cada banner pra essa mensagem aparece primeiro */
export function SeletorBanner({ valor = '', padrao = 'none', tipo = 'banner', opcional = false, mensagem = '', onChange }) {
  const { api } = useApp();
  const [modo, setModo] = useState('padrao');
  const [link, setLink] = useState('');
  const [arquivo, setArquivo] = useState('');
  const [erro, setErro] = useState('');
  const [cat, setCat] = useState('Todos');
  const [tema, setTema] = useState('');
  const [pg, setPg] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const mini = tipo === 'mini';
  const atual = urlImagem(valor, padrao, api);
  const escolhido = valor || padrao;
  const todos = GALERIA[tipo] ?? GALERIA.banner;
  const daMensagem = (x) => (mensagem && x[3]?.tipo === mensagem ? 0 : 1);
  const lista = todos
    .filter((x) => (cat === 'Todos' || x[2] === cat) && (!tema || x[3]?.tema === tema))
    .map((x, i) => [x, i])
    .sort((a, b) => daMensagem(a[0]) - daMensagem(b[0]) || a[1] - b[1])
    .map(([x]) => x);
  const porPagina = mini ? 12 : 6;
  const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const pagina = Math.min(pg, paginas);
  const cats = ['Todos', ...['Eventos', 'Festas', 'Fundos', 'Clássicos'].filter((c) => todos.some((x) => x[2] === c))];
  const temas = cat === 'Festas' || cat === 'Fundos' ? TEMAS.filter(([id]) => todos.some((x) => x[2] === cat && x[3]?.tema === id)) : [];

  const usarLink = () => {
    const v = link.trim();
    if (!/^https:\/\/\S+$/i.test(v)) return setErro('Cola um link que comece com https://');
    setErro('');
    onChange(v);
  };
  async function enviar(f) {
    if (!f) return;
    if (!TIPOS.includes(f.type)) return setErro('Isso não parece uma imagem.');
    if (f.size > MAX) return setErro('Arquivo maior que 8 MB.');
    setErro('');
    setEnviando(true);
    try {
      const r = await chamar('/api/anexo', { base64: await lerBase64(f), tipo: f.type, nome: f.name });
      setArquivo(f.name);
      onChange(r.ref);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return html`
    <div class="sb">
      <div class=${`sb-quadro${mini ? ' mini' : ''}${tipo === 'rodape' ? ' rodape' : ''}`} style=${`--prop:${PROPORCAO[tipo] ?? '3 / 1'}`}>
        ${atual ? html`<img src=${atual} alt="Imagem escolhida" />` : html`<div class="sb-vazio">sem imagem</div>`}
      </div>
      <div class="sb-linha">
        <span class="sb-origem">${origemImagem(valor, padrao)}</span>
        <div style="margin-left:auto;display:flex;gap:6px">
          ${opcional && html`<button type="button" class="sb-mini-btn" onClick=${() => onChange('none')}>Sem imagem</button>`}
          <button type="button" class="sb-mini-btn" onClick=${() => onChange('')}>Padrão</button>
        </div>
      </div>
      <${Segmentado} opcoes=${[['padrao', 'Modelos'], ['link', 'Link'], ['anexo', 'Anexar']]} valor=${modo} onChange=${(m) => (setModo(m), setErro(''))} />
      ${modo === 'padrao' &&
      html`
        <div class="sb-linha">
          ${cats.map((c) => html`<button type="button" class=${`chip${cat === c ? ' on' : ''}`} style="font-weight:800" onClick=${() => (setCat(c), setTema(''), setPg(1))}>${c}</button>`)}
        </div>
        ${temas.length > 0 &&
        html`<div class="sb-linha">
          ${[['', 'Todas'], ...temas].map(([id, nome]) => html`<button type="button" class=${`chip navy${tema === id ? ' on' : ''}`} style="padding:3px 9px;font-size:11px" onClick=${() => (setTema(id), setPg(1))}>${nome}</button>`)}
        </div>`}
        <div class="sb-grade" style=${`--col:${mini ? '64px' : '110px'};--prop:${mini ? '1 / 1' : tipo === 'card' ? '600 / 260' : '3 / 1'}`}>
          ${lista.slice((pagina - 1) * porPagina, pagina * porPagina).map(
            ([nome, src]) => html`<button type="button" class=${`sb-modelo${escolhido === src ? ' on' : ''}`} title=${nome} onClick=${() => onChange(src)}>
              <img src=${urlImagem(src, '', api)} alt="" loading="lazy" />
              <span>${nome}${/\.gif$/i.test(src) ? html` <b class="sb-gif">GIF</b>` : ''}</span>
            </button>`,
          )}
        </div>
        ${paginas > 1 &&
        html`<div class="sb-pagina">
          <button type="button" disabled=${pagina <= 1} onClick=${() => setPg(pagina - 1)}>‹ Anterior</button>
          <span>${pagina} / ${paginas}</span>
          <button type="button" disabled=${pagina >= paginas} onClick=${() => setPg(pagina + 1)}>Próxima ›</button>
        </div>`}`}
      ${modo === 'link' &&
      html`<div style="display:grid;gap:6px">
        <div style="display:flex;gap:8px">
          <input class="campo mono" value=${link} placeholder="https://.../imagem.gif" onInput=${(e) => setLink(e.target.value)} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), usarLink())} />
          <button type="button" class="btn navy" onClick=${usarLink}>Usar</button>
        </div>
        <span style="font-size:12px;color:var(--cinza)">PNG, JPG ou GIF. Precisa ser o link direto da imagem.</span>
      </div>`}
      ${modo === 'anexo' &&
      html`<label
        class=${`sb-solta${arrastando ? ' arrastando' : ''}`}
        onDragOver=${(e) => (e.preventDefault(), setArrastando(true))}
        onDragLeave=${() => setArrastando(false)}
        onDrop=${(e) => (e.preventDefault(), setArrastando(false), enviar(e.dataTransfer.files[0]))}
      >
        <input type="file" accept=${TIPOS.join(',')} style="display:none" onChange=${(e) => enviar(e.target.files[0])} />
        <b style="font-weight:800">${enviando ? 'Enviando…' : 'Clique ou arraste uma imagem'}</b>
        <span style="font-size:12px;color:var(--cinza);text-wrap:pretty">GIF, PNG, JPG ou WEBP · até 8 MB. O bot manda o arquivo junto com a mensagem.</span>
        ${arquivo && html`<span style="font:500 12px var(--mono)">${arquivo}</span>`}
      </label>`}
      ${erro && html`<span class="sb-erro">${erro}</span>`}
    </div>`;
}
