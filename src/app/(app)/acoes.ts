"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { COOKIE_OCULTAR } from "@/lib/ocultar";
import { exigirSessao } from "@/lib/sessao";

const UM_ANO = 60 * 60 * 24 * 365;

/** Liga ou desliga "Ocultar valores" neste navegador (D8). Exige sessão, como toda ação (D2). */
export async function alternarOcultarValores() {
  await exigirSessao();
  const cookieStore = await cookies();
  const ligado = cookieStore.get(COOKIE_OCULTAR)?.value === "1";
  cookieStore.set(COOKIE_OCULTAR, ligado ? "0" : "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: UM_ANO,
  });
  revalidatePath("/", "layout");
}
