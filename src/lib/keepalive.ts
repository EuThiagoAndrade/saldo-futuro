import { createHash, timingSafeEqual } from "node:crypto";

export type KeepaliveDeps = {
  /** CRON_SECRET do ambiente; ausente ou vazio recusa tudo. */
  secret: string | undefined;
  /** Consulta trivial ao banco; nulo quando não há backend configurado. */
  ping: (() => Promise<boolean>) | null;
};

export type KeepaliveResult = { status: 200 | 401 | 500 | 503; body: { ok: boolean } };

// Compara os hashes para não vazar o tamanho nem o conteúdo do segredo pelo tempo de resposta.
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export async function runKeepalive(authorization: string | null, { secret, ping }: KeepaliveDeps): Promise<KeepaliveResult> {
  if (!secret || authorization === null || !safeEqual(authorization, `Bearer ${secret}`)) {
    return { status: 401, body: { ok: false } };
  }
  if (!ping) return { status: 503, body: { ok: false } };
  try {
    return (await ping()) ? { status: 200, body: { ok: true } } : { status: 500, body: { ok: false } };
  } catch {
    return { status: 500, body: { ok: false } };
  }
}
