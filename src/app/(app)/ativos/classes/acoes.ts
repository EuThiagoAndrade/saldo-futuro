"use server";

import type { EstadoAcao } from "@/lib/telas/acao";
import { criarEntrada, excluirEntrada, renomearEntrada } from "@/lib/telas/acoes-catalogo";

// Ações da tela de classes (ciclo 012, issue #127); a regra está em acoes-catalogo.

export async function criar(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return criarEntrada("classes", dados);
}

export async function renomear(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return renomearEntrada("classes", dados);
}

export async function excluir(_estado: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return excluirEntrada("classes", dados);
}
