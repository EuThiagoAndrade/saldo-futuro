import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Centavos, RecusaFinanceira } from "../financeiro/centavos";
import type { Evento } from "../financeiro/eventos";
import {
  descreverEvento,
  MENSAGEM_GENERICA,
  mensagemDeRecusa,
  montarTransferencias,
  podeEstornar,
  TIPOS_DA_TELA,
  valorComSinal,
} from "./carteira";

/* eslint-disable @typescript-eslint/no-explicit-any */
const casos: any[] = JSON.parse(
  readFileSync(join(process.cwd(), "tests/fixtures/financeiro/casos_referencia.json"), "utf8"),
).casos;
const caso = (id: string) => casos.find((c) => c.id === id);

describe("CR-01 — sinal do lançamento a partir do valor digitado positivo (P9)", () => {
  // Cada tentativa aceita do CR-01 que a tela oferece é produzida pela escolha de tipo e direção.
  const daTela: Record<string, [any, any]> = {
    aporte_positivo: ["aporte", undefined],
    resgate_negativo: ["resgate", undefined],
    rendimento_negativo: ["rendimento", "perda"],
    rendimento_positivo: ["rendimento", "ganho"],
    marcacao_negativa: ["marcacao", "perda"],
    cambio_positivo: ["cambio", "ganho"],
  };

  for (const tentativa of caso("CR-01").entrada.tentativas) {
    const escolha = daTela[tentativa.chave];
    if (!escolha) continue;
    it(`${tentativa.chave}: ${caso("CR-01").esperado[tentativa.chave]}`, () => {
      const digitado = BigInt(Math.abs(tentativa.valor));
      expect(valorComSinal(escolha[0], escolha[1], digitado)).toBe(BigInt(tentativa.valor));
    });
  }

  it("a tela nunca produz o sinal que o CR-01 recusa", () => {
    for (const tipo of TIPOS_DA_TELA) {
      for (const direcao of ["ganho", "perda", undefined] as const) {
        try {
          const valor = valorComSinal(tipo, direcao, 100n);
          if (tipo === "aporte") expect(valor > 0n).toBe(true);
          if (tipo === "resgate") expect(valor < 0n).toBe(true);
        } catch (erro) {
          expect((erro as RecusaFinanceira).motivo).toBe("direcao");
        }
      }
    }
  });

  it("valor zero (valor_zero) e sem direção são recusados", () => {
    expect(() => valorComSinal("rendimento", "ganho", 0n)).toThrow(RecusaFinanceira);
    expect(() => valorComSinal("cambio", undefined, 100n)).toThrow(RecusaFinanceira);
  });

  it("migração histórica não é oferecida pela tela", () => {
    expect(TIPOS_DA_TELA).not.toContain("migracao");
  });
});

const ev = (e: Partial<Evento> & Pick<Evento, "id" | "tipo" | "valor">): Evento => ({
  ativo: "A",
  data: "2026-03-01",
  ...e,
  valor: e.valor as Centavos,
});

describe("CR-03 — estorno pela tela", () => {
  const e1 = ev({ id: "e1", tipo: "aporte", valor: 500000n as Centavos });
  const e2 = ev({ id: "e2", tipo: "aporte", valor: 100000n as Centavos });
  const e3 = ev({ id: "e3", tipo: "estorno", valor: -100000n as Centavos, estornoDe: "e2" });
  const eventos = [e1, e2, e3];
  const porId = new Map(eventos.map((e) => [e.id, e]));

  it("segundo estorno e estorno de estorno não são oferecidos", () => {
    expect(podeEstornar(e1, eventos)).toBe(true);
    expect(podeEstornar(e2, eventos)).toBe(false);
    expect(podeEstornar(e3, eventos)).toBe(false);
  });

  it("descreve o estorno pelo tipo referenciado", () => {
    expect(descreverEvento(e3, porId)).toBe("Estorno de aporte");
  });
});

describe("CR-04 e CR-05 — transferências", () => {
  const pernas: Evento[] = [
    ev({ id: "t1o", tipo: "transferencia", ativo: "A", valor: -200000n as Centavos, transferencia: "t1", data: "2026-04-10" }),
    ev({ id: "t1d", tipo: "transferencia", ativo: "T", valor: 200000n as Centavos, transferencia: "t1", data: "2026-04-10" }),
    ev({ id: "c1o", tipo: "estorno", ativo: "A", valor: 200000n as Centavos, estornoDe: "t1o", transferencia: "t1", data: "2026-04-12" }),
    ev({ id: "c1d", tipo: "estorno", ativo: "T", valor: -200000n as Centavos, estornoDe: "t1d", transferencia: "t1", data: "2026-04-12" }),
  ];

  it("monta origem, destino, valor positivo e a data da correção", () => {
    expect(montarTransferencias([{ id: "t1", data: "2026-04-10" }], pernas)).toEqual([
      { id: "t1", data: "2026-04-10", origem: "A", destino: "T", valor: 200000n, correcao: "2026-04-12" },
    ]);
  });

  it("uma perna nunca é estornada sozinha pela tela", () => {
    expect(podeEstornar(pernas[0], pernas)).toBe(false);
    expect(descreverEvento(pernas[0], new Map())).toBe("Transferência (saída)");
    expect(descreverEvento(pernas[2], new Map())).toBe("Correção de transferência");
  });
});

describe("mensagens de recusa", () => {
  it("traduz o motivo do banco e das regras locais", () => {
    expect(mensagemDeRecusa(new Error("recusado_mesmo_ativo"))).toBe("Escolha ativos diferentes para a origem e o destino.");
    expect(mensagemDeRecusa("recusado_ja_estornado")).toBe("Esse lançamento já foi estornado.");
    expect(mensagemDeRecusa(new RecusaFinanceira("direcao"))).toBe("Escolha Ganho ou Perda.");
    expect(mensagemDeRecusa({ message: "recusado_saldo_nao_zero", code: "P0001" })).toBe(
      "Só é possível desativar um ativo com saldo zero.",
    );
  });

  it("nunca mostra detalhe técnico", () => {
    expect(mensagemDeRecusa(new Error('invalid input syntax for type uuid: "x"'))).toBe(MENSAGEM_GENERICA);
  });
});
