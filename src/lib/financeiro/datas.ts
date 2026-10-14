// Datas civis (KB-004, seção 1): texto AAAA-MM-DD e meses AAAA-MM, sem Date local. "Hoje" é a
// data civil em America/Cuiaba. As regras de 4.6 e 5 (início, sequência, mês terminado, K7 e
// K13) são as mesmas da função do banco.

import { RecusaFinanceira } from "./centavos";

export type DataCivil = string;
export type Mes = string;

const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MES = /^(\d{4})-(\d{2})$/;

function partesDoMes(mes: Mes): [number, number] {
  const m = MES.exec(mes);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`mês inválido: ${mes}`);
  return [Number(m[1]), Number(m[2])];
}

export function bissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

export function diasNoMes(mes: Mes): number {
  const [ano, m] = partesDoMes(mes);
  if (m === 2) return bissexto(ano) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

export function mesDe(data: DataCivil): Mes {
  const d = DATA.exec(data);
  if (!d) throw new Error(`data inválida: ${data}`);
  const mes = `${d[1]}-${d[2]}`;
  const dia = Number(d[3]);
  if (dia < 1 || dia > diasNoMes(mes)) throw new Error(`data inválida: ${data}`);
  return mes;
}

export function diaDe(data: DataCivil): number {
  mesDe(data);
  return Number(data.slice(8, 10));
}

export function mesSeguinte(mes: Mes): Mes {
  const [ano, m] = partesDoMes(mes);
  return m === 12 ? `${ano + 1}-01` : `${ano}-${String(m + 1).padStart(2, "0")}`;
}

export function ultimoDia(mes: Mes): DataCivil {
  return `${mes}-${String(diasNoMes(mes)).padStart(2, "0")}`;
}

/** Data civil corrente em America/Cuiaba, independente do fuso do processo. */
export function hojeEmCuiaba(agora: Date = new Date()): DataCivil {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Cuiaba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** KB-004, 4.6: nunca futura (K13); depois do primeiro fechamento, no primeiro mês aberto. */
export function conferirDataLancamento(data: DataCivil, hoje: DataCivil, ultimoMesFechado: Mes | null): void {
  mesDe(data);
  if (data > hoje) throw new RecusaFinanceira("data_futura");
  if (ultimoMesFechado !== null && mesDe(data) < mesSeguinte(ultimoMesFechado)) {
    throw new RecusaFinanceira("mes_fechado");
  }
}

/** KB-004, seção 5: mês terminado (K13), início no evento mais antigo (K7) e sequência (P8). */
export function conferirFechamento(
  mes: Mes,
  hoje: DataCivil,
  ultimoMesFechado: Mes | null,
  mesDoEventoMaisAntigo: Mes | null,
): void {
  if (ultimoDia(mes) >= hoje) throw new RecusaFinanceira("mes_nao_terminado");
  if (ultimoMesFechado === null) {
    if (mesDoEventoMaisAntigo !== mes) throw new RecusaFinanceira("inicio");
  } else if (mes !== mesSeguinte(ultimoMesFechado)) {
    throw new RecusaFinanceira("sequencia");
  }
}

/** Só o último mês fechado reabre (P8). */
export function conferirReabertura(mes: Mes, ultimoMesFechado: Mes | null): void {
  if (mes !== ultimoMesFechado) throw new RecusaFinanceira("reabertura");
}
