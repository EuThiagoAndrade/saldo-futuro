"use server";

import type { EstadoAcao } from "@/lib/telas/acao";
import { criarEntrada, excluirEntrada, renomearEntrada } from "@/lib/telas/acoes-catalogo";

// Ações da tela de instituições (ciclo 012, issue #127); a regra está em acoes-catalogo.

export async function criar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return criarEntrada("instituicoes", dados);
}

export async function renomear(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return renomearEntrada("instituicoes", dados);
}

export async function excluir(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return excluirEntrada("instituicoes", dados);
}
