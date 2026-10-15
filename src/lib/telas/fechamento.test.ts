import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Centavos, RecusaFinanceira } from "../financeiro/centavos";
import type { Evento } from "../financeiro/eventos";
import { previaFechamento } from "../financeiro/fechamento";
import { mensagemDeRecusa } from "./carteira";
import {
  type AtivoLido,
  entradaDoFechamento,
  linhasDoFechamento,
  mesTerminadoAberto,
  type PosicaoLida,
  proximoMesAFechar,
  situacaoDoMes,
} from "./fechamento";

// A composição monta, a partir de linhas como a Data API as devolve, a mesma entrada dos casos de
// referência; a prévia é a de src/lib/financeiro (D4).

/* eslint-disable @typescript-eslint/no-explicit-any */
const casos: any[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const caso = (id: string) => casos.find((c) => c.id === id);

function lidos(entrada: any): { ativos: AtivoLido[]; posicoes: PosicaoLida[]; eventos: Evento[] } {
  const ativos = entrada.ativos.map((a: any) => ({
    id: a.id,
    nome: a.id,
    tipo_ajuste: a.tipo_ajuste ?? null,
    sistema: a.sistema ?? null,
    ativo: true,
  }));
  // Os saldos iniciais do caso são as posições do mês fechado anterior.
  const anterior = `${entrada.mes.slice(0, 4)}-${String(Number(entrada.mes.slice(5)) - 1).padStart(2, "0")}-01`;
  const posicoes = Object.entries<number>(entrada.saldos_iniciais).map(([id, saldo]) => ({
    mes: anterior,
    ativo_id: id,
    saldo_inicial: 0,
    saldo_final: saldo,
    ajuste: 0,
    tipo_ajuste: null,
  }));
  const eventos = entrada.eventos.map((e: any) => ({ ...e, valor: BigInt(e.valor) as Centavos }));
  return { ativos, posicoes, eventos };
}

const reais = (saldos: Record<string, number>) => Object.fromEntries(Object.entries(saldos).map(([k, v]) => [k, BigInt(v)]));

describe("CR-12 — linhas e prévia do fechamento", () => {
  const { entrada, esperado } = caso("CR-12");
  const { ativos, posicoes, eventos } = lidos(entrada);
  const montada = entradaDoFechamento(entrada.mes, ativos, posicoes, eventos, reais(entrada.saldos_reais));

  it("as linhas pedem saldo real de A e B, com o saldo calculado do caso", () => {
    expect(linhasDoFechamento(montada).map((l) => [l.ativo, l.saldoCalculado, l.exigeSaldoReal])).toEqual([
      ["A", BigInt(esperado.saldo_calculado_A), true],
      ["B", BigInt(esperado.saldo_calculado_B), true],
    ]);
  });

  it("a prévia dá os ajustes e o consolidado esperados", () => {
    const previa = previaFechamento(montada);
    const porAtivo = Object.fromEntries(previa.posicoes.map((p) => [p.ativo, p]));
    expect(porAtivo.A.ajuste).toBe(BigInt(esperado.ajuste_A));
    expect(porAtivo.A.tipoAjuste).toBe(esperado.tipo_ajuste_A);
    expect(porAtivo.B.ajuste).toBe(BigInt(esperado.ajuste_B));
    expect(porAtivo.B.tipoAjuste).toBe(esperado.tipo_ajuste_B);
    expect(previa.consolidado.vi).toBe(BigInt(esperado.vi));
    expect(previa.consolidado.vf).toBe(BigInt(esperado.vf));
    expect(previa.consolidado.rendimento).toBe(BigInt(esperado.rendimento));
    expect(previa.consolidado.marcacao).toBe(BigInt(esperado.marcacao));
  });
});

describe("CR-13 — pendência", () => {
  const { entrada, esperado } = caso("CR-13");
  const { ativos, posicoes, eventos } = lidos(entrada);
  const montada = entradaDoFechamento(entrada.mes, ativos, posicoes, eventos, reais(entrada.saldos_reais));

  it("o trânsito entra pelo saldo calculado, sem pedir saldo real", () => {
    const linhas = linhasDoFechamento(montada);
    expect(linhas.filter((l) => l.exigeSaldoReal).map((l) => l.ativo)).toEqual(["A", "B"]);
    expect(linhas.find((l) => l.ativo === "T")).toBeUndefined(); // sem saldo nem evento no mês
  });

  it("a prévia recusa com os pendentes do caso e a tela traduz a recusa", () => {
    try {
      previaFechamento(montada);
      throw new Error("não recusou");
    } catch (erro) {
      expect(erro).toBeInstanceOf(RecusaFinanceira);
      expect((erro as RecusaFinanceira).detalhe).toEqual(esperado.pendentes);
      expect(mensagemDeRecusa(erro)).toMatch(/saldo real/);
    }
  });
});

describe("CR-15 e CR-18 — situação do mês na tela", () => {
  it("CR-15: sequência e reabertura só do último mês", () => {
    const { hoje } = caso("CR-15").entrada;
    const fechados = ["2026-01", "2026-02"];
    expect(situacaoDoMes("2026-04", hoje, fechados, "2026-01")).toEqual({ tipo: "recusado", motivo: "sequencia" });
    expect(situacaoDoMes("2026-01", hoje, fechados, "2026-01")).toEqual({ tipo: "fechado", podeReabrir: false });
    expect(situacaoDoMes("2026-03", hoje, fechados, "2026-01")).toEqual({ tipo: "pode_fechar" });
    expect(situacaoDoMes("2026-02", hoje, fechados, "2026-01")).toEqual({ tipo: "fechado", podeReabrir: true });
  });

  it("CR-18: em 14/10 e 31/10, outubro não fecha; em 01/11, fecha", () => {
    const fechados = ["2026-09"];
    expect(situacaoDoMes("2026-10", "2026-10-14", fechados, "2026-01")).toEqual({ tipo: "recusado", motivo: "mes_nao_terminado" });
    expect(situacaoDoMes("2026-10", "2026-10-31", fechados, "2026-01")).toEqual({ tipo: "recusado", motivo: "mes_nao_terminado" });
    expect(situacaoDoMes("2026-10", "2026-11-01", fechados, "2026-01")).toEqual({ tipo: "pode_fechar" });
  });

  it("o primeiro fechamento é o mês do evento mais antigo (K7)", () => {
    expect(situacaoDoMes("2026-03", "2026-10-14", [], "2026-02")).toEqual({ tipo: "recusado", motivo: "inicio" });
    expect(proximoMesAFechar(null, "2026-02")).toBe("2026-02");
    expect(proximoMesAFechar("2026-02", "2026-01")).toBe("2026-03");
  });

  it("o Início avisa só quando o próximo mês a fechar já terminou", () => {
    expect(mesTerminadoAberto("2026-08", "2026-01", "2026-10-14")).toBe("2026-09");
    expect(mesTerminadoAberto("2026-09", "2026-01", "2026-10-14")).toBeNull();
    expect(mesTerminadoAberto(null, null, "2026-10-14")).toBeNull();
  });
});
