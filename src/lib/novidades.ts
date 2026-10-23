import pacote from "../../package.json";

// Novidades do produto (BL-011, ciclo 010): versão corrente lida do package.json e histórico
// manual em linguagem simples, a partir da 0.7.0. Uma entrada só aparece depois que sua versão
// foi lançada no build (versão menor ou igual à corrente); versão sem entrada não tem notas, sem
// erro. A data é a civil da publicação da release em America/Cuiaba, preenchida só quando
// comprovada (no encerramento do ciclo); até lá fica null.

export interface Novidade {
  versao: string;
  publicadaEm: string | null;
  notas: string[];
}

export const VERSAO_ATUAL: string = pacote.version;

export const HISTORICO: readonly Novidade[] = [
  {
    versao: "0.7.0",
    publicadaEm: "2026-10-22",
    notas: [
      "Política de privacidade e termos de uso publicados, com links na tela de entrada e em Conta.",
      "Nova página Novidades, no menu, com a versão do aplicativo e o que mudou em cada versão.",
      "Na tela de Ativos, o cadastro abre numa página própria pelo botão Novo ativo, e a lista se divide nas abas Em uso e Desativados.",
      "No Início, a distribuição por ativo virou um gráfico de rosca com a participação de cada ativo; os menores ficam juntos em Outros, que abre a lista completa, e os saldos negativos aparecem à parte.",
    ],
  },
];

function partes(versao: string): [number, number, number] {
  const encontrado = /^(\d+)\.(\d+)\.(\d+)/.exec(versao);
  if (!encontrado) throw new Error(`versão inválida: ${versao}`);
  return [Number(encontrado[1]), Number(encontrado[2]), Number(encontrado[3])];
}

/** Negativo se a vem antes de b, zero se iguais e positivo se a vem depois (maior.menor.correção). */
export function compararVersoes(a: string, b: string): number {
  const [pa, pb] = [partes(a), partes(b)];
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
}

/** Entradas já lançadas na versão corrente, da mais recente para a mais antiga. */
export function novidadesPublicadas(versaoAtual: string, historico: readonly Novidade[] = HISTORICO): Novidade[] {
  return historico
    .filter((novidade) => compararVersoes(novidade.versao, versaoAtual) <= 0)
    .sort((a, b) => compararVersoes(b.versao, a.versao));
}
