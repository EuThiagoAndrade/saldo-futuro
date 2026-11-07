import { NextRequest } from "next/server";

// Normaliza somente o envio do formulário. A URL de /ativos continua validada estritamente.
export function GET(request: NextRequest) {
  const consulta = new URLSearchParams(request.nextUrl.searchParams);
  if (consulta.get("prazo_resgate_tipo") !== "prazo") {
    for (const campo of ["prazo_resgate_comparacao", "prazo_resgate_dias", "prazo_resgate_dias_ate", "prazo_resgate_unidade"]) consulta.delete(campo);
  } else if (consulta.get("prazo_resgate_comparacao") !== "entre") {
    consulta.delete("prazo_resgate_dias_ate");
  }
  return new Response(null, { status: 303, headers: { Location: `/ativos?${consulta.toString()}#ativos-da-aba` } });
}
