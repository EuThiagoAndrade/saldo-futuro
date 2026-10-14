import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerComposicao, lerTabela, marcaBenchmark } from "../../src/lib/leitura";
import { sqlLocal } from "./apoio/banco";
import { clienteDoUsuario, configurado, criarUsuarios, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// As séries de benchmark são globais. Todo teste que as usa fica neste arquivo serial (D9), que
// limpa as séries no início e no fim. Valores fictícios, gravados pela função de carga, como admin.

test.describe("séries de benchmark", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let admin: SupabaseClient;
  let cdi: string;

  const limparSeries = () => sqlLocal("delete from public.valores_benchmark; delete from public.coberturas_benchmark;");

  test.beforeAll(async () => {
    limparSeries();
    u = await criarUsuarios("benchmarks", { admin: "admin" });
    admin = await clienteDoUsuario(u.admin);
    const { data, error } = await admin.from("benchmarks").select("id").eq("nome", "CDI").single();
    expect(error).toBeNull();
    cdi = data!.id;
  });
  test.afterAll(async () => {
    limparSeries();
    await removerUsuarios(u);
  });

  /** n dias seguidos a partir de 2000-01-01, todos com o mesmo valor fictício. */
  function dias(n: number, valor: string) {
    return Array.from({ length: n }, (_, i) => ({
      data: new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10),
      valor,
    }));
  }

  async function carregar(valores: { data: string; valor: string }[]) {
    const { error } = await admin.rpc("carregar_benchmark", {
      p_benchmark: cdi,
      p_data_inicial: valores[0].data,
      p_data_final: valores.at(-1)!.data,
      p_valores: valores,
    });
    expect(error).toBeNull();
  }

  const lerValores = (opcoes: Parameters<typeof lerTabela>[2] = {}) =>
    lerTabela<{ data: string; valor: number }>(admin, "valores_benchmark", {
      colunas: "data, valor",
      filtrar: (consulta) => consulta.eq("benchmark_id", cdi),
      ...opcoes,
    });

  test("uma série com mais de 1.000 valores é lida inteira, em ordem de data", async () => {
    const serie = dias(1200, "0.04");
    await carregar(serie);
    const lidos = await lerValores();
    expect(lidos).toHaveLength(1200);
    expect(lidos.map((v) => v.data)).toEqual(serie.map((v) => v.data));
  });

  test("substituição da série entre páginas, com contagem e datas iguais: uma versão inteira", async () => {
    let substituiu = false;
    const { insumos } = await lerComposicao(
      () => marcaBenchmark(admin, cdi),
      () =>
        lerValores({
          tamanho: 500,
          aposPagina: async (indice) => {
            if (indice === 0 && !substituiu) {
              substituiu = true;
              await carregar(dias(1200, "0.05"));
            }
          },
        }),
    );
    expect(insumos).toHaveLength(1200);
    expect(new Set(insumos.map((v) => Number(v.valor)))).toEqual(new Set([0.05]));
  });

  test("substituição entre a cobertura e os valores: cobertura e valores da mesma versão", async () => {
    let substituiu = false;
    const { marca, insumos } = await lerComposicao(
      () => marcaBenchmark(admin, cdi),
      async () => {
        if (!substituiu) {
          substituiu = true;
          await carregar(dias(1200, "0.06"));
        }
        return lerValores();
      },
    );
    expect(new Set(insumos.map((v) => Number(v.valor)))).toEqual(new Set([0.06]));
    expect(marca).toEqual(await marcaBenchmark(admin, cdi));
  });
});
