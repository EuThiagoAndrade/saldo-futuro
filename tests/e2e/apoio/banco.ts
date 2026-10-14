// SQL de preparo e limpeza no banco local, como superusuário do contêiner do Supabase local.
// Só para o que nenhum papel da Data API pode fazer, por desenho: as séries de benchmark são
// globais e nem a chave secreta as apaga (revoke em 20261014193630_benchmarks.sql), e a falha
// de leitura do perfil precisa de um perfil ausente. Recusa qualquer URL que não seja local.

import { execFileSync } from "node:child_process";

// O nome do contêiner vem do project_id de supabase/config.toml, o mesmo no CI.
const CONTEINER = "supabase_db_saldo-futuro";

export function sqlLocal(sql: string): string {
  const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://invalido");
  if (!["127.0.0.1", "localhost"].includes(url.hostname)) throw new Error("sqlLocal só roda contra o Supabase local");
  return execFileSync("docker", ["exec", "-i", CONTEINER, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-tAq"], {
    input: sql,
    encoding: "utf8",
  }).trim();
}
