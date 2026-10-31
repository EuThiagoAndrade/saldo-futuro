import pacote from "../../package.json";

// Novidades do produto (BL-011, ciclo 010): versão corrente lida do package.json e histórico
// manual em linguagem simples, a partir da 0.7.0. Uma entrada só aparece depois que sua versão
// foi lançada no build (versão menor ou igual à corrente); versão sem entrada não tem notas, sem
// erro. A data é a civil da publicação da release em America/Cuiaba, preenchida só quando
// comprovada, depois da publicação da release; até lá fica null.

export interface Novidade {
  versao: string;
  publicadaEm: string | null;
  notas: string[];
}

export const VERSAO_ATUAL: string = pacote.version;

export const HISTORICO: readonly Novidade[] = [
  {
    versao: "0.13.0",
    publicadaEm: null,
    notas: [
      "Agora dá para anotar em cada ativo, em Mais detalhes, o veículo de acesso, o indexador da remuneração, o regime tributário, o prazo para resgate ou venda e a cobertura do FGC. São anotações suas: o Saldo Futuro não calcula imposto, prazo nem garantia com elas.",
      "Na tela de Ativos, Ver detalhes mostra essas anotações sem abrir a edição, e Filtrar encontra os ativos por elas, nas duas abas.",
    ],
  },
  {
    versao: "0.12.0",
    publicadaEm: "2026-10-30",
    notas: [
      "No Início, a distribuição do patrimônio agora abre Por instituição, e as visões aparecem na ordem Por instituição, Por classe e Por ativo.",
      "No detalhe de uma classe, as participações passaram a se chamar % na carteira e % na classe, com a explicação de cada uma logo acima da tabela.",
    ],
  },
  {
    versao: "0.11.0",
    publicadaEm: "2026-10-28",
    notas: [
      "No Início, a distribuição do patrimônio ganhou a visão Por instituição, com Sem instituição e Em trânsito à parte, e as classes agora abrem em subclasses e tipos, com a participação na carteira e dentro do grupo.",
      "Agora dá para mudar o nome de um ativo, inclusive de um ativo desativado, pelo botão Editar na tela de Ativos. O nome novo também aparece nos registros antigos.",
    ],
  },
  {
    versao: "0.10.0",
    publicadaEm: "2026-10-27",
    notas: [
      "No Início, a distribuição do patrimônio agora também pode ser vista por classe: Caixa, Renda fixa, Renda variável, Exterior, Cripto e Alternativos, além de Em trânsito e Sem classe. Use Por ativo e Por classe, acima do gráfico.",
      "A lista de classes de ativo ficou bem mais completa: produtos do Tesouro, poupança, estratégias de fundos, segmentos de fundos imobiliários, investimentos no exterior, criptoativos, imóveis e outros alternativos. Busque pelo nome na classe do ativo.",
    ],
  },
  {
    versao: "0.9.0",
    publicadaEm: "2026-10-24",
    notas: [
      "Agora dá para registrar a classe, a instituição e outros detalhes de cada ativo, no cadastro ou pelo botão Editar na tela de Ativos.",
      "Nova página Cadastros, em Mais, para manter as suas instituições e classes de ativo.",
    ],
  },
  {
    versao: "0.8.0",
    publicadaEm: "2026-10-23",
    notas: ["Agora é possível comparar a carteira com o IGP-M, além do CDI e do IPCA."],
  },
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
