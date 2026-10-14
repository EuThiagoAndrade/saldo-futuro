import { describe, expect, it } from "vitest";
import { ErroLeitura, lerComposicao, lerTudo, type Pagina } from "./leitura";

// Testes com cliente falso (D13). Os caminhos reais de cada tabela e a coerência entre páginas e
// entre coletas são testados no Supabase local, em tests/e2e/leitura.spec.ts.

function falso(linhas: number[], opcoes: { falharNaPagina?: number; contagens?: number[] } = {}): Pagina<number> {
  let chamada = 0;
  return async (de, ate) => {
    const indice = chamada++;
    if (indice === opcoes.falharNaPagina) return { data: null, error: { message: "falha" }, count: null };
    return { data: linhas.slice(de, ate + 1), error: null, count: opcoes.contagens?.[indice] ?? linhas.length };
  };
}

const sequencia = (n: number) => Array.from({ length: n }, (_, i) => i);

describe("lerTudo", () => {
  it("junta várias páginas até a incompleta", async () => {
    expect(await lerTudo(falso(sequencia(7)), { tamanho: 3 })).toEqual(sequencia(7));
  });

  it("lê uma página exata e confere a seguinte vazia", async () => {
    expect(await lerTudo(falso(sequencia(6)), { tamanho: 3 })).toEqual(sequencia(6));
    expect(await lerTudo(falso([]), { tamanho: 3 })).toEqual([]);
  });

  it("falha numa página intermediária é erro, nunca resultado parcial", async () => {
    await expect(lerTudo(falso(sequencia(7), { falharNaPagina: 1 }), { tamanho: 3 })).rejects.toThrow(ErroLeitura);
  });

  it("contagem que muda entre páginas é erro", async () => {
    await expect(lerTudo(falso(sequencia(7), { contagens: [7, 8] }), { tamanho: 3 })).rejects.toMatchObject({
      motivo: "contagem",
    });
  });

  it("total coletado diferente da contagem é erro", async () => {
    await expect(lerTudo(falso(sequencia(5), { contagens: [6, 6] }), { tamanho: 3 })).rejects.toMatchObject({
      motivo: "contagem",
    });
  });
});

describe("lerComposicao", () => {
  it("aceita quando a marca não muda e devolve a marca conferida", async () => {
    const r = await lerComposicao(async () => ({ v: 1 }), async (m) => `insumos de ${m.v}`);
    expect(r).toEqual({ marca: { v: 1 }, insumos: "insumos de 1" });
  });

  it("repete quando a marca muda e aceita a versão estável seguinte", async () => {
    const marcas = [1, 2, 2, 2];
    let leituras = 0;
    const r = await lerComposicao(async () => marcas[leituras++], async (m) => m);
    expect(r).toEqual({ marca: 2, insumos: 2 });
  });

  it("contagem que muda numa coleta faz repetir; falha de página não", async () => {
    let tentativa = 0;
    const r = await lerComposicao(
      async () => "v",
      async () => {
        if (tentativa++ === 0) throw new ErroLeitura("contagem", "8 → 9");
        return "estável";
      },
    );
    expect(r.insumos).toBe("estável");
    await expect(
      lerComposicao(
        async () => "v",
        async () => {
          throw new ErroLeitura("pagina", "falha");
        },
      ),
    ).rejects.toMatchObject({ motivo: "pagina" });
  });

  it("para depois de 3 tentativas com erro recuperável", async () => {
    let versao = 0;
    let insumosLidos = 0;
    await expect(
      lerComposicao(
        async () => versao++,
        async () => insumosLidos++,
      ),
    ).rejects.toMatchObject({ motivo: "mudou" });
    expect(insumosLidos).toBe(3);
  });
});
