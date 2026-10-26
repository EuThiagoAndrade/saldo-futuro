"use server";

import type { EstadoAcao } from "@/lib/telas/acao";
import { criarEntrada, excluirEntrada, renomearEntrada } from "@/lib/telas/acoes-catalogo";

// Ações de /cadastros (ciclo 012, issue #127; só instituições desde o ciclo 013, issue #138); a
// regra está em acoes-catalogo.

export async function criarInstituicao(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return criarEntrada("instituicoes", dados);
}

export async function renomearInstituicao(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return renomearEntrada("instituicoes", dados);
}

export async function excluirInstituicao(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return excluirEntrada("instituicoes", dados);
}
