// Arredondamento de apresentação (KB-004, seção 2; P4, K10): 2 casas, meio afastando do zero,
// sobre a representação decimal mais curta do float64, em formato brasileiro. O símbolo, o
// sinal explícito de positivos e a cor são do DESIGN.md. Nenhum cálculo usa o valor arredondado.

const MENOS = "−";

/** Algarismos da representação mais curta, expandida sem expoente: inteiro, fração e sinal. */
function decimal(valor: number): { negativo: boolean; inteiro: string; fracao: string } {
  if (!Number.isFinite(valor)) throw new Error(`valor não finito: ${valor}`);
  const [mantissa, expoenteTexto] = Math.abs(valor).toString().split("e");
  const expoente = Number(expoenteTexto ?? 0);
  const [i, f = ""] = mantissa.split(".");
  const digitos = i + f;
  const ponto = i.length + expoente;
  const inteiro = ponto <= 0 ? "0" : digitos.slice(0, ponto).padEnd(ponto, "0");
  const fracao = ponto <= 0 ? "0".repeat(-ponto) + digitos : digitos.slice(ponto);
  return { negativo: valor < 0, inteiro, fracao };
}

function deslocar(d: ReturnType<typeof decimal>, casas: number): ReturnType<typeof decimal> {
  const fracao = d.fracao.padEnd(casas, "0");
  return { negativo: d.negativo, inteiro: d.inteiro + fracao.slice(0, casas), fracao: fracao.slice(casas) };
}

function arredondar(d: ReturnType<typeof decimal>): string {
  const fracao = d.fracao.padEnd(3, "0");
  let unidades = BigInt(d.inteiro + fracao.slice(0, 2));
  if (fracao[2] >= "5") unidades += 1n;
  const texto = unidades.toString().padStart(3, "0");
  const inteiro = texto.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const sinal = d.negativo && unidades !== 0n ? MENOS : "";
  return `${sinal}${inteiro},${texto.slice(-2)}`;
}

/** Percentual de uma fração: 0.01005 → "1,01" (a vírgula é deslocada no texto, sem multiplicar). */
export function percentual(fracao: number): string {
  return arredondar(deslocar(decimal(fracao), 2));
}

/** Índice (por exemplo, a série base 100) com 2 casas: 100.005 → "100,01". */
export function indice(valor: number): string {
  return arredondar(decimal(valor));
}
