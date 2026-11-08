// API falsa pra mexer no painel sem o bot: serve o site e responde a API com dados de exemplo.
// Rodar na pasta da interface:  node dev/api-falsa.mjs   e abrir http://localhost:3000
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { MODELOS_REGRAS } from '../js/regras.js';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.json': 'application/json' };
const id = (n) => `1${String(n).padStart(17, '0')}`; // ids do Discord não cabem num Number
const CORES = [['Vermelho', '🔴', '#E74C3C', 31], ['Laranja', '🟠', '#E67E22', 12], ['Amarelo', '🟡', '#F1C40F', 6], ['Verde', '🟢', '#2ECC71', 18], ['Azul', '🔵', '#3498DB', 42], ['Roxo', '🟣', '#9B59B6', 27], ['Rosa', '🌸', '#FF6EC7', 23], ['Preto', '⚫', '#111111', 15], ['Branco', '⚪', '#FFFFFF', 11], ['Cinza', '🩶', '#95A5A6', 7], ['Marrom', '🟤', '#8B5A2B', 0]];

let config = {
  servidorId: id(1),
  cores: CORES.map(([nome, emoji, hex], i) => ({ nome, emoji, hex, tipo: i === 6 ? 'degrade' : 'solida', hex2: i === 6 ? '#FFD36E' : '', estilo: 'Secondary', botaoModo: i === 5 || i === 6 ? 'cargo' : 'discord', botaoHex: '', cargoId: i < 10 ? id(100 + i) : null })),
  painel: { titulo: '🎨 Escolha sua cor', descricao: 'Clique num botão pra pintar seu nome. Clicar de novo na mesma cor tira ela.', listarCores: true, campos: [{ nome: 'Como funciona', valor: 'Clicou, pintou. Clicou de novo, tirou.' }], rodape: 'Manda Chuva', corDoEmbed: '#5865F2', imgs: { topo: '', mini: '', imagem: '', finais: [] } },
  botoes: { porLinha: 4, remover: { ativo: true, texto: 'Tirar cor', emoji: '❌', estilo: 'Danger' } },
  mensagens: { ganhou: 'Pronto! Agora você é {cor}.', removeu: 'Tirei {cor} de você.' },
  noticias: { on: true, canalId: id(13), mencao: id(61), quais: 'todas', imgs: { topo: '', mini: '', imagem: '', finais: [] } },
  portaria: (() => {
    const imgs = () => ({ topo: '', mini: '', imagem: '', finais: [] });
    return {
      entrada: { on: true, canalId: id(14), titulo: 'Bem-vindo(a) ao campus!', textoPos: 'fora', cor: '#F2C14E', dm: false, imgs: imgs(),
        msg: 'Para nossa alegria, {usuario} acabou de chegar no **{servidor}**! 🎉\nPega sua cor em #escolha-sua-cor e se apresenta.',
        cargoAuto: { on: true, cargoId: id(60) },
        card: { on: true, bg: '', cima: 'BEM-VINDO(A) AO CAMPUS', baixo: 'Membro nº {numero}', layout: 'centro', forma: 'circulo', texto: '#FFFFFF', borda: '#F2C14E' } },
      saida: { on: true, canalId: id(14), titulo: 'Matrícula trancada', textoPos: 'fora', cor: '#95A5A6', dm: false, imgs: imgs(), msg: '{usuario} trancou a matrícula. A turma agora tem {numero} alunos.' },
      expulsao: { on: false, canalId: null, titulo: 'Expulsão', textoPos: 'fora', cor: '#E67E22', dm: true, mod: true, motivo: true, imgs: imgs(), msg: '{usuario} foi pra diretoria e não volta hoje.' },
      ban: { on: false, canalId: null, titulo: 'Banimento', textoPos: 'fora', cor: '#C4363C', dm: true, mod: true, motivo: true, imgs: imgs(), msg: '{usuario} foi **JUBILADO(A)** do {servidor}. Não volta nem com recurso.' },
      silencio: { on: false, canalId: null, titulo: 'Silenciado', textoPos: 'dentro', cor: '#3498DB', dm: true, mod: true, motivo: true, duracao: '1h', imgs: imgs(), msg: 'Shhh, biblioteca! {usuario} ficou em silêncio por {tempo}.' },
    };
  })(),
};
config.temas = {
  auto: true,
  respeitar: true,
  lista: [
    ['carnaval', 'Carnaval', '', '', '#9B59B6', 'Bloco dos Memes na rua! Quarta-feira de cinzas a gente volta.', 'carnaval'],
    ['pascoa', 'Páscoa', '', '', '#2ECC71', 'Caça aos ovos no campus: quem achar primeiro fica com o chocolate.', 'pascoa'],
    ['namorados', 'Dia dos Namorados', '12/06', '12/06', '#FF6EC7', 'Feliz dia pra quem tem mozão. E pra quem tem só o Wi-Fi da faculdade.'],
    ['junina', 'Festa Junina', '01/06', '30/06', '#E67E22', 'Olha a cobra! É mentira. Arraiá do campus liberado.'],
    ['estudante', 'Dia do Estudante', '11/08', '11/08', '#F2C14E', 'Feliz Dia do Estudante! Hoje o café da cantina é por nossa conta (não é).'],
    ['criancas', 'Dia das Crianças', '12/10', '12/10', '#3498DB', 'Feliz dia pra criança interior que ainda pede pra mãe marcar consulta.'],
    ['halloween', 'Halloween', '25/10', '31/10', '#E67E22', 'Semana do terror no campus. Cuidado com o DCE assombrado.'],
    ['natal', 'Natal', '01/12', '26/12', '#C4363C', 'Ho ho ho! O recesso tá chegando.'],
    ['ano', 'Ano Novo', '27/12', '02/01', '#F2C14E', 'Ano novo, semestre novo, memes novos.'],
    ['niver', 'Aniversário do servidor', '15/03', '15/03', '#9B59B6', 'Hoje o servidor faz aniversário! Parabéns pra nós.'],
  ].map(([id, nome, ini, fim, cor, frase, movel]) => ({ id, nome, ini, fim, ...(movel && { movel }), on: true, cor, frase, onde: { painel: true, portaria: true, news: true }, msgs: {} })),
};
config.niver = { on: true, canalId: id(12), hora: '09:00', msg: 'Hoje é aniversário de {usuario}! {idade} anos e ainda não trancou o curso. Parabéns!', topo: 'PARABÉNS!', baixo: '{idade} ANOS DE PURA RESENHA', fundo: '', idade: true, cargo: true, dm: false, botao: true };
let aniversarios = ['rafa_cringe:14/11:2004', 'marina.exe:03/12:2002', 'joao_sem_braço:22/01:', 'bia.ppt:08/03:2005', 'tio_do_ru:30/06:1998', 'lu.miojo:02/11:2003', 'dudu.zip:10/01:1999', 'carol_rascunho:17/06:2001', 'th3o:24/11:', 'nanda.pdf:05/05:2000']
  // Os dois primeiros têm foto (no bot de verdade vem do Discord); o resto fica com a inicial
  .map((x, i) => { const [nome, d, ano] = x.split(':'); return { userId: id(500 + i), nome, d, ano: ano ? +ano : null, avatar: i < 2 ? `/banners/card-${i ? 'confete' : 'campus'}.gif` : null }; });
config.moderacao = { silenciar: 3, expulsar: 5, canalId: id(15), automod: { palavrao: { on: true, acao: 'apagar' }, spam: { on: true, acao: 'silenciar' }, convites: { on: true, acao: 'avisar' }, mencoes: { on: false, acao: 'silenciar' }, links: { on: false, acao: 'apagar' } }, palavras: ['porra', 'caralho', 'merda', 'fdp', 'vsf', 'pqp'] };
config.tickets = {
  on: true, categoriaId: id(90), canalId: id(16), staffId: id(51), logsId: id(17), limite: 1, parado: '24h', apagar: '10s', transLog: true, transDm: true, avaliacao: true, mencionar: true,
  titulo: '🎫 Precisa de ajuda?', desc: 'Abre um ticket aqui embaixo e a staff te chama num canal privado.\nNada de treta no #geral, combinado?', imagem: '',
  motivos: [['❓', 'Dúvida', 'Pergunta sobre o servidor ou o bot'], ['🚨', 'Denúncia', 'Alguém passou dos limites'], ['🤝', 'Parceria', 'Divulgação, eventos, collab'], ['🐛', 'Bug do bot', 'O Manda Chuva fez besteira'], ['🎨', 'Cargo', 'Pedir ou trocar um cargo']].map(([emoji, nome, desc]) => ({ emoji, nome, desc, on: true })),
};
const MIN = 60_000;
let tickets = [['0042', '🚨', 'pedrinho', 'Denúncia', 4, null], ['0041', '🎨', 'bia.ppt', 'Cargo', 25, 'marina.exe'], ['0040', '🐛', 'th3o', 'Bug do bot', 60, null], ['0039', '🤝', 'gui_monitor', 'Parceria', 1500, 'gabs']]
  .map(([num, emoji, quem, motivo, min, resp], i) => ({ num, emoji, quem, userId: id(700 + i), motivo, aberto: Date.now() - min * MIN, quando: min < 60 ? `há ${min} min` : min < 1440 ? `há ${Math.floor(min / 60)} h` : 'ontem', resp, canalId: id(800 + i), link: 'https://discord.com/channels/1/2' }));
// Membros do protótipo (cargos pelos ids da lista de cargos daqui de baixo)
const NOMES_CARGO = { Dono: 50, Moderação: 51, VIP: 52, Calouro: 60, 'Notícias do bot': 61, Veterano: 62, Gamers: 63, Vermelho: 100, Laranja: 101, Amarelo: 102, Verde: 103, Azul: 104, Roxo: 105, Rosa: 106 };
const CORES_CARGO = { 50: '#F1C40F', 51: '#E91E63', 52: '#F39C12', 100: '#E74C3C', 101: '#E67E22', 102: '#F1C40F', 103: '#2ECC71', 104: '#3498DB', 105: '#9B59B6', 106: '#FF6EC7' };
const DIA = 864e5;
let membros = [
  ['marina.exe', 700, ['Moderação', 'Roxo', 'Veterano'], 0], ['pedrinho', 3, ['Azul', 'Calouro'], 0], ['bia_memes', 240, ['VIP', 'Rosa', 'Veterano'], 0],
  ['joaozin', 365, ['Vermelho', 'Gamers'], 1], ['caio.dev', 150, ['Verde', 'Notícias do bot'], 0], ['rafa_cringe', 7, ['Calouro'], 2],
  ['tetê', 120, ['Laranja', 'VIP'], 0], ['luana', 14, ['Amarelo', 'Calouro'], 0], ['gabs', 400, ['Azul', 'Gamers', 'Veterano'], 0], ['kiko', 1, ['Calouro'], 0],
  ['dudu.zip', 60, ['Roxo'], 0], ['nanda.pdf', 30, ['Verde', 'Veterano'], 0], ['th3o', 90, ['Rosa', 'Gamers'], 0], ['lu.miojo', 20, ['Amarelo', 'Calouro'], 0],
].map(([nome, dias, cargos, avisos], i) => {
  const ids = cargos.map((c) => id(NOMES_CARGO[c]));
  const topo = cargos.map((c) => CORES_CARGO[NOMES_CARGO[c]]).find(Boolean);
  return { id: id(500 + i), nome, usuario: nome.replace(/[^a-z0-9._]/gi, ''), avatar: i % 3 === 0 ? `/banners/card-${['campus', 'confete', 'campus'][i % 3]}.gif` : null, entrou: Date.now() - dias * DIA, cargos: ids, cor: topo ?? null, avisos, silenciadoAte: null, bot: false, podeSilenciar: i !== 0, podeExpulsar: i !== 0 };
});
let ocorrencias = [
  { id: 'o1', tipo: 'AUTO-MOD', userId: id(505), nome: 'rafa_cringe', oque: 'mandou 6 mensagens em 3s e levou aviso', por: 'anti-spam', quando: Date.now() - 2 * 36e5, desfazer: 'aviso:x', desfeito: false },
  { id: 'o2', tipo: 'SILÊNCIO', userId: id(509), nome: 'kiko', oque: 'foi silenciado por 10 minutos', por: 'por marina.exe', quando: Date.now() - DIA - 36e5, desfazer: 'silencio', desfeito: false },
  { id: 'o3', tipo: 'AVISO', userId: id(503), nome: 'joaozin', oque: 'levou aviso por convite de outro servidor', por: 'auto-mod', quando: Date.now() - 3 * DIA, desfazer: 'aviso:y', desfeito: false },
  { id: 'o4', tipo: 'BAN', userId: id(599), nome: 'vendedor_de_nitro', oque: 'foi banido', por: 'por marina.exe', quando: Date.now() - 7 * DIA, desfazer: 'ban', desfeito: false },
  ...['luana', 'gabs', 'th3o'].map((nome, i) => ({ id: `o${5 + i}`, tipo: 'AVISO', userId: id(510 + i), nome, oque: 'levou um aviso: flood no #geral (1/5)', por: 'pelo painel', quando: Date.now() - (9 + i) * DIA, desfazer: `aviso:z${i}`, desfeito: false })),
];
const anotar = (o) => ocorrencias.unshift({ id: `o${Date.now()}`, quando: Date.now(), desfeito: false, ...o });
const NOTICIAS = [
  { versao: '3.1.0', data: '02/11/2026', tag: 'NOVIDADE', titulo: 'Extra! O bot agora tem jornal', texto: 'Toda vez que o Manda Chuva ganhar novidade, ele posta a notícia num canal do servidor.', grande: true, adesivo: 'extra! extra!' },
  { versao: '3.0.1', data: '02/11/2026', tag: 'CORREÇÃO', titulo: 'Botão de tirar cor não some mais', texto: 'Tinha painel que perdia o botão depois de salvar. Achamos o culpado e ele já foi pra diretoria.', grande: false, adesivo: 'ai que burro, dá zero pra ele' },
  { versao: '3.0.0', data: '02/11/2026', tag: 'NOVIDADE', titulo: 'Visual novo: o painel virou campus', texto: 'Cada cor virou um cartão de matrícula.', grande: true, adesivo: 'stonks' },
  { versao: '2.1.0', data: '28/10/2026', tag: 'MELHORIA', titulo: 'Prévia mais parecida com o Discord', texto: 'Menções coloridas e emojis do servidor aparecem do jeitinho que vão ficar.', grande: false, adesivo: 'this is fine' },
  { versao: '2.0.0', data: '01/10/2026', tag: 'NOVIDADE', titulo: 'Painel na web', texto: 'Cores, textos, botões e respostas pelo navegador.', grande: true, adesivo: 'confia' },
];
let paineis = [{ servidorId: id(1), canalId: id(11), mensagemId: id(900), v2: true }];
// Regras: config padrão do bot e onde a mensagem ficou (null = nunca enviada)
config.regras = {
  canalId: null, cor: '#C4363C', titulo: 'REGIMENTO INTERNO DO CAMPUS', intro: 'Leia antes de cair na resenha. Quebrou regra, a staff sobe a escada de punições.', banner: '',
  regras: MODELOS_REGRAS[0][1].map(([t, d]) => ({ t, d })), escada: true, botao: true, botaoTxt: 'Li e aceito', cargoId: null, fixar: true, cmd: true,
};
let regrasMsg = null;
const anexos = new Map();

const canais = [['escolha-sua-cor', 'CAMPUS'], ['geral', 'CAMPUS'], ['cantina', 'CAMPUS'], ['portaria', 'ENTRADA'], ['registros-mod', 'STAFF'], ['abrir-ticket', 'SUPORTE'], ['registros-tickets', 'STAFF']].map(([nome, categoria], i) => ({ id: id(11 + i), nome, categoria, podeEnviar: i !== 4 }));
const cargos = () => [
  { id: id(50), nome: 'Dono', cor: '#F1C40F', cor2: '', perigoso: true, acima: true, membros: 1 },
  { id: id(51), nome: 'Moderação', cor: '#E91E63', cor2: '', perigoso: true, acima: true, membros: 4 },
  { id: id(52), nome: 'VIP', cor: '#F39C12', cor2: '', perigoso: false, acima: false, membros: 8 },
  ...CORES.slice(0, 10).map(([nome, , hex, membros], i) => ({ id: id(100 + i), nome, cor: hex, cor2: '', perigoso: false, acima: false, membros })),
  { id: id(60), nome: 'Calouro', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 34 },
  { id: id(61), nome: 'Notícias do bot', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 40 },
  { id: id(62), nome: 'Veterano', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 51 },
  { id: id(63), nome: 'Gamers', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 22 },
];

// Hierarquia do protótipo (de cima pra baixo); o Salvar aplica o rascunho aqui mesmo
let hierarquia = [
  { k: 'sep', id: id(70), nome: 'STAFF', travado: true },
  { k: 'role', id: id(50), nome: 'Dono', hex: '#F1C40F', perms: ['admin'], hoist: true, mencionavel: false, membros: 1, travado: true },
  { k: 'role', id: id(51), nome: 'Moderação', hex: '#E91E63', perms: ['cargos', 'mensagens', 'silenciar', 'expulsar', 'banir'], hoist: true, mencionavel: true, membros: 4, travado: true },
  { k: 'role', id: id(53), nome: 'Manda Chuva', hex: '#5865F2', perms: ['cargos'], hoist: false, mencionavel: false, membros: 1, travado: true, gerenciado: 'bot', bot: true },
  { k: 'sep', id: id(71), nome: 'VIP' },
  { k: 'role', id: id(52), nome: 'VIP', hex: '#F39C12', perms: [], hoist: true, mencionavel: false, membros: 8 },
  { k: 'sep', id: id(72), nome: 'CORES' },
  { k: 'cores' },
  { k: 'sep', id: id(73), nome: 'INTERESSES' },
  { k: 'role', id: id(60), nome: 'Calouro', hex: '', perms: [], hoist: false, mencionavel: false, membros: 34 },
  { k: 'role', id: id(62), nome: 'Veterano', hex: '', perms: [], hoist: false, mencionavel: false, membros: 51 },
  { k: 'role', id: id(63), nome: 'Gamers', hex: '', perms: [], hoist: false, mencionavel: false, membros: 22 },
  { k: 'role', id: id(61), nome: 'Notícias do bot', hex: '', perms: [], hoist: false, mencionavel: true, membros: 40 },
  { k: 'role', id: id(64), nome: 'Server Booster', hex: '#FF73FA', perms: [], hoist: false, mencionavel: false, membros: 2, gerenciado: 'impulso' },
];

function estado() {
  return {
    config,
    bot: { online: true, soPainel: false, versao: '3.0.0', recursos: { membros: true, conteudo: !!process.env.DEMO }, nome: 'Manda Chuva', avatar: null, convite: 'https://discord.com/oauth2/authorize?client_id=1' },
    servidores: [{ id: id(1), nome: 'Servidor de Teste', icone: '/banners/bot/mascote-64.png', sigla: 'SdT' }, { id: id(2), nome: 'Toca do Creeper', icone: null, sigla: 'TdC' }],
    servidor: {
      id: id(1), nome: 'Servidor de Teste', canais, cargos: cargos(), emojis: [],
      recursos: { degrade: false }, permissoesFaltando: ['Ver o registro de auditoria'], podeMencionarTodos: false, membros: 128, moderacaoFaltando: [], ticketsFaltando: process.env.DEMO ? [] : ['Gerenciar canais (tickets)'], regrasFaltando: process.env.DEMO ? [] : ['Fixar mensagens (regras)'],
      categorias: [{ id: id(90), nome: '🎫 Tickets' }, { id: id(91), nome: 'Geral' }, { id: id(92), nome: 'Staff' }],
      hierarquia: { cargoDoBot: 'Manda Chuva', temPermissao: true, acimaDoBot: [], coloridosAcima: ['VIP'], semCargo: config.cores.filter((c) => !c.cargoId).length, lista: hierarquia, permsDoBot: ['cargos', 'mensagens'] },
    },
    noticias: NOTICIAS,
    aniversarios,
    ocorrencias,
    tickets,
    regrasMsg,
    paineis: paineis.map((p) => ({ ...p, canalNome: canais.find((c) => c.id === p.canalId)?.nome ?? 'canal apagado', link: 'https://discord.com/channels/1/2/3' })),
  };
}

const ler = (req) => new Promise((ok) => { const p = []; req.on('data', (d) => p.push(d)).on('end', () => ok(p.length ? JSON.parse(Buffer.concat(p).toString('utf8')) : {})); });
const json = (res, status, dados) => (res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }), res.end(JSON.stringify(dados)));

// ---------- Login e perfil ----------
const MEDALHAS = [['calouro', 'Calouro', 'Entrou no servidor.', 'COMUM', 1, 1, ''], ['veterano', 'Veterano', '6 meses de casa.', 'RARA', 3, 6, 'meses'], ['lenda', 'Lenda do Campus', '2 anos de casa sem trancar.', 'LENDÁRIA', 3, 24, 'meses'], ['tagarela', 'Tagarela', 'Mandou 1.000 mensagens na resenha.', 'COMUM', 1000, 1000, ''], ['rei-resenha', 'Rei da Resenha', 'Top 1 de mensagens de um mês.', 'ÉPICA', 0, 1, ''], ['rato-call', 'Rato de Call', '50 horas em call de voz.', 'RARA', 32, 50, 'h'], ['construtor', 'Mestre dos Blocos', 'Foi em 10 noites de Minecraft do servidor.', 'RARA', 10, 10, '', 'evento'], ['detetive', 'Detetive Espacial', 'Achou o impostor 5 vezes nas noites de Among.', 'RARA', 3, 5, '', 'evento'], ['mira-ouro', 'Mira de Ouro', 'Ganhou um campeonato de CS ou Valorant do servidor.', 'ÉPICA', 0, 1, '', 'evento'], ['sobrevivente', 'Último de Pé', 'Venceu uma partida no evento de Free Fire.', 'RARA', 1, 1, '', 'evento'], ['foliao', 'Folião', 'Participou de 3 festas do servidor.', 'COMUM', 2, 3, '', 'evento'], ['aniversario', 'Parabéns!', 'Cadastrou o aniversário com /aniversario.', 'COMUM', 1, 1, ''], ['moderador', 'Guardião', 'Faz parte da staff.', 'ÉPICA', 1, 1, ''], ['coruja', 'Coruja da Madrugada', 'Mandou mensagem entre 3h e 5h da manhã.', 'SECRETA', 1, 1, ''], ['capivara', 'Capivara Zen', 'Ficou 6 horas seguidas numa call, de boa.', 'SECRETA', 0, 1, ''], ['pintor', 'Pintor de Nomes', 'Trocou de cor 10 vezes no painel.', 'COMUM', 7, 10, '']]
  .map(([id, nome, desc, rar, v, max, un, origem = 'auto']) => ({ id, nome, desc, rar, v, max, un, origem, ganha: v >= max }));
let meuPerfil = {
  bOrig: 'galeria', banner: 'banners/perfil/jogos-1.jpg', bLink: '', bLinkGif: false, bAnexo: '', bArqNome: '',
  aOrig: 'discord', aLink: '', aLinkGif: false, aAnexo: '', aArqNome: '',
  bio: 'Main suporte no Valorant, construtor no Minecraft e o primeiro a chegar na call. Calouro, mas já sei onde fica o RU.', fixadas: ['calouro', 'sobrevivente'],
  ap: { fundo: '#FFFCF4', nome: '', nomeTipo: 'solida', grad: 0, fonte: 'Graduate', destaque: '#C4363C' }, niverVis: 'data',
};
// Aparência de exemplo dos colegas na lista da turma (o bot manda a de cada um)
const APS = [
  { fundo: '#1F2A5C', nome: '', nomeTipo: 'degrade', grad: 1, fonte: 'Pacifico', destaque: '#F2C14E' },
  { fundo: '#F5C6D6', nome: '#C4363C', nomeTipo: 'solida', grad: 0, fonte: 'Caveat', destaque: '#C4363C' },
  { fundo: '#FFFCF4', nome: '', nomeTipo: 'solida', grad: 0, fonte: 'Graduate', destaque: '#C4363C' },
  { fundo: '#C8E6C0', nome: '#1B1F33', nomeTipo: 'solida', grad: 0, fonte: 'Press Start 2P', destaque: '#2F8F5B' },
];
const CATS = ['jogos', 'musica', 'diversos', 'animais', 'desenhos', 'codigo'];
/** O que o site mostra do perfil. Aqui o Discord não tem banner nem foto: entra a cor de destaque e a inicial. */
function visual(p = meuPerfil) {
  const ver = (k) => ({ link: p[`${k}Link`], anexo: p[`${k}Anexo`], discord: null, galeria: p.banner })[p[`${k}Orig`]];
  const banner = ver('b'), avatar = ver('a');
  const gif = [banner, avatar].some((x) => /\.gif/i.test(x ?? '') || anexos.get(String(x).slice(6))?.tipo === 'image/gif');
  return { banner, cor: banner ? null : '#7a4fd0', avatar, gif };
}
function quem(req) {
  const t = /^Sessao (.+)$/.exec(req.headers.authorization ?? '')?.[1];
  return t === 'membro' || t === 'staff' ? t : t ? null : 'admin';
}
function eu(papel) {
  if (papel === 'admin') return { papel, papelTxt: 'Senha do painel', usuario: null };
  return {
    papel, papelTxt: papel === 'staff' ? 'Staff · Moderação' : 'Membro',
    usuario: { id: id(501), nome: 'pedrinho', usuario: 'pedrinho', avatar: null, entrou: Date.now() - 3 * DIA, cargos: [...(papel === 'staff' ? [{ nome: 'Moderação', cor: '#E91E63' }] : []), { nome: 'Azul', cor: '#3498DB' }, { nome: 'Calouro', cor: '#99AAB5' }] },
    perfil: meuPerfil, visual: visual(), niver: { d: '14/05', ano: 2004 }, medalhas: MEDALHAS.map((m) => (m.id === 'moderador' ? { ...m, v: papel === 'staff' ? 1 : 0, ganha: papel === 'staff' } : m)),
    stats: { mensagens: 1284, horas: 32, medalhas: MEDALHAS.filter((m) => m.ganha).length },
  };
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }).end();
  const rota = `${req.method} ${url.pathname}`;
  if (rota === 'GET /saude') return json(res, 200, { ok: true, bot: 'online', versao: '3.11.0', login: true });
  if (rota === 'GET /auth/entrar') return res.writeHead(302, { Location: `${url.searchParams.get('volta')}#sessao=${process.env.PAPEL || 'staff'}` }).end();
  if (url.pathname.startsWith('/api/')) {
    const papel = quem(req);
    if (!papel) return json(res, 401, { erro: 'Sua sessão acabou. Entre com o Discord de novo.' });
    if (rota === 'GET /api/eu') return json(res, 200, eu(papel));
    if (rota === 'GET /api/publico') return json(res, 200, { bot: { online: true, nome: 'Manda Chuva', avatar: null, versao: '3.11.0' }, servidor: { id: id(1), nome: 'Servidor de Teste', membros: 128 }, noticias: NOTICIAS });
    if (rota === 'POST /api/eu/perfil') {
      const c = await ler(req);
      if (c.fixadas?.some((x) => !MEDALHAS.find((m) => m.id === x)?.ganha)) return json(res, 400, { erro: 'Só dá pra fixar medalha que você já ganhou.' });
      if (/quebrado/.test(c.bLink ?? c.aLink ?? '')) return json(res, 400, { erro: 'Não consegui abrir essa imagem. Confere se é o link direto de um PNG, JPG, GIF ou WEBP de até 8 MB.' });
      meuPerfil = { ...meuPerfil, ...c };
      return json(res, 200, { ok: true, perfil: meuPerfil, visual: visual() });
    }
    if (rota === 'POST /api/eu/anexo') {
      const { base64, tipo, nome, alvo } = await ler(req);
      const buf = Buffer.from(base64, 'base64');
      const a = createHash('sha256').update(buf).digest('hex').slice(0, 16);
      anexos.set(a, { buf, tipo });
      const k = alvo === 'foto' ? 'a' : 'b';
      meuPerfil = { ...meuPerfil, [`${k}Orig`]: 'anexo', [`${k}Anexo`]: `anexo:${a}`, [`${k}ArqNome`]: nome };
      return json(res, 200, { ok: true, perfil: meuPerfil, visual: visual() });
    }
    if (rota === 'GET /api/turma') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const lista = membros.filter((m) => !q || m.nome.toLowerCase().includes(q));
      const por = 9, pg = Math.max(1, Math.min(Math.ceil(lista.length / por) || 1, Number(url.searchParams.get('pagina')) || 1));
      const ids = MEDALHAS.map((m) => m.id);
      const itens = lista.slice((pg - 1) * por, pg * por).map((m, i) => ({ id: m.id, nome: m.nome, usuario: m.usuario, avatar: m.avatar, entrou: m.entrou, banner: `banners/perfil/${CATS[(i + m.nome.length) % 6]}-${(i % 8) + 1}.jpg`, bio: '', medalhas: ids.slice(i % 5, (i % 5) + 1 + (m.nome.length % 3)), ap: APS[i % APS.length], niver: ['14/05 · 22 anos', '03/12', null][i % 3], cargos: m.cargos.slice(0, 3).map((c) => ({ nome: Object.keys(NOMES_CARGO).find((k) => id(NOMES_CARGO[k]) === c) ?? 'Cargo', cor: CORES_CARGO[Number(c.slice(-3))] ?? '#99AAB5' })) }));
      return json(res, 200, { itens, pagina: pg, paginas: Math.ceil(lista.length / por) || 1, total: lista.length, completa: true });
    }
    if (papel === 'membro') return json(res, 403, { erro: 'Essa parte é só pra staff.' });
  }
  if (rota === 'GET /api/estado') return json(res, 200, estado());
  if (rota === 'POST /api/salvar') {
    const corpo = await ler(req);
    const rel = ['(API falsa) nada foi pro Discord.'];
    if (corpo.hierarquia) {
      let n = 0;
      hierarquia = corpo.hierarquia.lista.map((x) => (x.k === 'cores' || /^\d{17,20}$/.test(x.id) ? x : { ...x, id: id(300 + n++), membros: 0 }));
      rel.push(`Hierarquia: ${n} criado(s), ${corpo.hierarquia.apagar.length} apagado(s).`);
    }
    delete corpo.hierarquia;
    config = corpo;
    config.cores.forEach((c, i) => (c.cargoId ??= id(200 + i)));
    if (config.regras?.canalId === 'novo') (config.regras.canalId = id(13)), rel.push('(API falsa) "Criar #regras" virou #cantina.');
    if (config.regras?.cargoId === 'novo') (config.regras.cargoId = id(60)), rel.push('(API falsa) "Criar @Verificado" virou @Calouro.');
    return json(res, 200, { config, relatorio: rel });
  }
  if (rota === 'POST /api/enviar') {
    const { canalId } = await ler(req);
    paineis.push({ servidorId: id(1), canalId, mensagemId: id(901 + paineis.length), v2: true });
    return json(res, 200, { link: 'https://discord.com/channels/1/2/3', relatorio: [] });
  }
  if (rota === 'POST /api/regras/enviar') {
    const r = config.regras;
    const nome = canais.find((c) => c.id === r.canalId)?.nome ?? 'canal';
    const nova = !regrasMsg;
    regrasMsg = { quando: Date.now(), fixada: r.fixar, canalNome: nome, link: 'https://discord.com/channels/1/2/3' };
    return json(res, 200, { link: regrasMsg.link, relatorio: [nova ? `Regras enviadas em #${nome}.` : `Mensagem das regras atualizada em #${nome}.`], regrasMsg });
  }
  if (rota === 'POST /api/apagar') {
    const { mensagemId } = await ler(req);
    paineis = paineis.filter((p) => p.mensagemId !== mensagemId);
    return json(res, 200, { ok: true });
  }
  if (rota === 'POST /api/portaria/testar') return json(res, 200, { ok: true, para: 'você' });
  if (rota === 'GET /api/membros') {
    const p = new URL(req.url, 'http://x').searchParams;
    const q = (p.get('q') ?? '').toLowerCase().replace(/^@/, ''), cargo = p.get('cargo') ?? '';
    const lista = membros.filter((m) => (!q || m.nome.toLowerCase().includes(q)) && (!cargo || m.cargos.includes(cargo))).sort((a, b) => a.nome.localeCompare(b.nome));
    const por = Math.min(100, Math.max(1, +p.get('por') || 6));
    const paginas = Math.max(1, Math.ceil(lista.length / por)), pg = Math.min(Math.max(1, +p.get('pagina') || 1), paginas);
    return json(res, 200, { itens: lista.slice((pg - 1) * por, pg * por), pagina: pg, paginas, total: lista.length });
  }
  if (rota === 'POST /api/membros/acao') {
    const c = await ler(req);
    const m = membros.find((x) => x.id === c.userId);
    if (!m) return json(res, 404, { erro: 'Essa pessoa não está mais no servidor.' });
    const motivo = c.motivo ? `: ${c.motivo}` : '';
    let mensagem;
    if (c.acao === 'dar') { m.cargos.push(c.cargoId); mensagem = `${m.nome} ganhou o cargo.`; }
    else if (c.acao === 'tirar') { m.cargos = m.cargos.filter((x) => x !== c.cargoId); mensagem = `Tirei o cargo de ${m.nome}.`; }
    else if (c.acao === 'avisar') { m.avisos++; anotar({ tipo: 'AVISO', userId: m.id, nome: m.nome, oque: `levou um aviso${motivo} (${m.avisos}/5)`, por: 'pelo painel', desfazer: 'aviso:n' }); mensagem = `${m.nome} levou um aviso (${m.avisos}/5).`; }
    else if (c.acao === 'silenciar') { m.semPrazo = c.duracao === 'sem'; m.silenciadoAte = Date.now() + (m.semPrazo ? 28 * DIA : 600_000); anotar({ tipo: 'SILÊNCIO', userId: m.id, nome: m.nome, oque: `foi silenciado por 10 minutos${motivo}`, por: 'pelo painel', desfazer: 'silencio' }); mensagem = `${m.nome} ficou em silêncio.`; }
    else if (c.acao === 'dessilenciar') { m.silenciadoAte = null; m.semPrazo = false; mensagem = `${m.nome} pode falar de novo.`; }
    else if (c.acao === 'expulsar') { membros = membros.filter((x) => x !== m); anotar({ tipo: 'EXPULSÃO', userId: m.id, nome: m.nome, oque: `foi expulso${motivo}`, por: 'pelo painel', desfazer: null }); return json(res, 200, { ok: true, mensagem: `${m.nome} foi expulso.`, membro: null }); }
    return json(res, 200, { ok: true, mensagem, membro: m });
  }
  if (rota === 'POST /api/tickets/acao') {
    const c = await ler(req);
    const t = tickets.find((x) => x.num === c.num);
    if (!t) return json(res, 404, { erro: 'Esse ticket já foi fechado.' });
    tickets = tickets.filter((x) => x !== t);
    return json(res, 200, { ok: true, mensagem: `Ticket #${t.num} fechado. O canal some em 10 segundos.` });
  }
  if (rota === 'POST /api/ocorrencias/desfazer') {
    const { id: oid } = await ler(req);
    const o = ocorrencias.find((x) => x.id === oid);
    if (!o?.desfazer) return json(res, 400, { erro: 'Essa não tem volta.' });
    o.desfeito = true;
    return json(res, 200, { ok: true, mensagem: `Desfeito: ${o.nome}.` });
  }
  if (rota === 'POST /api/aniversarios') {
    const c = await ler(req);
    if (c.acao === 'remover') { aniversarios = aniversarios.filter((p) => p.userId !== c.userId); return json(res, 200, { ok: true }); }
    const m = /^(\d{1,2})\/(\d{1,2})$/.exec(c.data ?? '');
    if (!m) return json(res, 400, { erro: 'Data no formato dia/mês, tipo 14/05.' });
    const d = `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}`;
    aniversarios.push({ userId: id(900 + aniversarios.length), nome: c.membro, d, ano: c.ano ? +c.ano : null });
    return json(res, 200, { ok: true, nome: c.membro, d });
  }
  if (rota === 'POST /api/anexo') {
    const { base64, tipo } = await ler(req);
    const buf = Buffer.from(base64, 'base64');
    const a = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    anexos.set(a, { buf, tipo });
    return json(res, 200, { id: a, ref: `anexo:${a}` });
  }
  // Placas dos banners de evento: aqui mostra o JPG original (o bot de verdade desenha com o nome do servidor)
  const placa = /^\/placas\/([a-z]+)\.jpg$/.exec(url.pathname);
  if (placa) url.pathname = `/banners/eventos/${placa[1]}.jpg`;
  const anexo = /^\/anexos\/([0-9a-f]{16})/.exec(url.pathname);
  if (anexo && anexos.has(anexo[1])) return res.writeHead(200, { 'Content-Type': anexos.get(anexo[1]).tipo }).end(anexos.get(anexo[1]).buf);
  // Arquivos do site
  const caminho = normalize(join(RAIZ, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
  if (!caminho.startsWith(normalize(RAIZ))) return json(res, 403, {});
  try {
    const dados = await readFile(caminho);
    res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] ?? 'application/octet-stream' }).end(dados);
  } catch {
    json(res, 404, { erro: 'Não encontrado.' });
  }
}).listen(Number(process.env.PORTA) || 3000, () => console.log(`API falsa + site em http://localhost:${Number(process.env.PORTA) || 3000}`));
