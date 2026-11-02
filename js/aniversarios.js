// Regras da lista de aniversários no painel (as mesmas do bot em lib/aniversarios.js)

const CORES = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22', '#FF6EC7', '#1ABC9C', '#F2C14E'];
/** Cor fixa por pessoa pra bolinha com a inicial */
export const corDaPessoa = (id) => CORES[[...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length];

export function diasAteNiver(d, hoje) {
  const [dia, mes] = d.split('/').map(Number);
  const hoje0 = Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia);
  let alvo = Date.UTC(hoje.ano, mes - 1, dia);
  if (alvo < hoje0) alvo = Date.UTC(hoje.ano + 1, mes - 1, dia);
  return Math.round((alvo - hoje0) / 864e5);
}

/** {idade} some (com o espaço) quando não tem ano ou a idade está desligada */
export function textoDoNiver(texto, vars, mostrarIdade) {
  const temIdade = mostrarIdade && vars.idade != null;
  return String(texto ?? '')
    .replace(/\{idade\}\s*/g, temIdade ? `${vars.idade} ` : '')
    .replace(/\{(usuario|nome|servidor)\}/g, (_, k) => vars[k] ?? '')
    .trim();
}

/** Lista com dias até o aniversário, idade que vai fazer e o "quando", em ordem dos próximos */
export function listaNiver(lista, hoje) {
  return lista
    .map((p) => {
      const dd = diasAteNiver(p.d, hoje);
      const [dia, mes] = p.d.split('/').map(Number);
      const anoDoNiver = mes * 100 + dia < hoje.mes * 100 + hoje.dia ? hoje.ano + 1 : hoje.ano;
      const idade = p.ano ? anoDoNiver - p.ano : null;
      return {
        ...p,
        dd,
        idade,
        idadeTxt: idade != null ? `vai fazer ${idade} anos` : 'sem ano: sai sem idade',
        quando: dd === 0 ? 'HOJE' : dd === 1 ? 'AMANHÃ' : `em ${dd} dias`,
        cor: corDaPessoa(p.userId),
      };
    })
    .sort((a, b) => a.dd - b.dd);
}
