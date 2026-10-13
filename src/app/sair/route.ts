import { NextResponse, type NextRequest } from "next/server";
import { backend } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!backend) return NextResponse.redirect(new URL("/", request.url), 303);

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/entrar", request.url), 303);
}
