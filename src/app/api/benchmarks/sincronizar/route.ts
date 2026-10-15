import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ErroSincronizacao, sincronizarBenchmark } from "@/lib/benchmarks/sgs";
import { hojeEmCuiaba, mesDe } from "@/lib/financeiro/datas";
import { marcaBenchmark } from "@/lib/leitura";
import { obterSessao } from "@/lib/sessao";
import { lerCatalogo } from "@/lib/telas/leitura-benchmarks";

export const maxDuration = 60;
const entrada = z.object({ benchmark: z.uuid(), inicio: z.string(), fim: z.string(), confirmado: z.literal(true) });

export async function POST(request: Request) {
  // A rota é um ponto de entrada independente; não depende da proteção do layout.
  let sessao;
  try { sessao = await obterSessao(); } catch { return NextResponse.json({ erro: "Não foi possível conferir o acesso." }, { status: 403 }); }
  if (!sessao) return NextResponse.json({ erro: "Entre para continuar." }, { status: 401 });
  if (sessao.papel !== "admin") return NextResponse.json({ erro: "Acesso recusado." }, { status: 403 });
  // O Next pode reconstruir request.url com um hostname interno. O Host do pedido
  // conserva a origem acessada pelo navegador (inclusive a porta no ambiente local).
  const origem = new URL(request.url);
  origem.host = request.headers.get("host") ?? origem.host;
  if (request.headers.get("origin") !== origem.origin) {
    return NextResponse.json({ erro: "Origem do pedido recusada." }, { status: 403 });
  }
  const dados = entrada.safeParse(await request.json().catch(() => null));
  if (!dados.success) return NextResponse.json({ erro: "Confira o benchmark, as datas e a confirmação." }, { status: 400 });
  const { benchmark: id, inicio, fim } = dados.data;
  try {
    mesDe(inicio); mesDe(fim);
    if (inicio > fim || fim > hojeEmCuiaba()) throw new Error("periodo");
  } catch { return NextResponse.json({ erro: "Escolha datas válidas, em ordem e até hoje." }, { status: 400 }); }

  const { supabase } = sessao;
  let erro: string | null = null;
  try {
    const benchmark = (await lerCatalogo(supabase)).find((b) => b.id === id);
    if (!benchmark) return NextResponse.json({ erro: "Benchmark não encontrado." }, { status: 400 });
    // Um único prazo para todas as janelas e seus corpos, nunca um prazo por chamada.
    const signal = AbortSignal.timeout(45_000);
    await sincronizarBenchmark({ id, codigoSgs: benchmark.codigo_sgs, periodicidade: benchmark.periodicidade }, inicio, fim, {
      cliente: supabase, signal, buscar: (url) => fetch(url, { signal, cache: "no-store" }),
    });
  } catch (falha) {
    if (falha instanceof ErroSincronizacao) {
      if (falha.motivo === "tempo") erro = "O tempo de busca esgotou. Nenhum valor foi gravado.";
      else if (falha.motivo === "sem_valores") erro = "A fonte não devolveu valores para o período. Nenhum valor foi gravado.";
      else if (falha.motivo === "gravacao" && falha.message.includes("recusado_buraco")) erro = "O período deixaria um buraco na cobertura. Escolha um intervalo que toque a cobertura atual.";
      else if (falha.motivo === "gravacao") erro = "A carga foi recusada. Confira o período e a cobertura atual.";
      else erro = "A fonte está indisponível ou devolveu uma resposta inválida. Nenhum valor foi gravado.";
    } else erro = "Não foi possível confirmar a sincronização. Confira a cobertura atual antes de repetir.";
  }
  revalidatePath("/benchmarks");
  revalidatePath("/benchmarks/comparacao");
  revalidatePath("/admin/benchmarks");
  try {
    const cobertura = await marcaBenchmark(supabase, id);
    return NextResponse.json({ erro, cobertura, ok: erro ? null : "Sincronização concluída. A cobertura foi relida." }, { status: erro ? 422 : 200 });
  } catch {
    return NextResponse.json({ erro: "Não foi possível reler a cobertura. Tente novamente para conferir o estado atual." }, { status: 503 });
  }
}
