import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { backend } from "@/lib/config";

// Só renova a sessão. Não redireciona: a proteção de rotas é feita no servidor.
export async function proxy(request: NextRequest) {
  if (!backend) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(backend.url, backend.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims: ele renova os cookies da sessão.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Fora do proxy: arquivos estáticos, ícones, manifesto e a rota do cron (sem sessão).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|api/keepalive|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
