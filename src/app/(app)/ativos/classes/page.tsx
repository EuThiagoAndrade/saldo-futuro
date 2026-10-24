import { PaginaCatalogo } from "@/components/pagina-catalogo";
import { PreviewNotice } from "@/components/preview-notice";
import { backend } from "@/lib/config";
import { exigirSessao } from "@/lib/sessao";
import { linhasDoCatalogo } from "@/lib/telas/catalogos";
import { lerClasses, lerVinculosDosAtivos } from "@/lib/telas/leituras";
import { criar, excluir, renomear } from "./acoes";

export const metadata = { title: "Classes — Saldo Futuro" };

// Catálogo de classes do usuário (ciclo 012, issue #127, BL-009), aberto a partir de /ativos.
export default async function Pagina() {
  if (!backend) return <PreviewNotice />;
  const { supabase } = await exigirSessao();
  const [entradas, vinculos] = await Promise.all([lerClasses(supabase), lerVinculosDosAtivos(supabase)]);

  return <PaginaCatalogo tipo="classes" linhas={linhasDoCatalogo("classes", entradas, vinculos)} acoes={{ criar, renomear, excluir }} />;
}
