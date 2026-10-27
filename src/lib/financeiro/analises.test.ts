import { describe, expect, it } from "vitest";
import { ClassificacaoIncoerente } from "./alocacao";
import { RecusaFinanceira } from "./centavos";
import { comporInstituicoes, InstituicaoIncoerente, type PosicaoInstitucional } from "./instituicao";
import { comporFronteiraDeClasses, detalharClasse, type NoDaTaxonomia, type PosicaoDeClasse } from "./niveis";
import { agruparOutros, ratear } from "./rateio";

// Bordas das análises por instituição e níveis de classe que os casos de referência não esgotam
// (KB-004, seção 15; ciclo 015, issue #152). Só dados fictícios.

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

describe("rateio pelo maior resto", () => {
  it("soma 10000, empata o resto pela ordem recebida e aceita lista vazia", () => {
    expect(ratear([1n, 1n, 1n])).toEqual([3334, 3333, 3333]);
    expect(ratear([1n, 7n, 4n])).toEqual([834, 5833, 3333]);
    expect(ratear([])).toEqual([]);
  });

  it("não perde precisão acima do inteiro seguro", () => {
    const g = 9007199254740991n;
    expect(ratear([g, g])).toEqual([5000, 5000]);
    expect(ratear([g * 3n, g])).toEqual([7500, 2500]);
  });

  it("recusa saldo que não é positivo", () => {
    expect(() => ratear([1n, 0n])).toThrow(RangeError);
    expect(() => ratear([1n, -1n])).toThrow(RangeError);
  });
});

describe("Outros depois do rateio", () => {
  const linha = (saldo: bigint, participacao: number) => ({ saldo, participacao });

  it("com até cinco linhas não há Outros", () => {
    const linhas = [linha(5n, 3000), linha(4n, 2500), linha(3n, 2000), linha(2n, 1500), linha(1n, 1000)];
    expect(agruparOutros(linhas)).toEqual({ principais: linhas, outros: null });
  });

  it("os demais somam saldo e participação dos componentes, sem novo rateio", () => {
    const linhas = [linha(30n, 3000), linha(20n, 2000), linha(15n, 1500), linha(12n, 1200), linha(10n, 1000), linha(8n, 800), linha(5n, 500)];
    const { principais, outros } = agruparOutros(linhas);
    expect(principais).toEqual(linhas.slice(0, 5));
    expect(outros).toEqual({ saldo: 13n, participacao: 1300, componentes: linhas.slice(5) });
    expect(principais.reduce((s, l) => s + l.participacao, 0) + outros!.participacao).toBe(10000);
  });

  it("Sem instituição e Em trânsito também podem cair em Outros, sempre com componentes identificados", () => {
    const posicoes: PosicaoInstitucional[] = [
      ...[1, 2, 3, 4, 5].map((n) => ({ id: uuid(n), nome: `Ativo ${n}`, saldo: 1000 * (10 - n), sistema: null, instituicao_id: uuid(100 + n) })),
      { id: uuid(6), nome: "Ativo 6", saldo: 300, sistema: null, instituicao_id: null },
      { id: uuid(7), nome: "Ativo 7", saldo: 200, sistema: "transito", instituicao_id: null },
    ];
    const catalogo = [1, 2, 3, 4, 5].map((n) => ({ id: uuid(100 + n), nome: `Instituição ${n}` }));
    const a = comporInstituicoes(posicoes, catalogo);
    const { principais, outros } = agruparOutros(a.linhas);
    expect(principais.map((l) => l.grupo.tipo)).toEqual(Array(5).fill("instituicao"));
    expect(outros!.componentes.map((l) => l.grupo.tipo)).toEqual(["sem_instituicao", "transito"]);
    expect(outros!.saldo).toBe(500n);
    expect(principais.reduce((s, l) => s + l.saldo, outros!.saldo)).toBe(a.base);
  });
});

describe("por instituição: fronteiras e recusas", () => {
  const p = (n: number, saldo: number, instituicao_id: string | null, sistema: string | null = null): PosicaoInstitucional => ({
    id: uuid(n),
    nome: `Ativo ${n}`,
    saldo,
    sistema,
    instituicao_id,
  });
  const catalogo = [{ id: uuid(101), nome: "Instituição A" }];

  it("o trânsito tem precedência sobre qualquer vínculo", () => {
    const a = comporInstituicoes([p(1, 100, uuid(101), "transito")], catalogo);
    expect(a.linhas).toEqual([{ grupo: { tipo: "transito", id: null, nome: null }, saldo: 100n, participacao: 10000 }]);
  });

  it("ID sem entrada no catálogo recusa a visão, mesmo numa posição negativa ou zerada", () => {
    for (const saldo of [100, -100, 0]) {
      expect(() => comporInstituicoes([p(1, saldo, uuid(999))], catalogo), String(saldo)).toThrow(InstituicaoIncoerente);
    }
  });

  it("instituição repetida no catálogo recusa a visão", () => {
    expect(() => comporInstituicoes([], [...catalogo, { id: uuid(101), nome: "Outra" }])).toThrow(InstituicaoIncoerente);
  });

  it("centavos fora dos inteiros seguros, fracionários ou NaN são recusados", () => {
    for (const saldo of [9007199254740992, 1.5, Number.NaN]) expect(() => comporInstituicoes([p(1, saldo, null)], catalogo)).toThrow(RecusaFinanceira);
  });

  it("sem posições ou só com zeros não há linhas nem base", () => {
    expect(comporInstituicoes([], catalogo)).toEqual({ base: 0n, linhas: [], negativos: [], omitidos: [] });
    const zeros = comporInstituicoes([p(1, 0, null)], catalogo);
    expect(zeros.linhas).toEqual([]);
    expect(zeros.omitidos).toEqual([{ id: uuid(1), nome: "Ativo 1" }]);
  });

  it("o negativo identifica o grupo atual e não reduz o positivo da mesma instituição", () => {
    const a = comporInstituicoes([p(1, 300, uuid(101)), p(2, -100, uuid(101))], catalogo);
    expect(a.linhas[0].saldo).toBe(300n);
    expect(a.negativos).toEqual([{ id: uuid(2), nome: "Ativo 2", saldo: -100n, grupo: { tipo: "instituicao", id: uuid(101), nome: "Instituição A" } }]);
  });
});

describe("níveis de classe: árvore, pai e recusas", () => {
  const MACRO_RF = "a5000000-0000-4000-8000-000000020000";
  const MACRO_RV = "a5000000-0000-4000-8000-000000030000";
  const MACRO_CX = "a5000000-0000-4000-8000-000000010000";
  const no = (id: string, parent_id: string | null, nivel: number, nome: string, ordem: number): NoDaTaxonomia => ({ id, parent_id, nivel, nome, ordem });
  const ARVORE = [
    no(MACRO_CX, null, 1, "Caixa e disponibilidades", 1),
    no(MACRO_RF, null, 1, "Renda fixa", 2),
    no(MACRO_RV, null, 1, "Renda variável", 3),
    no(uuid(21), MACRO_RF, 2, "Subclasse A", 1),
    no(uuid(22), MACRO_RF, 2, "Subclasse B", 2),
    no(uuid(31), uuid(21), 3, "Tipo A1", 1),
    no(uuid(32), uuid(21), 3, "Tipo A2", 2),
    no(uuid(41), MACRO_RV, 2, "Subclasse C", 1),
  ];
  const NOS = new Map(ARVORE.map((n) => [n.id, n]));
  const p = (n: number, saldo: number, taxonomia_id: string | null, sistema: string | null = null): PosicaoDeClasse => ({ id: uuid(n), nome: `Ativo ${n}`, saldo, sistema, taxonomia_id });

  it("pai inexistente ou terminal (tipo) não tem detalhe", () => {
    expect(detalharClasse([p(1, 100, uuid(31))], NOS, uuid(999))).toBeNull();
    expect(detalharClasse([p(1, 100, uuid(31))], NOS, uuid(31))).toBeNull();
  });

  it("cada positivo entra uma vez em cada fronteira, com o resíduo certo em cada profundidade", () => {
    const posicoes = [p(1, 100, uuid(31)), p(2, 200, uuid(21)), p(3, 400, MACRO_RF), p(4, 800, uuid(41)), p(5, 1600, null), p(6, 3200, null, "transito")];
    const f2 = comporFronteiraDeClasses(posicoes, NOS, 2);
    const f3 = comporFronteiraDeClasses(posicoes, NOS, 3);
    const por = (f: typeof f2) => f.linhas.map((l) => `${l.grupo.tipo}:${l.grupo.no ?? ""}=${l.saldo}`).sort();
    expect(por(f2)).toEqual(
      [`no:${uuid(21)}=300`, `residuo:${MACRO_RF}=400`, `no:${uuid(41)}=800`, "sem_classe:=1600", "transito:=3200"].sort(),
    );
    expect(por(f3)).toEqual(
      [`no:${uuid(31)}=100`, `residuo:${uuid(21)}=200`, `residuo:${MACRO_RF}=400`, `residuo:${uuid(41)}=800`, "sem_classe:=1600", "transito:=3200"].sort(),
    );
    expect(f2.base).toBe(6300n);
    expect(f3.base).toBe(6300n);
  });

  it("um pai sem positivos não tem linhas nem percentuais, mas mantém os negativos do ramo", () => {
    const d = detalharClasse([p(1, -50, uuid(31)), p(2, -20, MACRO_RV), p(3, 100, MACRO_RV)], NOS, uuid(21))!;
    expect(d.linhas).toEqual([]);
    expect(d.base).toBe(0n);
    expect(d.negativos.map((n) => n.id)).toEqual([uuid(1)]);
    expect(d.negativos[0].caminho.map((n) => n.nome)).toEqual(["Renda fixa", "Subclasse A", "Tipo A1"]);
  });

  it("os negativos do detalhe de uma macro incluem os vínculos diretos e os descendentes; o de outra macro fica de fora", () => {
    const posicoes = [p(1, 100, uuid(21)), p(2, -50, MACRO_RF), p(3, -30, uuid(32)), p(4, -10, uuid(41))];
    expect(detalharClasse(posicoes, NOS, MACRO_RF)!.negativos.map((n) => n.id)).toEqual([uuid(2), uuid(3)]);
    expect(detalharClasse(posicoes, NOS, MACRO_RV)!.negativos.map((n) => n.id)).toEqual([uuid(4)]);
  });

  it("o resíduo do pai vem depois dos filhos no empate e traz o caminho do pai", () => {
    const d = detalharClasse([p(1, 100, uuid(22)), p(2, 100, MACRO_RF), p(3, 100, uuid(21))], NOS, MACRO_RF)!;
    expect(d.linhas.map((l) => `${l.grupo.tipo}:${l.grupo.no}`)).toEqual([`no:${uuid(21)}`, `no:${uuid(22)}`, `residuo:${MACRO_RF}`]);
    expect(d.linhas.map((l) => l.participacaoPai)).toEqual([3334, 3333, 3333]);
    expect(d.linhas[2].caminho.map((n) => n.id)).toEqual([MACRO_RF]);
    expect(d.pai.caminho.map((n) => n.nome)).toEqual(["Renda fixa"]);
  });

  it("as macros seguem a ordem fixa, não a ordem dos nós na entrada", () => {
    const invertida = new Map([...NOS].reverse());
    const posicoes = [p(1, 100, MACRO_RV), p(2, 100, MACRO_CX), p(3, 100, MACRO_RF)];
    const nomes = (nos: ReadonlyMap<string, NoDaTaxonomia>) => comporFronteiraDeClasses(posicoes, nos, 2).linhas.map((l) => l.caminho[0].nome);
    expect(nomes(NOS)).toEqual(["Caixa e disponibilidades", "Renda fixa", "Renda variável"]);
    expect(nomes(invertida)).toEqual(nomes(NOS));
  });

  it("nó fora da árvore, nível inválido, pai errado ou raiz que não é macro recusam a visão, também em posição zerada", () => {
    const invalidos: NoDaTaxonomia[][] = [
      [no(uuid(51), MACRO_RF, 4, "Nível 4", 1)],
      [no(uuid(51), MACRO_RF, 3, "Tipo sob a macro", 1)],
      [no(uuid(51), null, 1, "Raiz sem macro", 7)],
      [no(uuid(51), uuid(999), 2, "Pai ausente", 1)],
    ];
    for (const extras of invalidos) {
      const nos = new Map([...ARVORE, ...extras].map((n) => [n.id, n]));
      for (const saldo of [100, -100, 0]) {
        expect(() => comporFronteiraDeClasses([p(1, saldo, uuid(51))], nos, 2), `${extras[0].nome} ${saldo}`).toThrow(ClassificacaoIncoerente);
      }
    }
    expect(() => comporFronteiraDeClasses([p(1, 100, uuid(999))], NOS, 3)).toThrow(ClassificacaoIncoerente);
  });

  it("centavos fora dos inteiros seguros são recusados", () => {
    for (const saldo of [9007199254740992, 1.5, Number.NaN]) expect(() => comporFronteiraDeClasses([p(1, saldo, uuid(21))], NOS, 2)).toThrow(RecusaFinanceira);
  });

  it("renomear um nó não muda o desempate; nós homônimos em ramos diferentes continuam distintos", () => {
    const posicoes = [p(1, 100, uuid(21)), p(2, 100, uuid(22)), p(3, 100, uuid(41))];
    const antes = detalharClasse(posicoes, NOS, MACRO_RF)!.linhas.map((l) => l.participacaoPai);
    const renomeada = new Map(NOS).set(uuid(21), no(uuid(21), MACRO_RF, 2, "Zzz", 1));
    expect(detalharClasse(posicoes, renomeada, MACRO_RF)!.linhas.map((l) => l.participacaoPai)).toEqual(antes);
    expect(antes).toEqual([5000, 5000]);
  });
});
