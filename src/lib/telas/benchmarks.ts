// Composição da comparação (D4): só regras existentes da KB-004, seções 8 e 9.
import { serieBase100 } from "../financeiro/acumulado";
import { comparar, retornoMensalDiario, retornoMensalMensal, type Cobertura, type RetornoBenchmark, type ValorSerie } from "../financeiro/benchmarks";
import { mesSeguinte } from "../financeiro/datas";
import { ND, type Razao } from "../financeiro/rentabilidade";
import { mesesDoPeriodo, type Periodo } from "./inicio";

export function retornosDoBenchmark(periodicidade: "diaria" | "mensal", valores: readonly ValorSerie[], cobertura: Cobertura | null, periodo: Periodo) {
  const retornos: Record<string, RetornoBenchmark> = {};
  for (const mes of mesesDoPeriodo(periodo)) {
    if (periodicidade === "mensal") retornos[mes] = retornoMensalMensal(valores, mes);
    else {
      const resultado = retornoMensalDiario(valores, cobertura, mes);
      retornos[mes] = resultado.completo ? resultado.retorno : "parcial";
    }
  }
  return retornos;
}

export function comporComparacao(carteira: Readonly<Record<string, Razao>>, benchmark: Readonly<Record<string, RetornoBenchmark>>, inicio: string, periodo: Periodo) {
  const de = periodo.de > mesSeguinte(inicio) ? periodo.de : mesSeguinte(inicio);
  const efetivo = { de, ate: periodo.ate };
  const meses = de <= periodo.ate ? mesesDoPeriodo(efetivo) : [];
  const b: Record<string, Razao> = Object.fromEntries(Object.entries(benchmark).map(([mes, r]) => [mes, typeof r === "number" ? r : ND]));
  return {
    efetivo,
    meses,
    medidas: comparar(carteira, benchmark, de, periodo.ate),
    baseCarteira: serieBase100(carteira, inicio, de, periodo.ate),
    baseBenchmark: serieBase100(b, inicio, de, periodo.ate),
  };
}
