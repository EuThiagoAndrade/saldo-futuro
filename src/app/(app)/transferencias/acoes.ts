"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RecusaFinanceira } from "@/lib/financeiro/centavos";
import { lerQuantia } from "@/lib/financeiro/quantias";
import type { EstadoAcao } from "@/lib/telas/acao";
import { mensagemDeRecusa } from "@/lib/telas/carteira";
import { exigirSessao } from "@/lib/sessao";

// Transferência e correção pela tela (KB-004, 4.4; K6), só pelas funções do banco (D3).

const data = z.iso.date({ error: "Informe uma data válida." });

const novaTransferencia = z.object({
  origem: z.uuid({ error: "Escolha o ativo de origem." }),
  destino: z.uuid({ error: "Escolha o ativo de destino." }),
  data,
  valor: z.string({ error: "Informe o valor." }),
});

export async function transferir(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = novaTransferencia.safeParse({
    origem: dados.get("origem"),
    destino: dados.get("destino"),
    data: dados.get("data"),
    valor: dados.get("valor"),
  });
  if (!entrada.success) return { erro: entrada.error.issues[0].message };

  let valor: bigint;
  try {
    valor = lerQuantia(entrada.data.valor);
  } catch (erro) {
    if (erro instanceof RecusaFinanceira && erro.motivo === "formato") {
      return { erro: "Use o formato 1.234,56, com vírgula e até duas casas decimais." };
    }
    return { erro: mensagemDeRecusa(erro) };
  }
  if (valor <= 0n) return { erro: "O valor precisa ser maior que zero." };

  const { error } = await supabase.rpc("transferir", {
    p_origem: entrada.data.origem,
    p_destino: entrada.data.destino,
    p_data: entrada.data.data,
    p_valor: Number(valor),
  });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Transferência registrada." };
}

const correcao = z.object({ transferencia: z.uuid(), data });

export async function corrigirTransferencia(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const entrada = correcao.safeParse({ transferencia: dados.get("transferencia"), data: dados.get("data") });
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const { error } = await supabase.rpc("corrigir_transferencia", {
    p_transferencia: entrada.data.transferencia,
    p_data: entrada.data.data,
  });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  return { ok: "Transferência corrigida." };
}
