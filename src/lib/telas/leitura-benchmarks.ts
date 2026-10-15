import "server-only";
import { type Cliente, lerComposicao, lerTabela, marcaBenchmark, marcaCarteira } from "../leitura";
import { mesDaColuna } from "./fechamento";
import { lerEventos } from "./leituras";

export interface BenchmarkLido {
  id: string;
  nome: string;
  codigo_sgs: number;
  periodicidade: "diaria" | "mensal";
}

export async function lerCatalogo(cliente: Cliente) {
  const benchmarks = await lerTabela<BenchmarkLido>(cliente, "benchmarks", { colunas: "id, nome, codigo_sgs, periodicidade" });
  return Promise.all(benchmarks.map(async (benchmark) => ({ ...benchmark, cobertura: await marcaBenchmark(cliente, benchmark.id) })));
}

/** Marcas dos dois lados envolvem todas as consultas, inclusive tabelas com uma única página. */
export async function lerComparacao(cliente: Cliente, benchmarkId: string) {
  const { marca, insumos } = await lerComposicao(
    async () => ({ carteira: await marcaCarteira(cliente), benchmark: await marcaBenchmark(cliente, benchmarkId) }),
    async () => ({
      consolidados: (await lerTabela<{ mes: string; vi: number; vf: number }>(cliente, "consolidados_mensais", { colunas: "mes, vi, vf" }))
        .map((m) => ({ mes: mesDaColuna(m.mes), vi: BigInt(m.vi), vf: BigInt(m.vf) })),
      eventos: await lerEventos(cliente),
      valores: (await lerTabela<{ data: string; valor: number | string }>(cliente, "valores_benchmark", {
        colunas: "data, valor", filtrar: (consulta) => consulta.eq("benchmark_id", benchmarkId),
      })).map((v) => ({ data: v.data, valor: String(v.valor) })),
    }),
  );
  return { ...insumos, cobertura: marca.benchmark };
}
