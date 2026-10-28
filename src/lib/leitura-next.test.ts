import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { lerComparacao } from "./telas/leitura-benchmarks";
import { comporDistribuicao } from "./financeiro/distribuicao";
import { ErroLeitura } from "./leitura";
import { lerInsumosDoFechamento, lerInsumosDoInicio, lerInsumosDoInicioPorClasse, lerInsumosDoInicioPorInstituicao } from "./telas/leituras";

// D13 dentro do servidor Next. O Next 16.4.0 memoriza por pedido os GET/HEAD com mesmos URL e
// cabeçalhos (next/dist/server/lib/dedupe-fetch.js) e só não o faz quando o fetch recebe signal.
// Aqui a mesma regra envolve uma Data API falsa, e o cliente Supabase real faz as consultas.

const RF = "a5000000-0000-4000-8000-000000020000";
const RV = "a5000000-0000-4000-8000-000000030000";
const INSTITUICAO = "00000000-0000-4000-8000-0000000000a1";

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

/**
 * Data API com uma linha por tabela; troca de versão logo depois do primeiro transporte indicado. A
 * versão 2 é uma escrita que muda vários componentes da marca: refechamento e um evento novo.
 * Requisições em voo ao mesmo tempo formam um lote, atendido na ordem de chegada ou na inversa: o
 * banco pode ler consultas paralelas em qualquer ordem. Com a escrita "metadados" (ciclo 015, issue
 * #153), a versão 2 só renomeia o ativo, troca sua instituição e o reclassifica: muda a marca dos
 * metadados, nada mais. Com "nomes", o Início tem três ativos de mesmo saldo e a versão 2 renomeia o
 * primeiro. A marca dos metadados pode ser substituída, para simular A → B → A ou uma marca inválida.
 */
function dataApi(
  trocarApos: (transporte: string, indice: number) => boolean,
  ordem: "chegada" | "inversa" = "chegada",
  escrita: "carteira" | "metadados" | "nomes" = "carteira",
  marcaDeMetadados?: () => string,
) {
  let versao = 1;
  const transportes: string[] = [];
  const linhas = (tabela: string, filtros: URLSearchParams): object[] | string => {
    const carteira = escrita === "carteira" ? versao : 1;
    const metadados = escrita === "carteira" ? 1 : versao;
    const v = carteira === 1 ? 1010000 : 1020000;
    switch (tabela) {
      case "consolidados_mensais": return [{ mes: "2026-01-01", fechado_em: `v${carteira}`, vi: 1000000, vf: v }];
      case "posicoes_mensais":
        return (escrita === "nomes" ? ["a1", "a2", "a3"] : ["a1"]).map((ativo_id) => ({ mes: "2026-01-01", ativo_id, saldo_inicial: 1000000, saldo_final: escrita === "nomes" ? 10000 : v, ajuste: 0, tipo_ajuste: null }));
      case "ativos":
        if (filtros.has("desativado_em")) return [];
        if (escrita === "nomes") {
          return [["a1", metadados === 1 ? "Ativo A" : "Ativo Z"], ["a2", "Ativo B"], ["a3", "Ativo C"]].map(([id, nome]) => ({ id, nome, tipo_ajuste: null, sistema: null, ativo: true, desativado_em: null, instituicao_id: null, taxonomia_id: RF }));
        }
        return [{ id: "a1", nome: metadados === 1 ? "Ativo fictício" : "Ativo renomeado", tipo_ajuste: null, sistema: null, ativo: true, desativado_em: null, instituicao_id: metadados === 1 ? null : INSTITUICAO, taxonomia_id: metadados === 1 ? RF : RV }];
      case "instituicoes": return [{ id: INSTITUICAO, nome: "Instituição fictícia" }];
      case "taxonomia_ativos": return [RF, RV].map((id, i) => ({ id, parent_id: null, nivel: 1, nome: `Classe ${i + 1}`, ordem: i + 2 }));
      case "ler_versao_metadados": return marcaDeMetadados ? marcaDeMetadados() : String(metadados);
      case "coberturas_benchmark": return [{ inicio: "2026-01-01", fim: "2026-02-01", atualizado_em: `v${versao}` }];
      case "valores_benchmark": return [{ data: "2026-01-01", valor: versao === 1 ? 0.8 : 0.9 }];
      case "eventos": return carteira === 1 ? [] : [{ id: "e1", ativo_id: "a1", data: "2026-02-05", tipo: "aporte", valor: 10000, estorno_de: null, transferencia_id: null }];
      default: return [];
    }
  };
  const fila: { pedido: Request; responder: (r: Response) => void }[] = [];
  let agendado = false;
  let maiorLote = 0;
  const fetchFalso: typeof fetch = (entrada, init) => new Promise<Response>((responder) => {
    fila.push({ pedido: new Request(entrada, init), responder });
    if (agendado) return;
    agendado = true;
    setImmediate(() => {
      agendado = false;
      const lote = fila.splice(0);
      maiorLote = Math.max(maiorLote, lote.length);
      if (ordem === "inversa") lote.reverse();
      for (const { pedido, responder: r } of lote) r(servir(pedido));
    });
  });
  const servir = (pedido: Request): Response => {
    const url = new URL(pedido.url);
    const tabela = url.pathname.split("/").at(-1)!;
    const transporte = `${pedido.method} ${tabela} ${url.searchParams.get("select")}`;
    transportes.push(transporte);
    const dados = linhas(tabela, url.searchParams);
    if (versao === 1 && trocarApos(transporte, transportes.length - 1)) versao = 2;
    const intervalo = typeof dados === "string" ? "*/*" : dados.length ? `0-${dados.length - 1}/${dados.length}` : `*/0`;
    const corpo = pedido.method === "HEAD" ? null : JSON.stringify(dados);
    return new Response(corpo, { status: 200, headers: { "content-type": "application/json", "content-range": intervalo } });
  };
  const cliente = createClient("http://127.0.0.1:54321", "chave-ficticia", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: deduplicarComoNext(fetchFalso) },
  });
  return { cliente, transportes, versao: () => versao, maiorLote: () => maiorLote };
}

describe("D13 com a deduplicação do Next", () => {
  it("Início por classe: mudança de metadados depois da leitura dos ativos repete e devolve só o estado novo", async () => {
    const api = dataApi((t) => t.startsWith("GET ativos id,nome"), "chegada", "metadados");
    const insumos = await lerInsumosDoInicioPorClasse(api.cliente);
    expect(api.versao()).toBe(2);
    expect(insumos.ativos[0]).toMatchObject({ nome: "Ativo renomeado", taxonomia_id: RV, instituicao_id: INSTITUICAO });
    expect(insumos.nos).toHaveLength(2);
    // Duas tentativas: a marca dos metadados foi lida antes e depois em cada uma.
    expect(api.transportes.filter((t) => t.startsWith("POST ler_versao_metadados"))).toHaveLength(4);
    expect(api.transportes.filter((t) => t.startsWith("GET ativos id,nome"))).toHaveLength(2);
    // A marca nova cobre a taxonomia: a RPC antiga da classificação não é chamada.
    expect(api.transportes.filter((t) => t.includes("ler_versao_classificacao"))).toEqual([]);
  });

  it("Início por instituição: o catálogo é lido na mesma composição e uma renomeação repete tudo", async () => {
    const api = dataApi((t) => t.startsWith("GET instituicoes"), "chegada", "metadados");
    const insumos = await lerInsumosDoInicioPorInstituicao(api.cliente);
    expect(api.versao()).toBe(2);
    expect(insumos.ativos[0]).toMatchObject({ nome: "Ativo renomeado", instituicao_id: INSTITUICAO });
    expect(insumos.instituicoes).toEqual([{ id: INSTITUICAO, nome: "Instituição fictícia" }]);
    expect(api.transportes.filter((t) => t.startsWith("GET instituicoes"))).toHaveLength(2);
    expect(api.transportes.filter((t) => t.startsWith("POST ler_versao_metadados"))).toHaveLength(4);
  });

  it("Início por ativo: renomear depois da leitura repete e o centésimo do desempate segue o nome novo", async () => {
    const posicoes = (i: Awaited<ReturnType<typeof lerInsumosDoInicio>>) => i.ativos.map((a) => ({ id: a.id, nome: a.nome, saldo: i.posicoes.find((p) => p.ativo_id === a.id)!.saldo_final }));
    const antes = dataApi(() => false, "chegada", "nomes");
    const d1 = comporDistribuicao(posicoes(await lerInsumosDoInicio(antes.cliente)));
    expect(d1.positivos.map((p) => [p.nome, p.participacao])).toEqual([["Ativo A", 3334], ["Ativo B", 3333], ["Ativo C", 3333]]);

    const api = dataApi((t) => t.startsWith("GET ativos id,nome"), "chegada", "nomes");
    const d2 = comporDistribuicao(posicoes(await lerInsumosDoInicio(api.cliente)));
    expect(api.versao()).toBe(2);
    // Só nomes do estado novo: B passa a receber a unidade que sobra. É o efeito aceito da renomeação.
    expect(d2.positivos.map((p) => [p.nome, p.participacao])).toEqual([["Ativo B", 3334], ["Ativo C", 3333], ["Ativo Z", 3333]]);
    expect(d2.positivos.reduce((s, p) => s + p.saldo, 0n)).toBe(30000n);
    expect(api.transportes.filter((t) => t.startsWith("GET ativos id,nome"))).toHaveLength(2);
  });

  const leitores = {
    "por ativo": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicio(c),
    "por classe": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicioPorClasse(c),
    "por instituição": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicioPorInstituicao(c),
  };

  it.each(Object.entries(leitores))("Início %s: A → B → A (nome, instituição ou classe) muda a marca e repete, mesmo com o estado final igual", async (_nome, ler) => {
    // Antes da primeira tentativa a marca é 1; depois dela, 3 (duas escritas confirmadas que se desfazem).
    const marcas = ["1", "3", "3", "3"];
    const api = dataApi(() => false, "chegada", "metadados", () => marcas.shift() ?? "3");
    const insumos = await ler(api.cliente);
    expect(insumos.ativos[0]).toMatchObject({ nome: "Ativo fictício", taxonomia_id: RF, instituicao_id: null });
    expect(api.transportes.filter((t) => t.startsWith("POST ler_versao_metadados"))).toHaveLength(4);
    expect(api.transportes.filter((t) => t.startsWith("GET ativos id,nome"))).toHaveLength(2);
  });

  it.each(Object.entries(leitores))("Início %s: metadados que mudam a cada tentativa viram indisponibilidade, sem fallback", async (_nome, ler) => {
    let n = 0;
    const api = dataApi(() => false, "chegada", "metadados", () => String(++n));
    await expect(ler(api.cliente)).rejects.toThrow(ErroLeitura);
    await expect(ler(api.cliente)).rejects.toMatchObject({ motivo: "mudou" });
  });

  it.each(Object.entries(leitores))("Início %s: marca dos metadados inválida é erro, nunca um contador zero", async (_nome, ler) => {
    for (const marca of ["", "abc", "-1", "1.5"]) {
      const api = dataApi(() => false, "chegada", "metadados", () => marca);
      await expect(ler(api.cliente), `marca "${marca}"`).rejects.toMatchObject({ motivo: "pagina" });
    }
  });

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
    // Sem composição nova: o fechamento mantém só a marca financeira (issue #153).
    expect(api.transportes.filter((t) => t.includes("ler_versao"))).toEqual([]);
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

// Uma escrita depois de cada transporte possível: entre componentes da marca antes (lidos juntos),
// no seu início e fim, entre insumos e páginas, e entre componentes da marca depois. O resultado é
// sempre uma versão inteira, nunca a mistura (D13 com a marca em paralelo).
describe("D13 com escrita depois de qualquer transporte", () => {
  const casos = {
    Início: async (api: ReturnType<typeof dataApi>) => {
      const r = await lerInsumosDoInicio(api.cliente);
      return [r.consolidados[0].vf === 1020000, r.posicoes[0].saldo_final === 1020000, r.eventos.length === 1];
    },
    fechamento: async (api: ReturnType<typeof dataApi>) => {
      const r = await lerInsumosDoFechamento(api.cliente);
      return [r.posicoes[0].saldo_final === 1020000, r.eventos.length === 1];
    },
    Comparação: async (api: ReturnType<typeof dataApi>) => {
      const r = await lerComparacao(api.cliente, "benchmark-ficticio");
      return [r.consolidados[0].vf === 1020000n, r.eventos.length === 1, r.valores[0].valor === "0.9", r.cobertura?.atualizado_em === "v2"];
    },
  };
  it.each((Object.keys(casos) as (keyof typeof casos)[]).flatMap((caso) => [[caso, "chegada"], [caso, "inversa"]] as const))(
    "%s, lote em ordem de %s",
    async (caso, ordem) => {
      const versoes = new Set<string>();
      let maiorLote = 0;
      for (let k = 0; ; k++) {
        const api = dataApi((_t, indice) => indice === k, ordem);
        const nova = await casos[caso](api);
        expect(new Set(nova).size, `escrita depois do transporte ${k}`).toBe(1);
        versoes.add(nova[0] ? "nova" : "antiga");
        maiorLote = Math.max(maiorLote, api.maiorLote());
        if (api.versao() === 1) break;
      }
      expect([...versoes].sort()).toEqual(["antiga", "nova"]);
      // Os componentes da marca estiveram em voo juntos.
      expect(maiorLote).toBeGreaterThanOrEqual(5);
    },
  );
});

// A mesma varredura para a marca dos metadados (ciclo 015, issue #153): uma escrita depois de cada
// transporte possível, inclusive entre a marca de metadados e os componentes da carteira, devolve
// sempre o nome, a instituição e a classe do mesmo estado, nunca a mistura.
describe("D13 dos leitores do Início com escrita de metadados depois de qualquer transporte", () => {
  const leitores = {
    "por ativo": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicio(c),
    "por classe": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicioPorClasse(c),
    "por instituição": (c: ReturnType<typeof dataApi>["cliente"]) => lerInsumosDoInicioPorInstituicao(c),
  };
  it.each(Object.entries(leitores).flatMap(([nome, ler]) => [[nome, ler, "chegada"], [nome, ler, "inversa"]] as const))(
    "%s, lote em ordem de %s",
    async (_nome, ler, ordem) => {
      const estados = new Set<string>();
      for (let k = 0; ; k++) {
        const api = dataApi((_t, indice) => indice === k, ordem, "metadados");
        const { ativos } = await ler(api.cliente);
        const novo = [ativos[0].nome === "Ativo renomeado", ativos[0].taxonomia_id === RV, ativos[0].instituicao_id === INSTITUICAO];
        expect(new Set(novo).size, `escrita depois do transporte ${k}`).toBe(1);
        estados.add(novo[0] ? "novo" : "antigo");
        if (api.versao() === 1) break;
      }
      expect([...estados].sort()).toEqual(["antigo", "novo"]);
    },
  );
});
