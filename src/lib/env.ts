import { z } from "zod";

// Variável vazia no .env equivale a variável ausente.
const optional = (schema: z.ZodType<string>) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optional(z.url()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optional(z.string().min(1)),
  NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: optional(z.enum(["true", "false"])),
  // Só no servidor: segredo do cron da Vercel. Ausente ou vazio, a rota de keepalive recusa tudo.
  CRON_SECRET: optional(z.string().min(1)),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

export type BackendConfig = { url: string; publishableKey: string };

// Sem URL e chave, a aplicação roda sem backend (previews) e não chama o Supabase.
export function backendConfig(env: Env): BackendConfig | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

// O login por senha existe só no ambiente local e no CI.
export function passwordLoginEnabled(env: Env): boolean {
  return env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === "true";
}
