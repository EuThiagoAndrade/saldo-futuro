import { deNumero } from "./centavos";
import { UNIDADES_TOTAIS } from "./distribuicao";

// Alocação por classe macro do último mês fechado (KB-004, seção 15; ciclo 013, issue #139,
// BL-014). Função irmã da distribuição por ativo, que não muda. Cada ativo com posição em M entra
// na linha da classe macro do seu nó atual (P2: a classificação de hoje, sem histórico), na linha
// própria do trânsito ou em Sem classe, quando não tem nó. Os negativos ficam de fora, por ativo,
// antes de agrupar; só os positivos somam nas linhas. A participação é um inteiro de centésimos de
// ponto percentual, repartido em bigint pelo maior resto entre as linhas, com o empate de resto pela
// ordem fixa das oito linhas (P6), mesmo com saldos diferentes. Nada passa por ponto flutuante.

/** As oito linhas, na ordem fixa (desempate do resto e da apresentação). */
export const GRUPOS = ["caixa", "renda_fixa", "renda_variavel", "exterior", "cripto", "alternativos", "transito", "sem_classe"] as const;
export type Grupo = (typeof GRUPOS)[number];

/** Classes macro da taxonomia global, pelas identidades fixas do catálogo (nível 1). */
export const MACROS: Readonly<Record<string, Grupo>> = {
  "a5000000-0000-4000-8000-000000010000": "caixa",
  "a5000000-0000-4000-8000-000000020000": "renda_fixa",
  "a5000000-0000-4000-8000-000000030000": "renda_variavel",
  "a5000000-0000-4000-8000-000000040000": "exterior",
  "a5000000-0000-4000-8000-000000050000": "cripto",
  "a5000000-0000-4000-8000-000000060000": "alternativos",
};

export interface NoDaArvore {
  id: string;
  parent_id: string | null;
  nivel: number;
}

/** Vínculo com nó inexistente ou caminho inválido: a visão fica indisponível, nunca vira Sem classe. */
export class ClassificacaoIncoerente extends Error {
  constructor(detalhe: string) {
    super(`classificação incoerente: ${detalhe}`);
    this.name = "ClassificacaoIncoerente";
  }
}

/**
 * Linha de um ativo: o trânsito tem precedência e linha própria; só o vínculo nulo é Sem classe; um
 * nó de qualquer nível sobe no máximo dois pais até a classe macro.
 */
export function grupoDoAtivo(ativo: { sistema: string | null; taxonomia_id: string | null }, nos: ReadonlyMap<string, NoDaArvore>): Grupo {
  if (ativo.sistema === "transito") return "transito";
  if (ativo.taxonomia_id === null) return "sem_classe";
  let no = nos.get(ativo.taxonomia_id);
  for (let subidas = 0; no && no.nivel > 1 && subidas < 2; subidas++) {
    const pai = no.parent_id === null ? undefined : nos.get(no.parent_id);
    if (!pai || pai.nivel !== no.nivel - 1) throw new ClassificacaoIncoerente(`pai ausente ou de nível errado para ${no.id}`);
    no = pai;
  }
  if (!no) throw new ClassificacaoIncoerente(`nó ${ativo.taxonomia_id} inexistente`);
  const grupo = no.nivel === 1 && no.parent_id === null ? MACROS[no.id] : undefined;
  if (!grupo) throw new ClassificacaoIncoerente(`nó ${no.id} não leva a uma classe macro`);
  return grupo;
}

export interface PosicaoDaAlocacao {
  id: string;
  nome: string;
  /** Saldo final em M, em centavos, como vem da leitura (number seguro). */
  saldo: number;
  grupo: Grupo;
}

export interface LinhaDaAlocacao {
  grupo: Grupo;
  /** Soma exata dos saldos positivos da linha; pode passar da faixa de uma posição. */
  saldo: bigint;
  /** Centésimos de ponto percentual sobre a base positiva, de 0 a 10000. */
  participacao: number;
}

export interface Alocacao {
  /** Soma exata dos saldos positivos de todas as linhas. */
  base: bigint;
  /** Linhas com saldo positivo, por saldo decrescente e, no empate, pela ordem fixa. */
  linhas: LinhaDaAlocacao[];
  /** Ativos com saldo negativo: fora da base, sem participação, como na distribuição por ativo. */
  negativos: { id: string; nome: string; saldo: bigint; grupo: Grupo }[];
  /** Ativos com saldo zero: não aparecem. */
  omitidos: { id: string; nome: string }[];
}

const colacao = new Intl.Collator("pt-BR");
const ordem = (g: Grupo) => GRUPOS.indexOf(g);

function porNomeEId(a: { nome: string; id: string }, b: { nome: string; id: string }): number {
  const nome = colacao.compare(a.nome, b.nome);
  if (nome !== 0) return nome;
  const [x, y] = [a.id.toLowerCase(), b.id.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}

export function comporAlocacao(posicoes: readonly PosicaoDaAlocacao[]): Alocacao {
  const entradas = posicoes.map((p) => ({ id: p.id, nome: p.nome, grupo: p.grupo, saldo: deNumero(p.saldo) as bigint }));

  // Negativos por ativo, antes de agrupar: nunca reduzem a linha da classe.
  const negativos = entradas.filter((p) => p.saldo < 0n).sort((a, b) => (a.saldo === b.saldo ? porNomeEId(a, b) : a.saldo < b.saldo ? -1 : 1));
  const omitidos = entradas.filter((p) => p.saldo === 0n).sort(porNomeEId).map(({ id, nome }) => ({ id, nome }));

  const somas = new Map<Grupo, bigint>();
  for (const p of entradas) if (p.saldo > 0n) somas.set(p.grupo, (somas.get(p.grupo) ?? 0n) + p.saldo);
  const porOrdemFixa = GRUPOS.filter((g) => somas.has(g)).map((grupo) => ({ grupo, saldo: somas.get(grupo)! }));

  const base = porOrdemFixa.reduce((soma, l) => soma + l.saldo, 0n);
  if (base === 0n) return { base, linhas: [], negativos, omitidos };

  const pisos = porOrdemFixa.map((l) => (l.saldo * UNIDADES_TOTAIS) / base);
  const restos = porOrdemFixa.map((l) => (l.saldo * UNIDADES_TOTAIS) % base);
  const sobra = Number(UNIDADES_TOTAIS - pisos.reduce((soma, q) => soma + q, 0n));
  // Maiores restos primeiro; empate de resto direto pela ordem fixa (P6), sem olhar o saldo.
  const porResto = porOrdemFixa.map((_, i) => i).sort((i, j) => (restos[i] === restos[j] ? i - j : restos[i] > restos[j] ? -1 : 1));
  for (const i of porResto.slice(0, sobra)) pisos[i] += 1n;

  const linhas = porOrdemFixa
    .map((l, i) => ({ ...l, participacao: Number(pisos[i]) }))
    .sort((a, b) => (a.saldo === b.saldo ? ordem(a.grupo) - ordem(b.grupo) : a.saldo > b.saldo ? -1 : 1));
  return { base, linhas, negativos, omitidos };
}
