// Aba Cargos › Moderação: auto-mod, sistema de avisos (vai no Salvar) e livro de ocorrências (Desfazer vale na hora)
import { html } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { paginar } from '../logica.js';
import { COR_TIPO, tempoRelativo } from '../moderacao.js';
import { Adesivo, Paginacao, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';

const AUTOMOD = [
  ['palavrao', 'Filtro de palavrões', 'Apaga mensagens com palavras da lista.'],
  ['spam', 'Anti-spam', '5 mensagens em 3 segundos.'],
  ['convites', 'Convites de outros servidores', 'Bloqueia links discord.gg de fora.'],
  ['mencoes', 'Chuva de menções', 'Mais de 5 menções numa mensagem.'],
  ['links', 'Links suspeitos', 'Encurtadores e golpes de “nitro grátis”.'],
];
const ACOES = [{ v: 'apagar', t: 'Só apagar' }, { v: 'avisar', t: 'Apagar e avisar' }, { v: 'silenciar', t: 'Silenciar 10 min' }, { v: 'expulsar', t: 'Expulsar' }];
const POR_PAGINA = 5;

export function TelaModeracao() {
  const { cfg, estado, ui, setUi, mudar, aviso, tratar, recarregar } = useApp();
  const md = cfg.moderacao;
  const s = estado.servidor;
  const muda = (patch) => mudar((c) => Object.assign(c.moderacao, patch));
  const opCanais = [{ v: '', t: 'Nenhum (só no painel)' }, ...(s?.canais ?? []).map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' }))];
  const numero = (campo) => (e) => {
    const n = Math.min(20, Math.max(0, Math.trunc(Number(e.target.value)) || 0));
    muda({ [campo]: n });
  };

  const livro = estado.ocorrencias ?? [];
  const p = paginar(livro, ui.livroPg ?? 1, POR_PAGINA);
  const desfazer = async (o) => {
    try {
      const r = await chamar('/api/ocorrencias/desfazer', { id: o.id });
      aviso(r.mensagem, 'perdoado, mas tô de olho');
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  };

  return html`<div class="colunas">
    <div style="flex:999 1 520px;min-width:0;display:grid;gap:20px">
      <div class="cartao" style="gap:4px;position:relative">
        <${Adesivo} texto="chega na próxima atualização" cor="#d9c2ec" giro="3deg" estilo="top:-14px;right:16px" />
        <h2 class="h2">AUTO-MODERAÇÃO</h2>
        <p style="margin:0 0 8px;font-size:14px;color:var(--cinza)">O bot age sozinho quando alguém pisa na bola.</p>
        ${AUTOMOD.map(([k, titulo, texto]) => html`<div class="mod-linha desligada">
          <${Toggle} on=${md.automod[k].on} titulo=${titulo} onClick=${() => {}} />
          <div style="flex:1 1 200px;display:grid;gap:2px"><b style="font-weight:800">${titulo}</b><span style="font-size:13px;color:var(--cinza)">${texto}</span></div>
          <${ListaSuspensa} estilo="flex:0 0 190px" valor=${md.automod[k].acao} opcoes=${ACOES} desabilitada=${true} onChange=${() => {}} />
        </div>`)}
      </div>
      <div class="cartao">
        <h2 class="h2">SISTEMA DE AVISOS</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
          <label class="rotulo">Silenciar 1h com
            <input class="campo" type="number" min="0" max="20" value=${md.silenciar} onInput=${numero('silenciar')} />
          </label>
          <label class="rotulo">Expulsar com
            <input class="campo" type="number" min="0" max="20" value=${md.expulsar} onInput=${numero('expulsar')} />
          </label>
          <div class="rotulo">Canal de registros
            <${ListaSuspensa} valor=${md.canalId ?? ''} opcoes=${opCanais} onChange=${(v) => muda({ canalId: v || null })} />
          </div>
        </div>
        <p style="margin:0;font-size:13px;color:var(--cinza)">Contagem em avisos. Eles expiram depois de 30 dias. 0 = nunca. Cada aviso, silêncio e expulsão também aparece no canal de registros.</p>
      </div>
    </div>
    <aside style="flex:1 1 380px;min-width:0;position:sticky;top:16px;display:grid;gap:14px">
      <div class="cartao sombra" style="gap:0;padding:18px">
        <${Adesivo} texto="foi pra diretoria" cor="#f5b5a8" giro="4deg" estilo="top:-14px;right:14px" />
        <h2 class="h2" style="margin-bottom:8px">LIVRO DE OCORRÊNCIAS</h2>
        ${!livro.length && html`<p class="dica" style="margin:0;padding:12px 0;border-top:2px dashed var(--tracejado)">Nada por aqui. Turma comportada (por enquanto).</p>`}
        ${p.itens.map((o) => html`<div class="ocorrencia">
          <span class="ocorrencia-tipo" style=${`background:${COR_TIPO[o.tipo] ?? 'var(--fundo)'};color:${o.tipo === 'BAN' ? '#fff' : 'var(--tinta)'}`}>${o.tipo}</span>
          <div style="display:grid;gap:2px;min-width:0">
            <span class=${o.desfeito ? 'riscado' : ''}><b style="font-weight:800">${o.nome}</b> ${o.oque}</span>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <span style="font-size:12px;color:var(--cinza)">${tempoRelativo(o.quando)}${o.por ? ` · ${o.por}` : ''}</span>
              ${o.desfeito ? html`<span class="ocorrencia-desfeita">desfeito</span>` : o.desfazer && html`<button type="button" class="btn-link" onClick=${() => desfazer(o)}>Desfazer</button>`}
            </div>
          </div>
        </div>`)}
        <div style="padding-top:10px;border-top:2px dashed var(--tracejado)"><${Paginacao} p=${p} ir=${(n) => setUi({ livroPg: n })} /></div>
      </div>
    </aside>
  </div>`;
}
