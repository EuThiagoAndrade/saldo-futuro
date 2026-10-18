// Diário por operação e trava de gravador único (plano do ciclo 006, "Mecanismo de execução").
// Os dois vivem num diretório em local/, escolhido pelo ponto de entrada. O diário é um JSONL só
// de acréscimos: cada linha é gravada e sincronizada com o disco antes da chamada seguinte, para
// que a intenção exista antes da chamada e o resultado logo depois dela.

import { open, readFile, unlink } from "node:fs/promises";
import path from "node:path";

export type EntradaDiario =
  | { tipo: "cabecalho"; versao: 1; sha256Origem: string; sha256Plano: string; usuarioDestino: string }
  | { tipo: "intencao"; sequencia: number; chave: string }
  | { tipo: "resultado"; sequencia: number; chave: string; id: string | null }
  | { tipo: "desconhecida"; sequencia: number; chave: string; motivo: string }
  | { tipo: "reconhecida"; sequencia: number; chave: string; id: string | null }
  | { tipo: "recusada"; sequencia: number; chave: string; codigo: string };

export interface Diario {
  ler(): Promise<EntradaDiario[]>;
  acrescentar(entrada: EntradaDiario): Promise<void>;
}

/** Diário em arquivo: uma linha JSON por entrada, com fsync a cada acréscimo. */
export function diarioEmArquivo(caminho: string): Diario {
  return {
    async ler() {
      let texto: string;
      try {
        texto = await readFile(caminho, "utf8");
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw erro;
      }
      const linhas = texto.split("\n");
      // Uma última linha sem quebra é uma escrita interrompida: não vale como entrada.
      if (linhas.at(-1) !== "") throw new Error("diário com a última linha incompleta");
      return linhas.slice(0, -1).map((linha) => JSON.parse(linha) as EntradaDiario);
    },
    async acrescentar(entrada) {
      const arquivo = await open(caminho, "a");
      try {
        await arquivo.write(`${JSON.stringify(entrada)}\n`);
        await arquivo.sync();
      } finally {
        await arquivo.close();
      }
    },
  };
}

export const NOME_TRAVA = "gravacao.trava";

export class TravaPresente extends Error {
  constructor() {
    super("trava de gravador único presente");
    this.name = "TravaPresente";
  }
}

/**
 * Executa fn com a trava de gravador único criada de forma exclusiva (wx) no diretório. Se a trava
 * existir, nada é executado. A trava só é removida por quem a criou; se o processo morrer, ela
 * fica, e a remoção é decisão humana do roteiro.
 */
export async function comTrava<T>(diretorio: string, fn: () => Promise<T>): Promise<T> {
  const caminho = path.join(diretorio, NOME_TRAVA);
  let arquivo;
  try {
    arquivo = await open(caminho, "wx");
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === "EEXIST") throw new TravaPresente();
    throw erro;
  }
  try {
    await arquivo.write(`${JSON.stringify({ pid: process.pid, inicio: new Date().toISOString() })}\n`);
    await arquivo.sync();
  } finally {
    await arquivo.close();
  }
  try {
    return await fn();
  } finally {
    await unlink(caminho);
  }
}
