// Aba Membros (de quem não é staff): a turma toda, com banner, foto, medalhas fixadas e cargos. Só olhar, sem ações.
import { html, useEffect, useRef, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { paginar } from '../logica.js';
import { Paginacao } from '../ui/basicos.js';
import { CartaoPerfil } from './perfil.js';

export function AbaTurma() {
  const { estado, tratar } = useApp();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [r, setR] = useState(null);
  const [aberto, setAberto] = useState(null);
  const pedido = useRef(0);

  useEffect(() => {
    const n = ++pedido.current;
    const t = setTimeout(() => {
      chamar(`/api/turma?q=${encodeURIComponent(busca.trim())}&pagina=${pagina}`)
        .then((x) => n === pedido.current && setR(x))
        .catch(tratar);
    }, busca ? 300 : 0);
    return () => clearTimeout(t);
  }, [busca, pagina]);

  // A paginação do bot já vem pronta: o paginar daqui só monta os botões
  const p = r ? { ...paginar(Array.from({ length: r.total }), r.pagina, 9), itens: r.itens } : null;
  const servidor = estado.servidor?.nome ?? 'servidor';

  return html`<div style="display:grid;gap:22px">
    <div style="display:grid;gap:6px">
      <div class="cabeca-linha"><h1 class="h1">MEMBROS</h1><span class="rabisco">a turma toda</span></div>
      <p class="sub">Quem está no ${servidor}. Clique num perfil pra ver banner, cargos e medalhas.</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
      <input class="campo" style="flex:1 1 260px" placeholder="Buscar membro…" value=${busca} onInput=${(e) => (setBusca(e.target.value), setPagina(1))} />
      <span style="font:400 15px var(--titulo)">${r ? `${r.total} na turma` : '…'}</span>
    </div>
    ${r && !r.completa && !busca && html`<p class="dica" style="margin:0">Aparece quem já passou pelo chat ou montou o perfil. Busque pelo nome pra achar mais alguém.</p>`}
    ${!r && html`<p class="sub">Chamando a turma…</p>`}
    ${p && html`<div class="grade-turma">
      ${p.itens.map((m) => html`<button type="button" class="turma-item" onClick=${() => setAberto(aberto === m.id ? null : m.id)}>
        <${CartaoPerfil} grande=${aberto === m.id} usuario=${m} perfil=${{ banner: m.banner, cor: m.cor, bio: m.bio, ap: m.ap, niver: m.niver }} fixadas=${m.medalhas} />
      </button>`)}
    </div>`}
    ${p && !p.itens.length && html`<div class="vazio-tracejado">Ninguém com esse nome. Talvez tenha trancado.</div>`}
    ${p && html`<${Paginacao} p=${p} ir=${setPagina} />`}
  </div>`;
}
