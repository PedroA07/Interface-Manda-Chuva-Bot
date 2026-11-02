// Aba Temas › Aniversários (config, card e prévia) e › Lista de aniversários (quem cadastrou, adicionar e tirar)
import { html, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { listaNiver, textoDoNiver } from '../aniversarios.js';
import { useApp } from '../estado.js';
import { paginar, urlImagem } from '../logica.js';
import { hojeDe } from '../temas.js';
import { Paginacao, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';
import { SeletorBanner } from '../ui/seletor-banner.js';

const MODELOS = [
  ['Parabéns, calouro', 'Hoje é aniversário de {usuario}! {idade} anos e ainda não trancou o curso. Parabéns!'],
  ['Bolo no RU', 'Atenção, turma: {usuario} faz {idade} anos hoje. O bolo é no RU, meio-dia.'],
  ['Subiu de nível', '{usuario} subiu de nível: agora tem {idade} anos. Já pode reclamar da coluna.'],
  ['Sem idade', 'Feliz aniversário, {usuario}! O {servidor} inteiro deseja tudo de bom.'],
];
const HORAS = ['00:00', '08:00', '09:00', '12:00', '18:00'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const FUNDO = 'banners/card-confete.gif';
const EXEMPLO = { userId: '0', nome: 'rafa_cringe', d: '14/11', ano: 2004 };

function Extra({ titulo, texto, on, onClick, ultimo }) {
  return html`<div style=${`display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:${ultimo ? 'none' : '2px dashed var(--tracejado)'}`}>
    <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">${titulo}</b><span style="font-size:13px;color:var(--cinza)">${texto}</span></div>
    <${Toggle} on=${on} onClick=${onClick} />
  </div>`;
}

const Bolinha = ({ p, tam = 34 }) => html`<span class="niver-bola" style=${`--c:${p.cor};width:${tam}px;height:${tam}px`}>${p.nome.charAt(0).toUpperCase()}</span>`;

export function TelaAniversarios() {
  const { cfg, estado, setUi, mudar, api } = useApp();
  const n = cfg.niver;
  const muda = (patch) => mudar((x) => Object.assign(x.niver, patch));
  const s = estado.servidor;
  const hoje = hojeDe(estado);
  const lista = listaNiver(estado.aniversarios ?? [], hoje);
  const pessoa = lista[0] ?? listaNiver([EXEMPLO], hoje)[0];
  const vars = { usuario: '<@1>', nome: pessoa.nome, servidor: s?.nome ?? 'Seu servidor', idade: pessoa.idade };
  const noCard = { ...vars, usuario: pessoa.nome };
  const canal = s?.canais.find((c) => c.id === n.canalId);
  const opCanais = [{ v: '', t: 'Escolha um canal' }, ...(s?.canais ?? []).map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' }))];
  const card = html`<div class="card-previa card-niver" style="container-type:inline-size">
    <img src=${urlImagem(n.fundo, FUNDO, api)} alt="" />
    <div class="card-niver-dentro">
      ${n.topo && html`<span class="card-niver-topo">${textoDoNiver(n.topo, noCard, n.idade)}</span>`}
      <span class="card-niver-foto" style=${`--c:${pessoa.cor}`}>${pessoa.nome.charAt(0).toUpperCase()}</span>
      <span class="card-niver-nome">${pessoa.nome}</span>
      ${textoDoNiver(n.baixo, noCard, n.idade) && html`<span class="card-niver-baixo">${textoDoNiver(n.baixo, noCard, n.idade)}</span>`}
    </div>
  </div>`;

  return html`
    <div class="colunas">
      <div class="col-editor">
        <div class="cabeca">
          <div class="cabeca-texto">
            <div class="cabeca-linha"><h1 class="h1">ANIVERSÁRIOS</h1><span class="rabisco">mais um ano sem trancar</span></div>
            <p class="sub">No dia, o bot posta um card com a foto, o nome e a idade de quem faz aniversário.</p>
          </div>
          <div class="caixa-liga"><span style="font-weight:800">${n.on ? 'Ligado' : 'Desligado'}</span><${Toggle} on=${n.on} onClick=${() => muda({ on: !n.on })} /></div>
        </div>
        ${n.on && !n.canalId && html`<span class="sb-erro">Escolha o canal pro bot postar.</span>`}
        <div class="cartao" style="background:var(--aviso);gap:10px;padding:16px 18px">
          <b style="font:400 17px/1.1 var(--titulo)">COMO O BOT SABE A DATA?</b>
          <p style="margin:0;font-size:14px;text-wrap:pretty">O Discord não mostra idade nem aniversário de ninguém. Cada membro cadastra o seu, e o ano é opcional: sem ano, a mensagem sai sem idade.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><code class="comando">/aniversario 14/05/2003</code><span style="font-size:13px;color:var(--cinza)">ou</span><code class="comando">/aniversario 14/05</code></div>
        </div>
        <div class="cartao">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
            <div class="rotulo">Canal <${ListaSuspensa} valor=${n.canalId ?? ''} opcoes=${opCanais} onChange=${(v) => muda({ canalId: v || null })} /></div>
            <div class="rotulo">Horário <${ListaSuspensa} valor=${n.hora} opcoes=${HORAS.map((h) => ({ v: h, t: h }))} onChange=${(v) => muda({ hora: v })} /></div>
          </div>
          <div style="display:grid;gap:8px"><span class="rotulo">Modelos prontos</span>
            <div style="display:flex;flex-wrap:wrap;gap:8px">${MODELOS.map(([nome, m]) => html`<button type="button" class=${`modelo${n.msg === m ? ' on' : ''}`} onClick=${() => muda({ msg: m })}>${nome}</button>`)}</div>
          </div>
          <label class="rotulo">Mensagem <textarea class="campo" rows="3" maxlength="2000" value=${n.msg} onInput=${(e) => muda({ msg: e.target.value })}></textarea></label>
          <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
            <span style="font-size:13px;color:var(--cinza);font-weight:700">Inserir:</span>
            ${[['{usuario}', 'menciona a pessoa'], ['{nome}', 'nome sem menção'], ['{idade}', 'idade que está fazendo'], ['{servidor}', 'nome do servidor']].map(([v, dica]) => html`<button type="button" class="variavel" title=${dica} onClick=${() => muda({ msg: `${n.msg} ${v}` })}>${v}</button>`)}
          </div>
        </div>
        <div class="cartao">
          <span style="font:400 17px/1 var(--titulo)">CARD DO ANIVERSARIANTE</span>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
            <label class="rotulo">Texto de cima <input class="campo" maxlength="60" value=${n.topo} onInput=${(e) => muda({ topo: e.target.value })} /></label>
            <label class="rotulo">Texto de baixo <input class="campo" maxlength="60" value=${n.baixo} onInput=${(e) => muda({ baixo: e.target.value })} /></label>
          </div>
          <div style="display:grid;gap:6px"><span class="rotulo">Fundo</span><${SeletorBanner} valor=${n.fundo} padrao=${FUNDO} tipo="card" onChange=${(v) => muda({ fundo: v })} /></div>
        </div>
        <div class="cartao" style="gap:4px;padding:8px 20px">
          <${Extra} titulo="Mostrar a idade" texto="Só para quem cadastrou o ano." on=${n.idade} onClick=${() => muda({ idade: !n.idade })} />
          <${Extra} titulo="Cargo “Aniversariante do dia”" texto="O bot dá o cargo no dia e tira depois de 24 horas." on=${n.cargo} onClick=${() => muda({ cargo: !n.cargo })} />
          <${Extra} titulo="Mandar parabéns na DM" texto="Além da mensagem no canal." on=${n.dm} onClick=${() => muda({ dm: !n.dm })} />
          <${Extra} titulo="Botão “Cadastrar aniversário” no painel de cores" texto="Para quem não sabe usar comando." on=${n.botao} onClick=${() => muda({ botao: !n.botao })} ultimo />
        </div>
        <div style="display:grid;gap:10px">
          <span class="rotulo">Próximos aniversários</span>
          <div style="display:grid;gap:6px">
            ${lista.slice(0, 5).map(
              (p, i) => html`<div class="niver-prox" style=${i === 0 ? 'background:var(--aviso)' : ''}>
                <${Bolinha} p=${p} tam=${36} />
                <span style="flex:1;min-width:0;display:grid;gap:1px"><b class="niver-nome">@${p.nome}</b><span style="font-size:13px;color:var(--cinza)">${p.idadeTxt}</span></span>
                <span style="flex:none;font:500 14px var(--mono)">${p.d}</span>
                <span class="niver-quando" style=${p.dd === 0 ? 'background:var(--mostarda)' : ''}>${p.quando}</span>
              </div>`,
            )}
            ${!lista.length && html`<p class="dica">Ninguém cadastrou ainda. Assim que alguém usar o /aniversario, aparece aqui.</p>`}
            <button type="button" class="btn navy sombra" style="justify-self:start" onClick=${() => setUi({ tmView: 'lista' })}>Ver lista completa (${lista.length}) ›</button>
          </div>
        </div>
      </div>
      <aside class="col-lado">
        <span style="font:400 16px var(--titulo)">PRÉVIA · #${canal?.nome ?? 'canal'} · ${pessoa.d} às ${n.hora}</span>
        <${Previa} hora=${n.hora} ctx=${{ usuarios: { 1: pessoa.nome } }} msg=${{ fora: textoDoNiver(n.msg, vars, n.idade), card }}
          depois=${n.cargo && html`<div style="margin-top:6px;font-size:13px;color:#949ba4">@${pessoa.nome} ganhou o cargo <span style="color:#f2c14e;font-weight:700">Aniversariante do dia</span> por 24 horas.</div>`} />
        <span style="font-size:12px;color:var(--cinza);text-wrap:pretty">Na prévia, a foto aparece como a inicial. No servidor, o bot usa a foto de perfil da pessoa.</span>
      </aside>
    </div>`;
}

export function ListaAniversarios() {
  const { estado, aviso, tratar, recarregar } = useApp();
  const [novo, setNovo] = useState({ membro: '', data: '', ano: '' });
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [mes, setMes] = useState('');
  const [ordem, setOrdem] = useState('prox');
  const [pagina, setPagina] = useState(1);
  const hoje = hojeDe(estado);
  const todos = listaNiver(estado.aniversarios ?? [], hoje);
  const q = busca.trim().toLowerCase();
  let lista = todos.filter((p) => (!q || p.nome.toLowerCase().includes(q)) && (!mes || p.d.slice(3) === mes));
  const chave = (p) => +p.d.slice(3) * 100 + +p.d.slice(0, 2);
  if (ordem === 'nome') lista = [...lista].sort((a, b) => a.nome.localeCompare(b.nome));
  else if (ordem === 'data') lista = [...lista].sort((a, b) => chave(a) - chave(b));
  const p = paginar(lista, pagina, 8);
  const filtro = (fn) => (v) => (fn(v), setPagina(1));

  async function adicionar() {
    setErro('');
    if (!novo.membro.trim()) return setErro('Faltou o nome do membro.');
    try {
      const r = await chamar('/api/aniversarios', { acao: 'add', ...novo });
      setNovo({ membro: '', data: '', ano: '' });
      aviso(`Aniversário de ${r.nome} anotado: ${r.d}.`, 'já pode comprar o bolo');
      await recarregar();
    } catch (e) {
      setErro(e.message);
    }
  }
  async function tirar(pessoa) {
    if (!confirm(`Tirar ${pessoa.nome} da lista de aniversários?`)) return;
    try {
      await chamar('/api/aniversarios', { acao: 'remover', userId: pessoa.userId });
      aviso(`${pessoa.nome} saiu da lista.`, 'sem bolo pra ele');
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  }
  const campo = (k) => (e) => (setNovo((x) => ({ ...x, [k]: e.target.value })), setErro(''));

  return html`
    <div style="display:grid;gap:20px">
      <div style="display:grid;gap:6px">
        <div class="cabeca-linha"><h1 class="h1">LISTA DE ANIVERSÁRIOS</h1><span class="rabisco">a chamada do bolo</span></div>
        <p class="sub" style="max-width:62ch">Todo mundo que cadastrou a data com /aniversario. Dá pra adicionar alguém na mão ou tirar da lista.</p>
      </div>
      <div class="cartao niver-form">
        <label class="rotulo">Membro <input class="campo" placeholder="nome_do_membro" value=${novo.membro} onInput=${campo('membro')} /></label>
        <label class="rotulo">Dia/mês <input class="campo mono" placeholder="14/05" maxlength="5" value=${novo.data} onInput=${campo('data')} /></label>
        <label class="rotulo">Ano (opcional) <input class="campo mono" placeholder="2003" maxlength="4" value=${novo.ano} onInput=${campo('ano')} /></label>
        <button type="button" class="btn vermelho sombra" style="height:44px;font-size:15px" onClick=${adicionar}>+ Adicionar</button>
        ${erro && html`<span class="sb-erro" style="grid-column:1/-1">${erro}</span>`}
      </div>
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px">
        <input class="campo" style="flex:1 1 240px;width:auto" placeholder="Buscar membro…" value=${busca} onInput=${(e) => filtro(setBusca)(e.target.value)} />
        <${ListaSuspensa} estilo="flex:0 1 220px;min-width:180px" valor=${mes} onChange=${filtro(setMes)}
          opcoes=${[{ v: '', t: 'Todos os meses' }, ...MESES.map((t, i) => ({ v: String(i + 1).padStart(2, '0'), t, nota: String(todos.filter((x) => +x.d.slice(3) === i + 1).length) }))]} />
        <div class="segmentado sombra" style="box-shadow:none;border-radius:10px">
          ${[['prox', 'Próximos'], ['data', 'Calendário'], ['nome', 'A–Z']].map(([id, nome]) => html`<button type="button" class=${ordem === id ? 'on' : ''} style="padding:9px 12px;font:800 13px var(--corpo)" onClick=${() => filtro(setOrdem)(id)}>${nome}</button>`)}
        </div>
        <span style="font:400 14px var(--titulo)">${lista.length} de ${todos.length}</span>
      </div>
      <div class="tabela-niver">
        <div class="tabela-niver-cabeca"><span>Membro</span><span>Data</span><span>Idade</span><span>Quando</span><span></span></div>
        ${p.itens.map(
          (x) => html`<div class="tabela-niver-linha" style=${x.dd === 0 ? 'background:var(--aviso)' : ''}>
            <span style="display:flex;align-items:center;gap:10px;min-width:0"><${Bolinha} p=${x} /><b class="niver-nome">@${x.nome}</b></span>
            <span style="font:500 14px var(--mono)">${x.d}</span>
            <span style="font-size:13px;color:var(--cinza)">${x.idadeTxt}</span>
            <span class="niver-quando" style=${`justify-self:start;${x.dd === 0 ? 'background:var(--mostarda)' : ''}`}>${x.quando}</span>
            <button type="button" class="btn-x" style="width:32px;height:32px;border-color:var(--tinta)" title="Tirar da lista" onClick=${() => tirar(x)}>×</button>
          </div>`,
        )}
        ${p.vazio && html`<div style="padding:28px;text-align:center;color:var(--cinza)">Ninguém encontrado. Nem o bolo.</div>`}
      </div>
      <${Paginacao} p=${p} ir=${setPagina} />
    </div>`;
}
