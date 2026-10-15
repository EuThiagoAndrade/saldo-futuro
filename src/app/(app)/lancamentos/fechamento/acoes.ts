"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { paraNumero, RecusaFinanceira } from "@/lib/financeiro/centavos";
import { hojeEmCuiaba } from "@/lib/financeiro/datas";
import { previaFechamento } from "@/lib/financeiro/fechamento";
import { lerQuantia } from "@/lib/financeiro/quantias";
import { ErroLeitura, MENSAGEM_DADOS_MUDARAM } from "@/lib/leitura";
import { exigirSessao } from "@/lib/sessao";
import type { EstadoAcao } from "@/lib/telas/acao";
import { mensagemDeRecusa } from "@/lib/telas/carteira";
import type { EstadoRevisao } from "@/lib/telas/estado-fechamento";
import { entradaDoFechamento, mesMaisAntigo, situacaoDoMes } from "@/lib/telas/fechamento";
import { lerInsumosDoFechamento, nomeDoAtivo } from "@/lib/telas/leituras";

// Fechamento em três etapas (KB-004, seção 5; D5 do ciclo 003): a revisão calcula a prévia no
// servidor, com os insumos coerentes de D13; o fechamento é gravado só por fechar_mes, que
// recalcula e confere tudo de novo.

const mes = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido.");
const PREFIXO = "saldo:";

export async function revisarFechamento(_estado: EstadoRevisao, dados: FormData): Promise<EstadoRevisao> {
  const { supabase } = await exigirSessao();
  const alvo = mes.safeParse(dados.get("mes"));
  if (!alvo.success) return { erro: alvo.error.issues[0].message };

  let insumos;
  try {
    insumos = await lerInsumosDoFechamento(supabase);
  } catch (erro) {
    if (erro instanceof ErroLeitura) return { erro: erro.motivo === "mudou" ? MENSAGEM_DADOS_MUDARAM : "Não foi possível ler a carteira. Tente novamente." };
    throw erro;
  }
  const situacao = situacaoDoMes(alvo.data, hojeEmCuiaba(), insumos.mesesFechados, mesMaisAntigo(insumos.eventos));
  if (situacao.tipo !== "pode_fechar") return { erro: mensagemDeRecusa(situacao.tipo === "fechado" ? "recusado_mes_fechado" : `recusado_${situacao.motivo}`) };

  // Saldo real digitado de cada ativo; campo vazio é pendência, não zero (P7).
  const saldosReais: Record<string, bigint> = {};
  for (const [campo, valor] of dados.entries()) {
    if (!campo.startsWith(PREFIXO) || typeof valor !== "string" || !valor.trim()) continue;
    const ativo = campo.slice(PREFIXO.length);
    try {
      saldosReais[ativo] = lerQuantia(valor);
    } catch (erro) {
      const nome = nomeDoAtivo(insumos.ativos, ativo);
      if (erro instanceof RecusaFinanceira && erro.motivo === "formato") {
        return { erro: `Saldo de ${nome}: use o formato 1.234,56, com vírgula e até duas casas decimais.` };
      }
      return { erro: `Saldo de ${nome}: ${mensagemDeRecusa(erro)}` };
    }
  }

  try {
    const entrada = entradaDoFechamento(alvo.data, insumos.ativos, insumos.posicoes, insumos.eventos, saldosReais);
    const previa = previaFechamento(entrada);
    return {
      revisao: {
        saldos: Object.fromEntries(Object.entries(saldosReais).map(([id, v]) => [id, v.toString()])),
        posicoes: previa.posicoes.map((p) => ({
          ativo: p.ativo,
          nome: nomeDoAtivo(insumos.ativos, p.ativo),
          saldoCalculado: p.saldoCalculado.toString(),
          saldoFinal: p.saldoFinal.toString(),
          ajuste: p.ajuste.toString(),
          tipoAjuste: p.tipoAjuste,
        })),
        consolidado: Object.fromEntries(Object.entries(previa.consolidado).map(([k, v]) => [k, v.toString()])) as Required<EstadoRevisao>["revisao"]["consolidado"],
      },
    };
  } catch (erro) {
    if (erro instanceof RecusaFinanceira && erro.motivo === "pendencia") {
      const nomes = (erro.detalhe as string[]).map((id) => nomeDoAtivo(insumos.ativos, id));
      return { erro: `Informe o saldo real de: ${nomes.join(", ")}.` };
    }
    return { erro: mensagemDeRecusa(erro) };
  }
}

const fechamento = z.object({ mes, saldos: z.record(z.uuid(), z.string().regex(/^-?\d+$/)) });

export async function fecharMes(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  let saldos: unknown;
  try {
    saldos = JSON.parse(String(dados.get("saldos") ?? "{}"));
  } catch {
    return { erro: "Revise o fechamento de novo." };
  }
  const entrada = fechamento.safeParse({ mes: dados.get("mes"), saldos });
  if (!entrada.success) return { erro: "Revise o fechamento de novo." };
  let p_saldos: Record<string, number>;
  try {
    // Fronteira de saída: só inteiros na faixa (D11), sem perda de precisão.
    p_saldos = Object.fromEntries(Object.entries(entrada.data.saldos).map(([id, v]) => [id, paraNumero(BigInt(v))]));
  } catch (erro) {
    return { erro: mensagemDeRecusa(erro) };
  }
  const { error } = await supabase.rpc("fechar_mes", { p_mes: `${entrada.data.mes}-01`, p_saldos });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  redirect(`/lancamentos/fechamento/${entrada.data.mes}`);
}

export async function reabrirMes(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  const { supabase } = await exigirSessao();
  const alvo = mes.safeParse(dados.get("mes"));
  if (!alvo.success) return { erro: alvo.error.issues[0].message };
  const { error } = await supabase.rpc("reabrir_mes", { p_mes: `${alvo.data}-01` });
  if (error) return { erro: mensagemDeRecusa(error) };
  revalidatePath("/", "layout");
  redirect(`/lancamentos/fechamento/${alvo.data}`);
}
