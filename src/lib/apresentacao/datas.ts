// Datas civis (AAAA-MM-DD) e meses (AAAA-MM) no formato brasileiro, sem Date local: o texto da
// data é reorganizado, então o fuso do processo não muda o dia exibido (KB-004, seção 1).

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-03-02" → "02/03/2026". */
export function dataBr(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "2026-03-02" → "2 de março de 2026". */
export function dataExtensaBr(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${Number(dia)} de ${MESES[Number(mes) - 1]} de ${ano}`;
}

/** "2026-03" → "março de 2026". */
export function mesBr(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${MESES[Number(m) - 1]} de ${ano}`;
}

/** Mês AAAA-MM válido, ou null. */
export function mesValido(texto: string | undefined): string | null {
  return texto && /^\d{4}-(0[1-9]|1[0-2])$/.test(texto) ? texto : null;
}
