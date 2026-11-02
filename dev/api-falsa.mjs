// API falsa pra mexer no painel sem o bot: serve o site e responde a API com dados de exemplo.
// Rodar na pasta da interface:  node dev/api-falsa.mjs   e abrir http://localhost:3000
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };
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
const NOTICIAS = [
  { versao: '3.1.0', data: '02/11/2026', tag: 'NOVIDADE', titulo: 'Extra! O bot agora tem jornal', texto: 'Toda vez que o Manda Chuva ganhar novidade, ele posta a notícia num canal do servidor.', grande: true, adesivo: 'extra! extra!' },
  { versao: '3.0.1', data: '02/11/2026', tag: 'CORREÇÃO', titulo: 'Botão de tirar cor não some mais', texto: 'Tinha painel que perdia o botão depois de salvar. Achamos o culpado e ele já foi pra diretoria.', grande: false, adesivo: 'ai que burro, dá zero pra ele' },
  { versao: '3.0.0', data: '02/11/2026', tag: 'NOVIDADE', titulo: 'Visual novo: o painel virou campus', texto: 'Cada cor virou um cartão de matrícula.', grande: true, adesivo: 'stonks' },
  { versao: '2.1.0', data: '28/10/2026', tag: 'MELHORIA', titulo: 'Prévia mais parecida com o Discord', texto: 'Menções coloridas e emojis do servidor aparecem do jeitinho que vão ficar.', grande: false, adesivo: 'this is fine' },
  { versao: '2.0.0', data: '01/10/2026', tag: 'NOVIDADE', titulo: 'Painel na web', texto: 'Cores, textos, botões e respostas pelo navegador.', grande: true, adesivo: 'confia' },
];
let paineis = [{ servidorId: id(1), canalId: id(11), mensagemId: id(900), v2: true }];
const anexos = new Map();

const canais = [['escolha-sua-cor', 'CAMPUS'], ['geral', 'CAMPUS'], ['cantina', 'CAMPUS'], ['portaria', 'ENTRADA'], ['registros-mod', 'STAFF']].map(([nome, categoria], i) => ({ id: id(11 + i), nome, categoria, podeEnviar: i !== 4 }));
const cargos = () => [
  { id: id(50), nome: 'Dono', cor: '#F1C40F', cor2: '', perigoso: true, acima: true, membros: 1 },
  { id: id(51), nome: 'Moderação', cor: '#E91E63', cor2: '', perigoso: true, acima: true, membros: 4 },
  { id: id(52), nome: 'VIP', cor: '#F39C12', cor2: '', perigoso: false, acima: false, membros: 8 },
  ...CORES.slice(0, 10).map(([nome, , hex, membros], i) => ({ id: id(100 + i), nome, cor: hex, cor2: '', perigoso: false, acima: false, membros })),
  { id: id(60), nome: 'Calouro', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 34 },
  { id: id(61), nome: 'Notícias do bot', cor: '#000000', cor2: '', perigoso: false, acima: false, membros: 40 },
];

function estado() {
  return {
    config,
    bot: { online: true, soPainel: false, versao: '3.0.0', recursos: { membros: true }, nome: 'Manda Chuva', avatar: null, convite: 'https://discord.com/oauth2/authorize?client_id=1' },
    servidores: [{ id: id(1), nome: 'Servidor de Teste' }],
    servidor: {
      id: id(1), nome: 'Servidor de Teste', canais, cargos: cargos(), emojis: [],
      recursos: { degrade: false }, permissoesFaltando: ['Ver o registro de auditoria'], podeMencionarTodos: false, membros: 128,
      hierarquia: { cargoDoBot: 'Manda Chuva', temPermissao: true, acimaDoBot: [], coloridosAcima: ['VIP'], semCargo: config.cores.filter((c) => !c.cargoId).length },
    },
    noticias: NOTICIAS,
    paineis: paineis.map((p) => ({ ...p, canalNome: canais.find((c) => c.id === p.canalId)?.nome ?? 'canal apagado', link: 'https://discord.com/channels/1/2/3' })),
  };
}

const ler = (req) => new Promise((ok) => { const p = []; req.on('data', (d) => p.push(d)).on('end', () => ok(p.length ? JSON.parse(Buffer.concat(p).toString('utf8')) : {})); });
const json = (res, status, dados) => (res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' }), res.end(JSON.stringify(dados)));

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') return res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }).end();
  const rota = `${req.method} ${url.pathname}`;
  if (rota === 'GET /api/estado') return json(res, 200, estado());
  if (rota === 'POST /api/salvar') {
    config = await ler(req);
    config.cores.forEach((c, i) => (c.cargoId ??= id(200 + i)));
    return json(res, 200, { config, relatorio: ['(API falsa) nada foi pro Discord.'] });
  }
  if (rota === 'POST /api/enviar') {
    const { canalId } = await ler(req);
    paineis.push({ servidorId: id(1), canalId, mensagemId: id(901 + paineis.length), v2: true });
    return json(res, 200, { link: 'https://discord.com/channels/1/2/3', relatorio: [] });
  }
  if (rota === 'POST /api/apagar') {
    const { mensagemId } = await ler(req);
    paineis = paineis.filter((p) => p.mensagemId !== mensagemId);
    return json(res, 200, { ok: true });
  }
  if (rota === 'POST /api/portaria/testar') return json(res, 200, { ok: true, para: 'você' });
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
