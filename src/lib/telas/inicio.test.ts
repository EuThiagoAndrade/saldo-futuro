import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Retornos } from "../financeiro/acumulado";
import { type Centavos, RecusaFinanceira } from "../financeiro/centavos";
import type { Evento } from "../financeiro/eventos";
import { ND } from "../financeiro/rentabilidade";
import {
  aportesLiquidos,
  inicioDaCarteira,
  limitesDoPeriodo,
  mesDeReferencia,
  resultadoDoPeriodo,
  retornosDaCarteira,
  type TipoDePeriodo,
  variacaoDeM,
} from "./inicio";

// Composição do Início contra os casos de referência (KB-004, seções 7, 8 e 15).

/* eslint-disable @typescript-eslint/no-explicit-any */
const casos: any[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const caso = (id: string) => casos.find((c) => c.id === id);

/** Razões com 1e-9 × max(1, |esperado|) (P3); textos e N/D por igualdade. */
function conferir(obtido: unknown, esperado: unknown, rotulo: string) {
  if (typeof esperado === "number" && typeof obtido === "number") {
    expect(Math.abs(obtido - esperado), `${rotulo}: ${obtido}`).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(esperado)));
  } else {
    expect(obtido, rotulo).toEqual(esperado);
  }
}

const limites = (p: { de: string; ate: string }) => `${p.de}/${p.ate}`;

describe("CR-51 — limites dos períodos do Início", () => {
  const { entrada, esperado } = caso("CR-51");
  const retornos: Retornos = entrada.retornos;
  const M = mesDeReferencia(entrada.meses_fechados)!;
  const inicio = inicioDaCarteira(entrada.meses_fechados)!;

  it("M é o último mês fechado e o início é o primeiro", () => {
    expect(M).toBe("2026-04");
    expect(inicio).toBe(entrada.inicio);
  });

  it("limites inclusivos dos quatro períodos fixos", () => {
    const chaves: [TipoDePeriodo, string][] = [
      ["mes", "limites_mes"],
      ["ano", "limites_ano"],
      ["12_meses", "limites_12_meses"],
      ["desde_inicio", "limites_desde_inicio"],
    ];
    for (const [tipo, chave] of chaves) expect(limites(limitesDoPeriodo(tipo, M, inicio))).toBe(esperado[chave]);
  });

  it("resultados, N/D e sugestão de K1", () => {
    for (const consulta of entrada.consultas) {
      const intervalo = consulta.de ? { de: consulta.de, ate: consulta.ate } : undefined;
      let obtido: unknown;
      try {
        const r = resultadoDoPeriodo(retornos, inicio, limitesDoPeriodo(consulta.periodo, M, inicio, intervalo));
        obtido = r.acumulado;
        if (consulta.chave === "ano") {
          conferir(limites(r.sugestao!.periodo), esperado.sugestao_ano_limites, "sugestao_ano_limites");
          conferir(r.sugestao!.valor, esperado.sugestao_ano, "sugestao_ano");
        }
      } catch (erro) {
        obtido = `recusado_${(erro as RecusaFinanceira).motivo}`;
      }
      conferir(obtido, esperado[consulta.chave], consulta.chave);
    }
  });

  it("sem fechamento, depois de reabrir e na virada do ano", () => {
    expect(mesDeReferencia(entrada.sem_fechamento.meses_fechados) ?? ND).toBe(esperado.mes_referencia_sem_fechamento);
    expect(mesDeReferencia(entrada.apos_reabrir.meses_fechados)).toBe(esperado.mes_referencia_apos_reabrir_2026_04);
    const virada = entrada.virada.meses_fechados_ate;
    expect(limites(limitesDoPeriodo("ano", virada, inicio))).toBe(esperado.limites_ano_na_virada);
  });
});

const ev = (e: any): Evento => ({ ...e, valor: BigInt(e.valor) as Centavos, estornoDe: e.referencia });

describe("CR-52 — aportes líquidos", () => {
  const { entrada, esperado } = caso("CR-52");
  it("com M e sem fechamento", () => {
    expect(aportesLiquidos(entrada.a.eventos.map(ev), entrada.a.mes_referencia)).toBe(BigInt(esperado.aportes_liquidos));
    expect(aportesLiquidos(entrada.b.eventos.map(ev), null)).toBe(BigInt(esperado.aportes_liquidos_sem_fechamento));
  });
});

describe("rentabilidade dos meses fechados (CR-20, CR-24) e patrimônio com trânsito (CR-17)", () => {
  it("CR-20: Dietz com aporte no meio do mês e variação", () => {
    const { entrada, esperado } = caso("CR-20");
    const meses = [
      { mes: "2026-03", vi: 0n, vf: 1000000n },
      { mes: entrada.mes, vi: BigInt(entrada.vi), vf: BigInt(entrada.vf) },
    ];
    const retornos = retornosDaCarteira(meses, entrada.eventos.map(ev), "2026-03");
    conferir(retornos[entrada.mes], esperado.retorno, "retorno");
    expect(retornos["2026-03"]).toBe(ND); // início da carteira
    conferir(variacaoDeM(meses[1]), esperado.variacao, "variacao");
  });

  it("CR-24: estorno de aporte de mês já fechado resolve o evento anterior", () => {
    const { entrada, esperado } = caso("CR-24");
    // O estorno não traz valor: vale o oposto do evento referenciado (KB-004, 4.3).
    const porId = new Map(entrada.eventos_anteriores.map((e: any) => [e.id, e]));
    const estornos = entrada.eventos.map((e: any) => ({ ...e, valor: -(porId.get(e.referencia) as any).valor }));
    const eventos = [...entrada.eventos_anteriores, ...estornos].map(ev);
    const retornos = retornosDaCarteira([{ mes: entrada.mes, vi: BigInt(entrada.vi), vf: BigInt(entrada.vf) }], eventos, "2025-12");
    conferir(retornos[entrada.mes], esperado.retorno, "retorno");
  });

  it("CR-17: o patrimônio de M é o Vf, trânsito incluído", () => {
    const { esperado } = caso("CR-17");
    expect(esperado.vf).toBe(805000 + esperado.saldo_final_T);
  });
});

describe("CR-32, CR-33, CR-35, CR-36 e CR-37 pelo resultado do período", () => {
  it("CR-32 e CR-33", () => {
    for (const id of ["CR-32", "CR-33"]) {
      const { entrada, esperado } = caso(id);
      for (const consulta of entrada.consultas) {
        conferir(resultadoDoPeriodo(entrada.retornos, entrada.inicio, consulta).acumulado, esperado[consulta.chave], `${id}.${consulta.chave}`);
      }
    }
  });

  it("CR-33: a sugestão do período até abril é março a abril", () => {
    const { entrada, esperado } = caso("CR-33");
    const r = resultadoDoPeriodo(entrada.retornos, entrada.inicio, { de: "2025-12", ate: "2026-04" });
    expect(limites(r.sugestao!.periodo)).toBe("2026-03/2026-04");
    conferir(r.sugestao!.valor, esperado.periodo_2026_03_a_2026_04, "sugestao");
  });

  it("CR-35: N/D logo depois do início; a sugestão é só março", () => {
    const { entrada, esperado } = caso("CR-35");
    const r = resultadoDoPeriodo(entrada.retornos, entrada.inicio, { de: "2026-01", ate: "2026-03" });
    conferir(r.acumulado, esperado.ano_ate_2026_03, "ano");
    expect(limites(r.sugestao!.periodo)).toBe("2026-03/2026-03");
    conferir(r.sugestao!.valor, esperado.periodo_2026_03, "sugestao");
  });

  it("CR-36: base 100, acumulado e drawdown", () => {
    const { entrada, esperado } = caso("CR-36");
    const r = resultadoDoPeriodo(entrada.retornos, entrada.inicio, { de: "2026-01", ate: "2026-04" });
    expect(r.mesesBase100).toEqual(["2026-01", "2026-02", "2026-03", "2026-04"]);
    ["2026_01", "2026_02", "2026_03", "2026_04"].forEach((m, i) => conferir((r.base100 as number[])[i], esperado[`base100_${m}`], m));
    conferir(r.acumulado, esperado.acumulado, "acumulado");
    conferir(r.drawdown, esperado.drawdown_maximo, "drawdown");
    expect(r.sugestao).toBeNull();
  });

  it("CR-37: drawdown com o primeiro mês negativo e com N/D", () => {
    const { entrada, esperado } = caso("CR-37");
    const [a, b] = entrada.series;
    conferir(resultadoDoPeriodo(a.retornos, a.inicio, a).drawdown, esperado.drawdown_maximo_a, "a");
    conferir(resultadoDoPeriodo(b.retornos, b.inicio, b).drawdown, esperado.drawdown_maximo_b, "b");
    expect(resultadoDoPeriodo(b.retornos, b.inicio, b).base100).toBe(ND);
  });
});
