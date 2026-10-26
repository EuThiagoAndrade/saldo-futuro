import { z } from "zod";

// Campos descritivos do ativo (ciclo 012, issue #128, BL-009): instituição, classe e quatro
// indicadores em três estados. Só descrevem o ativo; nenhum cálculo os lê. A classe é um nó da
// taxonomia global (ciclo 013, issue #138): só o ID de um nó escolhido na lista vale, sem criação
// e sem nome digitado. A leitura do formulário é pura: devolve os parâmetros de
// cadastrar_ativo_taxonomia e editar_detalhes_ativo_taxonomia, ou a recusa.

export const INDICADORES = [
  { campo: "previdencia", coluna: "previdencia", rotulo: "Previdência" },
  { campo: "liquidezImediata", coluna: "liquidez_imediata", rotulo: "Liquidez imediata (reserva)" },
  { campo: "exposicaoCambial", coluna: "exposicao_cambial", rotulo: "Exposição cambial" },
  { campo: "isentoIr", coluna: "isento_ir", rotulo: "Isento de IR" },
] as const;

export type ColunaIndicador = (typeof INDICADORES)[number]["coluna"];

/** Valores dos rádios: "sim", "nao" ou vazio (não informado). */
export const OPCOES_INDICADOR = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "nao", rotulo: "Não" },
  { valor: "", rotulo: "Não informado" },
] as const;

export interface ParametrosDetalhes {
  p_instituicao: string | null;
  p_instituicao_nova: string | null;
  p_taxonomia: string | null;
  p_previdencia: boolean | null;
  p_liquidez_imediata: boolean | null;
  p_exposicao_cambial: boolean | null;
  p_isento_ir: boolean | null;
}

const referencia = (mensagem: string) =>
  z.union([z.literal(""), z.uuid({ error: mensagem })]).transform((v) => (v === "" ? null : v));
const nomeNovo = (mensagem: string) =>
  z.string().trim().max(100, mensagem).transform((v) => (v === "" ? null : v));
const indicador = z.enum(["sim", "nao", ""], { error: "Escolha Sim, Não ou Não informado." }).transform((v) =>
  v === "sim" ? true : v === "nao" ? false : null,
);

const detalhes = z.object({
  instituicao: referencia("Escolha uma instituição da lista ou cadastre uma nova."),
  instituicaoNova: nomeNovo("Use até 100 caracteres no nome da instituição."),
  taxonomia: referencia("Escolha uma classe da lista."),
  previdencia: indicador,
  liquidezImediata: indicador,
  exposicaoCambial: indicador,
  isentoIr: indicador,
});

const texto = (dados: FormData, nome: string) => {
  const valor = dados.get(nome);
  return typeof valor === "string" ? valor : "";
};

/** Lê os campos descritivos do formulário; ausente vale como vazio (não informado). */
export function lerDetalhes(dados: FormData): { erro: string } | { parametros: ParametrosDetalhes } {
  const entrada = detalhes.safeParse(
    Object.fromEntries(
      ["instituicao", "instituicaoNova", "taxonomia", ...INDICADORES.map((i) => i.campo)].map((nome) => [nome, texto(dados, nome)]),
    ),
  );
  if (!entrada.success) return { erro: entrada.error.issues[0].message };
  const d = entrada.data;
  return {
    parametros: {
      p_instituicao: d.instituicao,
      p_instituicao_nova: d.instituicaoNova,
      p_taxonomia: d.taxonomia,
      p_previdencia: d.previdencia,
      p_liquidez_imediata: d.liquidezImediata,
      p_exposicao_cambial: d.exposicaoCambial,
      p_isento_ir: d.isentoIr,
    },
  };
}

/** Valor do rádio para um indicador gravado. */
export function valorDoIndicador(valor: boolean | null): "sim" | "nao" | "" {
  return valor === true ? "sim" : valor === false ? "nao" : "";
}
