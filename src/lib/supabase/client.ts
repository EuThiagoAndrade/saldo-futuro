import { createBrowserClient } from "@supabase/ssr";
import { backend } from "@/lib/config";

export function createClient() {
  if (!backend) throw new Error("Backend não configurado.");
  return createBrowserClient(backend.url, backend.publishableKey);
}
