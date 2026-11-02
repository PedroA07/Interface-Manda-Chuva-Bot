// Aba Cores: a chamada da turma (cartões), a ficha de matrícula da cor escolhida e o boletim da hierarquia
import { html } from '../../vendor/preact-htm.js';
import { useApp } from '../estado.js';
import { botaoDaCor, ESTILOS, fundoDaCor, hexDeRgb, hexEntrada, hexOk, MAX_CORES, rgbDe } from '../logica.js';
import { markdown } from '../markdown.js';
import { Adesivo, Amostras, CampoCor, Emoji, Segmentado } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';

const EMOJIS = {
  Cores: '🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 ⬛',
  Corações: '❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 🩷 🩵 🩶 💖 💗 💝 💔',
  Natureza: '🌸 🌺 🌻 🌷 🌹 🍀 🌿 🌵 🌈 🌙 ⭐ ✨ ☀️ 🌊 🔥 ❄️',
  Comida: '🍓 🍒 🍑 🍋 🍏 🫐 🍇 🥑 🍕 🍔 🍩 🧁 🍦 🧃 ☕ 🧋',
  Memes: '💀 🗿 🤡 😎 🤠 🥶 🥵 😈 👽 🤖 👻 🫠 🤌 🐸 🦆 🐧',
  Objetos: '👑 💎 🎓 📚 ✏️ 🎨 🎮 🎧 🏆 🎯 🚀 ⚡ 💣 🧪 🔮 🪩',
};
const PALETAS = {
  Básicas: ['#111111', '#FFFFFF', '#95A5A6', '#4D5656', '#8B5A2B', '#F5DEB3', '#800020', '#D4AF37'],
  Vibrantes: ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63'],
  Pastel: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D7BAFF', '#FFC6E5', '#C9F2E7'],
  Neon: ['#FF073A', '#FF6EC7', '#FFF01F', '#39FF14', '#00F0FF', '#1F51FF', '#BC13FE', '#FF5F1F'],
  Escuras: ['#8B0000', '#A0522D', '#556B2F', '#006D5B', '#1F3A93', '#4B0082', '#2C2F33', '#99AAB5'],
};
const DO_SERVIDOR = 'Do servidor';

const num = (i) => String(i + 1).padStart(2, '0');

function boletim(estado) {
  const b = estado.bot, s = estado.servidor, h = s?.hierarquia;
  if (!b.online) return [{ nota: '?', cor: '#9a917c', item: 'Bot dormindo', texto: 'Ligue o bot pra conferir a hierarquia.' }];
  if (!s) return [{ nota: '?', cor: '#9a917c', item: 'Nenhum servidor', texto: 'Escolha o servidor lá em cima.' }];
  const nomes = (xs) => xs.map((n) => `@${n}`).join(' e ');
  const itens = [
    h.temPermissao
      ? { nota: 'A+', cor: '#2f8f5b', item: 'Permissão Gerenciar cargos', texto: 'O bot tem a permissão. Mandou bem.' }
      : { nota: 'F', cor: '#c4363c', item: 'Permissão Gerenciar cargos', texto: 'O bot está sem a permissão Gerenciar cargos: ele não consegue dar as cores.' },
    h.acimaDoBot.length
      ? { nota: 'D', cor: '#c4363c', item: 'Bot acima dos cargos de cor', texto: `${nomes(h.acimaDoBot)} estão acima do cargo do bot (@${h.cargoDoBot}), então ele não consegue dar. Arraste o cargo do bot pra cima deles.` }
      : { nota: 'A', cor: '#2f8f5b', item: 'Bot acima dos cargos de cor', texto: 'Ele consegue dar todas as cores.' },
    h.coloridosAcima.length
      ? { nota: 'C', cor: '#c4363c', item: 'Cargos coloridos por cima', texto: `${nomes(h.coloridosAcima)} têm cor e estão acima das cores. Quem tiver um deles não vê o nome mudar. Dá pra consertar na aba Cargos.`, sticker: 'this is fine' }
      : { nota: 'A', cor: '#2f8f5b', item: 'Cargos coloridos por cima', texto: 'Nenhum. As cores aparecem pra todo mundo.' },
  ];
  if (h.semCargo) itens.push({ nota: 'B', cor: '#b07a00', item: 'Cores sem cargo', texto: `${h.semCargo} cor(es) ainda sem cargo no servidor. Clique em Salvar que o bot cria.` });
  if (s.permissoesFaltando?.length) itens.push({ nota: 'C', cor: '#c4363c', item: 'Permissões do bot', texto: `Faltam: ${s.permissoesFaltando.join(', ')}. Dá pra dar no cargo do bot nas configurações do servidor.` });
  if (!b.recursos?.membros) itens.push({ nota: 'B', cor: '#b07a00', item: 'Contagem de alunos', texto: 'Ligue a "Server Members Intent" no portal do Discord (seu bot → Bot → Privileged Gateway Intents) pra contar quem tem cada cor.' });
  return itens;
}

function media(itens) {
  const notas = itens.map((i) => i.nota);
  if (notas.includes('?')) return '?';
  if (notas.includes('F')) return 'D';
  if (notas.includes('D')) return 'C';
  if (notas.includes('C')) return 'B+';
  if (notas.includes('B')) return 'A-';
  return 'A';
}

function Ficha({ c, i }) {
  const { cfg, estado, ui, setUi, mudar, aviso } = useApp();
  const cores = cfg.cores;
  const muda = (patch) => mudar((x) => Object.assign(x.cores[i], patch));
  const b = botaoDaCor(c);
  const cargos = estado.servidor?.cargos ?? [];
  const emojisServidor = estado.servidor?.emojis ?? [];
  const categorias = [...Object.keys(EMOJIS), ...(emojisServidor.length ? [DO_SERVIDOR] : [])];
  const cat = categorias.includes(ui.emojiCat) ? ui.emojiCat : 'Cores';
  const lista = cat === DO_SERVIDOR ? emojisServidor.map((e) => e.texto) : EMOJIS[cat].split(' ');
  const usados = new Set(cores.filter((x, j) => j !== i && x.cargoId).map((x) => x.cargoId));
  const opCargo = [
    { v: '', t: 'Criar cargo novo', nota: 'o bot cria' },
    ...cargos.map((r) => ({
      v: r.id,
      t: r.nome,
      cor: r.cor !== '#000000' ? r.cor : undefined,
      desabilitado: r.perigoso || r.acima || usados.has(r.id),
      nota: r.perigoso ? 'tem moderação' : r.acima ? 'acima do bot' : usados.has(r.id) ? 'já é outra cor' : '',
    })),
  ];
  const escolherCargo = (v) =>
    mudar((x) => {
      const cor = x.cores[i];
      const r = cargos.find((y) => y.id === v);
      cor.cargoId = r ? r.id : null;
      if (r) {
        cor.nome = r.nome;
        if (r.cor !== '#000000') cor.hex = r.cor;
      }
    });
  const rgb = rgbDe(c.hex);
  const resposta = markdown(cfg.mensagens.ganhou.replaceAll('{cor}', '<@&90001>'), { cargos: [{ id: '90001', nome: c.nome, cor: hexOk(c.hex) }] });
  const mover = (d) => {
    mudar((x) => ([x.cores[i], x.cores[i + d]] = [x.cores[i + d], x.cores[i]]));
    setUi({ selCor: i + d });
  };
  const expulsar = () => {
    mudar((x) => x.cores.splice(i, 1));
    setUi({ selCor: Math.max(0, i - 1) });
    aviso(`${c.nome} foi expulso da turma.`, 'senta lá, Cláudia');
  };

  return html`
    <div class="ficha">
      <div class="ficha-topo" style=${`--fundo-cor:${fundoDaCor(c)}`}>
        <span class="ficha-emoji"><${Emoji} texto=${c.emoji} /></span>
        <div class="ficha-etiqueta"><small>FICHA DE MATRÍCULA Nº ${num(i)}</small><span>${c.nome}</span></div>
      </div>
      <div class="ficha-corpo">
        <label class="rotulo">Nome do cargo
          <input class="campo" maxlength="80" value=${c.nome} onInput=${(e) => muda({ nome: e.target.value })} />
        </label>

        <div style="display:grid;gap:6px">
          <span class="rotulo">Emoji</span>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <div style="flex-basis:100%;display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:2px">
              ${categorias.map((k) => html`<button type="button" class=${`chip${cat === k ? ' on' : ''}`} onClick=${() => setUi({ emojiCat: k })}>${k}</button>`)}
              <input class="campo emoji" style="margin-left:auto" title="Ou cole qualquer emoji" value=${c.emoji} onInput=${(e) => muda({ emoji: e.target.value.trim() })} />
            </div>
            ${lista.map((v) => html`<button type="button" class=${`btn-emoji${c.emoji === v ? ' on' : ''}`} onClick=${() => muda({ emoji: v })}><${Emoji} texto=${v} /></button>`)}
          </div>
        </div>

        <div style="display:grid;gap:6px">
          <span class="rotulo">Cor do nome</span>
          <${Segmentado} opcoes=${[['solida', 'Sólida'], ['degrade', 'Degradê']]} valor=${c.tipo} onChange=${(t) => muda({ tipo: t, hex2: c.hex2 || '#FFFFFF' })} />
          <${CampoCor} valor=${c.hex} onChange=${(v) => muda({ hex: v })} />
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${c.tipo === 'degrade' &&
            html`<div style="flex-basis:100%;display:flex;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:13px;font-weight:700;color:var(--cinza)">até</span>
                <div style="flex:1"><${CampoCor} valor=${c.hex2} alto=${38} onChange=${(v) => muda({ hex2: v })} /></div>
              </div>
              <span style="flex-basis:100%;font-size:12px;color:var(--cinza);margin-bottom:4px">Degradê no nome precisa de servidor com impulso.</span>`}
            <div style="flex-basis:100%;display:grid;gap:4px;margin-bottom:4px">
              ${['R', 'G', 'B'].map(
                (k, n) => html`<div class="rgb" style=${`--c:${['#c4363c', '#2f8f5b', '#1f51ff'][n]}`}>
                  <b>${k}</b>
                  <input type="range" min="0" max="255" value=${rgb[n]} onInput=${(e) => muda({ hex: hexDeRgb(rgb.map((x, j) => (j === n ? +e.target.value : x))) })} />
                  <span>${rgb[n]}</span>
                </div>`,
              )}
            </div>
            ${Object.entries(PALETAS).map(
              ([nome, lista2]) => html`<span class="grupo-amostra">${nome}</span>
                ${lista2.map((v) => html`<button type="button" class="amostra" style=${`--c:${v}`} title=${v} onClick=${() => muda({ hex: v })}></button>`)}`,
            )}
          </div>
        </div>

        <div class="rotulo">Cargo no Discord
          <${ListaSuspensa} valor=${cargos.some((r) => r.id === c.cargoId) ? c.cargoId : ''} opcoes=${opCargo} onChange=${escolherCargo} />
        </div>

        <div style="display:grid;gap:6px">
          <span class="rotulo">Cor do botão</span>
          <${Segmentado} opcoes=${[['cargo', 'Cor do cargo'], ['propria', 'Cor própria'], ['discord', 'Padrão Discord']]} valor=${c.botaoModo} onChange=${(m) => muda({ botaoModo: m, botaoHex: c.botaoHex || hexOk(c.hex) })} />
          ${c.botaoModo === 'propria' &&
          html`<div style="display:grid;gap:6px">
            <${CampoCor} valor=${c.botaoHex} alto=${40} onChange=${(v) => muda({ botaoHex: v })} />
            <${Amostras} cores=${[...PALETAS.Vibrantes, ...PALETAS.Neon]} tamanho="p" onEscolher=${(v) => muda({ botaoHex: v })} />
          </div>`}
          ${c.botaoModo !== 'discord'
            ? html`<p class="dica" style="font-size:12px">O Discord só pinta o fundo do botão em 4 cores. Com cor livre, o bot cria um emoji redondo nessa cor e usa o fundo mais parecido (aqui: ${b.base}).</p>`
            : html`<div class="estilos-discord">
                ${Object.entries(ESTILOS).map(([k, [nome, bg]]) => html`<button type="button" class=${c.estilo === k ? 'on' : ''} style=${`--c:${bg}`} onClick=${() => muda({ estilo: k })}>${nome}</button>`)}
              </div>`}
        </div>

        <div class="mini-discord">
          <span class="dc-btn" style=${`--c:${b.bg};width:max-content`}>
            ${b.bolinha && html`<span class="dc-bolinha" style=${`--c:${b.bolinha}`}></span>`}
            <${Emoji} texto=${c.emoji} classe="dc-emoji" /><span>${c.nome}</span>
          </span>
          <div class="dc-so-voce">Só você pode ver esta mensagem</div>
          <div dangerouslySetInnerHTML=${{ __html: resposta }}></div>
        </div>

        <div style="display:flex;align-items:center;gap:8px">
          <button type="button" class="btn-seta" title="Subir" disabled=${i === 0} onClick=${() => mover(-1)}>↑</button>
          <button type="button" class="btn-seta" title="Descer" disabled=${i === cores.length - 1} onClick=${() => mover(1)}>↓</button>
          <button type="button" class="btn-perigo" style="margin-left:auto" onClick=${expulsar}>Expulsar da turma</button>
        </div>
      </div>
    </div>`;
}

export function AbaCores() {
  const { cfg, estado, ui, setUi, mudar } = useApp();
  const cores = cfg.cores;
  const cargos = estado.servidor?.cargos ?? [];
  const sel = Math.min(ui.selCor, cores.length - 1);
  const membrosDe = (c) => cargos.find((r) => r.id === c.cargoId)?.membros ?? null;
  const conhecidos = cores.map(membrosDe).filter((n) => n != null);
  const max = conhecidos.length ? Math.max(...conhecidos) : null;
  const min = conhecidos.length ? Math.min(...conhecidos) : null;
  const cheio = cores.length >= MAX_CORES;
  const itens = boletim(estado);

  const novaCor = () => {
    if (cheio) return;
    const hex = hexEntrada(Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));
    mudar((x) => x.cores.push({ nome: `Nova cor ${x.cores.length + 1}`, emoji: '⭐', hex, tipo: 'solida', hex2: '', estilo: 'Secondary', botaoModo: 'discord', botaoHex: '', cargoId: null }));
    setUi({ selCor: cores.length });
  };

  return html`
    <div class="colunas">
      <div class="col-editor" style="gap:26px">
        <div class="cabeca">
          <div class="cabeca-texto">
            <div class="cabeca-linha"><h1 class="h1">CARGOS DE COR</h1><span class="rabisco">a chamada da turma</span></div>
            <p class="sub" style="max-width:56ch">Cada cor é um cargo no Discord. Clica num cartão pra abrir a ficha e editar.</p>
          </div>
          <div style="margin-left:auto;display:flex;align-items:center;gap:12px">
            <span style="font:400 15px var(--titulo)">${cores.length}/${MAX_CORES} matriculados</span>
            <button type="button" class="btn vermelho sombra" disabled=${cheio} onClick=${novaCor}>+ Nova cor</button>
          </div>
        </div>

        <div class="grade-cores">
          ${cores.map((c, i) => {
            const b = botaoDaCor(c);
            const n = membrosDe(c);
            const temCargo = cargos.some((r) => r.id === c.cargoId);
            const sticker = n == null ? '' : n === max && max > 0 ? 'stonks' : n === min && cores.length > 2 ? 'flopou' : '';
            return html`<button type="button" class=${`cartao-cor${i === sel ? ' sel' : ''}`} onClick=${() => setUi({ selCor: i })}>
              <div class="cartao-cor-faixa" style=${`--fundo-cor:${fundoDaCor(c)}`}><span class="cartao-cor-num">${num(i)}</span></div>
              <span class="cartao-cor-emoji"><${Emoji} texto=${c.emoji} /></span>
              <div class="cartao-cor-corpo">
                <div class="cartao-cor-nome">${c.nome}</div>
                <div class="cartao-cor-linha">
                  <span class="cartao-cor-hex">${c.hex}</span>
                  <span class="cartao-cor-alunos" title=${n == null ? 'Ligue a Server Members Intent pra contar' : ''}>${n == null ? '—' : n} alunos</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                  <span class="cartao-cor-botao" style=${`--c:${b.bg};--b:${b.bolinha}`}>${b.bolinha && html`<i></i>`}botão ${b.nome}</span>
                  <span class="cartao-cor-status" style=${`--c:${temCargo ? '#2f8f5b' : '#b07a00'}`}>${temCargo ? '✓ cargo no Discord' : 'cria ao salvar'}</span>
                </div>
              </div>
              ${sticker && html`<span class="adesivo">${sticker}</span>`}
            </button>`;
          })}
          <button type="button" class="nova-cor" disabled=${cheio} onClick=${novaCor}><b>+</b><span style="font-weight:700">Matricular nova cor</span></button>
        </div>

        <div class="cartao" style="padding:22px">
          <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:10px">
            <h2 class="h2-grande">BOLETIM DA HIERARQUIA</h2>
            <span style="font-weight:700;color:var(--cinza)">Média geral: <span style="font:400 20px var(--rabisco);color:var(--vermelho)">${media(itens)}</span></span>
          </div>
          <div style="display:grid">
            ${itens.map(
              (b) => html`<div class="boletim-item">
                <span class="boletim-nota" style=${`--c:${b.cor}`}>${b.nota}</span>
                <div style="display:grid;gap:2px">
                  <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
                    <b style="font-weight:800">${b.item}</b>
                    ${b.sticker && html`<${Adesivo} solto texto=${b.sticker} cor="#f5b5a8" estilo="font-size:13px;padding:4px 8px;box-shadow:none" />`}
                  </div>
                  <span style="color:var(--cinza);text-wrap:pretty">${b.texto}</span>
                </div>
              </div>`,
            )}
          </div>
          <p class="dica">Mexeu nos cargos no Discord? É só voltar pra esta aba que atualiza.</p>
        </div>
      </div>

      <aside class="col-lado" style="flex:1 1 360px">
        ${cores[sel] && html`<${Ficha} key=${sel} c=${cores[sel]} i=${sel} />`}
        <p class="nota-amarela">Tirou uma cor daqui? O cargo continua no Discord. O Discord só tem 4 cores de botão; a cor do nome vem do cargo.</p>
      </aside>
    </div>`;
}
