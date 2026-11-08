// Aba Regras: o regimento do servidor. O bot posta no canal, edita a mesma mensagem ao atualizar,
// dá um cargo pra quem clicar em "Li e aceito" e responde o /regras só pra quem pediu.
import { html } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { urlImagem } from '../logica.js';
import { BANNER_PADRAO, CORES_REGRAS, LIMITES, MAX_REGRAS, MODELOS_REGRAS, escadaDePunicoes, modeloDasRegras, textoDasRegras } from '../regras.js';
import { Amostras, Toggle } from '../ui/basicos.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';
import { SeletorBanner } from '../ui/seletor-banner.js';

const dataHora = (ms) => new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function AbaRegras() {
  const { cfg, estado, mudar, salvar, sujo, aviso, tratar, recarregar, api } = useApp();
  const r = cfg.regras;
  if (!r) return html`<p class="sub">Atualize o bot pra versão nova: esta aba precisa dele.</p>`;
  const s = estado.servidor, b = estado.bot, env = estado.regrasMsg;
  const muda = (patch) => mudar((c) => Object.assign(c.regras, patch));
  const mudaRegra = (i, patch) => mudar((c) => Object.assign(c.regras.regras[i], patch));
  const mover = (i, d) =>
    mudar((c) => {
      const a = c.regras.regras, j = i + d;
      if (j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]];
    });

  const canais = s?.canais ?? [];
  const opCanais = [
    { v: '', t: 'Escolha um canal' },
    ...canais.map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' })),
    { v: 'novo', t: 'Criar #regras', nota: 'o bot cria ao salvar' },
  ];
  // Cargo de moderação/admin ou acima do bot não pode ser dado por botão
  const opCargos = [
    { v: '', t: 'Escolha um cargo' },
    ...(s?.cargos ?? []).map((c) => ({ v: c.id, t: `@${c.nome}`, cor: c.cor, desabilitado: c.perigoso || c.acima, nota: c.perigoso ? 'tem permissão de moderação' : c.acima ? 'acima do bot' : '' })),
    { v: 'novo', t: 'Criar @Verificado', nota: 'o bot cria ao salvar' },
  ];
  const canal = r.canalId === 'novo' ? { nome: 'regras' } : canais.find((c) => c.id === r.canalId);
  const cargo = r.cargoId === 'novo' ? { nome: 'Verificado' } : s?.cargos.find((c) => c.id === r.cargoId);

  const modelo = modeloDasRegras(r.regras);
  const usarModelo = (k) => {
    if (k === modelo) return;
    const mexidas = modelo < 0 && r.regras.some((x) => x.t.trim() || x.d.trim());
    if (mexidas && !confirm(`Trocar as regras pelo modelo "${MODELOS_REGRAS[k][0]}"? As que estão aí somem.`)) return;
    muda({ regras: MODELOS_REGRAS[k][1].map(([t, d]) => ({ t, d })) });
  };

  const motivo = !b.online ? 'Ligue o bot pra enviar as regras.' : !s ? 'Escolha o servidor lá em cima.' : !r.canalId ? 'Escolha o canal das regras.' : !r.regras.some((x) => x.t.trim()) ? 'Escreva pelo menos uma regra.' : '';
  async function enviar() {
    if (motivo) return aviso(motivo);
    if (sujo && !(await salvar())) return;
    try {
      const resp = await chamar('/api/regras/enviar', {});
      aviso(resp.relatorio.join('\n'), 'agora ninguém pode dizer que não sabia', { link: resp.link });
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  }

  const msg = {
    topo: urlImagem(r.banner, BANNER_PADRAO, api),
    cor: r.cor,
    titulo: r.titulo,
    texto: textoDasRegras(r, cfg.moderacao),
    rodape: `${s?.nome ?? 'Seu servidor'} · atualizado em ${new Date().toLocaleDateString('pt-BR')}`,
    linhas: r.botao ? [[{ emoji: '✅', texto: r.botaoTxt, bg: '#248046' }]] : [],
  };
  const extras = [
    ['escada', 'Mostrar a escada de punições', `${escadaDePunicoes(cfg.moderacao)}. Sai dos limites de Cargos › Moderação.`],
    ['botao', 'Botão de aceitar', 'Quem clica ganha o cargo e libera o resto do servidor.'],
    ['fixar', 'Fixar a mensagem no canal', 'Fica no topo do canal.'],
    ['cmd', 'Comando /regras', 'Qualquer membro vê as regras em qualquer canal, só pra ele. Aparece depois do primeiro envio.'],
  ];

  return html`<div class="colunas">
    <div class="col-editor" style="gap:22px">
      <div class="cabeca">
        <div class="cabeca-texto">
          <div class="cabeca-linha"><h1 class="h1">REGRAS</h1><span class="rabisco">o regimento interno</span></div>
          <p class="sub">Escreva as regras e o bot manda no canal. Com o botão de aceitar, quem não concordar fica só na Portaria.</p>
        </div>
      </div>
      ${s?.regrasFaltando?.length > 0 && html`<div class="aviso-faixa" style="margin:0"><b>Falta permissão pro bot:</b><span>${s.regrasFaltando.join(', ')}. Dá pra dar no cargo do bot nas configurações do servidor.</span></div>`}

      <div class="cartao">
        <div class="grade-campos">
          <div class="rotulo">Canal<${ListaSuspensa} valor=${r.canalId ?? ''} opcoes=${opCanais} onChange=${(v) => muda({ canalId: v || null })} /></div>
          <div class="rotulo">Cor da barra<${Amostras} cores=${CORES_REGRAS} marcada=${r.cor} tamanho="grande" onEscolher=${(v) => muda({ cor: v })} /></div>
        </div>
        <label class="rotulo">Título <input class="campo" maxlength=${LIMITES.titulo} value=${r.titulo} onInput=${(e) => muda({ titulo: e.target.value })} /></label>
        <label class="rotulo">Introdução <textarea class="campo" rows="2" maxlength=${LIMITES.intro} value=${r.intro} onInput=${(e) => muda({ intro: e.target.value })}></textarea></label>
        <div style="display:grid;gap:6px"><span class="rotulo">Imagem do topo</span><${SeletorBanner} valor=${r.banner} padrao=${BANNER_PADRAO} tipo="banner" opcional onChange=${(v) => muda({ banner: v })} /></div>
      </div>

      <div class="cartao">
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px"><h2 class="h2">AS REGRAS</h2><span class="rg-conta">${r.regras.length}/${MAX_REGRAS}</span></div>
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
          <span style="font-size:13px;font-weight:700;color:var(--cinza)">Modelos:</span>
          ${MODELOS_REGRAS.map(([nome], k) => html`<button type="button" class=${`rg-modelo${modelo === k ? ' on' : ''}`} onClick=${() => usarModelo(k)}>${nome}</button>`)}
        </div>
        <div style="display:grid;gap:10px">
          ${r.regras.map((x, i, a) => html`<div class="rg-regra">
            <span class="rg-num">${i + 1}</span>
            <div style="display:grid;gap:8px;min-width:0">
              <input class="campo rg-titulo" maxlength=${LIMITES.regra} placeholder="Título da regra" value=${x.t} onInput=${(e) => mudaRegra(i, { t: e.target.value })} />
              <textarea class="campo" rows="2" maxlength=${LIMITES.explicacao} placeholder="Explica em uma frase (opcional)" value=${x.d} onInput=${(e) => mudaRegra(i, { d: e.target.value })}></textarea>
            </div>
            <div class="rg-acoes">
              <button type="button" class="rg-mover" title="Subir" disabled=${!i} onClick=${() => mover(i, -1)}>↑</button>
              <button type="button" class="rg-mover" title="Descer" disabled=${i === a.length - 1} onClick=${() => mover(i, 1)}>↓</button>
              <button type="button" class="rg-mover rg-apagar" title="Apagar regra" onClick=${() => mudar((c) => c.regras.regras.splice(i, 1))}>×</button>
            </div>
          </div>`)}
          ${!r.regras.length && html`<div style="padding:14px;text-align:center;color:var(--cinza)">Sem regras ainda. Escolhe um modelo ou adiciona a primeira.</div>`}
        </div>
        <button type="button" class="btn" style="justify-self:start" onClick=${() => (r.regras.length >= MAX_REGRAS ? aviso(`Máximo de ${MAX_REGRAS} regras.`, 'ninguém lê mais que isso') : mudar((c) => c.regras.regras.push({ t: '', d: '' })))}>+ Adicionar regra</button>
      </div>

      <div class="cartao" style="gap:0;padding-top:4px;padding-bottom:4px">
        ${extras.map(([k, titulo, texto], i) => html`<div class="mod-linha" style=${i ? '' : 'border-top:none'}>
          <div style="flex:1;display:grid;gap:2px"><b style="font-weight:800">${titulo}</b><span style="font-size:13px;color:var(--cinza);text-wrap:pretty">${texto}</span></div>
          <${Toggle} on=${r[k]} titulo=${titulo} onClick=${() => muda({ [k]: !r[k] })} />
        </div>`)}
        ${r.botao && html`<div class="grade-campos" style="padding:4px 0 14px">
          <label class="rotulo">Texto do botão <input class="campo" maxlength=${LIMITES.botao} value=${r.botaoTxt} onInput=${(e) => muda({ botaoTxt: e.target.value })} /></label>
          <div class="rotulo">Cargo que ganha<${ListaSuspensa} valor=${r.cargoId ?? ''} opcoes=${opCargos} onChange=${(v) => muda({ cargoId: v || null })} /></div>
        </div>`}
      </div>

      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:14px">
        <button type="button" class="btn navy sombra grande" disabled=${!!motivo} onClick=${enviar}>${env ? 'Atualizar mensagem' : `Enviar no #${canal?.nome ?? 'canal'}`}</button>
        ${env && html`<span class="rg-enviada">Enviada em ${dataHora(env.quando)}${env.fixada ? ' · fixada' : ''} · <a href=${env.link} target="_blank" rel="noopener">ver no Discord ↗</a></span>`}
        ${motivo && b.online && s && html`<span style="font-size:13px;color:var(--cinza)">${motivo}</span>`}
      </div>
      ${env && html`<p class="dica" style="margin-top:-12px">Depois de enviada, o Salvar já atualiza a mesma mensagem no Discord.</p>`}
    </div>

    <aside class="col-lado" style="gap:14px">
      <span style="font:400 16px var(--titulo)">PRÉVIA · #${canal?.nome ?? 'regras'}</span>
      <div class="rg-previa"><${Previa} msg=${msg} ctx=${{ cargos: s?.cargos ?? [], canais }} /></div>
      ${r.botao && html`<span style="font-size:12px;color:var(--cinza);text-wrap:pretty">Quem clica ganha o cargo ${cargo ? html`<b>@${cargo.nome}</b>` : '(escolha o cargo)'} e passa a ver o resto do servidor.</span>`}
      <p class="dica">Pra quem não aceitou ver só a Portaria, os outros canais precisam liberar só pra esse cargo (Editar canal › Permissões).</p>
    </aside>
  </div>`;
}
