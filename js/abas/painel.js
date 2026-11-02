// Aba Painel: o mural do corredor — texto, imagens e botões do painel de cores, com prévia ao vivo e envio
import { html, useState } from '../../vendor/preact-htm.js';
import { chamar } from '../api.js';
import { useApp } from '../estado.js';
import { PADROES } from '../galeria.js';
import { botaoDaCor, ESTILOS, hexOk, urlImagem } from '../logica.js';
import { Adesivo, CampoCor, Toggle } from '../ui/basicos.js';
import { ImagensEmbed } from '../ui/imagens-embed.js';
import { ListaSuspensa } from '../ui/lista-suspensa.js';
import { Previa } from '../ui/previa.js';

/** A mensagem do painel como o bot vai mandar (lib/painel.js no bot), pra prévia */
function mensagemDoPainel(cfg, api) {
  const p = cfg.painel, bt = cfg.botoes, P = PADROES.painel, i = p.imgs;
  // Menção falsa pra cada cor: a prévia pinta com a cor que está sendo editada, antes de salvar
  const ctx = { cargos: cfg.cores.map((c, k) => ({ id: String(90000 + k), nome: c.nome, cor: hexOk(c.hex) })) };
  const lista = cfg.cores.map((c, k) => `${c.emoji ? `${c.emoji}  ` : ''}<@&${90000 + k}>`).join('\n');
  const campos = p.campos.map((f) => `**${f.nome}**\n${f.valor}`).join('\n\n');
  const linhas = [];
  for (let k = 0; k < cfg.cores.length; k += bt.porLinha) linhas.push(cfg.cores.slice(k, k + bt.porLinha).map((c) => ({ texto: c.nome, emoji: c.emoji, ...botaoDaCor(c) })));
  if (bt.remover.ativo) linhas.push([{ texto: bt.remover.texto, emoji: bt.remover.emoji, bg: ESTILOS[bt.remover.estilo][1] }]);
  return {
    ctx,
    msg: {
      topo: urlImagem(i.topo, P.topo, api),
      cor: hexOk(p.corDoEmbed),
      titulo: p.titulo,
      texto: [p.descricao, p.listarCores ? lista : '', campos].filter(Boolean).join('\n\n'),
      mini: urlImagem(i.mini, P.mini, api),
      imagem: urlImagem(i.imagem, P.imagem, api),
      rodape: p.rodape,
      finais: i.finais.map((f) => urlImagem(f, P.final, api)).filter(Boolean),
      linhas,
    },
  };
}

export function AbaPainel() {
  const { cfg, estado, mudar, salvar, sujo, aviso, tratar, recarregar, api } = useApp();
  const [canal, setCanal] = useState('');
  const p = cfg.painel, bt = cfg.botoes, s = estado.servidor, b = estado.bot;
  const muda = (patch) => mudar((x) => Object.assign(x.painel, patch));
  const mudaBotoes = (fn) => mudar((x) => fn(x.botoes));
  const { msg, ctx } = mensagemDoPainel(cfg, api);
  const motivo = !b.online ? 'Ligue o bot para enviar o painel.' : !s ? 'Escolha o servidor lá em cima.' : '';
  const opCanais = (s?.canais ?? []).map((c) => ({ v: c.id, t: `#${c.nome}`, desabilitado: !c.podeEnviar, nota: c.podeEnviar ? c.categoria : 'sem permissão' }));

  async function enviar() {
    if (!canal) return aviso('Escolha um canal primeiro.');
    if (sujo && !(await salvar())) return;
    try {
      const r = await chamar('/api/enviar', { canalId: canal });
      const nome = s.canais.find((c) => c.id === canal)?.nome ?? 'canal';
      aviso([`Painel enviado em #${nome}!`, ...r.relatorio].join('\n'), 'taca-lhe pau', { link: r.link });
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  }
  async function apagar(id) {
    if (!confirm('Apagar este painel do Discord?')) return;
    try {
      await chamar('/api/apagar', { mensagemId: id });
      aviso('Painel apagado.', 'F no chat');
      await recarregar();
    } catch (e) {
      tratar(e);
    }
  }

  return html`
    <div class="colunas">
      <div class="col-editor">
        <div class="cabeca-linha"><h1 class="h1">O PAINEL</h1><span class="rabisco">o mural do corredor</span></div>

        <div class="cartao">
          <h2 class="h2">EMBED</h2>
          <label class="rotulo">Título
            <input class="campo" maxlength="256" value=${p.titulo} onInput=${(e) => muda({ titulo: e.target.value })} />
          </label>
          <label class="rotulo">Descrição
            <textarea class="campo" rows="3" maxlength="4000" value=${p.descricao} onInput=${(e) => muda({ descricao: e.target.value })}></textarea>
          </label>
          <div class="linha-toggle">
            <${Toggle} on=${p.listarCores} onClick=${() => muda({ listarCores: !p.listarCores })} />
            <span>Listar as cores no embed (com a menção colorida)</span>
          </div>
          <div class="grade-campos">
            <div class="rotulo">Cor da barra lateral <${CampoCor} valor=${p.corDoEmbed} onChange=${(v) => muda({ corDoEmbed: v })} /></div>
            <label class="rotulo">Rodapé
              <input class="campo" maxlength="2048" value=${p.rodape} onInput=${(e) => muda({ rodape: e.target.value })} />
            </label>
            <div style="grid-column:1/-1">
              <${ImagensEmbed} imgs=${p.imgs} padroes=${PADROES.painel} onChange=${(imgs) => muda({ imgs })} />
            </div>
          </div>
          <div style="display:grid;gap:10px">
            <span class="rotulo">Campos (texto extra dentro do embed)</span>
            ${p.campos.map(
              (f, k) => html`<div class="campo-embed">
                <div class="campo-embed-topo">
                  <input class="campo" style="flex:1 1 180px;font-weight:700" maxlength="256" placeholder="Título do campo" value=${f.nome}
                    onInput=${(e) => mudar((x) => (x.painel.campos[k].nome = e.target.value))} />
                  <button type="button" class="btn-x" title="Remover campo" onClick=${() => mudar((x) => x.painel.campos.splice(k, 1))}>×</button>
                </div>
                <textarea class="campo" rows="2" maxlength="1024" placeholder="Texto do campo" value=${f.valor} onInput=${(e) => mudar((x) => (x.painel.campos[k].valor = e.target.value))}></textarea>
              </div>`,
            )}
            <button type="button" class="btn-tracejado" onClick=${() => mudar((x) => x.painel.campos.push({ nome: 'Novo campo', valor: 'Escreva aqui' }))}>+ Adicionar campo</button>
          </div>
          <p class="dica">Dá pra usar **negrito**, *itálico*, \`código\` e menção de cargo <code>${'<@&ID>'}</code>.</p>
        </div>

        <div class="cartao">
          <h2 class="h2">BOTÕES</h2>
          <div style="display:grid;gap:6px">
            <span class="rotulo">Botões de cor por linha</span>
            <div class="por-linha">
              ${[1, 2, 3, 4, 5].map((n) => html`<button type="button" class=${bt.porLinha === n ? 'on' : ''} onClick=${() => mudaBotoes((x) => (x.porLinha = n))}>${n}</button>`)}
            </div>
          </div>
          <div class="linha-toggle">
            <${Toggle} on=${bt.remover.ativo} onClick=${() => mudaBotoes((x) => (x.remover.ativo = !x.remover.ativo))} />
            <span>Mostrar o botão de tirar a cor</span>
          </div>
          <div style="display:grid;grid-template-columns:minmax(0,1fr) 80px;gap:12px">
            <label class="rotulo">Texto
              <input class="campo" maxlength="80" value=${bt.remover.texto} onInput=${(e) => mudaBotoes((x) => (x.remover.texto = e.target.value))} />
            </label>
            <label class="rotulo">Emoji
              <input class="campo" style="padding:7px;text-align:center;font-size:18px" maxlength="100" value=${bt.remover.emoji} onInput=${(e) => mudaBotoes((x) => (x.remover.emoji = e.target.value.trim()))} />
            </label>
          </div>
          <div style="display:grid;gap:6px">
            <span class="rotulo">Cor do botão de tirar</span>
            <div class="estilos-discord">
              ${Object.entries(ESTILOS).map(([k, [nome, bg]]) => html`<button type="button" class=${bt.remover.estilo === k ? 'on' : ''} style=${`--c:${bg}`} onClick=${() => mudaBotoes((x) => (x.remover.estilo = k))}>${nome}</button>`)}
            </div>
          </div>
        </div>

        <div class="cartao">
          <h2 class="h2">RESPOSTAS <span style="font:700 13px var(--corpo);color:var(--cinza)">(só quem clicou vê)</span></h2>
          <label class="rotulo">Quando escolhe uma cor
            <input class="campo" maxlength="1500" value=${cfg.mensagens.ganhou} onInput=${(e) => mudar((x) => (x.mensagens.ganhou = e.target.value))} />
          </label>
          <label class="rotulo">Quando tira a cor
            <input class="campo" maxlength="1500" value=${cfg.mensagens.removeu} onInput=${(e) => mudar((x) => (x.mensagens.removeu = e.target.value))} />
          </label>
          <p class="dica"><code>{cor}</code> vira a menção do cargo, já colorida.</p>
        </div>
      </div>

      <aside class="col-lado">
        <div style="display:grid;gap:10px">
          <span style="font:400 16px var(--titulo)">PRÉVIA AO VIVO</span>
          <${Previa} msg=${msg} ctx=${ctx} />
        </div>
        <div class="cartao" style="padding:18px;gap:12px">
          <${Adesivo} texto="taca-lhe pau" giro="5deg" estilo="top:-14px;right:14px" />
          <h2 class="h2">ENVIAR PAINEL</h2>
          <div style="display:flex;gap:8px">
            <${ListaSuspensa} valor=${canal} opcoes=${opCanais} placeholder="Escolha um canal" desabilitada=${!!motivo} estilo="flex:1;min-width:0" onChange=${setCanal} />
            <button type="button" class="btn vermelho sombra" style="padding:9px 18px" disabled=${!!motivo} onClick=${enviar}>Enviar</button>
          </div>
          ${motivo && html`<p class="dica">${motivo}</p>`}
          <div>
            ${estado.paineis.map(
              (x) => html`<div class="painel-enviado">
                <b>#${x.canalNome}</b>
                <a href=${x.link} target="_blank" rel="noopener" style="font-weight:700">Abrir ↗</a>
                <button type="button" class="btn-perigo pequeno" onClick=${() => apagar(x.mensagemId)}>Apagar</button>
              </div>`,
            )}
          </div>
          ${!estado.paineis.length && html`<p class="dica">Nenhum painel enviado ainda.</p>`}
          <p class="dica">Ao salvar, os painéis que já estão no Discord são atualizados sozinhos.</p>
        </div>
      </aside>
    </div>`;
}
