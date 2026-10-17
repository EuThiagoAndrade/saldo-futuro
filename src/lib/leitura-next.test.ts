import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { lerComparacao } from "./telas/leitura-benchmarks";
import { lerInsumosDoFechamento, lerInsumosDoInicio } from "./telas/leituras";

// D13 dentro do servidor Next. O Next 16.4.0 memoriza por pedido os GET/HEAD com mesmos URL e
// cabeçalhos (next/dist/server/lib/dedupe-fetch.js) e só não o faz quando o fetch recebe signal.
// Aqui a mesma regra envolve uma Data API falsa, e o cliente Supabase real faz as consultas.

function deduplicarComoNext(fetchReal: typeof fetch): typeof fetch {
  const memoria = new Map<string, Promise<Response>>();
  return async (entrada, init) => {
    if (init?.signal) return fetchReal(entrada, init);
    const pedido = new Request(entrada, init);
    if (pedido.method !== "GET" && pedido.method !== "HEAD") return fetchReal(entrada, init);
    const chave = JSON.stringify([pedido.method, pedido.url, [...pedido.headers]]);
    if (!memoria.has(chave)) memoria.set(chave, fetchReal(entrada, init));
    return (await memoria.get(chave)!).clone();
  };
}

/** Data API com uma linha por tabela; troca de versão logo depois do primeiro transporte indicado. */
function dataApi(trocarApos: (transporte: string) => boolean) {
  let versao = 1;
  const transportes: string[] = [];
  const linhas = (tabela: string, filtros: URLSearchParams): object[] => {
    const v = versao === 1 ? 1010000 : 1020000;
    switch (tabela) {
      case "consolidados_mensais": return [{ mes: "2026-01-01", fechado_em: `v${versao}`, vi: 1000000, vf: v }];
      case "posicoes_mensais": return [{ mes: "2026-01-01", ativo_id: "a1", saldo_inicial: 1000000, saldo_final: v, ajuste: 0, tipo_ajuste: null }];
      case "ativos": return filtros.has("desativado_em") ? [] : [{ id: "a1", nome: "Ativo fictício", tipo_ajuste: null, sistema: null, ativo: true, desativado_em: null }];
      case "coberturas_benchmark": return [{ inicio: "2026-01-01", fim: "2026-02-01", atualizado_em: `v${versao}` }];
      case "valores_benchmark": return [{ data: "2026-01-01", valor: versao === 1 ? 0.8 : 0.9 }];
      default: return [];
    }
  };
  const fetchFalso: typeof fetch = async (entrada, init) => {
    const pedido = new Request(entrada, init);
    const url = new URL(pedido.url);
    const tabela = url.pathname.split("/").at(-1)!;
    const transporte = `${pedido.method} ${tabela} ${url.searchParams.get("select")}`;
    transportes.push(transporte);
    const dados = linhas(tabela, url.searchParams);
    if (versao === 1 && trocarApos(transporte)) versao = 2;
    const intervalo = dados.length ? `0-${dados.length - 1}/${dados.length}` : `*/0`;
    const corpo = pedido.method === "HEAD" ? null : JSON.stringify(dados);
    return new Response(corpo, { status: 200, headers: { "content-type": "application/json", "content-range": intervalo } });
  };
  const cliente = createClient("http://127.0.0.1:54321", "chave-ficticia", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: deduplicarComoNext(fetchFalso) },
  });
  return { cliente, transportes, versao: () => versao };
}

describe("D13 com a deduplicação do Next", () => {
  it("Início: fechamento refeito entre consolidados e posições devolve só a versão nova", async () => {
    const api = dataApi((t) => t === "GET consolidados_mensais mes,vi,vf");
    const insumos = await lerInsumosDoInicio(api.cliente);
    expect(api.versao()).toBe(2);
    expect(insumos.consolidados[0].vf).toBe(1020000);
    expect(insumos.posicoes[0].saldo_final).toBe(1020000);
  });

  it("fechamento: cada tentativa lê a marca no banco antes e depois dos insumos", async () => {
    const api = dataApi((t) => t === "GET consolidados_mensais mes");
    const insumos = await lerInsumosDoFechamento(api.cliente);
    expect(api.versao()).toBe(2);
    expect(insumos.posicoes[0].saldo_final).toBe(1020000);
    // Duas tentativas, com marca antes e depois em cada uma, todas transportadas.
    expect(api.transportes.filter((t) => t === "GET consolidados_mensais mes,fechado_em")).toHaveLength(4);
    expect(api.transportes.filter((t) => t.startsWith("GET posicoes_mensais"))).toHaveLength(2);
  });

  it("Comparação: carga de benchmark entre eventos e valores devolve só a versão nova", async () => {
    const api = dataApi((t) => t.startsWith("GET eventos"));
    const resultado = await lerComparacao(api.cliente, "benchmark-ficticio");
    expect(api.versao()).toBe(2);
    expect(resultado.consolidados[0].vf).toBe(1020000n);
    expect(resultado.valores).toEqual([{ data: "2026-01-01", valor: "0.9" }]);
    expect(resultado.cobertura?.atualizado_em).toBe("v2");
  });
});
