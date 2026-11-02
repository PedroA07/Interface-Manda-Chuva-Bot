// Aba Notícias: o Jornal do Campus (changelog do bot, que vem da API) e onde o bot avisa no Discord
import { html, useState } from '../../vendor/preact-htm.js';
import { useApp } from '../estado.js';
import { PADROES } from '../galeria.js';
import { dataCurta, naoLidas, paginar, urlImagem } from '../logica.js';
import { Adesivo, Paginacao, Toggle } from '../ui/basicos.js';
import { ImagensEmbed } from '../ui/imagens-embed.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';

const COR_TAG = { NOVIDADE: '#b9dcb0', MELHORIA: '#b6c8ee', 'CORREÇÃO': '#f5b5a8' };
const FILTROS = [['tudo', 'Tudo'], ['NOVIDADE', 'Novidades'], ['MELHORIA', 'Melhorias'], ['CORREÇÃO', 'Correções']];
const hoje = () => new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

export function AbaNoticias() {
  const { cfg, estado, ui, setUi, mudar, api } = useApp();
  const [filtro, setFiltro] = useState('tudo');
  const [pagina, setPagina] = useState(1);
  const lista = estado.noticias ?? [];
  const novas = new Set(naoLidas(lista, ui.lido).map((n) => n.versao));
  const filtradas = lista.filter((n) => filtro === 'tudo' || n.tag === filtro);
  const p = paginar(filtradas, pagina, 3);
  const n = cfg.noticias;
  const muda = (patch) => mudar((x) => Object.assign(x.noticias, patch));
  const s = estado.servidor;
  const canal = s?.canais.find((c) => c.id === n.canalId);
  const opCanais = [{ v: '', t: 'Escolha um canal' }, ...(s?.canais ?? []).map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' }))];
  const opMencao = [{ v: '', t: 'Ninguém' }, ...(s?.cargos ?? []).map((r) => ({ v: r.id, t: `@${r.nome}`, cor: r.cor !== '#000000' ? r.cor : undefined })), { v: 'everyone', t: '@everyone', nota: 'corajoso' }];
  const ultima = (n.quais === 'grandes' ? lista.find((x) => x.grande) : lista[0]) ?? lista[0];
  const P = PADROES.news, i = n.imgs;
  const msg = ultima && {
    acima: n.mencao === 'everyone' ? '@everyone' : n.mencao ? `<@&${n.mencao}>` : '',
    topo: urlImagem(i.topo, P.topo, api),
    cor: '#f2c14e',
    texto: `-# **Jornal do Campus · v${ultima.versao}**\n### ${ultima.titulo}\n${ultima.texto}`,
    mini: urlImagem(i.mini, P.mini, api),
    imagem: urlImagem(i.imagem, P.imagem, api),
    rodape: 'Leia tudo no painel',
    finais: i.finais.map((f) => urlImagem(f, P.final, api)).filter(Boolean),
  };
  const filtrar = (f) => (setFiltro(f), setPagina(1));

  return html`
    <div class="colunas">
      <div class="col-editor" style="gap:20px">
        <div class="jornal-cabeca">
          <div class="jornal-linha"><span>JORNAL DO CAMPUS</span><span>EDIÇÃO Nº ${lista.length}</span><span>${hoje()}</span></div>
          <h1 class="jornal-titulo">O MANDA CHUVA</h1>
          <span style="font:400 17px var(--rabisco);color:var(--vermelho)">tudo que mudou no bot, sem fake news</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
          ${FILTROS.map(([id, nome]) => html`<button type="button" class=${`chip${filtro === id ? ' on' : ''}`} style="padding:7px 14px;font-size:13px" onClick=${() => filtrar(id)}>${nome}</button>`)}
          <button type="button" class="btn-link" style="margin-left:auto;padding:7px 4px;font-size:13px;text-decoration-thickness:2px" onClick=${() => lista[0] && setUi({ lido: lista[0].versao })}>Marcar tudo como lido</button>
        </div>
        <div style="display:grid;gap:18px">
          ${p.itens.map(
            (x, k) => html`<article class=${`noticia${novas.has(x.versao) ? ' nova' : ''}`}>
              <div class="noticia-lado"><span class="noticia-versao">v${x.versao}</span><span class="noticia-data">${dataCurta(x.data)}</span></div>
              <div style="display:grid;gap:8px">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                  <span class="noticia-tag" style=${`--c:${COR_TAG[x.tag] ?? '#efe8d8'}`}>${x.tag}</span>
                  ${novas.has(x.versao) && html`<span class="noticia-nao-lida"><i></i>NÃO LIDA</span>`}
                </div>
                <h3 class="noticia-titulo">${x.titulo}</h3>
                <p style="margin:0;color:#3d4152;text-wrap:pretty">${x.texto}</p>
                ${x.imagem && html`<img src=${x.imagem} alt="" style="display:block;width:100%;margin-top:4px;border:var(--borda);border-radius:10px" />`}
              </div>
              <${Adesivo} texto=${x.adesivo} giro=${k % 2 ? '4deg' : '-4deg'} estilo="top:-12px;right:16px" />
            </article>`,
          )}
          ${p.vazio && html`<p class="dica" style="text-align:center;padding:20px">Nada por aqui. Nem fofoca.</p>`}
          <${Paginacao} p=${p} ir=${setPagina} />
        </div>
      </div>

      <aside class="col-lado" style="flex:1 1 380px">
        <div class="cartao sombra" style="padding:18px">
          <div style="display:flex;align-items:center;gap:12px">
            <h2 class="h2" style="flex:1">AVISAR NO DISCORD</h2>
            <${Toggle} on=${n.on} onClick=${() => muda({ on: !n.on })} />
          </div>
          <p style="margin:0;font-size:14px;color:var(--cinza);text-wrap:pretty">Quando o bot ganha uma atualização, ele posta a notícia num canal do servidor.</p>
          <div class="rotulo">Canal
            <${ListaSuspensa} valor=${n.canalId ?? ''} opcoes=${opCanais} onChange=${(v) => muda({ canalId: v || null })} />
          </div>
          ${n.on && !n.canalId && html`<span class="sb-erro">Escolha o canal pro bot postar.</span>`}
          <div class="rotulo">Mencionar
            <${ListaSuspensa} valor=${n.mencao} opcoes=${opMencao} onChange=${(v) => muda({ mencao: v })} />
          </div>
          ${n.mencao === 'everyone' && s && !s.podeMencionarTodos && html`<span class="sb-erro">O cargo do bot precisa da permissão "Mencionar @everyone" pra isso marcar alguém.</span>`}
          <div style="display:grid;gap:6px">
            <span class="rotulo">Imagens do aviso</span>
            <${ImagensEmbed} imgs=${n.imgs} padroes=${P} mensagem="news" onChange=${(imgs) => muda({ imgs })} />
          </div>
          <div style="display:grid;gap:6px">
            <span class="rotulo">Quais atualizações</span>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${[['todas', 'Todas'], ['grandes', 'Só as grandes']].map(
                ([id, nome]) => html`<button type="button" class=${`btn${n.quais === id ? ' navy' : ''}`} style="font:700 13px var(--corpo)" onClick=${() => muda({ quais: id })}>${nome}</button>`,
              )}
            </div>
          </div>
          <p class="dica">Na primeira vez, o bot posta só a notícia mais recente. Depois, cada versão nova sai sozinha.</p>
        </div>
        ${msg &&
        html`<div style="display:grid;gap:10px">
          <span style="font:400 16px var(--titulo)">PRÉVIA · #${canal?.nome ?? 'canal'}</span>
          <${Previa} msg=${msg} ctx=${{ cargos: s?.cargos ?? [] }} />
        </div>`}
      </aside>
    </div>`;
}
