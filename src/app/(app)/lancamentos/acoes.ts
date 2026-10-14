"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RecusaFinanceira } from "@/lib/financeiro/centavos";
import { mesDe } from "@/lib/financeiro/datas";
import { lerQuantia } from "@/lib/financeiro/quantias";
import type { EstadoAcao } from "@/lib/telas/acao";
import { mensagemDeRecusa, TIPOS_DA_TELA, valorComSinal } from "@/lib/telas/carteira";
import { exigirSessao } from "@/lib/sessao";

// Escrita só pelas funções do banco, com a sessão do usuário (D3). O valor digitado é lido pelo
// parser da KB-004 aqui, no servidor, que é a autoridade (D12); o sinal vem da escolha de tipo e
// direção, nunca do texto (P9).

const data = z.iso.date({ error: "Informe uma data válida." });

const novoLancamento = z.object({
  ativo: z.uuid({ error: "Escolha um ativo." }),
  data,
  tipo: z.enum(TIPOS_DA_TELA, { error: "Escolha um tipo de lançamento." }),
  direcao: z.enum(["ganho", "perda"]).optional(),
  valor: z.string({ error: "Informe o valor." }),
});

export async function lancar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = novoLancamento.safeParse({
    ativo: dados.get("ativo"),
    data: dados.get("data"),
    tipo: dados.get("tipo"),
    direcao: dados.get("direcao") || undefined,
    valor: dados.get("valor"),
  });
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { ativo, tipo, direcao } = entrada.data;

  let valor: bigint;
  try {
    const digitado = lerQuantia(entrada.data.valor);
    if (digitado < 0n) return { erro: "Digite o valor sem sinal. Para perdas, escolha Perda." };
    valor = valorComSinal(tipo, direcao, digitado);
  } catch (erro) {
    if (erro instanceof RecusaFinanceira && erro.motivo === "formato") {
      return { erro: "Use o formato 1.234,56, com vírgula e até duas casas decimais." };
    }
    return { erro: mensagemDeRecusa(erro) };
  }

  const { error } = await supabase.rpc("lancar_evento", {
    p_ativo: ativo,
    p_data: entrada.data.data,
    p_tipo: tipo,
    p_valor: Number(valor),
  });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  redirect(`/lancamentos?mes=${mesDe(entrada.data.data)}`);
}

const estorno = z.object({ evento: z.uuid(), data });

export async function estornar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = estorno.safeParse({ evento: dados.get("evento"), data: dados.get("data") });
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { error } = await supabase.rpc("estornar_evento", { p_evento: entrada.data.evento, p_data: entrada.data.data });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Lançamento estornado." };
}
