import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ErroLeitura, lerComposicao, lerTabela, marcaCarteira, ORDENS, type Tabela } from "../../src/lib/leitura";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Leitura completa e coerente da carteira pelo caminho real (D13), no Supabase local, com
// páginas pequenas forçadas e alterações entre páginas e entre coletas. Valores fictícios.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Linha = Record<string, any>;

test.describe("leitura da carteira", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  let ativos: Record<string, string>;

  test.beforeAll(async () => {
    u = await criarUsuarios("leitura", { a: "user" });
    cliente = await clienteDoUsuario(u.a);
    ativos = await prepararCenario(cliente, [
      { criarAtivo: "x", nome: "Ativo fictício X", tipoAjuste: "rendimento" },
      { criarAtivo: "y", nome: "Ativo fictício Y", tipoAjuste: "marcacao" },
      { criarAtivo: "z", nome: "Ativo fictício Z", tipoAjuste: "rendimento" },
      { lancar: "x", data: "2025-01-05", tipo: "aporte", valor: 100000 },
      { lancar: "y", data: "2025-01-05", tipo: "aporte", valor: 50000 },
      { lancar: "z", data: "2025-01-20", tipo: "aporte", valor: 30000 },
      { fechar: "2025-01", saldos: { x: 100100, y: 49000, z: 30050 } },
      { lancar: "x", data: "2025-02-03", tipo: "aporte", valor: 2000 },
      { lancar: "y", data: "2025-02-10", tipo: "resgate", valor: -1000 },
      { fechar: "2025-02", saldos: { x: 102300, y: 48500, z: 30100 } },
      { lancar: "z", data: "2025-03-04", tipo: "aporte", valor: 500 },
    ]);
    const { error } = await cliente.rpc("transferir", {
      p_origem: ativos.x,
      p_destino: ativos.y,
      p_data: "2025-03-05",
      p_valor: 700,
    });
    expect(error).toBeNull();
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  /** Referência: a tabela inteira numa só consulta, ordenada pelas chaves de ORDENS. */
  async function inteira(tabela: Tabela): Promise<Linha[]> {
    let consulta: any = cliente.from(tabela).select("*");
    for (const coluna of ORDENS[tabela]) consulta = consulta.order(coluna, { ascending: true });
    const { data, error } = await consulta;
    expect(error).toBeNull();
    return data;
  }

  for (const tabela of ["eventos", "ativos", "transferencias", "consolidados_mensais", "posicoes_mensais"] as Tabela[]) {
    test(`${tabela}: páginas de 2 linhas devolvem todas as linhas na ordem declarada`, async () => {
      const referencia = await inteira(tabela);
      expect(referencia.length).toBeGreaterThan(0);
      expect(await lerTabela<Linha>(cliente, tabela, { tamanho: 2 })).toEqual(referencia);
    });
  }

  /** Lê consolidados e posições como uma composição; o gancho altera o banco entre as coletas. */
  function lerFechamentos(gancho: (tentativa: number) => Promise<void>) {
    let tentativa = 0;
    return lerComposicao(
      () => marcaCarteira(cliente),
      async () => {
        tentativa++;
        const consolidados = await lerTabela<Linha>(cliente, "consolidados_mensais", { tamanho: 1 });
        await gancho(tentativa);
        const posicoes = await lerTabela<Linha>(cliente, "posicoes_mensais", { tamanho: 1 });
        return { consolidados, posicoes, tentativa };
      },
    );
  }

  /** O patrimônio de cada mês é a soma das posições do mesmo mês (KB-004, seção 6). */
  function coerente({ consolidados, posicoes }: { consolidados: Linha[]; posicoes: Linha[] }) {
    for (const c of consolidados) {
      const soma = posicoes.filter((p) => p.mes === c.mes).reduce((total, p) => total + p.saldo_final, 0);
      expect(soma, c.mes).toBe(c.vf);
    }
  }

  async function refecharFevereiro(saldoX: number) {
    expect((await cliente.rpc("reabrir_mes", { p_mes: "2025-02-01" })).error).toBeNull();
    const saldos = { [ativos.x]: saldoX, [ativos.y]: 48500, [ativos.z]: 30100 };
    expect((await cliente.rpc("fechar_mes", { p_mes: "2025-02-01", p_saldos: saldos })).error).toBeNull();
  }

  test("reabrir e fechar de novo entre consolidados e posições: uma versão inteira, nunca a mistura", async () => {
    const { insumos } = await lerFechamentos(async (tentativa) => {
      if (tentativa === 1) await refecharFevereiro(102400);
    });
    expect(insumos.tentativa).toBe(2); // a primeira coleta foi descartada
    coerente(insumos);
    const fevereiro = insumos.consolidados.find((c) => c.mes === "2025-02-01");
    expect(fevereiro?.vf).toBe(102400 + 48500 + 30100);
  });

  test("reabrir e fechar de novo entre páginas das posições: uma versão inteira", async () => {
    let paginas = 0;
    const { insumos } = await lerComposicao(
      () => marcaCarteira(cliente),
      async () => ({
        consolidados: await lerTabela<Linha>(cliente, "consolidados_mensais"),
        posicoes: await lerTabela<Linha>(cliente, "posicoes_mensais", {
          tamanho: 2,
          aposPagina: async (indice) => {
            if (indice === 0 && paginas++ === 0) await refecharFevereiro(102300);
          },
        }),
      }),
    );
    coerente(insumos);
  });

  test("lançamento retroativo entre páginas dos eventos: o conjunto inclui o novo evento", async () => {
    let lancou = false;
    const { marca, insumos } = await lerComposicao(
      () => marcaCarteira(cliente),
      () =>
        lerTabela<Linha>(cliente, "eventos", {
          tamanho: 2,
          aposPagina: async (indice) => {
            if (indice === 1 && !lancou) {
              lancou = true;
              const { error } = await cliente.rpc("lancar_evento", {
                p_ativo: ativos.z,
                p_data: "2025-03-01",
                p_tipo: "aporte",
                p_valor: 100,
              });
              expect(error).toBeNull();
            }
          },
        }),
    );
    expect(insumos).toHaveLength(marca.eventos);
    expect(insumos.some((e) => e.data === "2025-03-01" && e.valor === 100)).toBe(true);
  });

  test("alteração em toda tentativa: erro recuperável depois de 3", async () => {
    let saldo = 102300;
    await expect(lerFechamentos(async () => refecharFevereiro(++saldo))).rejects.toThrow(ErroLeitura);
  });
});
