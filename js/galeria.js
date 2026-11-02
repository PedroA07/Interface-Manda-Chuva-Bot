// Modelos de imagem da galeria (pasta banners/). Cada item: [nome, arquivo, categoria, { tema?, tipo? }]
// Os banners "Eventos" (banners/eventos/<evento>.jpg) aparecem com a placa desenhada pelo bot, com o nome do servidor.

export const TEMAS = [['natal', 'Natal'], ['ano', 'Ano Novo'], ['halloween', 'Halloween'], ['carnaval', 'Carnaval'], ['pascoa', 'Páscoa'], ['namorados', 'Namorados'], ['junina', 'Festa Junina'], ['estudante', 'Dia do Estudante'], ['criancas', 'Dia das Crianças'], ['niver', 'Aniversário']];
// Uma versão de cada banner festivo pra cada mensagem do bot
export const TIPOS = [['painel', 'Painel'], ['entrada', 'Entrou'], ['saida', 'Saiu'], ['expulsao', 'Expulso'], ['ban', 'Banido'], ['silencio', 'Silenciado'], ['news', 'Notícias']];

const EVENTOS = [['painel', 'Escolha sua cor'], ['entrada', 'Calouro na área'], ['saida', 'Trancou a matrícula'], ['expulsao', 'Foi pra diretoria'], ['ban', 'Jubilado'], ['silencio', 'Biblioteca'], ['news', 'Plantão do bot'], ['aniversario', 'Parabéns, veterano']];
export const PLACAS = EVENTOS.map(([id]) => id);

const FESTAS = TEMAS.flatMap(([tema, nome]) => [
  ...TIPOS.map(([tipo, nomeTipo]) => [`${nome} · ${nomeTipo}`, `banners/festas/${tema}-${tipo}.gif`, 'Festas', { tema, tipo }]),
  ...TIPOS.map(([tipo, nomeTipo]) => [`${nome} · ${nomeTipo} (imagem)`, `banners/festas/${tema}-${tipo}.jpg`, 'Festas', { tema, tipo }]),
]);

const FUNDOS = [
  ...TEMAS.map(([tema, nome]) => [`${nome} (fundo)`, `banners/fundos/${tema === 'ano' ? 'ano-novo' : tema}.jpg`, 'Fundos', { tema }]),
  ...EVENTOS.map(([id, nome]) => [`${nome} (fundo)`, `banners/eventos/fundo-${id}.jpg`, 'Fundos', {}]),
];

const CLASSICOS = [
  ['Escolha sua cor', 'painel-cores.gif'], ['Pinte seu nome', 'cores-arcoiris.gif'], ['Bem-vindo(a)', 'boas-vindas.gif'], ['Calouro na área', 'boas-quadro.gif'],
  ['É verdade esse bilete', 'boas-bilhete.gif'], ['Trancou a matrícula', 'saida-trancou.gif'], ['Foi pra diretoria', 'expulso-diretoria.gif'], ['Jubilado!', 'ban-jubilado.gif'],
  ['Shhh! Biblioteca', 'silencio-biblioteca.gif'], ['Jornal do campus', 'noticias.gif'], ['Plantão do bot', 'news-plantao.gif'], ['Aviso', 'tema-aviso.gif'],
  ['Carnaval', 'tema-carnaval.gif'], ['Páscoa', 'tema-pascoa.gif'], ['Namorados', 'tema-namorados.gif'], ['Festa Junina', 'tema-junina.gif'], ['Dia do Estudante', 'tema-estudante.gif'],
  ['Dia das Crianças', 'tema-criancas.gif'], ['Halloween', 'tema-halloween.gif'], ['Natal', 'tema-natal.gif'], ['Ano Novo', 'tema-ano-novo.gif'], ['Aniversário', 'tema-aniversario.gif'],
].map(([nome, arq]) => [nome, `banners/${arq}`, 'Clássicos', {}]);

const BANNERS = [...EVENTOS.map(([id, nome]) => [nome, `banners/eventos/${id}.jpg`, 'Eventos', { tipo: id }]), ...FESTAS, ...FUNDOS, ...CLASSICOS];

export const GALERIA = {
  banner: BANNERS,
  rodape: [['Faixa do campus', 'banners/rodape-campus.gif', 'Clássicos', {}], ['Fim da aula', 'banners/rodape-fim.gif', 'Clássicos', {}], ...BANNERS],
  mini: [
    ...[...EVENTOS.map(([id, nome]) => [nome, id]), ...TEMAS.map(([id, nome]) => [nome, id])].map(([nome, id], i) => [nome, `banners/mini/${id}.jpg`, i < EVENTOS.length ? 'Eventos' : 'Festas', {}]),
    ...[['Paleta', 'mini-paleta'], ['Selo MC', 'mini-selo'], ['Capelo', 'mini-capelo'], ['Chuva', 'mini-chuva'], ['Estrela', 'mini-estrela'], ['Coroa', 'mini-coroa']].map(([nome, arq]) => [nome, `banners/${arq}.gif`, 'Clássicos', {}]),
  ],
  card: [
    ['Portaria', 'banners/eventos/card-entrada.jpg', 'Eventos', {}], ['Festa de aniversário', 'banners/eventos/card-niver.jpg', 'Eventos', {}],
    ...TEMAS.map(([tema, nome]) => [nome, `banners/festas/card-${tema}.jpg`, 'Festas', { tema }]),
    ...FUNDOS,
    ...[['Campus', 'card-campus'], ['Confete', 'card-confete'], ['Quadro-negro', 'card-quadro'], ['Arco-íris', 'card-arcoiris'], ['Noite', 'card-noite'], ['Caderno', 'card-papel']].map(([nome, arq]) => [nome, `banners/${arq}.gif`, 'Clássicos', {}]),
  ],
};

// Padrões de cada lugar (os mesmos do bot, em lib/imagens.js)
export const PADROES = {
  painel: { topo: 'banners/painel-cores.gif', mini: 'banners/mini-paleta.gif', imagem: 'none', final: 'banners/rodape-campus.gif' },
  news: { topo: 'banners/noticias.gif', mini: 'banners/mini-selo.gif', imagem: 'none', final: 'banners/rodape-campus.gif' },
};
