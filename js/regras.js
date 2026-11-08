// Regras (aba Regras): modelos, escada de punições e texto da mensagem. Iguais ao lib/regras.js do bot.

export const MAX_REGRAS = 15;
export const BANNER_PADRAO = 'banners/boas-quadro.gif';
export const LIMITES = { titulo: 100, intro: 500, regra: 80, explicacao: 110, botao: 80 };
export const CORES_REGRAS = ['#C4363C', '#F2C14E', '#1F2A5C', '#2ECC71', '#5865F2', '#9B59B6', '#FF6EC7'];

/** [nome, [[título, explicação], ...]] */
export const MODELOS_REGRAS = [
  ['Resenha de boa', [
    ['Respeito acima de tudo', 'Zoeira sim, ofensa não. Nada de preconceito, assédio ou ataque pessoal.'],
    ['Sem spam e flood', 'Uma figurinha é meme. Vinte seguidas é castigo.'],
    ['Cada assunto no seu canal', 'Clipe em #clipes, meme em #memes, treta em canal nenhum.'],
    ['Nada de +18 ou gore', 'Nem “de zoeira”, nem com spoiler.'],
    ['Divulgação só com permissão', 'Convite de outro servidor só com aval da staff.'],
    ['Golpe é ban na hora', 'Nitro grátis, link suspeito ou venda de conta: ban sem aviso.'],
    ['Respeite a call', 'Sem gritar no microfone e sem soundboard infinito.'],
    ['Discordou? Abre ticket', 'Reclamação de punição vai no ticket, não no #geral.'],
  ]],
  ['Gamer', [
    ['Sem toxicidade na partida', 'Perdeu? Respira. Xingar o time não sobe o rank.'],
    ['Sem hack ou trapaça', 'Cheat, exploit ou smurf pra humilhar: ban.'],
    ['Nada de vender conta ou item', 'Comércio fica fora do servidor.'],
    ['Procurando time? Canal certo', 'Use #procurando-time e marque o cargo do jogo.'],
    ['Spoiler com aviso', 'Lançamento novo? Usa a marcação de spoiler.'],
    ['Respeite a call', 'Microfone aberto sem barulho de fundo, por favor.'],
  ]],
  ['Curto e grosso', [['Respeite todo mundo', ''], ['Sem spam', ''], ['Sem conteúdo +18', ''], ['Golpe é ban', '']]],
];

const ordinal = (n) => `${n}º aviso`;

/** "1º aviso → 2º aviso → 3º aviso: silêncio de 1 h → 5º aviso: expulsão → ban", com os limites da Moderação (0 = nunca) */
export function escadaDePunicoes({ silenciar, expulsar }) {
  if (!silenciar && !expulsar) return 'aviso → silêncio → expulsão → ban';
  const silencia = silenciar > 0 && (!expulsar || silenciar < expulsar);
  const primeira = silencia ? silenciar : expulsar;
  const passos = [];
  const soAviso = primeira - 1;
  if (soAviso > 3) passos.push(`1º ao ${ordinal(soAviso)}`);
  else for (let n = 1; n <= soAviso; n++) passos.push(ordinal(n));
  if (silencia) passos.push(`${ordinal(silenciar)}: silêncio de 1 h`);
  passos.push(expulsar ? `${ordinal(expulsar)}: expulsão` : 'expulsão');
  passos.push('ban');
  return passos.join(' → ');
}

/** Corpo da mensagem: introdução, regras com título (numeradas) e a escada */
export function textoDasRegras(r, moderacao) {
  const regras = r.regras.filter((x) => x.t.trim()).map((x, i) => [`**${i + 1}. ${x.t.trim()}**`, x.d.trim()].filter(Boolean).join('\n'));
  return [r.intro.trim(), regras.join('\n\n'), r.escada && `**Escada de punições**\n${escadaDePunicoes(moderacao)}`].filter(Boolean).join('\n\n');
}

/** Qual modelo as regras são hoje (índice), ou -1 se foram mexidas */
export function modeloDasRegras(regras) {
  return MODELOS_REGRAS.findIndex(([, lista]) => lista.length === regras.length && lista.every(([t, d], i) => regras[i].t === t && regras[i].d === d));
}
