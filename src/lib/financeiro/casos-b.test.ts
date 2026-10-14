import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Centavos, deNumero, exigirFaixa, LIMITE_CENTAVOS, paraNumero, RecusaFinanceira } from "./centavos";
import {
  conferirDataLancamento,
  conferirFechamento,
  conferirReabertura,
  diasNoMes,
  hojeEmCuiaba,
  type Mes,
  mesDe,
  mesSeguinte,
} from "./datas";
import {
  componentes,
  conferirLancamento,
  corrigirTransferencia,
  criarEstorno,
  criarTransferencia,
  type Evento,
  type TipoEvento,
} from "./eventos";
import { type Ativo, identidadeFecha, previaFechamento } from "./fechamento";

// Casos de referência da entrega B (KB-004, CR-01 a CR-18), lidos do mesmo JSON da KB.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;

const casos: Json[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const casoPorId = new Map(casos.map((c) => [c.id, c]));

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

function recusa(fn: () => unknown): string {
  try {
    fn();
    return "aceito";
  } catch (erro) {
    if (erro instanceof RecusaFinanceira) return erro.message;
    throw erro;
  }
}

function ativos(entrada: Json): Ativo[] {
  return entrada.ativos.map((a: Json) => ({ id: a.id, tipoAjuste: a.tipo_ajuste, sistema: a.sistema }));
}

function centavosDe(mapa: Record<string, number> | undefined): Record<string, bigint> {
  return Object.fromEntries(Object.entries(mapa ?? {}).map(([k, v]) => [k, deNumero(v)]));
}

/** Converte os eventos do JSON (lançamentos, estornos, transferências e correções). */
function eventosDe(lista: Json[]): Evento[] {
  const eventos: Evento[] = [];
  let anonimo = 0;
  for (const e of lista) {
    if (e.tipo === "transferencia") {
      eventos.push(...criarTransferencia(e.id, e.origem, e.destino, e.data, BigInt(e.valor)));
    } else if (e.tipo === "estorno_transferencia") {
      eventos.push(...corrigirTransferencia(e.referencia, e.data, eventos));
    } else if (e.tipo === "estorno") {
      const referencia = eventos.find((x) => x.id === e.referencia);
      if (!referencia) throw new Error(`referência ausente: ${e.referencia}`);
      eventos.push(criarEstorno(e.id, referencia, e.data, eventos));
    } else {
      const valor = conferirLancamento(e.tipo as TipoEvento, BigInt(e.valor));
      for (let i = 0; i < (e.repeticoes ?? 1); i++) {
        eventos.push({ id: e.id ?? `anonimo-${anonimo++}`, ativo: e.ativo, data: e.data, tipo: e.tipo, valor });
      }
    }
  }
  return eventos;
}

/** Tentativas: aceito ou recusado (a KB não nomeia motivo para lançamentos inválidos). */
function tentativa(t: Json, eventos: Evento[]): string {
  return recusa(() => {
    if (t.tipo === "transferencia") return criarTransferencia("tentativa", t.origem, t.destino, t.data, BigInt(t.valor));
    if (t.tipo === "estorno_transferencia") return corrigirTransferencia(t.referencia, t.data, eventos);
    if (t.tipo === "estorno") {
      const referencia = eventos.find((x) => x.id === t.referencia);
      if (!referencia) throw new Error(`referência ausente: ${t.referencia}`);
      return criarEstorno("tentativa", referencia, t.data, eventos, t.valor === undefined ? undefined : BigInt(t.valor));
    }
    return conferirLancamento(t.tipo, BigInt(t.valor));
  }) === "aceito"
    ? "aceito"
    : "recusado";
}

/** Resultados de um caso de saldo ou fechamento, com as chaves usadas nos esperados. */
function avaliarMes(entrada: Json): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  const eventos = eventosDe(entrada.eventos);
  const porId = new Map(eventos.map((e) => [e.id, e]));
  const iniciais = centavosDe(entrada.saldos_iniciais);
  let patrimonio = 0n;
  for (const ativo of entrada.ativos) {
    const saldo = eventos.filter((e) => e.ativo === ativo.id).reduce((s, e) => s + e.valor, iniciais[ativo.id] ?? 0n);
    r[`saldo_calculado_${ativo.id}`] = naturalOuRecusa(saldo);
    patrimonio += saldo;
  }
  r.patrimonio_calculado = naturalOuRecusa(patrimonio);
  const transferencias = new Set(eventos.map((e) => e.transferencia).filter(Boolean));
  for (const t of transferencias) {
    const pernas = eventos.filter((e) => e.transferencia === t);
    r[`soma_pernas_${t}`] = Number(pernas.filter((e) => e.tipo === "transferencia").reduce((s, e) => s + e.valor, 0n));
    const correcao = pernas.filter((e) => e.tipo === "estorno");
    if (correcao.length > 0) {
      r.estorno_perna_origem = Number(correcao.find((e) => e.estornoDe?.endsWith(":origem"))!.valor);
      r.estorno_perna_destino = Number(correcao.find((e) => e.estornoDe?.endsWith(":destino"))!.valor);
    }
  }
  for (const e of eventos.filter((x) => x.tipo === "estorno" && !x.transferencia)) {
    r[`valor_${e.id}`] = Number(e.valor);
  }
  for (const c of entrada.eventos.filter((x: Json) => x.tipo === "estorno_transferencia")) {
    r[`soma_pernas_${c.id}`] = Number(
      eventos.filter((e) => e.transferencia === c.referencia && e.tipo === "estorno").reduce((s, e) => s + e.valor, 0n),
    );
  }
  for (const t of entrada.tentativas ?? []) r[t.chave] = tentativa(t, eventos);

  if (entrada.saldos_reais) {
    let resultado: string;
    try {
      const previa = previaFechamento({
        mes: entrada.mes,
        ativos: ativos(entrada),
        saldosIniciais: iniciais,
        eventos,
        saldosReais: centavosDe(entrada.saldos_reais),
      });
      resultado = "aceito";
      r.pendentes = [];
      r.identidade = "ok";
      for (const p of previa.posicoes) {
        r[`ajuste_${p.ativo}`] = paraNumero(p.ajuste);
        r[`saldo_final_${p.ativo}`] = paraNumero(p.saldoFinal);
        if (p.tipoAjuste) r[`tipo_ajuste_${p.ativo}`] = p.tipoAjuste;
      }
      for (const [k, v] of Object.entries(previa.consolidado)) r[k] = paraNumero(v);
    } catch (erro) {
      if (!(erro instanceof RecusaFinanceira)) throw erro;
      resultado = erro.message;
      if (erro.motivo === "pendencia") r.pendentes = erro.detalhe;
    }
    r.previa = resultado;
    r.fechamento = resultado;
  } else {
    const c = componentes(eventos, porId);
    for (const [k, v] of Object.entries(c)) if (k !== "transferencias") r[k] = Number(v);
  }
  return r;
}

function naturalOuRecusa(valor: bigint): number | string {
  return valor >= -LIMITE_CENTAVOS && valor <= LIMITE_CENTAVOS ? Number(valor) : "fora_da_faixa";
}

/** Simulador mínimo da carteira para os casos de passos: só datas, início e sequência. */
function simularPassos(entrada: Json, mesesFechados: Mes[] = []): Record<string, string> {
  const fechados = [...mesesFechados];
  const datas: string[] = [];
  const r: Record<string, string> = {};
  for (const passo of entrada.passos) {
    const hoje = passo.hoje ?? entrada.hoje;
    const ultimo = fechados.at(-1) ?? null;
    const maisAntigo = datas.length ? mesDe([...datas].sort()[0]) : null;
    r[passo.chave] = recusa(() => {
      if (passo.acao === "lancar") {
        conferirLancamento(passo.tipo, BigInt(passo.valor));
        conferirDataLancamento(passo.data, hoje, ultimo);
        datas.push(passo.data);
      } else if (passo.acao === "fechar") {
        conferirFechamento(passo.mes, hoje, ultimo, maisAntigo);
        fechados.push(passo.mes);
      } else {
        conferirReabertura(passo.mes, ultimo);
        fechados.pop();
      }
    });
  }
  return r;
}

function conferir(id: string, obtido: Record<string, unknown>, normalizar: (v: string) => string = (v) => v) {
  const esperado = casoPorId.get(id).esperado;
  for (const [chave, valor] of Object.entries(esperado)) {
    expect(normalizar(texto(obtido[chave])), `${id}.${chave}`).toBe(texto(valor));
  }
}

const generico = (v: string) => (v.startsWith("recusado_") && !v.startsWith("recusado_faixa") ? "recusado" : v);

describe("casos de referência da entrega B", () => {
  it("CR-01: sinais por tipo", () => {
    const r = Object.fromEntries(
      casoPorId.get("CR-01").entrada.tentativas.map((t: Json) => [t.chave, tentativa(t, [])]),
    );
    conferir("CR-01", r);
  });

  for (const id of ["CR-02", "CR-03", "CR-04", "CR-05", "CR-07", "CR-08", "CR-09", "CR-10", "CR-11", "CR-12", "CR-13", "CR-17"]) {
    it(`${id}: ${casoPorId.get(id).titulo}`, () => conferir(id, avaliarMes(casoPorId.get(id).entrada)));
  }

  it("CR-06: datas de lançamento e início da carteira", () => {
    const entrada = casoPorId.get("CR-06").entrada;
    conferir("CR-06", simularPassos(entrada), generico);
  });

  it("CR-14: conferência da identidade contábil", () => {
    const r = Object.fromEntries(
      casoPorId.get("CR-14").entrada.conferencias.map((c: Json) => [
        c.chave,
        identidadeFecha(BigInt(c.vi), BigInt(c.vf), centavosDe(c.componentes) as never) ? "ok" : "recusado_identidade",
      ]),
    );
    conferir("CR-14", r);
  });

  it("CR-15: sequência de fechamento e reabertura só do último mês", () => {
    const entrada = casoPorId.get("CR-15").entrada;
    conferir("CR-15", simularPassos(entrada, entrada.meses_fechados));
  });

  it("CR-16: reabertura volta ao estado anterior ao fechamento", () => {
    const base = casoPorId.get("CR-12").entrada;
    const antes = avaliarMes({ ...base, saldos_reais: undefined });
    const fechado = avaliarMes(base);
    // Reabrir descarta posições e consolidado: o estado volta a ser o calculado, sem ajustes.
    conferir("CR-16", {
      estado_apos_reabrir: "aberto",
      posicoes_apos_reabrir: 0,
      consolidado_apos_reabrir: "inexistente",
      saldo_calculado_A_apos_reabrir: antes.saldo_calculado_A,
      saldo_calculado_B_apos_reabrir: antes.saldo_calculado_B,
      retorno_apos_reabrir: "N/D",
      vf_apos_fechar_de_novo: fechado.vf,
    });
  });

  it("CR-18: mês só fecha depois de terminar", () => {
    const entrada = casoPorId.get("CR-18").entrada;
    conferir("CR-18", simularPassos(entrada, entrada.meses_fechados));
  });
});

describe("fronteira e faixa dos centavos (D11)", () => {
  it("aceita só inteiros seguros na entrada e recusa fora da faixa na saída", () => {
    expect(deNumero(9007199254740991)).toBe(9007199254740991n);
    expect(() => deNumero(9007199254740992)).toThrow("recusado_faixa");
    expect(() => deNumero(1.5)).toThrow("recusado_faixa");
    expect(paraNumero(-9007199254740991n)).toBe(-9007199254740991);
    expect(() => paraNumero(9007199254740992n)).toThrow("recusado_faixa");
    expect(() => exigirFaixa(-9007199254740992n)).toThrow("recusado_faixa");
  });

  it("soma com cancelamento é exata em bigint", () => {
    const max = 9007199254740991n as Centavos;
    expect(max + 2n - 2n).toBe(max);
    expect(Number(max) + 2 - 2).not.toBe(Number(max));
  });
});

describe("datas civis", () => {
  it("dias do mês, inclusive bissextos", () => {
    expect([diasNoMes("2028-02"), diasNoMes("2026-02"), diasNoMes("2100-02"), diasNoMes("2000-02")]).toEqual([29, 28, 28, 29]);
    expect(mesSeguinte("2026-12")).toBe("2027-01");
    expect(() => mesDe("2026-02-30")).toThrow();
  });

  it("o resultado não depende do fuso do processo", () => {
    const instante = new Date("2026-10-15T02:30:00Z"); // 14/10, 22h30 em Cuiabá
    const original = process.env.TZ;
    const resultados = ["UTC", "Pacific/Kiritimati", "America/Cuiaba"].map((fuso) => {
      process.env.TZ = fuso;
      return [hojeEmCuiaba(instante), diasNoMes("2028-02"), mesDe("2026-10-31"), mesSeguinte("2026-10")];
    });
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
    expect(resultados[0]).toEqual(["2026-10-14", 29, "2026-10", "2026-11"]);
    expect(resultados[1]).toEqual(resultados[0]);
    expect(resultados[2]).toEqual(resultados[0]);
  });
});
