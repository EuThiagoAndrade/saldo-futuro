import { ClassificacaoIncoerente, GRUPOS, MACROS, type NoDaArvore } from "./alocacao";
import { deNumero } from "./centavos";
import { porId, porNomeEId, porSaldoCrescente, ratear } from "./rateio";

// Níveis 2 e 3 da classe do mês M (KB-004, seção 15; ciclo 015, issue #152). A raiz macro continua
// em `comporAlocacao`. Aqui há duas fronteiras globais: na profundidade 2, a subclasse (ou o resíduo
// da macro); na profundidade 3, o tipo (ou o resíduo da subclasse ou da macro). Cada positivo entra
// uma vez em cada fronteira. O detalhe de um pai tem duas bases independentes: "% da carteira", do
// rateio global da fronteira, e "% do pai", do rateio local entre seus filhos e seu resíduo. O
// empate de resto segue a travessia da árvore, não o saldo. Nada passa por ponto flutuante.

export interface NoDaTaxonomia extends NoDaArvore {
  nome: string;
  ordem: number;
}

export interface PosicaoDeClasse {
  id: string;
  nome: string;
  /** Saldo final em M, em centavos, como vem da leitura (number seguro). */
  saldo: number;
  sistema: string | null;
  taxonomia_id: string | null;
}

export type ProfundidadeDeClasse = 2 | 3;

/** `no`: o nó do grupo; `residuo`: vínculo direto ao nó, que é o pai; Em trânsito e Sem classe não têm nó. */
export interface GrupoDeClasse {
  tipo: "no" | "residuo" | "transito" | "sem_classe";
  no: string | null;
}

/** Do macro ao nó, com o ID de cada um (para os links de aprofundamento) e o nome. */
export type CaminhoDeClasse = { id: string; nome: string }[];

export interface LinhaDeClasse {
  grupo: GrupoDeClasse;
  caminho: CaminhoDeClasse;
  /** Soma exata dos saldos positivos do grupo; pode passar da faixa de uma posição. */
  saldo: bigint;
}

export interface NegativoDeClasse {
  id: string;
  nome: string;
  saldo: bigint;
  /** Nó atual do ativo; `transito` e `sem_classe` não têm nó. */
  grupo: GrupoDeClasse;
  caminho: CaminhoDeClasse;
}

export interface FronteiraDeClasses {
  profundidade: ProfundidadeDeClasse;
  /** Soma exata dos saldos positivos de todos os grupos. */
  base: bigint;
  /** Grupos positivos com a participação na carteira, por saldo decrescente e, no empate, pela travessia. */
  linhas: (LinhaDeClasse & { participacao: number })[];
  negativos: NegativoDeClasse[];
  omitidos: { id: string; nome: string }[];
}

export interface DetalheDeClasse {
  pai: { id: string; caminho: CaminhoDeClasse };
  /** Soma exata dos positivos do pai, base do rateio local. Só para conferência: o detalhe não a mostra. */
  base: bigint;
  /** Filhos imediatos e resíduo positivos, por saldo decrescente e, no empate, pela travessia. */
  linhas: (LinhaDeClasse & { participacaoCarteira: number; participacaoPai: number })[];
  /** Negativos do ramo: o pai, ou um descendente dele, é o nó atual do ativo. */
  negativos: NegativoDeClasse[];
}

const chave = (g: GrupoDeClasse) => `${g.tipo}:${g.no ?? ""}`;
const transito: GrupoDeClasse = { tipo: "transito", no: null };
const semClasse: GrupoDeClasse = { tipo: "sem_classe", no: null };

/** Do macro ao nó; nó inexistente, nível fora de 1 a 3 ou encadeamento inválido torna a visão indisponível. */
function caminhoDoNo(id: string, nos: ReadonlyMap<string, NoDaTaxonomia>): NoDaTaxonomia[] {
  const caminho: NoDaTaxonomia[] = [];
  let no = nos.get(id);
  if (!no) throw new ClassificacaoIncoerente(`nó ${id} inexistente`);
  for (;;) {
    if (no.nivel < 1 || no.nivel > 3) throw new ClassificacaoIncoerente(`nó ${no.id} com nível ${no.nivel}`);
    caminho.unshift(no);
    if (no.nivel === 1) {
      if (no.parent_id !== null || !MACROS[no.id]) throw new ClassificacaoIncoerente(`nó ${no.id} não é uma classe macro`);
      return caminho;
    }
    const pai: NoDaTaxonomia | undefined = no.parent_id === null ? undefined : nos.get(no.parent_id);
    if (!pai || pai.nivel !== no.nivel - 1) throw new ClassificacaoIncoerente(`pai ausente ou de nível errado para ${no.id}`);
    no = pai;
  }
}

/**
 * Travessia da árvore que define o desempate: as macros na ordem fixa, os irmãos pela ordem da
 * árvore (UUID como salvaguarda) e o resíduo do pai depois dos filhos; Em trânsito e Sem classe por
 * último. Devolve a posição de cada grupo possível.
 */
function travessia(nos: ReadonlyMap<string, NoDaTaxonomia>, profundidade: ProfundidadeDeClasse): Map<string, number> {
  const filhos = new Map<string, NoDaTaxonomia[]>();
  for (const n of nos.values()) if (n.parent_id !== null) filhos.set(n.parent_id, [...(filhos.get(n.parent_id) ?? []), n]);
  const filhosDe = (pai: NoDaTaxonomia) =>
    (filhos.get(pai.id) ?? []).filter((n) => n.nivel === pai.nivel + 1).sort((a, b) => (a.ordem === b.ordem ? porId(a.id, b.id) : a.ordem - b.ordem));

  const ordem: GrupoDeClasse[] = [];
  const macros = [...nos.values()].filter((n) => n.nivel === 1 && n.parent_id === null && MACROS[n.id]).sort((a, b) => GRUPOS.indexOf(MACROS[a.id]) - GRUPOS.indexOf(MACROS[b.id]));
  for (const macro of macros) {
    for (const sub of filhosDe(macro)) {
      if (profundidade === 2) {
        ordem.push({ tipo: "no", no: sub.id });
      } else {
        for (const tipo of filhosDe(sub)) ordem.push({ tipo: "no", no: tipo.id });
        ordem.push({ tipo: "residuo", no: sub.id });
      }
    }
    ordem.push({ tipo: "residuo", no: macro.id });
  }
  ordem.push(transito, semClasse);
  return new Map(ordem.map((g, i) => [chave(g), i]));
}

/** Grupo de uma posição em cada fronteira, com o pai sob o qual aparece no detalhe. */
function agrupar(posicoes: readonly PosicaoDeClasse[], nos: ReadonlyMap<string, NoDaTaxonomia>, profundidade: ProfundidadeDeClasse) {
  interface Entrada {
    id: string;
    nome: string;
    saldo: bigint;
    grupo: GrupoDeClasse;
    pai: string | null;
    caminho: CaminhoDeClasse;
    /** Nó atual do ativo e seu caminho, para os negativos. */
    vinculo: GrupoDeClasse;
    caminhoDoVinculo: CaminhoDeClasse;
  }
  const entradas = posicoes.map((p): Entrada => {
    const base = { id: p.id, nome: p.nome, saldo: deNumero(p.saldo) as bigint };
    if (p.sistema === "transito") return { ...base, grupo: transito, pai: null, caminho: [], vinculo: transito, caminhoDoVinculo: [] };
    if (p.taxonomia_id === null) return { ...base, grupo: semClasse, pai: null, caminho: [], vinculo: semClasse, caminhoDoVinculo: [] };
    const c = caminhoDoNo(p.taxonomia_id, nos);
    const nivel = c.length;
    const indice = profundidade === 2 ? Math.min(nivel, 2) - 1 : nivel - 1;
    const eResiduo = nivel < profundidade;
    return {
      ...base,
      grupo: { tipo: eResiduo ? "residuo" : "no", no: c[indice].id },
      pai: eResiduo ? c[indice].id : c[indice - 1].id,
      caminho: c.slice(0, indice + 1).map((n) => ({ id: n.id, nome: n.nome })),
      vinculo: { tipo: "no", no: p.taxonomia_id },
      caminhoDoVinculo: c.map((n) => ({ id: n.id, nome: n.nome })),
    };
  });

  const negativos: NegativoDeClasse[] = entradas
    .filter((p) => p.saldo < 0n)
    .sort(porSaldoCrescente)
    .map((p) => ({ id: p.id, nome: p.nome, saldo: p.saldo, grupo: p.vinculo, caminho: p.caminhoDoVinculo }));
  const omitidos = entradas.filter((p) => p.saldo === 0n).sort(porNomeEId).map(({ id, nome }) => ({ id, nome }));

  const somas = new Map<string, { grupo: GrupoDeClasse; pai: string | null; caminho: CaminhoDeClasse; saldo: bigint }>();
  for (const p of entradas) {
    if (p.saldo <= 0n) continue;
    const atual = somas.get(chave(p.grupo));
    somas.set(chave(p.grupo), { grupo: p.grupo, pai: p.pai, caminho: p.caminho, saldo: (atual?.saldo ?? 0n) + p.saldo });
  }
  const ordem = travessia(nos, profundidade);
  const grupos = [...somas.entries()]
    .map(([k, g]) => {
      const posicao = ordem.get(k);
      if (posicao === undefined) throw new ClassificacaoIncoerente(`grupo ${k} fora da árvore`);
      return { ...g, ordem: posicao };
    })
    .sort((a, b) => a.ordem - b.ordem);
  return { grupos, negativos, omitidos };
}

const porSaldoDecrescente = (a: { saldo: bigint; ordem: number }, b: { saldo: bigint; ordem: number }) =>
  a.saldo === b.saldo ? a.ordem - b.ordem : a.saldo > b.saldo ? -1 : 1;

export function comporFronteiraDeClasses(posicoes: readonly PosicaoDeClasse[], nos: ReadonlyMap<string, NoDaTaxonomia>, profundidade: ProfundidadeDeClasse): FronteiraDeClasses {
  const { grupos, negativos, omitidos } = agrupar(posicoes, nos, profundidade);
  const participacoes = ratear(grupos.map((g) => g.saldo));
  const linhas = grupos
    .map((g, i) => ({ ...g, participacao: participacoes[i] }))
    .sort(porSaldoDecrescente)
    .map(({ grupo, caminho, saldo, participacao }) => ({ grupo, caminho, saldo, participacao }));
  return { profundidade, base: grupos.reduce((soma, g) => soma + g.saldo, 0n), linhas, negativos, omitidos };
}

/**
 * Detalhe de um pai (macro ou subclasse): filhos imediatos e resíduo positivos, com as duas
 * participações, e os negativos do ramo. Pai inexistente ou terminal (tipo) devolve `null`; dado
 * incoerente na árvore ou nas posições é erro.
 */
export function detalharClasse(posicoes: readonly PosicaoDeClasse[], nos: ReadonlyMap<string, NoDaTaxonomia>, paiId: string): DetalheDeClasse | null {
  const pai = nos.get(paiId);
  if (!pai || pai.nivel > 2) return null;
  const caminhoDoPai = caminhoDoNo(paiId, nos).map((n) => ({ id: n.id, nome: n.nome }));

  const profundidade = (pai.nivel + 1) as ProfundidadeDeClasse;
  const { grupos, negativos } = agrupar(posicoes, nos, profundidade);
  const daCarteira = ratear(grupos.map((g) => g.saldo));
  const doPai = grupos.map((g, i) => ({ ...g, participacaoCarteira: daCarteira[i] })).filter((g) => g.pai === paiId);
  const noPai = ratear(doPai.map((g) => g.saldo));

  const linhas = doPai
    .map((g, i) => ({ ...g, participacaoPai: noPai[i] }))
    .sort(porSaldoDecrescente)
    .map(({ grupo, caminho, saldo, participacaoCarteira, participacaoPai }) => ({ grupo, caminho, saldo, participacaoCarteira, participacaoPai }));
  return {
    pai: { id: paiId, caminho: caminhoDoPai },
    base: doPai.reduce((soma, g) => soma + g.saldo, 0n),
    linhas,
    negativos: negativos.filter((n) => n.caminho.some((c) => c.id === paiId)),
  };
}
