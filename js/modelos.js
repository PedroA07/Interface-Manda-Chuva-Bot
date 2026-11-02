// Textos prontos do design (protótipo): modelos de mensagem e textos de cada evento da portaria

export const MODELOS_ENTRADA = [
  ['Para nossa alegria', 'Para nossa alegria, {usuario} acabou de chegar no **{servidor}**! 🎉\nPega sua cor em #escolha-sua-cor e se apresenta.'],
  ['Trote do calouro', 'Calouro na área! {usuario}, bem-vindo(a) ao **{servidor}**. Você é o aluno nº {numero}.\nRegra nº 1: escolher uma cor em #escolha-sua-cor.'],
  ['Bem-vindo à firma', '{usuario} entrou pra firma. O **{servidor}** agradece a preferência. Crachá nº {numero}.'],
  ['Sério (chato)', 'Olá, {usuario}. Seja bem-vindo(a) ao {servidor}. Leia as regras.'],
];

export const MODELOS_EVENTO = {
  saida: [['Trancou a matrícula', '{usuario} trancou a matrícula. A turma agora tem {numero} alunos.'], ['F no chat', 'Ué, cadê? {usuario} saiu do **{servidor}**. F no chat.'], ['Foi comprar cigarro', '{usuario} foi comprar cigarro e não voltou.'], ['Sério (chato)', '{usuario} saiu do servidor.']],
  expulsao: [['Foi pra diretoria', '{usuario} foi pra diretoria e não volta hoje.'], ['Senta lá, Cláudia', 'Senta lá, Cláudia: {usuario} foi expulso(a) por {moderador}.'], ['Sério (chato)', '{usuario} foi expulso(a). Motivo: {motivo}.']],
  ban: [['Jubilado', '{usuario} foi **JUBILADO(A)** do {servidor}. Não volta nem com recurso.'], ['O martelo desceu', 'O martelo desceu: {usuario} foi banido(a) por {moderador}.'], ['Sério (chato)', '{usuario} foi banido(a). Motivo: {motivo}.']],
  silencio: [['Shhh, biblioteca', 'Shhh, biblioteca! {usuario} ficou em silêncio por {tempo}.'], ['De castigo', '{usuario} tá de castigo por {tempo}. Vai pensar no que fez.'], ['Até segunda ordem', '{usuario} foi silenciado(a) até segunda ordem.'], ['Sério (chato)', '{usuario} foi silenciado(a) por {tempo}. Motivo: {motivo}.']],
};

// [título, explicação, adesivo da prévia]
export const TEXTO_EVENTO = {
  saida: ['QUANDO ALGUÉM SAI', 'Avisa no canal quando alguém sai do servidor.', 'F no chat'],
  expulsao: ['QUANDO ALGUÉM É EXPULSO', 'A pessoa pode voltar com um convite novo.', 'foi pra diretoria'],
  ban: ['QUANDO ALGUÉM É BANIDO', 'A pessoa não volta, nem com convite.', 'jubilado, tchau'],
  silencio: ['QUANDO ALGUÉM É SILENCIADO', 'Fica sem falar por um tempo, ou até alguém tirar.', 'shhh'],
};

export const EVENTOS = [['entrada', 'Entrou', '#2ECC71'], ['saida', 'Saiu', '#95A5A6'], ['expulsao', 'Expulso', '#E67E22'], ['ban', 'Banido', '#c4363c'], ['silencio', 'Silenciado', '#3498DB']];
export const TEMPOS = { '10min': '10 minutos', '1h': '1 hora', '1d': '1 dia', '7d': '1 semana', sem: 'tempo indeterminado' };
export const DURACOES = [['10min', '10 min'], ['1h', '1 hora'], ['1d', '1 dia'], ['7d', '1 semana'], ['sem', 'Sem prazo']];
export const CORES_EVENTO = ['#95A5A6', '#E67E22', '#C4363C', '#3498DB', '#2ECC71', '#9B59B6', '#F2C14E', '#111111'];
export const CORES_CARD = ['#FFFFFF', '#1B1F33', '#F2C14E', '#FF6EC7', '#3498DB', '#2ECC71'];
