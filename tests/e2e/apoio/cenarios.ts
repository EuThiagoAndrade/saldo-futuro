// Montagem de cenários pelas funções do banco (D9 do ciclo 004). Cada cenário reproduz um único
// caso de referência num usuário próprio, chamando as mesmas funções que a aplicação chama.
//
// O banco usa o relógio real (private.hoje(), em America/Cuiaba), que o teste não controla. Um
// cenário literal só é preparado se todas as datas do caso forem até hoje e todo mês a fechar já
// tiver terminado; senão, o apoio falha (não pula). Casos que dependem de "hoje", como o CR-18,
// são provados no Vitest com a data injetada.

import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeEmCuiaba, ultimoDia } from "../../../src/lib/financeiro/datas";

export class CenarioInvalido extends Error {
  constructor(detalhe: string) {
    super(`cenário literal inválido: ${detalhe}`);
    this.name = "CenarioInvalido";
  }
}

export type Passo =
  | { criarAtivo: string; nome: string; tipoAjuste: "rendimento" | "marcacao" }
  | { lancar: string; data: string; tipo: string; valor: number }
  | { fechar: string; saldos: Record<string, number> }
  | { reabrir: string };

/** Datas usadas pelos passos: lançamentos e o último dia de cada mês a fechar. */
function datasDosPassos(passos: Passo[]): { datas: string[]; meses: string[] } {
  const datas: string[] = [];
  const meses: string[] = [];
  for (const passo of passos) {
    if ("lancar" in passo) datas.push(passo.data);
    if ("fechar" in passo) meses.push(passo.fechar);
  }
  return { datas, meses };
}

/** Recusa o cenário se alguma data for posterior a hoje ou algum mês a fechar não tiver terminado. */
export function conferirDatas(passos: Passo[], hoje = hojeEmCuiaba()) {
  const { datas, meses } = datasDosPassos(passos);
  for (const data of datas) if (data > hoje) throw new CenarioInvalido(`data ${data} depois de hoje (${hoje})`);
  for (const mes of meses) if (ultimoDia(mes) >= hoje) throw new CenarioInvalido(`mês ${mes} ainda não terminou (${hoje})`);
}

/** Executa os passos como o usuário do cliente; devolve os ids dos ativos criados, por apelido. */
export async function prepararCenario(cliente: SupabaseClient, passos: Passo[]): Promise<Record<string, string>> {
  conferirDatas(passos);
  const ativos: Record<string, string> = {};
  const id = (apelido: string) => {
    if (!ativos[apelido]) throw new CenarioInvalido(`ativo ${apelido} não criado`);
    return ativos[apelido];
  };
  for (const passo of passos) {
    let resultado: { data: unknown; error: { message: string } | null };
    if ("criarAtivo" in passo) {
      resultado = await cliente.rpc("criar_ativo", { p_nome: passo.nome, p_tipo_ajuste: passo.tipoAjuste });
      if (!resultado.error) ativos[passo.criarAtivo] = resultado.data as string;
    } else if ("lancar" in passo) {
      resultado = await cliente.rpc("lancar_evento", {
        p_ativo: id(passo.lancar),
        p_data: passo.data,
        p_tipo: passo.tipo,
        p_valor: passo.valor,
      });
    } else if ("fechar" in passo) {
      const saldos = Object.fromEntries(Object.entries(passo.saldos).map(([apelido, valor]) => [id(apelido), valor]));
      resultado = await cliente.rpc("fechar_mes", { p_mes: `${passo.fechar}-01`, p_saldos: saldos });
    } else {
      resultado = await cliente.rpc("reabrir_mes", { p_mes: `${passo.reabrir}-01` });
    }
    if (resultado.error) throw new Error(`passo ${JSON.stringify(passo)}: ${resultado.error.message}`);
  }
  return ativos;
}

