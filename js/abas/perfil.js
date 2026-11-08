// Aba Meu perfil: banner e foto (do Discord, galeria, link ou anexo), medalhas (fixar até 3), bio, o cartão "como a galera
// te vê" e a prévia da carteirinha que o /perfil manda no Discord. Cada mudança vale na hora (não espera o Salvar): vai direto pro bot.
import { html, useEffect, useState } from '../../vendor/preact-htm.js';
import { chamar, ErroSenha } from '../api.js';
import { useApp } from '../estado.js';
import { hexEntrada, urlImagem } from '../logica.js';
import { tempoRelativo } from '../moderacao.js';
import {
  AP_PADRAO, capaDaGaleria, capaDe, CATEGORIAS, COMANDOS_PERFIL, COR_SEM_BANNER, corDeDestaque, CORES_NOME, DEGRADES, DESTAQUES, erroDoArquivo, erroDoLink, ESTILO_REDE,
  estiloDoNome, FAVORITOS, favoritosVisiveis, FONTES_NOME, FUNDOS, imagemDaMedalha, MAX_FAVORITOS, nomeDaCarteirinha, numeroBonito, partesDoBanner, PROPORCAO_CAPA, RARIDADE,
  REDES, textoDoAniversario, textoSobre, TIPOS_DE_IMAGEM, USUARIO_REDE, VISIBILIDADES,
} from '../perfil.js';
import { Amostras, LogoDiscord, Segmentado, Toggle } from '../ui/basicos.js';
import { lerBase64 } from '../ui/seletor-banner.js';

const MAX_BIO = 120;
const FILTROS = [['todas', 'Todas'], ['ganhas', 'Conquistadas'], ['faltam', 'Faltando']];
// k = 'b' (banner) ou 'a' (foto)
const ORIGENS = {
  b: [['discord', 'Do Discord'], ['galeria', 'Galeria'], ['link', 'Link'], ['anexo', 'Anexar']],
  a: [['discord', 'Do Discord'], ['link', 'Link'], ['anexo', 'Anexar']],
};
const SOBRE_O_DISCORD = {
  b: 'Usa o banner do seu perfil no Discord. Sem Nitro o Discord não tem banner, então entra a cor de destaque do seu perfil.',
  a: 'Usa sua foto do Discord e troca sozinha quando você mudar lá.',
};

/** Imagem escolhida pela pessoa. Link quebrado ou anexo apagado somem e deixam aparecer o que está atrás. */
const ImagemDoPerfil = ({ src }) => html`<img key=${src} src=${src} alt="" referrerpolicy="no-referrer" onError=${(e) => (e.target.style.display = 'none')} />`;

/** Variáveis de cor do cartão: fundo e texto (claro ou escuro, conforme o fundo) */
const coresDoCartao = (ap, t) => `--ap-fundo:${ap.fundo};--ap-txt:${t.txt};--ap-sub:${t.sub}`;

/** Cartões das redes de alguém (o bot monta e guarda por 30 min). ligado = só pergunta quando vai mostrar. */
function useCartoesDe(id, ligado, versao) {
  const [cartoes, setCartoes] = useState([]);
  useEffect(() => {
    if (!ligado || !id) return setCartoes([]);
    let vivo = true;
    chamar(`/api/redes?id=${encodeURIComponent(id)}`)
      .then((r) => vivo && setCartoes(r.redes ?? []))
      .catch(() => vivo && setCartoes([]));
    return () => (vivo = false);
  }, [id, ligado, versao]);
  return cartoes;
}

/** Um cartão por rede, nas cores dela: números, pôsteres (Letterboxd) ou capas dos jogos (Steam). Abre o perfil na rede. */
function CartoesRedes({ cartoes, cor, links = true }) {
  const Caixa = links ? 'a' : 'div';
  return html`<div class="rede-secao">
    <span style=${`color:${cor}`}>REDES</span>
    <div class="rede-lista">${cartoes.map((c) => {
      const [bg, fg, box, stBg, stFg] = ESTILO_REDE[c.rede] ?? ESTILO_REDE.instagram;
      const [, , ab, corSelo, corSigla] = REDES.find((r) => r[0] === c.rede) ?? [];
      return html`<${Caixa} class="rede-cartao" href=${links ? c.link || undefined : undefined} target=${links ? '_blank' : undefined} rel=${links ? 'noopener noreferrer' : undefined} style=${`--bg:${bg};--fg:${fg};--box:${box}`}>
        <div class="rede-cab">
          <span class="rede-selo" style=${`background:${corSelo};color:${corSigla}`}>${ab}</span>
          <span class="rede-nome"><b>${c.nome}</b><span>${c.user}</span></span>
          ${c.status && html`<span class="rede-status" style=${`background:${stBg};color:${stFg}`}>${c.status}</span>`}
        </div>
        ${c.stats?.length > 0 && html`<div class="rede-stats">${c.stats.map(([v, k]) => html`<span><b>${v}</b><small>${k}</small></span>`)}</div>`}
        ${c.aviso && html`<span class="rede-aviso">${c.aviso}</span>`}
        ${c.rede === 'instagram' && !c.aviso && html`<span class="rede-aviso">instagram.com/${String(c.user).replace(/^@/, '')}</span>`}
        ${c.itens?.length > 0 && html`<span class="rede-rotulo">${c.rotulo ?? (c.rede === 'letterboxd' ? 'VISTOS POR ÚLTIMO' : 'MAIS JOGADOS')}</span>`}
        ${c.itens?.length > 0 && c.rede === 'letterboxd' && html`<div class="rede-posters">${c.itens.map((it) => html`<div title=${it.t}>
          <span class="rede-poster">${it.src && html`<img src=${it.src} alt="" loading="lazy" referrerpolicy="no-referrer" />`}</span><small>${it.s}</small>
        </div>`)}</div>`}
        ${c.itens?.length > 0 && c.rede !== 'letterboxd' && c.itens.map((it) => html`<div class="rede-jogo">
          <span class="rede-capsula">${it.src && html`<img src=${it.src} alt="" loading="lazy" referrerpolicy="no-referrer" />`}</span><span class="rede-jogo-nome">${it.t}</span><span>${it.s}</span>
        </div>`)}
      </${Caixa}>`;
    })}</div>
  </div>`;
}

/** Uma rede em Meu perfil: vincular (pelo nome ou pelo login da Steam), mostrar/esconder e desvincular. Vale na hora. */
function LinhaRede({ id, nome, ab, cor, corSigla, modo, cartao }) {
  const { eu, setEu, aviso, tratar } = useApp();
  const conta = eu.perfil.redes?.[id];
  const [txt, setTxt] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function pedir(corpo, ok) {
    setOcupado(true);
    try {
      const r = await chamar('/api/eu/redes', corpo);
      setEu((e) => ({ ...e, perfil: r.perfil }));
      if (ok) aviso(ok, 'agora a turma te stalkeia');
      setTxt('');
    } catch (e) {
      tratar(e);
    } finally {
      setOcupado(false);
    }
  }
  async function conectarSteam() {
    setOcupado(true);
    try {
      const r = await chamar('/api/eu/redes/steam', { volta: location.href.split('#')[0] });
      location.href = r.link;
    } catch (e) {
      tratar(e);
      setOcupado(false);
    }
  }
  const vincular = () => {
    const u = txt.trim().replace(/^@/, '');
    if (!USUARIO_REDE.test(u)) return aviso('Esse usuário não parece válido.', 'confere aí', { erro: true });
    pedir({ acao: 'ligar', rede: id, user: u }, `${nome} vinculado.`);
  };
  const mostrar = conta?.mostrar !== false;
  const linha = conta
    ? `${conta.user ? `@${conta.user}` : cartao?.user || 'conta vinculada'} · ${mostrar ? 'aparece no perfil' : 'escondido do perfil'}`
    : { user: 'Só o nome de usuário. O perfil precisa ser público.', steam: 'Abre a página da Steam pra você autorizar.', app: 'Ainda não: o dono do bot precisa registrar um app do ' + nome + '.' }[modo];
  return html`<div class="rede-linha">
    <span class="rede-selo grande" style=${`background:${cor};color:${corSigla}`}>${ab}</span>
    <span class="rede-info"><b>${nome}</b><span>${linha}</span></span>
    ${conta
      ? html`<div class="rede-acoes"><span>Mostrar</span><${Toggle} on=${mostrar} titulo="Mostrar no perfil" onClick=${() => !ocupado && pedir({ acao: 'mostrar', rede: id, on: !mostrar })} />
          <button type="button" class="btn pequeno" disabled=${ocupado} onClick=${() => confirm(`Desvincular ${nome}?`) && pedir({ acao: 'desligar', rede: id }, `${nome} desvinculado.`)}>Desvincular</button></div>`
      : modo === 'user'
        ? html`<div class="rede-acoes cresce"><input class="campo" placeholder="seu_usuario" maxlength="31" value=${txt} disabled=${ocupado} onInput=${(e) => setTxt(e.target.value)} onKeyDown=${(e) => e.key === 'Enter' && vincular()} />
            <button type="button" class="btn" disabled=${ocupado || !txt.trim()} onClick=${vincular}>Vincular</button></div>`
        : modo === 'steam'
          ? html`<button type="button" class="btn" disabled=${ocupado} onClick=${conectarSteam}>${ocupado ? 'Abrindo…' : 'Conectar com Steam'}</button>`
          : html`<button type="button" class="btn" disabled title="Precisa de um app registrado pelo dono do bot">Em breve</button>`}
  </div>`;
}

/** Favoritos que aparecem: rótulo na cor de destaque e até 5 capas com o nome embaixo */
function SecoesFavoritos({ listas, cor }) {
  return html`<div class="fav-secoes">${listas.map((f) => html`<div class="fav-secao">
    <span style=${`color:${cor}`}>${(FAVORITOS.find((x) => x[0] === f.tipo)?.[1] ?? f.tipo).toUpperCase()}</span>
    <div class="fav-grade">${f.itens.map((it) => html`<div class="fav-item" title=${it.t}>
      <span class="fav-capa" style=${`aspect-ratio:${PROPORCAO_CAPA[f.tipo]}`}><img src=${capaDe(f.tipo, it)} alt="" loading="lazy" referrerpolicy="no-referrer" onError=${(e) => (e.target.src = capaDaGaleria(f.tipo, it.t))} /></span>
      <span class="fav-nome">${it.t}</span>
    </div>`)}</div>
  </div>`)}</div>`;
}

/** Cartão do perfil (também usado na lista da turma, em tamanho menor). perfil.niver = texto pronto do aniversário (ou nada). */
export function CartaoPerfil({ usuario, perfil, fixadas, stats, grande = true, cartoes, semLinks = false }) {
  const { api } = useApp();
  const ini = (usuario.nome || '?').charAt(0).toUpperCase();
  const banner = urlImagem(perfil.banner, '', api), foto = urlImagem(usuario.avatar, '', api);
  const ap = { ...AP_PADRAO, ...perfil.ap }, t = textoSobre(ap.fundo);
  // Na turma, os cartões das redes só vêm quando o perfil abre (o Meu perfil manda os dele prontos)
  const buscados = useCartoesDe(usuario.id, grande && !cartoes && (perfil.redes?.length ?? 0) > 0, (perfil.redes ?? []).join());
  const redes = cartoes ?? buscados;
  return html`<div class=${`perfil-cartao${grande ? '' : ' pequeno'}`} style=${coresDoCartao(ap, t)}>
    <div class="perfil-banner" style=${banner ? '' : `background:${perfil.cor || COR_SEM_BANNER}`}>${banner && html`<${ImagemDoPerfil} src=${banner} />`}</div>
    <div class="perfil-corpo">
      <div class="perfil-linha-foto">
        <span class="perfil-foto">${ini}${foto && html`<${ImagemDoPerfil} src=${foto} />`}${grande && html`<i></i>`}</span>
        <div class="perfil-fixadas">${fixadas.map((id) => html`<img src=${imagemDaMedalha(id)} alt="" title=${id} />`)}</div>
      </div>
      <div style="display:grid;gap:2px;min-width:0">
        <b class="perfil-nome" style=${estiloDoNome(ap, t.txt, grande ? 1 : 0.72)}>${usuario.nome}</b>
        <span class="perfil-sub">${grande && html`<${LogoDiscord} tam=${14} />`}@${usuario.usuario} · entrou ${usuario.entrou ? tempoRelativo(usuario.entrou) : '?'}</span>
      </div>
      <div class="perfil-cargos">${usuario.cargos.map((c) => html`<span class="perfil-cargo"><i style=${`--c:${c.cor}`}></i>${c.nome}</span>`)}</div>
      ${grande && html`<p class="perfil-bio">${perfil.bio || 'Ainda sem bio. Escreve alguma coisa aí!'}</p>`}
      ${grande && perfil.niver && html`<div class="perfil-niver"><span style=${`background:${ap.destaque}`}>ANIVERSÁRIO</span>${perfil.niver}</div>`}
      ${grande && redes.length > 0 && html`<${CartoesRedes} cartoes=${redes} cor=${corDeDestaque(ap)} links=${!semLinks} />`}
      ${grande && favoritosVisiveis(perfil.fav).length > 0 && html`<${SecoesFavoritos} listas=${favoritosVisiveis(perfil.fav)} cor=${corDeDestaque(ap)} />`}
      ${stats && html`<div class="perfil-stats">${stats.map(([v, k]) => html`<div><b>${v}</b><span>${k}</span></div>`)}</div>`}
    </div>
  </div>`;
}

/**
 * Como a resposta chega no Discord pra cada comando do perfil (o bot desenha a mesma coisa em imagem).
 * cmd: 'perfil' (carteirinha), 'completo' (carteirinha + seções), 'trofeus' ou 'niver' (foto pequena, nome e título).
 */
function PreviaComando({ cmd, usuario, visual, fixadas, stats, ap, niver, trofeus, total, favs, redes }) {
  const { api, estado } = useApp();
  const t = textoSobre(ap.fundo), destaque = corDeDestaque(ap);
  const banner = urlImagem(visual.banner, '', api), foto = urlImagem(visual.avatar, '', api);
  const servidor = (estado.servidor?.nome ?? 'Servidor').toUpperCase();
  const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const nomeCmd = (COMANDOS_PERFIL.find((c) => c[0] === cmd) ?? COMANDOS_PERFIL[0])[1];
  const comCarteirinha = cmd === 'perfil' || cmd === 'completo';
  const titulo = { trofeus: 'TROFÉUS', niver: 'ANIVERSÁRIO', favoritos: 'FAVORITOS', redes: 'REDES' }[cmd];
  const prefixo = { trofeus: 'trofeus-', niver: 'aniversario-', favoritos: 'favoritos-', redes: 'redes-' }[cmd] ?? 'perfil-';
  const arquivo = cmd === 'perfil' ? `${nomeDaCarteirinha(usuario.nome, visual.gif)} · 1000×560` : nomeDaCarteirinha(usuario.nome, false).replace(/^perfil-/, prefixo);
  const ini = (usuario.nome || '?').charAt(0).toUpperCase();
  const nome = html`<b style=${estiloDoNome(ap, t.txt, 0.72, 'var(--u)')}>${usuario.nome}</b>`;
  return html`<div class="dc" style="display:grid;gap:8px">
    <div class="cart-comando"><b>@${usuario.usuario}</b>usou<span>${nomeCmd}</span></div>
    <div class="dc-msg">
      <img class="dc-avatar" src="banners/bot/mascote-64.png" alt="" />
      <div class="dc-corpo" style="display:grid;gap:6px">
        <div class="dc-autor">Manda Chuva<span class="dc-app">APP</span><span class="dc-hora">hoje às ${hora}</span></div>
        <div class="cart" style=${coresDoCartao(ap, t)}>
          ${comCarteirinha && html`<div class="cart-banner" style=${banner ? '' : `background:${visual.cor || COR_SEM_BANNER}`}>${banner && html`<${ImagemDoPerfil} src=${banner} />`}</div>`}
          <div class=${`cart-corpo${comCarteirinha ? '' : ' sem-banner'}`}>
            ${comCarteirinha
              ? html`<div class="cart-topo">
                    <span class="cart-foto">${ini}${foto && html`<${ImagemDoPerfil} src=${foto} />`}</span>
                    <span class="cart-nome">${nome}<span>entrou ${usuario.entrou ? tempoRelativo(usuario.entrou) : '?'}</span></span>
                    <span class="cart-medalhas">${fixadas.map((id) => html`<img src=${imagemDaMedalha(id)} alt="" title=${id} />`)}</span>
                  </div>
                  <div class="cart-cargos">${usuario.cargos.map((c) => html`<span class="cart-cargo"><i style=${`--c:${c.cor}`}></i>${c.nome}</span>`)}</div>
                  <div class="cart-stats">${stats.map(([v, k]) => html`<span><b>${v}</b><small>${k}</small></span>`)}</div>`
              : html`<div class="cart-cab">
                  <span class="cart-foto pequena">${ini}${foto && html`<${ImagemDoPerfil} src=${foto} />`}</span>
                  <span class="cart-nome">${nome}<span class="cart-titulo" style=${`color:${destaque}`}>${titulo}</span></span>
                </div>`}
            ${(cmd === 'completo' || cmd === 'niver') && html`<div class="cart-secao"><span style=${`color:${destaque}`}>ANIVERSÁRIO</span><b>${niver}</b></div>`}
            ${(cmd === 'completo' || cmd === 'redes') &&
            (redes.length ? html`<${CartoesRedes} cartoes=${redes} cor=${destaque} />` : html`<div class="cart-secao"><span style=${`color:${destaque}`}>REDES</span><small class="cart-vazio">Nenhuma rede vinculada.</small></div>`)}
            ${(cmd === 'completo' || cmd === 'favoritos') &&
            (favs.length ? html`<${SecoesFavoritos} listas=${favs} cor=${destaque} />` : html`<div class="cart-secao"><span style=${`color:${destaque}`}>FAVORITOS</span><small class="cart-vazio">Nenhum favorito público.</small></div>`)}
            ${(cmd === 'completo' || cmd === 'trofeus') && html`<div class="cart-secao"><span style=${`color:${destaque}`}>TROFÉUS · ${trofeus.length} DE ${total}</span>
              <div class="cart-trofeus">${trofeus.map((m) => html`<img src=${imagemDaMedalha(m.id)} alt="" title=${m.nome} />`)}</div></div>`}
            <span class="cart-rodape">${servidor} · CARTEIRINHA</span>
          </div>
        </div>
        <span class="dc-hora">${arquivo}</span>
      </div>
    </div>
  </div>`;
}

/** Campo #hex ao lado das amostras: salva quando a cor é válida e a pessoa sai do campo (ou aperta Enter) */
function CampoHex({ valor, onSalvar }) {
  const [t, setT] = useState(valor);
  useEffect(() => setT(valor), [valor]);
  const salvar = () => {
    const v = hexEntrada(t);
    if (/^#[0-9A-F]{6}$/.test(v) && v !== valor) onSalvar(v);
  };
  return html`<input class="campo mono ap-hex" value=${t} placeholder="#hex" maxlength="7" onInput=${(e) => setT(e.target.value)} onBlur=${salvar} onKeyDown=${(e) => e.key === 'Enter' && salvar()} />`;
}

/** Uma lista de favoritos em Meu perfil: até 5, com a capa que o bot procura, e o "Mostrar". Vale na hora. */
function ListaFavoritos({ tipo, nome, exemplo }) {
  const { eu, setEu, aviso, tratar } = useApp();
  const fav = eu.perfil.fav ?? {};
  const itens = fav[tipo] ?? [];
  const mostrar = fav.mostrar?.[tipo] !== false;
  const [txt, setTxt] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function pedir(corpo, ok) {
    setOcupado(true);
    try {
      const r = await chamar('/api/eu/favoritos', corpo);
      setEu((e) => ({ ...e, perfil: r.perfil }));
      if (ok) aviso(ok, 'gosto não se discute');
      return true;
    } catch (e) {
      tratar(e);
      return false;
    } finally {
      setOcupado(false);
    }
  }
  async function add() {
    const t = txt.trim();
    if (!t || ocupado) return;
    if (itens.length >= MAX_FAVORITOS) return aviso(`Máximo de ${MAX_FAVORITOS} em ${nome.toLowerCase()}.`, 'escolhe os melhores');
    if (await pedir({ acao: 'add', tipo, t }, `${t} nos favoritos.`)) setTxt('');
  }

  return html`<div class="fav-lista">
    <div class="fav-topo">
      <b>${nome}</b><span class="fav-conta">${itens.length}/${MAX_FAVORITOS}</span>
      <span class="fav-mostrar">Mostrar</span><${Toggle} on=${mostrar} titulo=${mostrar ? 'Aparece no perfil' : 'Escondido do perfil'} onClick=${() => !ocupado && pedir({ acao: 'mostrar', tipo, on: !mostrar })} />
    </div>
    <div class="fav-chips">
      ${itens.map((it) => html`<span class="fav-chip">
        <span><img src=${capaDe(tipo, it)} alt="" referrerpolicy="no-referrer" onError=${(e) => (e.target.src = capaDaGaleria(tipo, it.t))} /></span>${it.t}
        <button type="button" title="Tirar" disabled=${ocupado} onClick=${() => pedir({ acao: 'tirar', tipo, t: it.t })}>×</button>
      </span>`)}
      ${!itens.length && html`<span class="fav-nada">Nada ainda.</span>`}
    </div>
    <div class="fav-add">
      <input class="campo" maxlength="60" placeholder=${exemplo} value=${txt} disabled=${ocupado} onInput=${(e) => setTxt(e.target.value)} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
      <button type="button" class="btn" title="Adicionar" disabled=${ocupado || !txt.trim()} onClick=${add}>${ocupado ? '…' : '+'}</button>
    </div>
  </div>`;
}

const VIS_TXT = {
  oculto: 'Ninguém vê sua data. O bot ainda te dá parabéns no dia, se a mensagem de aniversário estiver ligada.',
  data: 'Aparece só o dia e o mês. A idade fica escondida.',
};

/** De onde vem o banner ou a foto. O erro aparece em vermelho embaixo do campo. galeria = conteúdo da aba Galeria. */
function OrigemImagem({ k, galeria }) {
  const { eu, setEu, aviso, tratar } = useApp();
  const p = eu.perfil;
  const [modo, setModo] = useState(p[`${k}Orig`]);
  const [link, setLink] = useState(p[`${k}Link`]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const banner = k === 'b';

  async function pedir(caminho, corpo, ok) {
    setErro('');
    setOcupado(true);
    try {
      const r = await chamar(caminho, corpo);
      setEu((e) => ({ ...e, perfil: r.perfil, visual: r.visual }));
      if (ok) aviso(ok, 'ficou chave');
    } catch (e) {
      if (e instanceof ErroSenha || !e.status) tratar(e);
      else setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }

  function escolher(m) {
    setModo(m);
    setErro('');
    // Discord e galeria valem na hora; link e anexo só se já tiver um guardado (senão esperam a pessoa mandar)
    const pronto = m === 'link' ? p[`${k}Link`] : m === 'anexo' ? p[`${k}Anexo`] : true;
    if (pronto && m !== p[`${k}Orig`]) pedir('/api/eu/perfil', { [`${k}Orig`]: m });
  }

  function usarLink() {
    const problema = erroDoLink(link);
    if (problema) return setErro(problema);
    pedir('/api/eu/perfil', { [`${k}Orig`]: 'link', [`${k}Link`]: link.trim() }, banner ? 'Banner trocado pelo link.' : 'Foto trocada pelo link.');
  }

  async function enviar(e) {
    const f = e.target.files[0];
    e.target.value = ''; // deixa escolher o mesmo arquivo de novo
    if (!f) return;
    const problema = erroDoArquivo(f);
    if (problema) return setErro(problema);
    pedir('/api/eu/anexo', { base64: await lerBase64(f), tipo: f.type, nome: f.name, alvo: banner ? 'banner' : 'foto' }, banner ? 'Banner anexado.' : 'Foto anexada.');
  }

  const nomeDoArquivo = p[`${k}ArqNome`];
  return html`
    <${Segmentado} classe="origens" opcoes=${ORIGENS[k]} valor=${modo} onChange=${escolher} />
    ${modo === 'discord' && html`<div class="aviso-discord"><${LogoDiscord} tam=${20} /><span>${SOBRE_O_DISCORD[k]}</span></div>`}
    ${modo === 'link' &&
    html`<div style="display:grid;gap:6px">
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <input class="campo mono" style="flex:1 1 240px;min-width:0" value=${link} placeholder="https://…/imagem.gif" onInput=${(e) => (setLink(e.target.value), setErro(''))} onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), usarLink())} />
        <button type="button" class="btn navy" disabled=${ocupado} onClick=${usarLink}>${ocupado ? 'Conferindo…' : 'Usar'}</button>
      </div>
      <span style="font-size:12px;color:var(--cinza)">Link direto da imagem (PNG, JPG, GIF ou WEBP). GIF animado funciona.</span>
    </div>`}
    ${modo === 'anexo' &&
    html`<label class="sb-solta">
      <input type="file" accept=${TIPOS_DE_IMAGEM.join(',')} style="display:none" disabled=${ocupado} onChange=${enviar} />
      <b style="font-weight:800;overflow-wrap:anywhere">${ocupado ? 'Enviando…' : nomeDoArquivo ? `${nomeDoArquivo} · clique pra trocar` : 'Clique pra escolher uma imagem'}</b>
      <span style="font-size:12px;color:var(--cinza)">PNG, JPG, GIF ou WEBP · até 8 MB</span>
    </label>`}
    ${erro && html`<span class="sb-erro">${erro}</span>`}
    ${modo === 'galeria' && galeria}`;
}

export function AbaPerfil() {
  const { eu, setEu, aviso, tratar } = useApp();
  const [cat, setCat] = useState(() => partesDoBanner(eu.perfil.banner)[0]);
  const [filtro, setFiltro] = useState('todas');
  const [cmd, setCmd] = useState('perfil');
  const cartoes = useCartoesDe(eu.usuario?.id, !!eu.usuario, JSON.stringify(eu.perfil?.redes ?? {}));
  // Volta do login da Steam: avisa e limpa o endereço
  useEffect(() => {
    const m = /redes=steam-(ok|erro)/.exec(location.hash);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    if (m[1] === 'ok') aviso('Steam vinculada.', 'agora a turma te stalkeia');
    else aviso('A Steam não confirmou o login. Tenta de novo.', 'deu ruim', { erro: true });
  }, []);
  const [bio, setBio] = useState(eu.perfil.bio);
  if (!eu.usuario) return html`<p class="sub">Entre com o Discord pra ter perfil.</p>`;
  const p = eu.perfil;
  const ganhas = eu.medalhas.filter((m) => m.ganha);
  const fixadas = p.fixadas.filter((id) => ganhas.some((m) => m.id === id));
  const catAt = CATEGORIAS.find((c) => c[0] === cat) ?? CATEGORIAS[0];

  async function guardar(patch, ok, meme) {
    const antes = eu;
    const visual = patch.banner ? { ...eu.visual, banner: patch.banner, cor: null } : eu.visual;
    setEu({ ...eu, perfil: { ...eu.perfil, ...patch }, visual }); // já mostra; volta atrás se o bot recusar
    try {
      const r = await chamar('/api/eu/perfil', patch);
      setEu((e) => ({ ...e, perfil: r.perfil, visual: r.visual }));
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
  const usuario = { ...eu.usuario, avatar: eu.visual.avatar };
  const ap = { ...AP_PADRAO, ...p.ap };
  const mudaAp = (patch) => guardar({ ap: { ...ap, ...patch } });
  const vis = p.niverVis ?? 'data';
  const niverTxt = textoDoAniversario(eu.niver, vis);
  const textoVis = vis === 'idade' ? (eu.niver && !eu.niver.ano ? 'Sem o ano no cadastro, a idade não tem como aparecer: fica só o dia e o mês.' : `Aparece ${niverTxt ?? 'a data e a idade'} no perfil e nos comandos.`) : VIS_TXT[vis];
  // O que os comandos mostram do aniversário (o mesmo texto que o bot desenha)
  const niverDaFicha = niverTxt ?? (eu.niver ? 'Escondido pelo dono do perfil.' : 'Ainda não cadastrou (é com /aniversario cadastrar).');

  const galeria = html`<div style="display:grid;gap:14px">
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">
      ${CATEGORIAS.map(([id, nome]) => html`<button type="button" class=${`pilula${cat === id ? ' on' : ''}`} onClick=${() => setCat(id)}>${nome}</button>`)}
      <span style="margin-left:auto;font-size:13px;color:var(--cinza)">${catAt[2].length} banners em ${catAt[1]}</span>
    </div>
    <div class="grade-banners">
      ${catAt[2].map((nome, k) => {
        const src = `banners/perfil/${catAt[0]}-${k + 1}.jpg`, ativo = p.banner === src;
        return html`<button type="button" class=${`banner-opcao${ativo ? ' on' : ''}`} title=${nome} onClick=${() => !ativo && guardar({ bOrig: 'galeria', banner: src }, `Banner trocado: ${nome}.`, 'ficou chave')}>
          <img src=${src} alt="" loading="lazy" /><span>${nome}</span>
        </button>`;
      })}
    </div>
    <span style="font-size:12px;color:var(--cinza)">Artes originais inspiradas em jogos, músicas e estilos. Nada de logo ou personagem oficial.</span>
  </div>`;

  return html`<div class="colunas">
    <div class="col-editor" style="gap:24px">
      <div style="display:grid;gap:6px">
        <div class="cabeca-linha"><h1 class="h1">MEU PERFIL</h1><span class="rabisco">a carteirinha da resenha</span></div>
        <p class="sub">É assim que a galera te vê no site. Escolha um banner, fixe até 3 medalhas e escreva uma bio.</p>
      </div>

      <div class="cartao">
        <h2 class="h2">BANNER DO PERFIL</h2>
        <${OrigemImagem} k="b" galeria=${galeria} />
      </div>

      <div class="cartao">
        <h2 class="h2">FOTO DE PERFIL</h2>
        <${OrigemImagem} k="a" />
      </div>

      <div class="cartao">
        <h2 class="h2">APARÊNCIA</h2>
        <div class="ap-grupo"><span class="rotulo">Cor do fundo</span>
          <div class="ap-linha"><${Amostras} cores=${FUNDOS} marcada=${ap.fundo} tamanho="grande" onEscolher=${(v) => mudaAp({ fundo: v })} /><${CampoHex} valor=${ap.fundo} onSalvar=${(v) => mudaAp({ fundo: v })} /></div>
        </div>
        <div class="ap-grupo"><span class="rotulo">Cor do nome</span>
          <${Segmentado} classe="origens" opcoes=${[['solida', 'Cor sólida'], ['degrade', 'Degradê']]} valor=${ap.nomeTipo} onChange=${(v) => mudaAp({ nomeTipo: v })} />
          ${ap.nomeTipo === 'degrade'
            ? html`<div class="ap-linha">${DEGRADES.map(([c1, c2], i) => html`<button type="button" class=${`ap-degrade${ap.grad === i ? ' on' : ''}`} style=${`background:linear-gradient(90deg, ${c1}, ${c2})`} title=${`${c1} → ${c2}`} onClick=${() => mudaAp({ grad: i })}></button>`)}</div>`
            : html`<div class="ap-linha"><${Amostras} cores=${CORES_NOME} marcada=${ap.nome} tamanho="grande" onEscolher=${(v) => mudaAp({ nome: v })} /><${CampoHex} valor=${ap.nome} onSalvar=${(v) => mudaAp({ nome: v })} /></div>`}
        </div>
        <div class="ap-grupo"><span class="rotulo">Fonte do nome</span>
          <div class="ap-fontes">
            ${FONTES_NOME.map(([f, nome, , tam]) => html`<button type="button" class=${`ap-fonte${ap.fonte === f ? ' on' : ''}`} onClick=${() => mudaAp({ fonte: f })}>
              <span style=${`font-family:'${f}', sans-serif;font-size:${tam}px`}>${eu.usuario.nome}</span><small>${nome}</small>
            </button>`)}
          </div>
        </div>
        <div class="ap-grupo"><span class="rotulo">Cor de destaque</span>
          <div class="ap-linha"><${Amostras} cores=${DESTAQUES} marcada=${ap.destaque} tamanho="grande" onEscolher=${(v) => mudaAp({ destaque: v })} /><${CampoHex} valor=${ap.destaque} onSalvar=${(v) => mudaAp({ destaque: v })} /></div>
          <span style="font-size:12px;color:var(--cinza)">Usada nas etiquetas e títulos do cartão.</span>
        </div>
      </div>

      <div class="cartao">
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><h2 class="h2">REDES</h2><span style="font-size:13px;color:var(--cinza)">${REDES.filter(([id]) => p.redes?.[id]).length} de ${REDES.length} vinculadas</span></div>
        <div style="display:grid">${REDES.map(([id, nome, ab, cor, corSigla, modo]) => html`<${LinhaRede} key=${id} id=${id} nome=${nome} ab=${ab} cor=${cor} corSigla=${corSigla} modo=${modo} cartao=${cartoes.find((c) => c.rede === id)} />`)}</div>
      </div>

      <div class="cartao">
        <h2 class="h2">FAVORITOS</h2>
        <div class="fav-listas">${FAVORITOS.map(([tipo, nome, exemplo]) => html`<${ListaFavoritos} key=${tipo} tipo=${tipo} nome=${nome} exemplo=${exemplo} />`)}</div>
        <span style="font-size:12px;color:var(--cinza);text-wrap:pretty">O bot procura a capa sozinho, só pelo nome (Steam, Wikipédia, Apple e Open Library). Não achou? Entra uma arte da galeria.</span>
      </div>

      <div class="cartao">
        <h2 class="h2">ANIVERSÁRIO</h2>
        ${eu.niver
          ? html`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><span class="ap-data">${eu.niver.d}${eu.niver.ano ? `/${eu.niver.ano}` : ''}</span><span style="font-size:13px;color:var(--cinza)">cadastrado com /aniversario</span></div>`
          : html`<p class="dica">Você ainda não cadastrou. No Discord, use <code>/aniversario cadastrar</code> com o dia e o mês (o ano é opcional).</p>`}
        <${Segmentado} classe="origens" opcoes=${VISIBILIDADES} valor=${vis} onChange=${(v) => v !== vis && guardar({ niverVis: v }, 'Visibilidade do aniversário salva.', 'segredo guardado')} />
        <span style="font-size:13px;color:var(--cinza);text-wrap:pretty">${textoVis}</span>
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

      <div class="cartao">
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:10px"><h2 class="h2">COMANDOS DO PERFIL</h2><span style="font-size:13px;color:var(--cinza)">Clique pra ver a resposta na prévia</span></div>
        <div style="display:grid;gap:6px">
          ${COMANDOS_PERFIL.map(([id, nome, desc]) => html`<button type="button" class=${`cmd-perfil${cmd === id ? ' on' : ''}`} onClick=${() => setCmd(id)}><code>${nome} [membro]</code><span>${desc}</span></button>`)}
        </div>
        <span style="font-size:12px;color:var(--cinza);text-wrap:pretty">Sem [membro], mostra o seu. Tudo sai como imagem, e o que você escondeu não aparece pra ninguém. No Discord, o completo é a opção <code>completo</code> do /perfil.</span>
      </div>
    </div>

    <aside class="col-lado" style="gap:14px">
      <span style="font:400 16px var(--titulo)">COMO A GALERA TE VÊ</span>
      <${CartaoPerfil} usuario=${usuario} perfil=${{ banner: eu.visual.banner, cor: eu.visual.cor, bio: bio.trim() || p.bio, ap, niver: niverTxt, fav: p.fav }} fixadas=${fixadas} stats=${stats} cartoes=${cartoes} />
      <span style="font:400 16px var(--titulo)">NO DISCORD · ${(COMANDOS_PERFIL.find((c) => c[0] === cmd) ?? COMANDOS_PERFIL[0])[1]}</span>
      <${PreviaComando} cmd=${cmd} usuario=${usuario} visual=${eu.visual} fixadas=${fixadas} stats=${stats} ap=${ap} niver=${niverDaFicha} trofeus=${ganhas} total=${eu.medalhas.length} favs=${favoritosVisiveis(p.fav)} redes=${cartoes} />
      <span style="font-size:12px;color:var(--cinza);text-wrap:pretty">O bot desenha e manda como imagem anexada, sem embed. No /perfil, banner ou foto em GIF sai em GIF animado; os outros comandos saem em PNG.</span>
    </aside>
  </div>`;
}
