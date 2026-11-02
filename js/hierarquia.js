// Regras da aba Cargos › Hierarquia. O painel só mexe no rascunho (cfg.hierarquia = { lista, apagar });
// o bot aplica no Salvar (lib/hierarquia.js do bot).

const SNOWFLAKE = /^\d{17,20}$/;

/** Chave estável de cada item (o bloco de cores não tem id) */
export const chave = (x) => x.id ?? x.k;

/** Lista que aparece: o rascunho, se tiver, ou a que veio do servidor */
export const listaDe = (cfg, estado) => cfg.hierarquia?.lista ?? estado.servidor?.hierarquia?.lista ?? [];

/** Índice do cargo do bot: só o que está abaixo dele mexe */
export const indiceDoBot = (lista) => lista.findIndex((x) => x.bot);

export const movivel = (lista, k) => {
  const b = indiceDoBot(lista);
  return b >= 0 && k > b;
};

/** Troca o item k com o vizinho (d = -1 sobe, 1 desce). null = não dá. */
export function mover(lista, k, d) {
  const j = k + d;
  if (!movivel(lista, k) || !movivel(lista, j) || j >= lista.length) return null;
  const a = [...lista];
  [a[k], a[j]] = [a[j], a[k]];
  return a;
}

/** Arrastar: tira o item de "de" e põe na posição "para" (os dois abaixo do bot). null = não dá. */
export function moverPara(lista, de, para) {
  if (de === para || !movivel(lista, de) || !movivel(lista, para) || para >= lista.length) return null;
  const a = [...lista];
  const [x] = a.splice(de, 1);
  a.splice(para, 0, x);
  return a;
}

/** Cargos com cor entre o bot e o bloco de cores: o nome fica com a cor deles, não com a escolhida */
export function conflitos(lista) {
  const b = indiceDoBot(lista), c = lista.findIndex((x) => x.k === 'cores');
  if (b < 0) return [];
  return lista.filter((x, k) => x.k === 'role' && x.hex && x.gerenciado !== 'bot' && k > b && k < c).map((x) => x.nome);
}

/** "Consertar sozinho": o bloco de cores (com o separador colado em cima dele) vai pra logo abaixo do bot */
export function consertar(lista) {
  const a = [...lista], c = a.findIndex((x) => x.k === 'cores');
  const n = c > 0 && a[c - 1].k === 'sep' && movivel(a, c - 1) ? 2 : 1;
  const bloco = a.splice(c - n + 1, n);
  a.splice(indiceDoBot(a) + 1, 0, ...bloco);
  return a;
}

/** Item novo entra logo abaixo do bot. Devolve a lista nova. */
export function inserir(lista, item) {
  const a = [...lista];
  a.splice(indiceDoBot(a) + 1, 0, item);
  return a;
}

/** Tira o item do rascunho; se ele já existe no Discord, entra na lista de apagar */
export function tirar(rascunho, k) {
  const [x] = rascunho.lista.splice(k, 1);
  if (SNOWFLAKE.test(x?.id ?? '') && !rascunho.apagar.includes(x.id)) rascunho.apagar.push(x.id);
  return x;
}

/** Etiquetas do cargo na lista */
export function etiquetas(x) {
  const p = x.perms ?? [];
  return [
    x.bot && 'BOT',
    p.includes('admin') && 'ADMIN',
    !x.bot && p.some((q) => ['expulsar', 'banir', 'silenciar', 'mensagens'].includes(q)) && 'MOD',
    x.hoist && 'À PARTE',
    x.gerenciado === 'impulso' && 'IMPULSO',
    !x.bot && x.gerenciado && x.gerenciado !== 'impulso' && 'INTEGRAÇÃO',
  ].filter(Boolean);
}
export const COR_ETIQUETA = { ADMIN: '#f5b5a8', MOD: '#d9c2ec', BOT: '#b6c8ee', COR: '#f3d48a', 'À PARTE': '#efe8d8', IMPULSO: '#f7c6e6', INTEGRAÇÃO: '#e4dccb' };

export const PERMS = [['admin', 'Administrador'], ['cargos', 'Gerenciar cargos'], ['mensagens', 'Gerenciar mensagens'], ['silenciar', 'Silenciar membros'], ['expulsar', 'Expulsar'], ['banir', 'Banir']];
