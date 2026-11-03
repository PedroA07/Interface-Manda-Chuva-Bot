// Aba Meu perfil: banner (48 da galeria), medalhas (fixar até 3), bio e o cartão "como a galera te vê".
// Cada mudança vale na hora (não espera o Salvar): vai direto pro bot.
import { html, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { tempoRelativo } from '../moderacao.js';
import { CATEGORIAS, imagemDaMedalha, numeroBonito, partesDoBanner, RARIDADE } from '../perfil.js';
import { LogoDiscord } from '../ui/basicos.js';

const MAX_BIO = 120;
const FILTROS = [['todas', 'Todas'], ['ganhas', 'Conquistadas'], ['faltam', 'Faltando']];

/** Cartão do perfil (também usado na lista da turma, em tamanho menor) */
export function CartaoPerfil({ usuario, perfil, fixadas, stats, grande = true }) {
  const ini = (usuario.nome || '?').charAt(0).toUpperCase();
  return html`<div class=${`perfil-cartao${grande ? '' : ' pequeno'}`}>
    <div class="perfil-banner"><img src=${perfil.banner} alt="" /></div>
    <div class="perfil-corpo">
      <div class="perfil-linha-foto">
        <span class="perfil-foto">${usuario.avatar ? html`<img src=${usuario.avatar} alt="" />` : ini}${grande && html`<i></i>`}</span>
        <div class="perfil-fixadas">${fixadas.map((id) => html`<img src=${imagemDaMedalha(id)} alt="" title=${id} />`)}</div>
      </div>
      <div style="display:grid;gap:2px;min-width:0">
        <b class="perfil-nome">${usuario.nome}</b>
        <span class="perfil-sub">${grande && html`<${LogoDiscord} tam=${14} />`}@${usuario.usuario} · entrou ${usuario.entrou ? tempoRelativo(usuario.entrou) : '?'}</span>
      </div>
      <div class="perfil-cargos">${usuario.cargos.map((c) => html`<span class="perfil-cargo"><i style=${`--c:${c.cor}`}></i>${c.nome}</span>`)}</div>
      ${grande && html`<p class="perfil-bio">${perfil.bio || 'Ainda sem bio. Escreve alguma coisa aí!'}</p>`}
      ${stats && html`<div class="perfil-stats">${stats.map(([v, k]) => html`<div><b>${v}</b><span>${k}</span></div>`)}</div>`}
    </div>
  </div>`;
}

export function AbaPerfil() {
  const { eu, setEu, aviso, tratar } = useApp();
  const [cat, setCat] = useState(() => partesDoBanner(eu.perfil.banner)[0]);
  const [filtro, setFiltro] = useState('todas');
  const [bio, setBio] = useState(eu.perfil.bio);
  if (!eu.usuario) return html`<p class="sub">Entre com o Discord pra ter perfil.</p>`;
  const p = eu.perfil;
  const ganhas = eu.medalhas.filter((m) => m.ganha);
  const fixadas = p.fixadas.filter((id) => ganhas.some((m) => m.id === id));
  const catAt = CATEGORIAS.find((c) => c[0] === cat) ?? CATEGORIAS[0];

  async function guardar(patch, ok, meme) {
    const antes = eu;
    setEu({ ...eu, perfil: { ...eu.perfil, ...patch } }); // já mostra; volta atrás se o bot recusar
    try {
      const r = await chamar('/api/eu/perfil', patch);
      setEu((e) => ({ ...e, perfil: r.perfil }));
      if (ok) aviso(ok, meme);
    } catch (e) {
      setEu(antes);
      tratar(e);
    }
  }
  const fixar = (m) => {
    if (!m.ganha) return;
    if (fixadas.includes(m.id)) return guardar({ fixadas: fixadas.filter((x) => x !== m.id) });
    if (fixadas.length >= 3) return aviso('Já tem 3 fixadas. Tira uma antes.', 'não cabe mais pin');
    guardar({ fixadas: [...fixadas, m.id] }, `${m.nome} fixada no perfil.`, 'ostentação');
  };
  const lista = eu.medalhas.filter((m) => filtro === 'todas' || (filtro === 'ganhas' ? m.ganha : !m.ganha));
  const stats = [[numeroBonito(eu.stats.mensagens), 'mensagens'], [`${numeroBonito(eu.stats.horas)} h`, 'em call'], [String(eu.stats.medalhas), 'medalhas']];

  return html`<div class="colunas">
    <div class="col-editor" style="gap:24px">
      <div style="display:grid;gap:6px">
        <div class="cabeca-linha"><h1 class="h1">MEU PERFIL</h1><span class="rabisco">a carteirinha da resenha</span></div>
        <p class="sub">É assim que a galera te vê no site. Escolha um banner, fixe até 3 medalhas e escreva uma bio.</p>
      </div>

      <div class="cartao">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><h2 class="h2">BANNER DO PERFIL</h2><span style="margin-left:auto;font-size:13px;color:var(--cinza)">${catAt[2].length} banners em ${catAt[1]}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${CATEGORIAS.map(([id, nome]) => html`<button type="button" class=${`pilula${cat === id ? ' on' : ''}`} onClick=${() => setCat(id)}>${nome}</button>`)}</div>
        <div class="grade-banners">
          ${catAt[2].map((nome, k) => {
            const src = `banners/perfil/${catAt[0]}-${k + 1}.jpg`, ativo = p.banner === src;
            return html`<button type="button" class=${`banner-opcao${ativo ? ' on' : ''}`} title=${nome} onClick=${() => !ativo && guardar({ banner: src }, `Banner trocado: ${nome}.`, 'ficou chave')}>
              <img src=${src} alt="" loading="lazy" /><span>${nome}</span>
            </button>`;
          })}
        </div>
        <span style="font-size:12px;color:var(--cinza)">Artes originais inspiradas em jogos, músicas e estilos. Nada de logo ou personagem oficial.</span>
      </div>

      <div class="cartao">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><h2 class="h2">MEDALHAS</h2><span class="pilula-mostarda">${ganhas.length} de ${eu.medalhas.length}</span><span style="margin-left:auto;font-size:13px;color:var(--cinza)">Clique numa medalha ganha pra fixar no perfil (${fixadas.length}/3)</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">${FILTROS.map(([id, nome]) => html`<button type="button" class=${`pilula${filtro === id ? ' on' : ''}`} onClick=${() => setFiltro(id)}>${nome}</button>`)}</div>
        <div class="grade-medalhas">
          ${lista.map((m) => {
            const fix = fixadas.includes(m.id), secreta = m.rar === 'SECRETA' && !m.ganha;
            const [bg, cor] = RARIDADE[m.rar] ?? RARIDADE.COMUM;
            return html`<button type="button" class=${`medalha${fix ? ' fixada' : ''}${m.ganha ? ' ganha' : ''}`} onClick=${() => fixar(m)}>
              <img src=${imagemDaMedalha(m.id)} alt="" style=${`opacity:${m.ganha ? 1 : secreta ? 0.25 : 0.45}`} />
              <span style="flex:1;min-width:0;display:grid;gap:3px">
                <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><b style="font-weight:800;font-size:15px">${secreta ? 'Medalha secreta' : m.nome}</b><span class="raridade" style=${`--bg:${bg};--c:${cor}`}>${m.rar}</span></span>
                <span style="font-size:13px;color:var(--cinza);line-height:1.3">${secreta ? 'Ninguém sabe como ganha. Ou ninguém conta.' : m.desc}</span>
                ${!m.ganha && !secreta && m.max > 1 && html`<span style="display:flex;align-items:center;gap:6px"><span class="barra-prog"><span style=${`width:${Math.round((m.v / m.max) * 100)}%`}></span></span><span style="font:500 11px var(--mono)">${m.v}/${m.max}${m.un ? ` ${m.un}` : ''}</span></span>`}
                ${m.ganha && html`<span style=${`font-size:12px;font-weight:800;color:${fix ? 'var(--vermelho)' : '#2f8f5b'}`}>${fix ? '★ Fixada no perfil' : 'Conquistada · clique pra fixar'}</span>`}
                ${!m.ganha && m.origem === 'evento' && html`<span style="font-size:11px;font-weight:700;color:var(--cinza)">a staff dá depois do evento</span>`}
              </span>
            </button>`;
          })}
        </div>
      </div>

      <div class="cartao">
        <label class="rotulo">Bio
          <textarea class="campo" rows="2" maxlength=${MAX_BIO} value=${bio} onInput=${(e) => setBio(e.target.value.slice(0, MAX_BIO))}
            onBlur=${() => bio.trim() !== p.bio && guardar({ bio }, 'Bio salva.', 'escritor nato')}></textarea>
        </label>
        <span style="font-size:12px;color:var(--cinza)">${bio.length}/${MAX_BIO} · salva quando você sai do campo</span>
      </div>
    </div>

    <aside class="col-lado" style="gap:14px">
      <span style="font:400 16px var(--titulo)">COMO A GALERA TE VÊ</span>
      <${CartaoPerfil} usuario=${eu.usuario} perfil=${{ ...p, bio: bio.trim() || p.bio }} fixadas=${fixadas} stats=${stats} />
    </aside>
  </div>`;
}
