// Aba Servidor: montar o servidor com um modelo (categorias, canais e cargos) e escolher a fonte dos nomes.
// Montar e renomear só quem gerencia o servidor; a obra roda no bot e o painel acompanha o andamento.
import { html, useEffect, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { CARGOS_SRV, CATS_SRV, DECO, FONTES_U, MODELOS_SRV, formatarNome, planoDoModelo } from '../servidor.js';
import { Segmentado, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';

const OPCOES = [
  ['fontes', 'Usar as fontes da aba Fontes e nomes', 'Os nomes já saem estilizados.'],
  ['perms', 'Configurar permissões', 'Staff vê tudo. Quem não aceitou as regras só vê a Portaria.'],
  ['autoJogos', 'Cargos de jogos por botão', 'Mensagem em #escolha-sua-cor pra pegar Minecraft, Valorant etc.'],
  ['apagar', 'Apagar o que não está no modelo', 'Canais e cargos fora do modelo são apagados, com as mensagens.'],
];
const ALVOS = [['categorias', 'Categorias'], ['canais', 'Canais'], ['cargos', 'Cargos']];
const CAIXAS = [['manter', 'Como está'], ['maiusculas', 'MAIÚSCULAS'], ['minusculas', 'minúsculas']];
const EXEMPLO = { categorias: ['Resenha', '💬'], canais: ['geral', '💬'], cargos: ['Veterano', '🎓'] };
const caixa = (t, c) => (c === 'maiusculas' ? t.toUpperCase() : c === 'minusculas' ? t.toLowerCase() : t);
const dataHora = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/** Barra da obra em andamento e o relatório quando acaba */
function Andamento({ obra }) {
  if (!obra) return null;
  const pct = obra.total ? Math.round((obra.feitos / obra.total) * 100) : 0;
  return html`<div class="cartao sv-obra">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <b class="h2" style="font-size:17px">${obra.status === 'andando' ? 'OBRA EM ANDAMENTO' : obra.status === 'erro' ? 'A OBRA PAROU' : 'OBRA ENTREGUE'}</b>
      <span class="rg-conta">${obra.tipo === 'montar' ? 'Montar servidor' : 'Renomear'} · ${obra.feitos}/${obra.total || '?'}</span>
    </div>
    ${obra.status === 'andando' && html`<span class="barra-prog sv-barra"><span style=${`width:${pct}%`}></span></span><span style="font-size:13px;color:var(--cinza)">${obra.passo || '…'}</span>`}
    ${obra.rel?.length > 0 && html`<ul class="sv-rel">${obra.rel.map((l) => html`<li>${l}</li>`)}</ul>`}
  </div>`;
}

/** Copiar a configuração de outro servidor que a pessoa também gerencia: entra como alteração e só vale no Salvar */
function CopiarDeOutro() {
  const { servidores, servidor, colarConfig, aviso, tratar, eu, sujo } = useApp();
  const outros = servidores.filter((s) => s.id !== servidor && s.papel === 'admin');
  const [de, setDe] = useState(outros[0]?.id ?? '');
  const [ocupado, setOcupado] = useState(false);
  const [rel, setRel] = useState([]);
  async function copiar() {
    if (sujo && !confirm('Tem alterações não salvas aqui. Copiar por cima delas?')) return;
    setOcupado(true);
    try {
      const r = await chamar('/api/servidor/copiar', { de });
      colarConfig(r.config);
      setRel(r.relatorio);
      aviso(r.relatorio[0], 'ctrl+c, ctrl+v');
    } catch (e) {
      tratar(e);
    } finally {
      setOcupado(false);
    }
  }
  return html`<div class="cartao">
    <h2 class="h2">COPIAR DE OUTRO SERVIDOR</h2>
    <p style="margin:0;font-size:14px;max-width:70ch;text-wrap:pretty">Cada servidor tem a própria configuração. Aqui você traz a de outro servidor que você gerencia: cores, boas-vindas, regras, tickets, temas e o resto. Canais e cargos viram os de mesmo nome neste servidor; o que não existir fica vazio pra escolher. Nada muda no Discord até você clicar em <b>Salvar</b>.</p>
    <p style="margin:0;font-size:13px;color:var(--cinza);text-wrap:pretty">Dica: monte este servidor com o mesmo modelo antes de copiar. Assim os canais têm os mesmos nomes e quase tudo se acha sozinho.</p>
    ${outros.length
      ? html`<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <${ListaSuspensa} valor=${de} opcoes=${outros.map((s) => ({ v: s.id, t: s.nome, img: s.icone, sigla: s.sigla || s.nome.charAt(0) }))} onChange=${setDe} estilo="min-width:240px;width:auto" />
          <button type="button" class="btn navy sombra" disabled=${ocupado || !de || eu.papel !== 'admin'} onClick=${copiar}>${ocupado ? 'Copiando…' : 'Copiar configuração'}</button>
        </div>`
      : html`<p class="sub" style="margin:0">Você não gerencia nenhum outro servidor com o bot.</p>`}
    ${rel.length > 1 && html`<ul style="margin:0;padding-left:18px;font-size:14px;display:grid;gap:4px">${rel.slice(1).map((l) => html`<li>${l}</li>`)}</ul>`}
  </div>`;
}

export function AbaServidor() {
  const { cfg, estado, eu, mudar, salvar, sujo, aviso, tratar, recarregar } = useApp();
  const [view, setView] = useState('montar');
  const [alvo, setAlvo] = useState('canais');
  const [modal, setModal] = useState(false);
  const [obra, setObra] = useState(estado.obra ?? null);
  const [montado, setMontado] = useState(estado.srvMontado ?? null);
  const sv = cfg.srv;

  // Enquanto a obra anda, pergunta ao bot a cada 1,5 s
  useEffect(() => {
    if (obra?.status !== 'andando') return;
    const t = setTimeout(async () => {
      try {
        const r = await chamar('/api/servidor/andamento');
        setObra(r.obra);
        setMontado(r.montado);
        if (r.obra?.status !== 'andando') {
          aviso(r.obra?.status === 'pronto' ? 'Obra entregue.' : 'A obra parou no meio. Veja o relatório.', r.obra?.status === 'pronto' ? 'obra entregue no prazo (milagre)' : 'deu ruim na obra', { erro: r.obra?.status !== 'pronto' });
          await recarregar();
        }
      } catch (e) {
        tratar(e);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [obra]);

  if (!sv) return html`<p class="sub">Atualize o bot pra versão nova: esta aba precisa dele.</p>`;
  const muda = (patch) => mudar((c) => Object.assign(c.srv, patch));
  const mudaFonte = (patch) => mudar((c) => Object.assign(c.srv.f[alvo], patch));
  const plano = planoDoModelo(sv);
  const admin = eu.papel === 'admin';
  const andando = obra?.status === 'andando';
  const s = estado.servidor, b = estado.bot;
  const motivo = !b.online ? 'Ligue o bot pra mexer no servidor.' : !s ? 'Escolha o servidor lá em cima.' : !admin ? 'Só quem gerencia o servidor pode montar ou renomear.' : andando ? 'Tem uma obra em andamento.' : '';

  async function comecar(rota, msg) {
    if (sujo && !(await salvar())) return;
    try {
      const r = await chamar(rota, {});
      setObra(r.obra);
      aviso(msg, 'capacete na cabeça');
    } catch (e) {
      tratar(e);
    }
  }
  const montar = async () => {
    setModal(false);
    await comecar('/api/servidor/montar', `Montando: ${plano.resumo}.`);
  };
  const renomear = () => {
    if (!confirm('Renomear as categorias, os canais e os cargos do modelo que já existem, com as fontes escolhidas?')) return;
    comecar('/api/servidor/renomear', 'Renomeando o que já existe.');
  };

  // Prévia: nomes do jeito que vão ficar
  const comFonte = sv.opt.fontes || view === 'fontes';
  const nm = (a, nome, emoji, voz) => (comFonte ? formatarNome(a, nome, emoji, voz, sv.f[a]) : a === 'canais' && !voz ? nome.toLowerCase().replace(/\s+/g, '-') : nome);
  const cfgAlvo = sv.f[alvo];
  const [ex, exEmoji] = EXEMPLO[alvo];

  return html`<div class="colunas">
    <div class="col-editor" style="gap:22px">
      <div class="cabeca"><div class="cabeca-texto">
        <div class="cabeca-linha"><h1 class="h1">SERVIDOR</h1><span class="rabisco">obra pronta em 1 clique</span></div>
        <p class="sub">Monte o servidor com categorias, canais e cargos prontos e escolha a fonte dos nomes. O bot cria tudo sozinho.</p>
      </div></div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">${[['montar', 'Montar servidor'], ['fontes', 'Fontes e nomes'], ['copiar', 'Copiar de outro servidor']].map(([id, nome]) => html`<button type="button" class=${`rg-modelo sv-view${view === id ? ' on' : ''}`} onClick=${() => setView(id)}>${nome}</button>`)}</div>
      <${Andamento} obra=${obra} />

      ${view === 'montar' && html`
        <div class="cartao">
          <h2 class="h2">MODELO</h2>
          <div class="sv-modelos">${MODELOS_SRV.map(([id, nome, desc, cats]) => {
            const p = planoDoModelo({ cats });
            return html`<button type="button" class=${`sv-modelo${sv.modelo === id ? ' on' : ''}`} onClick=${() => muda({ modelo: id, cats: [...cats] })}>
              <b>${nome}</b><span>${desc}</span><small>${p.cats.length} categorias · ${p.cats.reduce((a, c) => a + c.canais.length, 0)} canais</small>
            </button>`;
          })}</div>
        </div>

        <div class="cartao">
          <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><h2 class="h2">CATEGORIAS E CANAIS</h2><span style="font-size:13px;color:var(--cinza)">Liga e desliga o que entra</span></div>
          <div style="display:grid">${CATS_SRV.map(([id, nome, emoji, canais], i) => {
            const on = sv.cats.includes(id);
            return html`<div class="sv-cat" style=${`opacity:${on ? 1 : 0.45};${i ? '' : 'border-top:none'}`}>
              <span class="sv-cat-emoji">${emoji}</span>
              <span style="flex:1;min-width:0;display:grid;gap:2px">
                <span style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><b style="font-weight:800;font-size:16px">${nome}</b><span class="rg-conta">${canais.length} canais</span></span>
                <span class="sv-canais">${canais.map(([t, n]) => (t === 'v' ? `🔊 ${n}` : `#${n}`)).join('   ')}</span>
              </span>
              <${Toggle} on=${on} titulo=${nome} onClick=${() => muda({ cats: on ? sv.cats.filter((x) => x !== id) : CATS_SRV.map((c) => c[0]).filter((x) => x === id || sv.cats.includes(x)) })} />
            </div>`;
          })}</div>
        </div>

        <div class="cartao">
          <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><h2 class="h2">CARGOS</h2><span style="font-size:13px;color:var(--cinza)">Saem das categorias escolhidas. Os cargos de cor continuam na aba Cores.</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">${plano.cargos.map((c) => html`<span class="sv-cargo"><i style=${`background:${c.cor}`}></i>${c.nome}${c.papel && html`<small>· ${c.papel}</small>`}</span>`)}</div>
        </div>

        <div class="cartao" style="gap:0;padding-top:4px;padding-bottom:4px">
          ${OPCOES.map(([k, titulo, texto], i) => html`<div class="mod-linha" style=${i ? '' : 'border-top:none'}>
            <div style="flex:1;display:grid;gap:2px"><b style=${`font-weight:800;color:${k === 'apagar' ? 'var(--vermelho)' : 'var(--tinta)'}`}>${titulo}</b><span style="font-size:13px;color:var(--cinza)">${texto}</span></div>
            <${Toggle} on=${sv.opt[k]} titulo=${titulo} onClick=${() => mudar((c) => (c.srv.opt[k] = !c.srv.opt[k]))} />
          </div>`)}
        </div>

        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px">
          <button type="button" class="btn navy sombra grande" disabled=${!!motivo || !sv.cats.length} onClick=${() => setModal(true)}>Montar servidor</button>
          <span style="font:500 14px var(--mono)">${plano.resumo}</span>
          ${motivo && html`<span style="flex-basis:100%;font-size:13px;color:var(--cinza)">${motivo}</span>`}
          ${montado && html`<span style="flex-basis:100%;font-size:13px;color:var(--verde);font-weight:800">Último servidor montado em ${dataHora(montado)}.</span>`}
        </div>`}

      ${view === 'copiar' && html`<${CopiarDeOutro} />`}

      ${view === 'fontes' && html`
        <div class="cartao" style="background:var(--aviso);gap:6px;padding:14px 18px">
          <b style="font:400 17px/1.1 var(--titulo)">COMO FUNCIONA</b>
          <p style="margin:0;font-size:14px;max-width:70ch;text-wrap:pretty">O Discord não deixa trocar a fonte de verdade. O bot troca as letras por símbolos Unicode que parecem outra fonte. Nas fontes estilizadas os acentos somem (é vira e) e leitores de tela podem ler errado.</p>
        </div>
        <div class="cartao">
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><h2 class="h2">APLICAR EM</h2><${Segmentado} classe="origens" opcoes=${ALVOS} valor=${alvo} onChange=${setAlvo} /></div>
          <div style="display:grid;gap:8px"><span class="rotulo">Fonte</span>
            <div class="sv-fontes">${FONTES_U.map(([id, nome]) => html`<button type="button" class=${`ap-fonte${cfgAlvo.fonte === id ? ' on' : ''}`} onClick=${() => mudaFonte({ fonte: id })}>
              <span style="font-size:20px">${formatarNome(alvo, ex, exEmoji, false, { ...cfgAlvo, fonte: id, deco: 0 })}</span><small>${nome}</small>
            </button>`)}</div>
          </div>
          <div style="display:grid;gap:8px"><span class="rotulo">Enfeite</span>
            <div class="sv-decos">${DECO[alvo].map((_, k) => html`<button type="button" class=${`ap-fonte${cfgAlvo.deco === k ? ' on' : ''}`} style="font-size:16px" onClick=${() => mudaFonte({ deco: k })}>${formatarNome(alvo, ex, exEmoji, false, { ...cfgAlvo, deco: k })}</button>`)}</div>
          </div>
          <div style="display:grid;gap:8px"><span class="rotulo">Letras</span>
            <${Segmentado} classe="origens" opcoes=${CAIXAS} valor=${cfgAlvo.caixa} onChange=${(v) => mudaFonte({ caixa: v })} />
            ${alvo === 'canais' && html`<span style="font-size:13px;color:var(--cinza);text-wrap:pretty">Canal de texto não aceita espaço (vira hífen) e, na fonte Normal, o Discord deixa tudo minúsculo.</span>`}
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px">
          <button type="button" class="btn navy sombra grande" disabled=${!!motivo} onClick=${renomear}>Renomear o que já existe</button>
          <span style="font-size:13px;color:var(--cinza);max-width:46ch;text-wrap:pretty">${motivo || 'Também vale para o que o Montar servidor criar depois.'}</span>
        </div>`}
    </div>

    <aside class="col-lado" style="gap:14px">
      <span style="font:400 16px var(--titulo)">PRÉVIA NO DISCORD</span>
      <div class="sv-previa">
        <div class="sv-previa-topo">${s?.nome ?? 'Seu servidor'}</div>
        <div class="sv-previa-lista">${plano.cats.map((c) => html`<div class="sv-previa-cat">
          <span class="sv-previa-nome">⌄ ${nm('categorias', c.nome, c.emoji, false)}</span>
          ${c.canais.map((ch) => html`<span class=${`sv-previa-canal${ch.nome === 'geral' ? ' on' : ''}`}><span>${ch.voz ? '🔊' : '#'}</span><span>${nm('canais', ch.nome, ch.emoji, ch.voz)}</span></span>`)}
        </div>`)}</div>
      </div>
      <div class="sv-previa sv-previa-cargos">
        <span>CARGOS — ${plano.cargos.length}</span>
        <div>${plano.cargos.map((r) => html`<span><i style=${`background:${r.cor}`}></i>${nm('cargos', r.nome, CARGOS_SRV.find((x) => x[0] === r.nome)[2], false)}</span>`)}</div>
      </div>
    </aside>

    ${modal && html`<div class="sv-modal-fundo" onClick=${(e) => e.target === e.currentTarget && setModal(false)}>
      <div class="sv-modal">
        <b style="font:400 22px/1.1 var(--titulo)">MONTAR O SERVIDOR?</b>
        <p style="margin:0;font-size:15px;text-wrap:pretty">O bot vai criar <b>${plano.resumo}</b>. O que já existe com o mesmo nome é reaproveitado.</p>
        <p style="margin:0;font-size:13px;color:var(--cinza);text-wrap:pretty">Coordenação e Monitor nascem com permissões de moderação: só dê pra quem for da staff.</p>
        ${sv.opt.apagar && html`<p class="sv-perigo">Atenção: canais e cargos fora do modelo vão ser apagados, com as mensagens. Não dá para desfazer. Ficam os que o bot usa, os de cor, separadores e integrações.</p>`}
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <button type="button" class="btn navy sombra grande" onClick=${montar}>Montar agora</button>
          <button type="button" class="btn" onClick=${() => setModal(false)}>Voltar</button>
        </div>
      </div>
    </div>`}
  </div>`;
}
