import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { alocacaoPorInstituicao, MACRO_DO_GRUPO, nomeDoGrupoInstitucional, ramoDeClasse } from "./analises-inicio";
import type { Ativo } from "./leituras";
import type { NoTaxonomia } from "./taxonomia";

// Composição das análises do Início (ciclo 015, issue #154): une os insumos lidos às funções puras.
// Só dados fictícios; os cálculos são provados em CR-015-01 a CR-015-16.

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const RF = "a5000000-0000-4000-8000-000000020000";
const SUB = uuid(21);
const TIPO = uuid(31);

const ativo = (n: number, extras: Partial<Ativo> = {}): Ativo => ({
  id: uuid(n),
  nome: `Ativo ${n}`,
  tipo_ajuste: "rendimento",
  sistema: null,
  ativo: true,
  desativado_em: null,
  instituicao_id: null,
  taxonomia_id: null,
  classe_id: null,
  previdencia: null,
  liquidez_imediata: null,
  exposicao_cambial: null,
  isento_ir: null,
  ...extras,
});
const posicao = (n: number, saldo_final: number) => ({ mes: "2026-03-01", ativo_id: uuid(n), saldo_inicial: 0, saldo_final, ajuste: 0, tipo_ajuste: null });
const NOS: NoTaxonomia[] = [
  { id: RF, parent_id: null, nivel: 1, nome: "Renda fixa", ordem: 2 },
  { id: SUB, parent_id: RF, nivel: 2, nome: "Subclasse fictícia", ordem: 1 },
  { id: TIPO, parent_id: SUB, nivel: 3, nome: "Tipo fictício", ordem: 1 },
];

describe("alocacaoPorInstituicao", () => {
  const instituicoes = [{ id: uuid(101), nome: "Banco fictício" }];

  it("agrupa pela instituição atual, com o trânsito pelo rótulo do sistema e Sem instituição à parte", () => {
    const ativos = [ativo(1, { instituicao_id: uuid(101) }), ativo(2), ativo(3, { sistema: "transito", nome: "Em trânsito" }), ativo(4, { instituicao_id: uuid(101) })];
    const a = alocacaoPorInstituicao({ ativos, instituicoes }, [posicao(1, 300), posicao(2, 100), posicao(3, 100), posicao(4, -50)])!;
    expect(a.linhas.map((l) => [nomeDoGrupoInstitucional(l.grupo), l.saldo, l.participacao])).toEqual([
      ["Banco fictício", 300n, 6000],
      ["Sem instituição", 100n, 2000],
      ["Em trânsito", 100n, 2000],
    ]);
    expect(a.negativos.map((n) => [n.nome, nomeDoGrupoInstitucional(n.grupo)])).toEqual([["Ativo 4", "Banco fictício"]]);
  });

  it("instituição fora do catálogo ou ativo ausente tornam a análise indisponível", () => {
    expect(alocacaoPorInstituicao({ ativos: [ativo(1, { instituicao_id: uuid(999) })], instituicoes }, [posicao(1, 100)])).toBeNull();
    expect(alocacaoPorInstituicao({ ativos: [], instituicoes }, [posicao(1, 100)])).toBeNull();
  });
});

describe("ramoDeClasse", () => {
  const insumos = { ativos: [ativo(1, { taxonomia_id: TIPO }), ativo(2, { taxonomia_id: SUB }), ativo(3, { taxonomia_id: RF })], nos: NOS };
  const posicoes = [posicao(1, 100), posicao(2, 100), posicao(3, 100)];

  it("sem pedido é a raiz", () => {
    expect(ramoDeClasse(insumos, posicoes, undefined)).toEqual({ tipo: "raiz" });
    expect(ramoDeClasse(insumos, posicoes, "")).toEqual({ tipo: "raiz" });
  });

  it("macro e subclasse abrem o detalhe; o UUID em maiúsculas vale como o canônico", () => {
    const macro = ramoDeClasse(insumos, posicoes, RF);
    expect(macro).toMatchObject({ tipo: "detalhe", detalhe: { pai: { id: RF } } });
    expect(ramoDeClasse(insumos, posicoes, RF.toUpperCase())).toEqual(macro);
    const sub = ramoDeClasse(insumos, posicoes, SUB);
    expect(sub).toMatchObject({ tipo: "detalhe", detalhe: { pai: { id: SUB } } });
  });

  it("tipo, inexistente ou texto qualquer são inválidos e voltam à raiz", () => {
    for (const pedido of [TIPO, uuid(999), "nao-e-um-uuid", "__proto__"]) expect(ramoDeClasse(insumos, posicoes, pedido), pedido).toEqual({ tipo: "invalido" });
  });

  it("dado incoerente (nó ou ativo que faltam) torna a análise indisponível, não o ramo inválido", () => {
    expect(ramoDeClasse({ ativos: [ativo(1, { taxonomia_id: uuid(999) })], nos: NOS }, [posicao(1, 100)], RF)).toBeNull();
    expect(ramoDeClasse({ ativos: [], nos: NOS }, [posicao(1, 100)], RF)).toBeNull();
  });
});

describe("MACRO_DO_GRUPO", () => {
  it("só as seis classes macro têm detalhe; trânsito e Sem classe não", () => {
    expect(Object.keys(MACRO_DO_GRUPO)).toEqual(["caixa", "renda_fixa", "renda_variavel", "exterior", "cripto", "alternativos"]);
    expect(MACRO_DO_GRUPO.renda_fixa).toBe(RF);
  });
});
