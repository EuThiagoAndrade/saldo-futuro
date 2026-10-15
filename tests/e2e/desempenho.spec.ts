import { expect, test } from "@playwright/test";
import { mesSeguinte } from "../../src/lib/financeiro/datas";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Medição de D9 (ciclo 004): o Início com 30 ativos e 5 anos de meses fechados, com eventos
// fictícios, no servidor local. Acima de 1 s, a situação passa a "Parado" para decidir cache.
// Opcional (MEDIR_DESEMPENHO=1): uma medida de tempo não deve tornar o CI instável; o resultado
// medido fica registrado na task da issue #40.

const ATIVOS = 30;
const MESES = 60;
const LIMITE_MS = 1000;

test.describe("desempenho do Início (D9)", () => {
  test.skip(!configurado || process.env.MEDIR_DESEMPENHO !== "1", "Só com MEDIR_DESEMPENHO=1 e o Supabase local.");
  test.setTimeout(900_000);

  let u: Record<string, UsuarioDeTeste>;
  test.beforeAll(async () => {
    u = await criarUsuarios("desempenho", { a: "user" });
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
  });

  test(`Início com ${ATIVOS} ativos e ${MESES} meses fechados abaixo de ${LIMITE_MS} ms`, async ({ page }) => {
    const cliente = await clienteDoUsuario(u.a);
    const ids: string[] = [];
    for (let i = 0; i < ATIVOS; i++) {
      const { data, error } = await cliente.rpc("criar_ativo", { p_nome: `Ativo fictício ${i + 1}`, p_tipo_ajuste: "rendimento" });
      expect(error).toBeNull();
      ids.push(data as string);
    }
    const saldos = new Map(ids.map((id) => [id, 0]));
    let mes = "2021-10";
    for (let m = 0; m < MESES; m++, mes = mesSeguinte(mes)) {
      const resultados = await Promise.all(
        ids.map((id) => cliente.rpc("lancar_evento", { p_ativo: id, p_data: `${mes}-05`, p_tipo: "aporte", p_valor: 10000 })),
      );
      for (const r of resultados) expect(r.error).toBeNull();
      for (const id of ids) saldos.set(id, saldos.get(id)! + 10000 + 100);
      const { error } = await cliente.rpc("fechar_mes", { p_mes: `${mes}-01`, p_saldos: Object.fromEntries(saldos) });
      expect(error, mes).toBeNull();
    }

    await entrar(page, u.a);
    await page.request.get("/"); // aquecimento
    const tempos: number[] = [];
    for (let i = 0; i < 5; i++) {
      const inicio = performance.now();
      const resposta = await page.request.get("/?periodo=desde_inicio");
      tempos.push(performance.now() - inicio);
      expect(resposta.status()).toBe(200);
    }
    tempos.sort((a, b) => a - b);
    const mediana = tempos[2];
    console.log(`D9: mediana ${mediana.toFixed(0)} ms; tempos ${tempos.map((t) => t.toFixed(0)).join(", ")} ms`);
    expect(mediana).toBeLessThan(LIMITE_MS);
  });
});
