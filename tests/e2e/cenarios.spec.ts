import { expect, test } from "@playwright/test";
import { hojeEmCuiaba, mesDe } from "../../src/lib/financeiro/datas";
import { CenarioInvalido, conferirDatas, prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// O apoio dos cenários (D9): recusa um cenário literal que dependa de data ainda não chegada e
// monta os passos pelas funções do banco, como o próprio usuário.

test.describe("conferência de datas do cenário literal", () => {
  const hoje = hojeEmCuiaba();
  const proximoAno = `${Number(hoje.slice(0, 4)) + 1}-01-15`;

  test("recusa lançamento com data posterior a hoje", () => {
    expect(() => conferirDatas([{ lancar: "a", data: proximoAno, tipo: "aporte", valor: 100 }])).toThrow(CenarioInvalido);
  });

  test("recusa fechar o mês corrente, que ainda não terminou", () => {
    expect(() => conferirDatas([{ fechar: mesDe(hoje), saldos: {} }])).toThrow(CenarioInvalido);
  });

  test("aceita datas e meses já terminados", () => {
    expect(() =>
      conferirDatas([
        { lancar: "a", data: "2025-01-10", tipo: "aporte", valor: 100 },
        { fechar: "2025-01", saldos: {} },
      ]),
    ).not.toThrow();
  });

  test("usa o hoje informado: em 31/10 outubro não fecha; em 01/11 fecha", () => {
    expect(() => conferirDatas([{ fechar: "2026-10", saldos: {} }], "2026-10-31")).toThrow(CenarioInvalido);
    expect(() => conferirDatas([{ fechar: "2026-10", saldos: {} }], "2026-11-01")).not.toThrow();
  });
});

test.describe("montagem pelas funções do banco", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("cenarios", { a: "user", b: "user" });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  test("os passos gravam a carteira do próprio usuário, invisível ao outro", async () => {
    const a = await clienteDoUsuario(u.a);
    await prepararCenario(a, [
      { criarAtivo: "x", nome: "Ativo fictício X", tipoAjuste: "rendimento" },
      { lancar: "x", data: "2025-01-10", tipo: "aporte", valor: 100000 },
      { fechar: "2025-01", saldos: { x: 100500 } },
    ]);
    const { data, error } = await a.from("consolidados_mensais").select("mes, vi, vf, aportes, rendimento");
    expect(error).toBeNull();
    expect(data).toEqual([{ mes: "2025-01-01", vi: 0, vf: 100500, aportes: 100000, rendimento: 500 }]);

    const b = await clienteDoUsuario(u.b);
    expect((await b.from("consolidados_mensais").select("mes")).data).toEqual([]);
  });
});
