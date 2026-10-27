import { deNumero } from "./centavos";
import { porNomeEId, porSaldoCrescente, ratear } from "./rateio";

// Alocação por instituição do mês M (KB-004, seção 15; ciclo 015, issue #152). Cada ativo com
// posição em M entra no grupo da instituição atual (pelo ID), em Sem instituição (vínculo nulo) ou em
// Em trânsito (ativo de sistema, com precedência). Negativos saem por ativo antes de agrupar. O
// empate de resto segue a ordem de desempate, não o saldo: instituições por nome (pt-BR) e UUID,
// depois Sem instituição e Em trânsito. Nada passa por ponto flutuante.

export interface InstituicaoDoCatalogo {
  id: string;
  nome: string;
}

export interface PosicaoInstitucional {
  id: string;
  nome: string;
  /** Saldo final em M, em centavos, como vem da leitura (number seguro). */
  saldo: number;
  sistema: string | null;
  instituicao_id: string | null;
}

export interface GrupoInstitucional {
  tipo: "instituicao" | "sem_instituicao" | "transito";
  /** ID da instituição; nulo nos grupos especiais. */
  id: string | null;
  /** Nome da instituição; nulo nos grupos especiais, cujo rótulo é da apresentação. */
  nome: string | null;
}

export interface LinhaInstitucional {
  grupo: GrupoInstitucional;
  /** Soma exata dos saldos positivos do grupo; pode passar da faixa de uma posição. */
  saldo: bigint;
  /** Centésimos de ponto percentual sobre a base positiva, de 0 a 10000. */
  participacao: number;
}

export interface AlocacaoInstitucional {
  /** Soma exata dos saldos positivos de todos os grupos. */
  base: bigint;
  /** Grupos positivos, por saldo decrescente e, no empate, pela ordem de desempate. */
  linhas: LinhaInstitucional[];
  /** Ativos com saldo negativo: fora da base, sem participação. */
  negativos: { id: string; nome: string; saldo: bigint; grupo: GrupoInstitucional }[];
  /** Ativos com saldo zero: não aparecem. */
  omitidos: { id: string; nome: string }[];
}

/** Instituição sem entrada legível ou repetida no catálogo: a visão fica indisponível, nunca vira Sem instituição. */
export class InstituicaoIncoerente extends Error {
  constructor(detalhe: string) {
    super(`instituição incoerente: ${detalhe}`);
    this.name = "InstituicaoIncoerente";
  }
}

const chave = (g: GrupoInstitucional) => (g.tipo === "instituicao" ? `i:${g.id}` : g.tipo);

export function comporInstituicoes(posicoes: readonly PosicaoInstitucional[], instituicoes: readonly InstituicaoDoCatalogo[]): AlocacaoInstitucional {
  const catalogo = new Map<string, InstituicaoDoCatalogo>();
  for (const i of instituicoes) {
    if (catalogo.has(i.id)) throw new InstituicaoIncoerente(`instituição ${i.id} repetida`);
    catalogo.set(i.id, i);
  }

  const grupoDe = (p: PosicaoInstitucional): GrupoInstitucional => {
    if (p.sistema === "transito") return { tipo: "transito", id: null, nome: null };
    if (p.instituicao_id === null) return { tipo: "sem_instituicao", id: null, nome: null };
    const instituicao = catalogo.get(p.instituicao_id);
    if (!instituicao) throw new InstituicaoIncoerente(`instituição ${p.instituicao_id} sem entrada`);
    return { tipo: "instituicao", id: instituicao.id, nome: instituicao.nome };
  };
  const entradas = posicoes.map((p) => ({ id: p.id, nome: p.nome, saldo: deNumero(p.saldo) as bigint, grupo: grupoDe(p) }));

  // Negativos por ativo, antes de agrupar: nunca reduzem o grupo.
  const negativos = entradas.filter((p) => p.saldo < 0n).sort(porSaldoCrescente);
  const omitidos = entradas.filter((p) => p.saldo === 0n).sort(porNomeEId).map(({ id, nome }) => ({ id, nome }));

  const somas = new Map<string, { grupo: GrupoInstitucional; saldo: bigint }>();
  for (const p of entradas) {
    if (p.saldo <= 0n) continue;
    const atual = somas.get(chave(p.grupo));
    somas.set(chave(p.grupo), { grupo: p.grupo, saldo: (atual?.saldo ?? 0n) + p.saldo });
  }

  const instituicoesPorNome = [...catalogo.values()].sort(porNomeEId).map((i) => `i:${i.id}`);
  const porDesempate = [...instituicoesPorNome, "sem_instituicao", "transito"].filter((c) => somas.has(c)).map((c) => somas.get(c)!);

  const base = porDesempate.reduce((soma, g) => soma + g.saldo, 0n);
  const participacoes = ratear(porDesempate.map((g) => g.saldo));
  const linhas = porDesempate
    .map((g, i) => ({ ...g, participacao: participacoes[i], ordem: i }))
    .sort((a, b) => (a.saldo === b.saldo ? a.ordem - b.ordem : a.saldo > b.saldo ? -1 : 1))
    .map(({ grupo, saldo, participacao }) => ({ grupo, saldo, participacao }));
  return { base, linhas, negativos, omitidos };
}
