import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

// "Ocultar valores" (P16, P20 e D8 do ciclo 004): a preferência fica num cookie do navegador,
// sem dado do usuário, lido pelo servidor em toda renderização. Assim a página já sai oculta,
// sem mostrar o valor antes da hidratação, e os gráficos continuam sem JavaScript.

export const COOKIE_OCULTAR = "sf_ocultar_valores";

export const valoresOcultos = cache(async (): Promise<boolean> => {
  return (await cookies()).get(COOKIE_OCULTAR)?.value === "1";
});
