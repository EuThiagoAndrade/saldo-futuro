import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { backend } from "@/lib/config";

export async function createClient() {
  if (!backend) throw new Error("Backend não configurado.");
  const cookieStore = await cookies();
  return createServerClient(backend.url, backend.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de um Server Component: o proxy renova a sessão e grava os cookies.
        }
      },
    },
  });
}
