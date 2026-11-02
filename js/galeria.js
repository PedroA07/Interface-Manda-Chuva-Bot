// Modelos de imagem da galeria (pasta banners/). [nome, arquivo, categoria]
// Os banners da categoria "Eventos" (banners/eventos/*.jpg) têm o nome de um servidor de exemplo gravado na placa;
// eles voltam pra galeria quando o bot passar a desenhar a placa com o nome do servidor de verdade.

const FESTAS = [['Natal', 'natal'], ['Ano Novo', 'ano'], ['Halloween', 'halloween'], ['Carnaval', 'carnaval'], ['Páscoa', 'pascoa'], ['Namorados', 'namorados'], ['Festa Junina', 'junina'], ['Dia do Estudante', 'estudante'], ['Dia das Crianças', 'criancas'], ['Aniversário', 'niver']];

const CLASSICOS = [
  ['Escolha sua cor', 'painel-cores.gif'], ['Pinte seu nome', 'cores-arcoiris.gif'], ['Bem-vindo(a)', 'boas-vindas.gif'], ['Calouro na área', 'boas-quadro.gif'],
  ['É verdade esse bilete', 'boas-bilhete.gif'], ['Trancou a matrícula', 'saida-trancou.gif'], ['Foi pra diretoria', 'expulso-diretoria.gif'], ['Jubilado!', 'ban-jubilado.gif'],
  ['Shhh! Biblioteca', 'silencio-biblioteca.gif'], ['Jornal do campus', 'noticias.gif'], ['Plantão do bot', 'news-plantao.gif'], ['Aviso', 'tema-aviso.gif'],
  ['Carnaval', 'tema-carnaval.gif'], ['Páscoa', 'tema-pascoa.gif'], ['Namorados', 'tema-namorados.gif'], ['Festa Junina', 'tema-junina.gif'], ['Dia do Estudante', 'tema-estudante.gif'],
  ['Dia das Crianças', 'tema-criancas.gif'], ['Halloween', 'tema-halloween.gif'], ['Natal', 'tema-natal.gif'], ['Ano Novo', 'tema-ano-novo.gif'], ['Aniversário', 'tema-aniversario.gif'],
].map(([nome, arq]) => [nome, `banners/${arq}`, 'Clássicos']);

const BANNERS = [...FESTAS.map(([nome, id]) => [nome, `banners/festas/${id}-entrada.gif`, 'Festas']), ...CLASSICOS];

const EVENTOS_MINI = [['Escolha sua cor', 'painel'], ['Calouro na área', 'entrada'], ['Trancou a matrícula', 'saida'], ['Foi pra diretoria', 'expulsao'], ['Jubilado', 'ban'], ['Biblioteca', 'silencio'], ['Plantão do bot', 'news'], ['Parabéns, veterano', 'aniversario']];

export const GALERIA = {
  banner: BANNERS,
  rodape: [['Faixa do campus', 'banners/rodape-campus.gif', 'Clássicos'], ['Fim da aula', 'banners/rodape-fim.gif', 'Clássicos'], ...BANNERS],
  mini: [
    ...EVENTOS_MINI.map(([nome, id]) => [nome, `banners/mini/${id}.jpg`, 'Eventos']),
    ...FESTAS.map(([nome, id]) => [nome, `banners/mini/${id}.jpg`, 'Festas']),
    ...[['Paleta', 'mini-paleta'], ['Selo MC', 'mini-selo'], ['Capelo', 'mini-capelo'], ['Chuva', 'mini-chuva'], ['Estrela', 'mini-estrela'], ['Coroa', 'mini-coroa']].map(([nome, arq]) => [nome, `banners/${arq}.gif`, 'Clássicos']),
  ],
  card: [
    ['Portaria', 'banners/eventos/card-entrada.jpg', 'Eventos'], ['Festa de aniversário', 'banners/eventos/card-niver.jpg', 'Eventos'],
    ...FESTAS.map(([nome, id]) => [nome, `banners/festas/card-${id}.jpg`, 'Festas']),
    ...[['Campus', 'card-campus'], ['Confete', 'card-confete'], ['Quadro-negro', 'card-quadro'], ['Arco-íris', 'card-arcoiris'], ['Noite', 'card-noite'], ['Caderno', 'card-papel']].map(([nome, arq]) => [nome, `banners/${arq}.gif`, 'Clássicos']),
  ],
};

// Padrões de cada lugar (os mesmos do bot, em lib/imagens.js)
export const PADROES = {
  painel: { topo: 'banners/painel-cores.gif', mini: 'banners/mini-paleta.gif', imagem: 'none', final: 'banners/rodape-campus.gif' },
  news: { topo: 'banners/noticias.gif', mini: 'banners/mini-selo.gif', imagem: 'none', final: 'banners/rodape-campus.gif' },
};
