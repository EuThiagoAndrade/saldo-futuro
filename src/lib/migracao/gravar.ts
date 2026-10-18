// Gravação e conferência da migração (issue #64; plano do ciclo 006, item B). A gravação aplica o
// plano de operações da simulação pelas funções autenticadas existentes, com a sessão do
// responsável (chave publicável e RLS), sem chave secreta e sem corrigir_transferencia.
//
// Garantias, todas do "Mecanismo de execução" do plano:
// - destino vazio na primeira execução; a única exceção é a retomada comprovada (diário com os
//   mesmos hashes e usuário, e destino igual a um prefixo exato do plano);
// - diário por operação: a intenção antes da chamada, o resultado com o UUID depois;
// - resposta perdida nunca é reenviada: a operação fica "desconhecida" e a carga para. Na
//   retomada, o efeito completo que aparece exatamente uma vez é reconhecido; ausente, parcial ou
//   duplicado, a carga continua parada, sem escrita;
// - comparação por efeitos completos (src/lib/migracao/destino.ts) no início, antes de cada
//   fechamento e no fim; antes das demais escritas, a marca da carteira (contagens, meses e
//   última desativação) precisa ser exatamente a esperada. Como eventos e transferências só
//   recebem inserções, qualquer escrita de fora muda a marca e para a carga.

import type { SupabaseClient } from "@supabase/supabase-js";
import { acumulado } from "../financeiro/acumulado";
import { ND, type Razao } from "../financeiro/rentabilidade";
import { type Cliente, ErroLeitura, marcaCarteira, type OpcoesLeitura } from "../leitura";
import { deLinhaEvento } from "../telas/carteira";
import { retornosDaCarteira } from "../telas/inicio";
import path from "node:path";
import { comTrava, type Diario, diarioEmArquivo, type EntradaDiario, TravaPresente } from "./diario";
import {
  contagensEsperadas,
  diferencas,
  type EstadoDestino,
  estadoAbstrato,
  estadoEsperado,
  iguais,
  lerEstadoDestino,
  mesCurto,
  type ParteDoEstado,
  referenciaDoEstorno,
  TRANSITO,
} from "./destino";
import { serializarEstavel, sha256 } from "./quantias";
import type { OperacaoMigracao, PlanoMigracao, RelatorioSimulacao } from "./tipos";

export type ClienteGravacao = Cliente & Pick<SupabaseClient, "rpc">;

export type ResultadoHandoff =
  | "executed"
  | "already_executed_and_reconciled"
  | "ambiguous_human_intervention_required"
  | "not_executed";

export type MotivoGravacao =
  | "concluida"
  | "ja_concluida"
  | "plano_invalido"
  | "usuario_divergente"
  | "diario_divergente"
  | "destino_nao_vazio"
  | "estado_divergente"
  | "desconhecida"
  | "desconhecida_sem_efeito"
  | "recusada"
  | "leitura_falhou"
  | "trava_presente";

export interface ResultadoGravacao {
  result: ResultadoHandoff;
  motivo: MotivoGravacao;
  total: number;
  /** Operações confirmadas no destino ao fim desta execução. */
  confirmadas: number;
  /** Escritas enviadas nesta execução. */
  enviadas: number;
  diferencas?: Partial<Record<ParteDoEstado, number>>;
}

export interface OpcoesGravacao {
  /** Tempo máximo de espera por chamada; esgotado, a operação fica desconhecida. */
  tempoLimiteMs?: number;
  leitura?: OpcoesLeitura;
}

const TEMPO_LIMITE_PADRAO = 60_000;

/** Classes SQLSTATE em que a transação certamente foi desfeita: recusa explícita, integridade, dado ou permissão. */
const RECUSA_CERTA = /^(P0|23|22|42)[0-9A-Z]{3}$/;

export function hashDoPlano(plano: PlanoMigracao): string {
  const { versao, sha256Origem, usuarioDestino, operacoes } = plano;
  return sha256(serializarEstavel({ versao, sha256Origem, usuarioDestino, operacoes }));
}

interface Progresso {
  /** Resultado (UUID ou null) de cada operação confirmada, por sequência. */
  ids: Map<number, string | null>;
  confirmadas: number;
  /** Sequência enviada sem resultado conhecido, se houver. */
  pendente: number | null;
}

function lerProgresso(entradas: EntradaDiario[], plano: PlanoMigracao): Progresso | null {
  const ids = new Map<number, string | null>();
  let pendente: number | null = null;
  for (const entrada of entradas.slice(1)) {
    if (entrada.tipo === "cabecalho") return null;
    const operacao = plano.operacoes[entrada.sequencia - 1];
    if (!operacao || operacao.chave !== entrada.chave) return null;
    if (entrada.tipo === "intencao" || entrada.tipo === "desconhecida") {
      if (entrada.sequencia !== ids.size + 1) return null;
      pendente = entrada.sequencia;
    } else if (entrada.tipo === "recusada") {
      if (entrada.sequencia !== ids.size + 1) return null;
      pendente = null;
    } else {
      if (entrada.sequencia !== ids.size + 1) return null;
      ids.set(entrada.sequencia, entrada.id);
      pendente = null;
    }
  }
  return { ids, confirmadas: ids.size, pendente };
}

/** UUID do destino → id do plano, para os ativos criados (confirmados no diário). */
function mapaDeAtivos(plano: PlanoMigracao, ids: ReadonlyMap<number, string | null>): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const [sequencia, id] of ids) {
    const operacao = plano.operacoes[sequencia - 1];
    if (operacao.tipo === "criar_ativo" && id) mapa.set(id, operacao.chave);
  }
  return mapa;
}

/**
 * O UUID do efeito da operação pendente, quando o destino já é igual ao prefixo que a inclui: a
 * única linha nova (fora do diário) do tipo que a operação cria. null para as funções sem retorno.
 */
function idDoEfeito(operacao: OperacaoMigracao, estado: EstadoDestino, conhecidos: Set<string>): string | null | undefined {
  let candidatos: string[];
  if (operacao.tipo === "criar_ativo") candidatos = estado.ativos.filter((a) => a.sistema === null).map((a) => a.id);
  else if (operacao.tipo === "lancar_evento" || operacao.tipo === "estornar_evento")
    candidatos = estado.eventos.filter((e) => !e.transferencia_id).map((e) => e.id);
  else if (operacao.tipo === "transferir") candidatos = estado.transferencias.map((t) => t.id);
  else return null;
  const novos = candidatos.filter((id) => !conhecidos.has(id));
  return novos.length === 1 ? novos[0] : undefined;
}

/** Só um SQLSTATE devolvido pelo banco prova que nada foi gravado; aborto, rede e gateway, não. */
function erroDeChamada(error: { code?: unknown } | null): "recusada" | "desconhecida" {
  return typeof error?.code === "string" && RECUSA_CERTA.test(error.code) ? "recusada" : "desconhecida";
}

function inteiro(valor: unknown): number {
  const numero = Number(String(valor));
  if (!Number.isSafeInteger(numero)) throw new Error("valor fora da faixa segura");
  return numero;
}

export async function gravar(
  cliente: ClienteGravacao,
  plano: PlanoMigracao,
  usuarioSessao: string,
  diario: Diario,
  opcoes: OpcoesGravacao = {},
): Promise<ResultadoGravacao> {
  const total = plano.operacoes.length;
  let enviadas = 0;
  const parar = (result: ResultadoHandoff, motivo: MotivoGravacao, confirmadas: number, extra: Partial<ResultadoGravacao> = {}): ResultadoGravacao => ({
    result,
    motivo,
    total,
    confirmadas,
    enviadas,
    ...extra,
  });

  if (plano.versao !== 1 || hashDoPlano(plano) !== plano.sha256Plano || plano.operacoes.some((o, i) => o.sequencia !== i + 1)) {
    return parar("not_executed", "plano_invalido", 0);
  }
  if (plano.usuarioDestino !== usuarioSessao) return parar("not_executed", "usuario_divergente", 0);

  const entradas = await diario.ler();
  const cabecalho = entradas[0];
  if (
    cabecalho &&
    (cabecalho.tipo !== "cabecalho" ||
      cabecalho.sha256Origem !== plano.sha256Origem ||
      cabecalho.sha256Plano !== plano.sha256Plano ||
      cabecalho.usuarioDestino !== usuarioSessao)
  ) {
    return parar("not_executed", "diario_divergente", 0);
  }
  const progresso = lerProgresso(entradas, plano);
  if (!progresso) return parar("not_executed", "diario_divergente", 0);
  const { ids } = progresso;

  let estado: EstadoDestino;
  try {
    estado = await lerEstadoDestino(cliente, opcoes.leitura);
  } catch (erro) {
    if (erro instanceof ErroLeitura) return parar("not_executed", "leitura_falhou", ids.size);
    throw erro;
  }

  let mapa = mapaDeAtivos(plano, ids);
  const esperadoAntes = estadoEsperado(plano, ids.size);

  if (progresso.pendente !== null) {
    // Retomada de uma operação sem resultado conhecido: nunca reenviar.
    const operacao = plano.operacoes[progresso.pendente - 1];
    let mapaComEfeito = mapa;
    if (operacao.tipo === "criar_ativo") {
      const novos = estado.ativos.filter((a) => a.sistema === null && !mapa.has(a.id));
      if (novos.length === 1) mapaComEfeito = new Map(mapa).set(novos[0].id, operacao.chave);
    }
    const esperadoDepois = estadoEsperado(plano, progresso.pendente);
    const conhecidos = new Set([...ids.values()].filter((id): id is string => Boolean(id)));
    const id = idDoEfeito(operacao, estado, conhecidos);
    if (iguais(estadoAbstrato(estado, mapaComEfeito), esperadoDepois) && id !== undefined) {
      await diario.acrescentar({ tipo: "reconhecida", sequencia: operacao.sequencia, chave: operacao.chave, id });
      ids.set(operacao.sequencia, id);
      mapa = mapaComEfeito;
    } else if (iguais(estadoAbstrato(estado, mapa), esperadoAntes)) {
      return parar("ambiguous_human_intervention_required", "desconhecida_sem_efeito", ids.size);
    } else {
      return parar("ambiguous_human_intervention_required", "estado_divergente", ids.size, {
        diferencas: diferencas(estadoAbstrato(estado, mapaComEfeito), esperadoDepois),
      });
    }
  } else {
    const diferenca = diferencas(estadoAbstrato(estado, mapa), esperadoAntes);
    if (Object.keys(diferenca).length > 0) {
      const motivo = ids.size === 0 ? "destino_nao_vazio" : "estado_divergente";
      return parar(ids.size === 0 ? "not_executed" : "ambiguous_human_intervention_required", motivo, ids.size, { diferencas: diferenca });
    }
  }

  if (!cabecalho) {
    await diario.acrescentar({
      tipo: "cabecalho",
      versao: 1,
      sha256Origem: plano.sha256Origem,
      sha256Plano: plano.sha256Plano,
      usuarioDestino: usuarioSessao,
    });
  }

  const inicio = ids.size;
  if (inicio === total) return parar("already_executed_and_reconciled", "ja_concluida", total);

  // Contagens esperadas da marca, mantidas a cada operação confirmada.
  const contagens = contagensEsperadas(estadoEsperado(plano, inicio));
  let transito = estado.ativos.find((a) => a.sistema === "transito")?.id ?? null;
  contagens.ativos = estado.ativos.length;
  let ultimaDesativacao = estado.marca.ultimaDesativacao;
  const idPorChave = new Map<string, string | null>();
  for (const [sequencia, id] of ids) idPorChave.set(plano.operacoes[sequencia - 1].chave, id);
  const porChave = new Map(plano.operacoes.map((o) => [o.chave, o]));
  const tempoLimite = opcoes.tempoLimiteMs ?? TEMPO_LIMITE_PADRAO;

  const uuidAtivo = (id: string): string => {
    const uuid = id === TRANSITO ? transito : idPorChave.get(id);
    if (!uuid) throw new Error(`ativo do plano sem UUID no destino: ${id}`);
    return uuid;
  };

  for (let indice = inicio; indice < total; indice++) {
    const operacao = plano.operacoes[indice];

    if (indice > inicio) {
      try {
        if (operacao.tipo === "fechar_mes") {
          const atual = await lerEstadoDestino(cliente, opcoes.leitura);
          const diferenca = diferencas(estadoAbstrato(atual, mapa), estadoEsperado(plano, indice));
          if (Object.keys(diferenca).length > 0) {
            return parar("ambiguous_human_intervention_required", "estado_divergente", indice, { diferencas: diferenca });
          }
          ultimaDesativacao = atual.marca.ultimaDesativacao;
        } else {
          const marca = await marcaCarteira(cliente);
          const meses = marca.meses.map(([mes]) => mesCurto(mes)).sort();
          if (
            marca.ativos !== contagens.ativos ||
            marca.eventos !== contagens.eventos ||
            marca.transferencias !== contagens.transferencias ||
            marca.ultimaDesativacao !== ultimaDesativacao ||
            JSON.stringify(meses) !== JSON.stringify([...contagens.meses].sort())
          ) {
            return parar("ambiguous_human_intervention_required", "estado_divergente", indice);
          }
        }
      } catch (erro) {
        if (erro instanceof ErroLeitura) return parar("ambiguous_human_intervention_required", "leitura_falhou", indice);
        throw erro;
      }
    }

    const p = operacao.payload as Record<string, unknown>;
    let funcao: string;
    let argumentos: Record<string, unknown>;
    switch (operacao.tipo) {
      case "criar_ativo":
        funcao = "criar_ativo";
        argumentos = { p_nome: p.nome, p_tipo_ajuste: p.tipoAjuste };
        break;
      case "lancar_evento":
        funcao = "lancar_evento";
        argumentos = { p_ativo: uuidAtivo(String(p.ativo)), p_data: p.data, p_tipo: p.tipo, p_valor: inteiro(p.valorCentavos) };
        break;
      case "estornar_evento": {
        const referencia = idPorChave.get(referenciaDoEstorno(operacao, porChave).chave);
        if (!referencia) throw new Error(`estorno sem UUID do evento referenciado: ${operacao.sequencia}`);
        funcao = "estornar_evento";
        argumentos = { p_evento: referencia, p_data: operacao.data };
        break;
      }
      case "transferir":
        funcao = "transferir";
        argumentos = {
          p_origem: uuidAtivo(String(p.origem)),
          p_destino: uuidAtivo(String(p.destino)),
          p_data: p.data,
          p_valor: inteiro(p.valorCentavos),
        };
        break;
      case "fechar_mes": {
        const saldos: Record<string, number> = {};
        for (const [ativo, saldo] of Object.entries(p.saldosReais as Record<string, string>)) {
          if (ativo !== TRANSITO) saldos[uuidAtivo(ativo)] = inteiro(saldo);
        }
        funcao = "fechar_mes";
        argumentos = { p_mes: `${mesCurto(String(p.mes))}-01`, p_saldos: saldos };
        break;
      }
      case "desativar_ativo":
        funcao = "desativar_ativo";
        argumentos = { p_ativo: uuidAtivo(String(p.ativo)) };
        break;
    }

    await diario.acrescentar({ tipo: "intencao", sequencia: operacao.sequencia, chave: operacao.chave });
    enviadas++;
    let resposta: { data: unknown; error: { code?: unknown; message?: string } | null };
    try {
      resposta = await cliente.rpc(funcao, argumentos).abortSignal(AbortSignal.timeout(tempoLimite));
    } catch {
      resposta = { data: null, error: { message: "falha de rede" } };
    }

    const retornaId = operacao.tipo !== "fechar_mes" && operacao.tipo !== "desativar_ativo";
    const idValido = typeof resposta.data === "string" && /^[0-9a-f-]{36}$/i.test(resposta.data);
    if (resposta.error || (retornaId && !idValido)) {
      if (!resposta.error || erroDeChamada(resposta.error) === "desconhecida") {
        await diario.acrescentar({
          tipo: "desconhecida",
          sequencia: operacao.sequencia,
          chave: operacao.chave,
          motivo: resposta.error ? "resposta_perdida" : "resposta_invalida",
        });
        return parar("ambiguous_human_intervention_required", "desconhecida", indice);
      }
      await diario.acrescentar({ tipo: "recusada", sequencia: operacao.sequencia, chave: operacao.chave, codigo: String(resposta.error.code) });
      return parar("ambiguous_human_intervention_required", "recusada", indice);
    }

    const id = retornaId ? (resposta.data as string) : null;
    await diario.acrescentar({ tipo: "resultado", sequencia: operacao.sequencia, chave: operacao.chave, id });
    ids.set(operacao.sequencia, id);
    idPorChave.set(operacao.chave, id);

    switch (operacao.tipo) {
      case "criar_ativo":
        mapa.set(id!, operacao.chave);
        contagens.ativos += 1;
        if (!transito) {
          const { data, error } = await cliente.from("ativos").select("id").eq("sistema", "transito");
          if (error || !data || data.length !== 1) return parar("ambiguous_human_intervention_required", "leitura_falhou", indice + 1);
          transito = data[0].id as string;
          contagens.ativos += 1;
        }
        break;
      case "lancar_evento":
      case "estornar_evento":
        contagens.eventos += 1;
        break;
      case "transferir":
        contagens.eventos += 2;
        contagens.transferencias += 1;
        break;
      case "fechar_mes":
        contagens.meses.push(mesCurto(String(p.mes)));
        break;
      case "desativar_ativo":
        try {
          ultimaDesativacao = (await marcaCarteira(cliente)).ultimaDesativacao;
        } catch (erro) {
          if (erro instanceof ErroLeitura) return parar("ambiguous_human_intervention_required", "leitura_falhou", indice + 1);
          throw erro;
        }
        break;
    }
  }

  try {
    const final = await lerEstadoDestino(cliente, opcoes.leitura);
    const diferenca = diferencas(estadoAbstrato(final, mapa), estadoEsperado(plano, total));
    if (Object.keys(diferenca).length > 0) {
      return parar("ambiguous_human_intervention_required", "estado_divergente", total, { diferencas: diferenca });
    }
  } catch (erro) {
    if (erro instanceof ErroLeitura) return parar("ambiguous_human_intervention_required", "leitura_falhou", total);
    throw erro;
  }
  return parar("executed", "concluida", total);
}

/**
 * A gravação como o ponto de entrada a executa: trava de gravador único e diário do plano no
 * diretório dado (em local/). Com a trava presente, nada é lido nem gravado.
 */
export async function gravarNoDiretorio(
  diretorio: string,
  cliente: ClienteGravacao,
  plano: PlanoMigracao,
  usuarioSessao: string,
  opcoes: OpcoesGravacao = {},
): Promise<ResultadoGravacao> {
  const diario = diarioEmArquivo(path.join(diretorio, `diario-${plano.sha256Plano}.jsonl`));
  try {
    return await comTrava(diretorio, () => gravar(cliente, plano, usuarioSessao, diario, opcoes));
  } catch (erro) {
    if (erro instanceof TravaPresente) {
      return { result: "not_executed", motivo: "trava_presente", total: plano.operacoes.length, confirmadas: 0, enviadas: 0 };
    }
    throw erro;
  }
}

export type CategoriaConferencia =
  | ParteDoEstado
  | "nomes_ambiguos"
  | "consolidados"
  | "posicoes_do_relatorio"
  | "patrimonio"
  | "retornos"
  | "acumulados"
  | "meses_nd";

export interface ResultadoConferencia {
  ok: boolean;
  meses: number;
  diferencas: Partial<Record<CategoriaConferencia, number>>;
}

function mais(diferencas: Partial<Record<CategoriaConferencia, number>>, categoria: CategoriaConferencia, n = 1) {
  if (n > 0) diferencas[categoria] = (diferencas[categoria] ?? 0) + n;
}

function mesmaRazao(a: Razao, b: number | "N/D"): boolean {
  return a === b;
}

/**
 * Conferência somente leitura: relê o destino inteiro e compara com o plano (efeitos completos) e
 * com o relatório da simulação, mês a mês: consolidado, posições, patrimônio (com o trânsito),
 * rentabilidade e acumulado calculados como a aplicação calcula, e os meses N/D.
 */
export async function conferir(
  cliente: Cliente,
  plano: PlanoMigracao,
  relatorio: RelatorioSimulacao,
  opcoes: { leitura?: OpcoesLeitura } = {},
): Promise<ResultadoConferencia> {
  const estado = await lerEstadoDestino(cliente, opcoes.leitura);
  const resultado: Partial<Record<CategoriaConferencia, number>> = {};

  // Os nomes vêm da descrição da origem, que é única; o mapa não depende do diário.
  const porNome = new Map<string, string>();
  for (const operacao of plano.operacoes) {
    if (operacao.tipo === "criar_ativo") porNome.set(String((operacao.payload as Record<string, unknown>).nome).trim(), operacao.chave);
  }
  const mapa = new Map<string, string>();
  const vistos = new Map<string, number>();
  for (const ativo of estado.ativos.filter((a) => a.sistema === null)) vistos.set(ativo.nome, (vistos.get(ativo.nome) ?? 0) + 1);
  for (const ativo of estado.ativos.filter((a) => a.sistema === null)) {
    const chave = porNome.get(ativo.nome);
    if (chave && vistos.get(ativo.nome) === 1) mapa.set(ativo.id, chave);
    else if (chave) mais(resultado, "nomes_ambiguos");
  }
  for (const [parte, n] of Object.entries(diferencas(estadoAbstrato(estado, mapa), estadoEsperado(plano, plano.operacoes.length)))) {
    mais(resultado, parte as ParteDoEstado, n);
  }

  const transito = estado.ativos.find((a) => a.sistema === "transito")?.id;
  const idDoPlano = (uuid: string) => (uuid === transito ? TRANSITO : (mapa.get(uuid) ?? `?${uuid}`));
  const consolidados = new Map(estado.consolidados.map((c) => [mesCurto(c.mes), c]));
  const mesesRelatorio = new Set(relatorio.meses.map((m) => m.mes));
  mais(resultado, "consolidados", [...consolidados.keys()].filter((mes) => !mesesRelatorio.has(mes)).length);

  const eventos = estado.eventos.map(deLinhaEvento);
  const mesesLidos = estado.consolidados.map((c) => ({ mes: mesCurto(c.mes), vi: BigInt(c.vi), vf: BigInt(c.vf) })).sort((a, b) => a.mes.localeCompare(b.mes));
  const inicio = relatorio.meses[0]?.mes;
  const retornos = inicio ? retornosDaCarteira(mesesLidos, eventos, inicio) : {};

  for (const mes of relatorio.meses) {
    const c = consolidados.get(mes.mes);
    if (!c) {
      mais(resultado, "consolidados");
      continue;
    }
    const campos = ["vi", "vf", "aportes", "resgates", "rendimento", "marcacao", "cambio", "migracao"] as const;
    if (campos.some((campo) => String(c[campo]) !== mes[campo])) mais(resultado, "consolidados");
    if (String(c.vf) !== mes.patrimonioOrigem) mais(resultado, "patrimonio");

    const doDestino = estado.posicoes
      .filter((p) => mesCurto(p.mes) === mes.mes)
      .map((p) => `${idDoPlano(p.ativo_id)}|${p.saldo_inicial}|${p.saldo_final}|${p.ajuste}`)
      .sort();
    const doRelatorio = mes.posicoes.map((p) => `${p.ativoId}|${p.saldoInicial}|${p.saldoFinal}|${p.ajuste}`).sort();
    if (JSON.stringify(doDestino) !== JSON.stringify(doRelatorio)) mais(resultado, "posicoes_do_relatorio");

    const retorno = retornos[mes.mes] ?? ND;
    if (!mesmaRazao(retorno, mes.retorno)) mais(resultado, "retornos");
    if ((retorno === ND) !== (mes.retorno === ND)) mais(resultado, "meses_nd");
    if (inicio && !mesmaRazao(acumulado(retornos, inicio, inicio, mes.mes), mes.acumuladoDesdeInicio)) mais(resultado, "acumulados");
  }

  return { ok: Object.keys(resultado).length === 0, meses: consolidados.size, diferencas: resultado };
}
