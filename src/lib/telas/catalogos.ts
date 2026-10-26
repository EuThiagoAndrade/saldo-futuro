import { ordenarPorNome } from "./combobox";

// Catálogo de instituições do usuário (ciclo 012, issue #127, BL-009), em /cadastros (emenda E-1
// do plano). Os nomes só descrevem os ativos; nenhum cálculo os lê. A identidade do nome (repetido
// ou não) é decidida pelo banco, por lower(btrim(nome)); aqui só se ordena e se conta o uso. As
// classes do usuário saíram de Cadastros no ciclo 013 (issue #138): a classe do ativo é um nó da
// taxonomia global.

export type TipoCatalogo = "instituicoes";

export interface EntradaCatalogo {
  id: string;
  nome: string;
}

/** Referências dos ativos (em uso ou desativados) às entradas do catálogo. */
export interface VinculoDoAtivo {
  instituicao_id: string | null;
}

export interface LinhaCatalogo extends EntradaCatalogo {
  /** Quantos ativos, em uso ou desativados, usam a entrada. */
  usos: number;
}

export const CATALOGOS = {
  instituicoes: {
    titulo: "Instituições",
    aba: "/cadastros",
    singular: "instituição",
    coluna: "instituicao_id",
    descricao: "Onde ficam os seus ativos. Os nomes aparecem como opção no cadastro do ativo e servem só para descrevê-lo.",
    vazio: "Nenhuma instituição cadastrada",
    textoVazio: "Inclua a primeira acima. Depois, ela aparece como opção no cadastro dos ativos.",
    rotuloCampo: "Nova instituição",
    rotuloIncluir: "Incluir instituição",
    incluida: "Instituição incluída.",
  },
} as const satisfies Record<TipoCatalogo, Record<string, string>>;

/** Entradas em ordem alfabética pt-BR, cada uma com o número de ativos que a usam. */
export function linhasDoCatalogo(tipo: TipoCatalogo, entradas: readonly EntradaCatalogo[], vinculos: readonly VinculoDoAtivo[]): LinhaCatalogo[] {
  const coluna = CATALOGOS[tipo].coluna;
  const usos = new Map<string, number>();
  for (const vinculo of vinculos) {
    const id = vinculo[coluna];
    if (id) usos.set(id, (usos.get(id) ?? 0) + 1);
  }
  return ordenarPorNome(entradas).map((e) => ({ id: e.id, nome: e.nome, usos: usos.get(e.id) ?? 0 }));
}

/** Segunda linha da lista: "Sem ativos", "Usada em 1 ativo" ou "Usada em N ativos". */
export function textoDeUso(usos: number): string {
  if (usos === 0) return "Sem ativos";
  return `Usada em ${usos} ${usos === 1 ? "ativo" : "ativos"}`;
}
