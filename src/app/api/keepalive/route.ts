import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { backend } from "@/lib/config";
import { parseEnv } from "@/lib/env";
import { runKeepalive } from "@/lib/keepalive";

// Sempre dinâmica: o cron chama a rota todos os dias e ela precisa tocar o banco.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { CRON_SECRET } = parseEnv({ CRON_SECRET: process.env.CRON_SECRET });

  const config = backend;
  const ping = config
    ? async () => {
        // Chave publicável e função public.keepalive(), que não lê tabela alguma.
        const supabase = createClient(config.url, config.publishableKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        const { data, error } = await supabase.rpc("keepalive");
        return !error && data === 1;
      }
    : null;

  const { status, body } = await runKeepalive(request.headers.get("authorization"), { secret: CRON_SECRET, ping });
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
