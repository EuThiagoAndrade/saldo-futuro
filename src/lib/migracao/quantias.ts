import { createHash } from "node:crypto";

/** Conversão M2 sem arredondamento: o texto decimal, nunca o ponto flutuante, gera os centavos. */
export function paraCentavosOrigem(valor: unknown, permitirNegativo = false): bigint {
  let decimal: string;
  if (typeof valor === "bigint") {
    if (valor < 0n && !permitirNegativo) throw new Error("valor negativo");
    decimal = valor.toString();
  } else if (typeof valor === "number") {
    if (!Number.isFinite(valor) || (valor < 0 && !permitirNegativo)) throw new Error("valor inválido ou negativo");
    decimal = String(valor);
  } else if (typeof valor === "string") {
    decimal = valor;
  } else {
    throw new Error("tipo de valor não aceito");
  }

  const partes = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(decimal);
  if (!partes) throw new Error("representação decimal não aceita");
  if (partes[1] === "-" && !permitirNegativo) throw new Error("valor negativo");
  const digitosSignificativos = `${partes[2]}${partes[3] ?? ""}`.replace(/^0+/, "").length;
  if (digitosSignificativos > 15) throw new Error("mais de 15 algarismos significativos");

  const inteiros = BigInt(partes[2]);
  const fracao = BigInt((partes[3] ?? "").padEnd(2, "0") || "0");
  const centavos = inteiros * 100n + fracao;
  return partes[1] === "-" ? -centavos : centavos;
}

export function sha256(conteudo: string | Uint8Array): string {
  return createHash("sha256").update(conteudo).digest("hex");
}

/** Serialização estável para que hashes não dependam da ordem de inserção das propriedades. */
export function serializarEstavel(valor: unknown): string {
  if (typeof valor === "bigint") return JSON.stringify(valor.toString());
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(serializarEstavel).join(",")}]`;
  const objeto = valor as Record<string, unknown>;
  return `{${Object.keys(objeto)
    .sort()
    .map((chave) => `${JSON.stringify(chave)}:${serializarEstavel(objeto[chave])}`)
    .join(",")}}`;
}
