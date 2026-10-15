import { describe, expect, it, vi } from "vitest";
import { type BenchmarkSgs, type Buscar, type ClienteCarga, ErroSincronizacao, janelas, sincronizarBenchmark, urlDaJanela } from "./sgs";

// Sincronização com o SGS (D10) só com fetch falso: nenhum teste chama a rede. Valores
// fictícios, no formato verificado na documentação do Banco Central (V3).

const CDI: BenchmarkSgs = { id: "00000000-0000-4000-8000-0000000000e1", codigoSgs: 12, periodicidade: "diaria" };
const IPCA: BenchmarkSgs = { id: "00000000-0000-4000-8000-0000000000e2", codigoSgs: 433, periodicidade: "mensal" };

function resposta(corpo: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => (typeof corpo === "string" ? corpo : JSON.stringify(corpo)) };
}

/** fetch falso que responde por janela, na ordem das chamadas. */
function buscarFalso(respostas: ReturnType<typeof resposta>[]) {
  const fila = [...respostas];
  return vi.fn<Buscar>(async () => {
    const r = fila.shift();
    if (!r) throw new Error("chamada inesperada");
    return r;
  });
}

function clienteFalso(erro: string | null = null) {
  return { rpc: vi.fn<ClienteCarga["rpc"]>(async () => ({ error: erro ? { message: erro } : null })) };
}

describe("janelas do SGS", () => {
  it("fatia em janelas consecutivas de no máximo 10 anos, sem sobreposição", () => {
    const lista = janelas("2000-01-01", "2026-10-14");
    expect(lista).toEqual([
      { inicio: "2000-01-01", fim: "2009-12-31" },
      { inicio: "2010-01-01", fim: "2019-12-31" },
      { inicio: "2020-01-01", fim: "2026-10-14" },
    ]);
  });

  it("janela a partir de 29 de fevereiro não passa de 10 anos", () => {
    expect(janelas("2024-02-29", "2040-01-01")[0]).toEqual({ inicio: "2024-02-29", fim: "2034-02-28" });
  });

  it("monta a URL com dataInicial e dataFinal em dd/MM/aaaa", () => {
    expect(urlDaJanela(12, { inicio: "2026-01-02", fim: "2026-02-27" })).toBe(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=02/01/2026&dataFinal=27/02/2026",
    );
  });
});

describe("sincronizarBenchmark", () => {
  it("prazo esgotado entre janelas não grava a primeira nem inicia a segunda", async () => {
    const controller = new AbortController();
    const cliente = clienteFalso();
    const buscar = vi.fn<Buscar>(async () => {
      controller.abort();
      return resposta([{ data: "31/12/2015", valor: "0.04" }]);
    });
    await expect(sincronizarBenchmark(CDI, "2006-01-01", "2016-01-31", { buscar, cliente, signal: controller.signal })).rejects.toMatchObject({ motivo: "tempo" });
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(cliente.rpc).not.toHaveBeenCalled();
  });
  it("prazo esgotado no corpo da última resposta não grava", async () => {
    const controller = new AbortController();
    const cliente = clienteFalso();
    const buscar: Buscar = async () => ({ ok: true, status: 200, text: async () => {
      controller.abort();
      return JSON.stringify([{ data: "01/01/2026", valor: "0.3" }]);
    } });
    await expect(sincronizarBenchmark(IPCA, "2026-01-01", "2026-01-31", { buscar, cliente, signal: controller.signal })).rejects.toMatchObject({ motivo: "tempo" });
    expect(cliente.rpc).not.toHaveBeenCalled();
  });
  it("busca todas as janelas e grava tudo numa única chamada, com os valores em texto", async () => {
    const buscar = buscarFalso([
      resposta([{ data: "31/12/2015", valor: "0.051660" }]),
      resposta([{ data: "02/01/2016", valor: "0.04" }, { data: "04/01/2016", valor: "0.040000" }]),
    ]);
    const cliente = clienteFalso();
    expect(await sincronizarBenchmark(CDI, "2006-01-01", "2016-01-31", { buscar, cliente })).toBe(3);
    expect(buscar).toHaveBeenCalledTimes(2);
    expect(buscar.mock.calls.map(([url]) => url)).toEqual([
      urlDaJanela(12, { inicio: "2006-01-01", fim: "2015-12-31" }),
      urlDaJanela(12, { inicio: "2016-01-01", fim: "2016-01-31" }),
    ]);
    expect(cliente.rpc).toHaveBeenCalledTimes(1);
    expect(cliente.rpc).toHaveBeenCalledWith("carregar_benchmark", {
      p_benchmark: CDI.id,
      p_data_inicial: "2006-01-01",
      p_data_final: "2016-01-31",
      p_valores: [
        { data: "2015-12-31", valor: "0.051660" },
        { data: "2016-01-02", valor: "0.04" },
        { data: "2016-01-04", valor: "0.040000" },
      ],
    });
  });

  it("repetir uma sincronização envia a mesma carga", async () => {
    const corpo = [{ data: "01/01/2026", valor: "0.33" }];
    const a = clienteFalso();
    const b = clienteFalso();
    await sincronizarBenchmark(IPCA, "2026-01-01", "2026-01-31", { buscar: buscarFalso([resposta(corpo)]), cliente: a });
    await sincronizarBenchmark(IPCA, "2026-01-01", "2026-01-31", { buscar: buscarFalso([resposta(corpo)]), cliente: b });
    expect(a.rpc.mock.calls).toEqual(b.rpc.mock.calls);
  });

  const falhas: [string, ReturnType<typeof resposta>[], ErroSincronizacao["motivo"]][] = [
    ["HTTP 406", [resposta({ erro: "x" }, 406)], "busca"],
    ["erro na janela posterior", [resposta([{ data: "31/12/2015", valor: "0.04" }]), resposta("erro", 500)], "busca"],
    ["JSON inválido", [resposta("<html>")], "resposta"],
    ["valor numérico em vez de texto", [resposta([{ data: "02/01/2006", valor: 0.04 }])], "resposta"],
    ["valor com vírgula", [resposta([{ data: "02/01/2006", valor: "0,04" }])], "resposta"],
    ["data fora do formato", [resposta([{ data: "2006-01-02", valor: "0.04" }])], "resposta"],
    ["data inexistente", [resposta([{ data: "30/02/2006", valor: "0.04" }])], "resposta"],
    ["data fora da janela", [resposta([{ data: "02/01/2005", valor: "0.04" }])], "resposta"],
    ["corpo que não é lista", [resposta({ data: "02/01/2006", valor: "0.04" })], "resposta"],
  ];
  for (const [nome, respostas, motivo] of falhas) {
    it(`${nome}: recusa sem gravar`, async () => {
      const cliente = clienteFalso();
      const buscar = buscarFalso([...respostas, resposta([])]);
      const fim = respostas.length > 1 ? "2016-01-31" : "2006-01-31";
      await expect(sincronizarBenchmark(CDI, "2006-01-01", fim, { buscar, cliente })).rejects.toMatchObject({ motivo });
      expect(cliente.rpc).not.toHaveBeenCalled();
    });
  }

  it("falha da rede: recusa sem gravar", async () => {
    const cliente = clienteFalso();
    const buscar = vi.fn<Buscar>(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(sincronizarBenchmark(CDI, "2006-01-01", "2006-01-31", { buscar, cliente })).rejects.toMatchObject({ motivo: "busca" });
    expect(cliente.rpc).not.toHaveBeenCalled();
  });

  it("série mensal fora do dia 1 é recusada", async () => {
    const cliente = clienteFalso();
    const buscar = buscarFalso([resposta([{ data: "15/01/2026", valor: "0.33" }])]);
    await expect(sincronizarBenchmark(IPCA, "2026-01-01", "2026-01-31", { buscar, cliente })).rejects.toMatchObject({
      motivo: "resposta",
    });
    expect(cliente.rpc).not.toHaveBeenCalled();
  });

  it("período sem nenhum valor não grava", async () => {
    const cliente = clienteFalso();
    await expect(
      sincronizarBenchmark(CDI, "2026-10-14", "2026-10-14", { buscar: buscarFalso([resposta([])]), cliente }),
    ).rejects.toMatchObject({ motivo: "sem_valores" });
    expect(cliente.rpc).not.toHaveBeenCalled();
  });

  it("erro da função de carga é devolvido como falha de gravação", async () => {
    const cliente = clienteFalso("recusado_buraco");
    await expect(
      sincronizarBenchmark(CDI, "2026-01-01", "2026-01-31", {
        buscar: buscarFalso([resposta([{ data: "02/01/2026", valor: "0.04" }])]),
        cliente,
      }),
    ).rejects.toThrow("gravacao: recusado_buraco");
  });
});
