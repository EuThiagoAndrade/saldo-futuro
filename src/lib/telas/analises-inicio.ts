import { ClassificacaoIncoerente, GRUPOS, MACROS } from "../financeiro/alocacao";
import { type AlocacaoInstitucional, comporInstituicoes, type GrupoInstitucional, InstituicaoIncoerente } from "../financeiro/instituicao";
import { type DetalheDeClasse, detalharClasse, type NoDaTaxonomia, type PosicaoDeClasse } from "../financeiro/niveis";
import { type Ativo, type InsumosDoInicio, nomeDoAtivo } from "./leituras";
import type { NoTaxonomia } from "./taxonomia";

// Composição das análises por instituição e por nível de classe do Início (ciclo 015, issue #154;
// KB-004, seção 15). Une os insumos lidos às funções puras das regras; não decide nada financeiro.
// Referência que não pode ser lida (ativo ausente, instituição fora do catálogo, nó inválido) torna a
// análise indisponível: devolve `null`, nunca uma linha de ausência.

type PosicaoDeM = InsumosDoInicio["posicoes"][number];

function ativosPorId(ativos: readonly Ativo[]): Map<string, Ativo> {
  return new Map(ativos.map((a) => [a.id, a]));
}

/** Rótulo do grupo institucional, para a legenda, a tabela e os negativos. */
export function nomeDoGrupoInstitucional(grupo: GrupoInstitucional): string {
  return grupo.tipo === "transito" ? "Em trânsito" : grupo.tipo === "sem_instituicao" ? "Sem instituição" : (grupo.nome ?? "Instituição");
}

/** Alocação de M por instituição atual; null se uma instituição ou um ativo não puder ser lido. */
export function alocacaoPorInstituicao(
  insumos: Pick<InsumosDoInicio, "ativos"> & { instituicoes: readonly { id: string; nome: string }[] },
  posicoesDeM: readonly PosicaoDeM[],
): AlocacaoInstitucional | null {
  const ativos = ativosPorId(insumos.ativos);
  try {
    return comporInstituicoes(
      posicoesDeM.map((p) => {
        const ativo = ativos.get(p.ativo_id);
        if (!ativo) throw new InstituicaoIncoerente(`ativo ${p.ativo_id} ausente`);
        return { id: ativo.id, nome: nomeDoAtivo(insumos.ativos, ativo.id), saldo: p.saldo_final, sistema: ativo.sistema, instituicao_id: ativo.instituicao_id };
      }),
      insumos.instituicoes,
    );
  } catch (erro) {
    if (erro instanceof InstituicaoIncoerente) return null;
    throw erro;
  }
}

export function arvoreDaTaxonomia(nos: readonly NoTaxonomia[]): Map<string, NoDaTaxonomia> {
  return new Map(nos.map((n) => [n.id, n]));
}

/** Ramo pedido na URL: só macro e subclasse existentes têm detalhe; o resto volta à raiz. */
export type RamoPedido = { tipo: "raiz" } | { tipo: "invalido" } | { tipo: "detalhe"; detalhe: DetalheDeClasse };

/**
 * Detalhe do pai pedido em `?classe=`. Ausente é a raiz; UUID inválido, nó inexistente ou terminal
 * (tipo) é "invalido" e volta à raiz com mensagem. Dado incoerente (árvore ou posições) devolve null.
 */
export function ramoDeClasse(
  insumos: Pick<InsumosDoInicio, "ativos"> & { nos: readonly NoTaxonomia[] },
  posicoesDeM: readonly PosicaoDeM[],
  pedido: string | undefined,
): RamoPedido | null {
  if (!pedido) return { tipo: "raiz" };
  const nos = arvoreDaTaxonomia(insumos.nos);
  const ativos = ativosPorId(insumos.ativos);
  try {
    const posicoes: PosicaoDeClasse[] = posicoesDeM.map((p) => {
      const ativo = ativos.get(p.ativo_id);
      if (!ativo) throw new ClassificacaoIncoerente(`ativo ${p.ativo_id} ausente`);
      return { id: ativo.id, nome: nomeDoAtivo(insumos.ativos, ativo.id), saldo: p.saldo_final, sistema: ativo.sistema, taxonomia_id: ativo.taxonomia_id };
    });
    const detalhe = detalharClasse(posicoes, nos, pedido.toLowerCase());
    return detalhe ? { tipo: "detalhe", detalhe } : { tipo: "invalido" };
  } catch (erro) {
    if (erro instanceof ClassificacaoIncoerente) return null;
    throw erro;
  }
}

/** Identidade (UUID) da classe macro de cada linha da raiz; trânsito e Sem classe não têm detalhe. */
export const MACRO_DO_GRUPO: Readonly<Record<string, string>> = Object.fromEntries(
  GRUPOS.flatMap((g) => {
    const id = Object.entries(MACROS).find(([, grupo]) => grupo === g)?.[0];
    return id ? [[g, id]] : [];
  }),
);
