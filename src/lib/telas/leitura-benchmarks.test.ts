import { expect, it, vi } from "vitest";
import type { Cliente } from "../leitura";
vi.mock("server-only", () => ({}));
import { lerComparacao } from "./leitura-benchmarks";

// Data API falsa com uma página por tabela e substituição sem mudança de contagem/chaves.
// Exercita o leitor real, incluindo as marcas dos dois lados ao redor de toda a composição.
it.each(["entre_tabelas", "entre_cobertura_valores"])("D13: %s devolve somente a versão nova completa", async (momento) => {
  let versao = 1;
  let mudou = false;
  const cliente = {
    from(tabela: string) {
      let colunas = "";
      let head = false;
      const consulta = {
        select(c: string, opcoes?: { head?: boolean }) { colunas = c; head = !!opcoes?.head; return consulta; },
        order() { return consulta; }, eq() { return consulta; }, not() { return consulta; }, limit() { return consulta; }, range() { return consulta; }, maybeSingle() { return consulta; }, abortSignal() { return consulta; },
        then(resolve: (r: unknown) => unknown) {
          let data: unknown = [];
          if (tabela === "consolidados_mensais") data = colunas.includes("fechado_em")
            ? [{ mes: "2026-01-01", fechado_em: `v${versao}` }]
            : [{ mes: "2026-01-01", vi: 1000000, vf: versao === 1 ? 1010000 : 1020000 }];
          if (tabela === "coberturas_benchmark") data = { inicio: "2026-01-01", fim: "2026-02-01", atualizado_em: `v${versao}` };
          if (tabela === "valores_benchmark") data = [{ data: "2026-01-01", valor: versao === 1 ? .8 : .9 }];
          const count = Array.isArray(data) ? data.length : 1;
          const resposta = { data: head ? null : data, count, error: null };
          const trocar = momento === "entre_tabelas"
            ? tabela === "consolidados_mensais" && colunas.includes("vi")
            : tabela === "valores_benchmark";
          if (trocar && !mudou) { versao = 2; mudou = true; }
          return Promise.resolve(resposta).then(resolve);
        },
      };
      return consulta;
    },
  } as unknown as Cliente;
  const resultado = await lerComparacao(cliente, "benchmark-ficticio");
  expect(mudou).toBe(true);
  expect(resultado.consolidados[0].vf).toBe(1020000n);
  expect(resultado.valores).toEqual([{ data: "2026-01-01", valor: "0.9" }]);
  expect(resultado.cobertura?.atualizado_em).toBe("v2");
});
