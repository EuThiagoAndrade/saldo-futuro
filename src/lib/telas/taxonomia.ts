import { ErroLeitura } from "../leitura";
import type { Opcao } from "./combobox";

// Taxonomia global de classes de ativos (ciclo 013, issue #138, BL-014): a árvore de até três
// níveis lida do banco, o caminho completo de cada nó para o seletor e o texto da classe do ativo
// nas listas. Funções puras. A árvore só muda por migração; aqui ela nunca é escrita. Um nó que
// falta ou uma árvore incoerente é erro de leitura, nunca "Sem classe": só a ausência de vínculo
// (taxonomia_id nulo) é "Sem classe".

export interface NoTaxonomia {
  id: string;
  parent_id: string | null;
  nivel: number;
  nome: string;
  ordem: number;
}

/** Separador do caminho completo, como em "Renda fixa › Crédito bancário › CDB". */
export const SEPARADOR_CAMINHO = " › ";

export interface Taxonomia {
  /** Todos os nós em ordem hierárquica (cada pai antes dos filhos, irmãos pela ordem), com o caminho completo como nome. */
  opcoes: Opcao[];
  /** Caminho completo do nó, ou undefined se o nó não existe. */
  caminho: (id: string) => string | undefined;
  /** Nome do próprio nó (último elemento do caminho), ou undefined se o nó não existe. */
  nome: (id: string) => string | undefined;
}

function incoerente(motivo: string): never {
  throw new ErroLeitura("pagina", `taxonomia incoerente: ${motivo}`);
}

/** Monta a árvore, conferindo identidade, nível e pai de cada nó. */
export function montarTaxonomia(nos: readonly NoTaxonomia[]): Taxonomia {
  const porId = new Map<string, NoTaxonomia>();
  for (const no of nos) {
    if (porId.has(no.id)) incoerente("nó repetido");
    porId.set(no.id, no);
  }
  const filhos = new Map<string | null, NoTaxonomia[]>();
  for (const no of nos) {
    if (no.nivel < 1 || no.nivel > 3) incoerente("nível fora de 1 a 3");
    if (no.parent_id === null ? no.nivel !== 1 : porId.get(no.parent_id)?.nivel !== no.nivel - 1) incoerente("pai ausente ou de nível errado");
    const irmaos = filhos.get(no.parent_id) ?? [];
    irmaos.push(no);
    filhos.set(no.parent_id, irmaos);
  }

  const caminhos = new Map<string, string[]>();
  const opcoes: Opcao[] = [];
  const descer = (pai: string | null, acima: string[]) => {
    for (const no of [...(filhos.get(pai) ?? [])].sort((a, b) => a.ordem - b.ordem)) {
      const caminho = [...acima, no.nome];
      caminhos.set(no.id, caminho);
      opcoes.push({ id: no.id, nome: caminho.join(SEPARADOR_CAMINHO) });
      descer(no.id, caminho);
    }
  };
  descer(null, []);
  if (opcoes.length !== nos.length) incoerente("nó fora da árvore");

  return {
    opcoes,
    caminho: (id) => caminhos.get(id)?.join(SEPARADOR_CAMINHO),
    nome: (id) => caminhos.get(id)?.at(-1),
  };
}

/**
 * Texto da classe de um ativo nas listas: o nome do nó (só o nome, o caminho fica no seletor e na
 * edição); sem vínculo e com legado, "Sem classe (antes: X)"; sem vínculo e sem legado, null
 * ("não informado"). Vínculo para um nó que não existe é erro de leitura.
 */
export function classeDoAtivo(
  ativo: { taxonomia_id: string | null; classe_id: string | null },
  taxonomia: Taxonomia,
  classesLegadas: ReadonlyMap<string, string>,
): string | null {
  if (ativo.taxonomia_id !== null) {
    const nome = taxonomia.nome(ativo.taxonomia_id);
    if (nome === undefined) incoerente("nó do ativo inexistente");
    return nome;
  }
  const antes = ativo.classe_id === null ? undefined : classesLegadas.get(ativo.classe_id);
  return antes === undefined ? null : `Sem classe (antes: ${antes})`;
}

/** Classe atual na edição: o caminho completo, ou "Sem classe" com a dica do legado, se houver. */
export function classeAtualDoAtivo(
  ativo: { taxonomia_id: string | null; classe_id: string | null },
  taxonomia: Taxonomia,
  classesLegadas: ReadonlyMap<string, string>,
): string {
  if (ativo.taxonomia_id !== null) {
    const caminho = taxonomia.caminho(ativo.taxonomia_id);
    if (caminho === undefined) incoerente("nó do ativo inexistente");
    return caminho;
  }
  const antes = ativo.classe_id === null ? undefined : classesLegadas.get(ativo.classe_id);
  return antes === undefined ? "Sem classe" : `Sem classe (antes: ${antes})`;
}
