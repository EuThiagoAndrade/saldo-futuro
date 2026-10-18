import type { DatabaseSync } from "node:sqlite";
import { acumulado } from "../financeiro/acumulado";
import { exigirFaixa, RecusaFinanceira } from "../financeiro/centavos";
import { mesDe, mesSeguinte, ultimoDia, type Mes } from "../financeiro/datas";
import { previaFechamento, type Ativo as AtivoFinanceiro, type Posicao } from "../financeiro/fechamento";
import { conferirLancamento, criarEstorno, criarTransferencia, type Evento, type TipoLancamento } from "../financeiro/eventos";
import { dietz, type MesDaCarteira, type Razao } from "../financeiro/rentabilidade";
import { lerOrigem } from "./leitor";
import { paraCentavosOrigem, serializarEstavel, sha256 } from "./quantias";
import type {
  AtivoNormalizado,
  CodigoRecusa,
  ConsolidadoNormalizado,
  DadosNormalizados,
  DadosOrigem,
  EventoNormalizado,
  EventoOrigem,
  MesSimulado,
  OperacaoMigracao,
  PlanoMigracao,
  PosicaoNormalizada,
  RecusaMigracao,
  RelatorioSimulacao,
  ResultadoSimulacao,
  ResumoSimulacao,
} from "./tipos";
import { VERSAO_PLANO } from "./tipos";

const TRANSITO_ID = "sistema:em-transito";
const EVENTOS_COM_DIRECAO = new Set(["RENDIMENTO", "CORRECAO_MARCACAO", "CAMBIO", "TRANSFERENCIA_PENDENTE", "MIGRACAO_HISTORICA"]);
const TIPOS_COBERTOS = new Set([
  "APORTE",
  "RESGATE",
  "RENDIMENTO",
  "CORRECAO_MARCACAO",
  "CAMBIO",
  "TRANSFERENCIA_PENDENTE",
  "MIGRACAO_HISTORICA",
  "ESTORNO",
]);

interface ParTransito {
  eventoTransito: EventoNormalizado;
  eventoAtivo: EventoNormalizado;
  origemId: string;
  destinoId: string;
  data: string;
  valor: bigint;
}

/** Classificação de M6 (plano v4): cada evento de trânsito cai em exatamente um caso. */
interface ClassificacaoTransito {
  /** Caso a: par único, migrado como transferência. */
  pares: ParTransito[];
  /** Caso b: sem candidato, migrado como `migracao` no trânsito. */
  semPar: EventoNormalizado[];
  /** Caso c: dois ou mais candidatos, ou candidato que serve a mais de um trânsito. */
  ambiguos: string[];
}

interface EventoPlanejado {
  origem: EventoNormalizado | null;
  evento: Evento;
  operacao: Omit<OperacaoMigracao, "sequencia">;
  ordem: number;
}

interface ExecucaoReplay {
  meses: MesSimulado[];
  eventos: Evento[];
  eventosPlanejados: Map<string, EventoPlanejado[]>;
  posicoesPorMes: Map<string, Map<string, Posicao>>;
  novasCausasM7: Array<{ chave: string; motivo: string }>;
}

interface CoberturaM10 {
  meses: Mes[];
  primeiroMes: Mes | null;
  ultimoMes: Mes | null;
  mesesAntigosIgnorados: number;
  erros: string[];
}

interface EntradaSimulacao {
  dados: DadosOrigem;
  usuarioDestino: string;
  sha256Origem?: string;
}

type OpcoesDatabase = { usuarioDestino: string; sha256Origem?: string };

function chaveAtivoMes(ativo: string, mes: string): string {
  return `${ativo}|${mes}`;
}

function mesCanonico(ano: number, mes: number): Mes {
  if (!Number.isInteger(ano) || ano < 1 || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    throw new Error("ano ou mês inválido");
  }
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
}

function recusa(codigo: CodigoRecusa, etapa: RecusaMigracao["etapa"], detalhes: string[]): RecusaMigracao {
  return { codigo, etapa, quantidade: detalhes.length, detalhes };
}

function resumoVazio(dados?: { ativos?: readonly unknown[]; eventos?: readonly { tipo: string }[] }): ResumoSimulacao {
  const eventosPorTipo: Record<string, number> = {};
  for (const evento of dados?.eventos ?? []) eventosPorTipo[evento.tipo] = (eventosPorTipo[evento.tipo] ?? 0) + 1;
  return {
    ativos: dados?.ativos?.length ?? 0,
    eventos: dados?.eventos?.length ?? 0,
    eventosPorTipo: Object.fromEntries(Object.entries(eventosPorTipo).sort(([a], [b]) => a.localeCompare(b))),
    mesesMigrados: 0,
    mesesComMigracao: 0,
    ativosMesesEmM7: 0,
    eventosZeroDescartados: 0,
    mesesConsolidadosAntigosIgnorados: 0,
    ativosDesativados: 0,
    ativosComSaldoQuePermanecemAtivos: 0,
    transitoComoTransferencia: 0,
    transitoComoMigracao: 0,
    posicoesImplicitasZero: 0,
  };
}

function normalizarDados(dados: DadosOrigem): { dados?: DadosNormalizados; errosM2: string[]; erros: string[] } {
  const errosM2: string[] = [];
  const erros: string[] = [];
  const converter = (valor: unknown, referencia: string, permitirNegativo = false): bigint => {
    try {
      return paraCentavosOrigem(valor, permitirNegativo);
    } catch {
      errosM2.push(referencia);
      return 0n;
    }
  };

  const ativos: AtivoNormalizado[] = [];
  const idsAtivos = new Set<number>();
  for (const ativo of dados.ativos) {
    if (idsAtivos.has(ativo.id) || !ativo.descricao.trim()) erros.push(`ativo inválido #${ativo.id}`);
    idsAtivos.add(ativo.id);
    const classificacao = (ativo.classificacao ?? "").toLowerCase();
    ativos.push({
      ...ativo,
      id: `ativo:${ativo.id}`,
      idOrigem: ativo.id,
      tipoAjuste: classificacao.includes("cripto") || classificacao.includes("vari") ? "marcacao" : "rendimento",
    });
  }

  const eventos: EventoNormalizado[] = [];
  const eventosPorId = new Map<number, EventoOrigem>();
  const idsEventos = new Set<number>();
  for (const evento of dados.eventos) {
    if (idsEventos.has(evento.id)) erros.push(`evento duplicado #${evento.id}`);
    idsEventos.add(evento.id);
    eventosPorId.set(evento.id, evento);
  }
  const valoresEvento = new Map<number, bigint>();
  for (const evento of dados.eventos) valoresEvento.set(evento.id, converter(evento.valor, `eventos.valor #${evento.id}`));

  const assinadoPorId = new Map<number, bigint>();
  const assinar = (evento: EventoOrigem, visitados = new Set<number>()): bigint => {
    const pronto = assinadoPorId.get(evento.id);
    if (pronto !== undefined) return pronto;
    if (visitados.has(evento.id)) throw new Error(`referência circular no evento #${evento.id}`);
    visitados.add(evento.id);
    const valor = valoresEvento.get(evento.id) ?? 0n;
    let assinado = valor;
    if (valor === 0n) assinado = 0n;
    else if (evento.tipo === "RESGATE") assinado = -valor;
    else if (evento.tipo === "ESTORNO") {
      const referencia = evento.referenciaId === null ? undefined : eventosPorId.get(evento.referenciaId);
      if (!referencia) throw new Error(`referência ausente no evento #${evento.id}`);
      assinado = -assinar(referencia, visitados);
    } else if (EVENTOS_COM_DIRECAO.has(evento.tipo) && (evento.observacao ?? "").toLowerCase().includes("negativo")) {
      assinado = -valor;
    }
    assinadoPorId.set(evento.id, assinado);
    return assinado;
  };

  for (const evento of dados.eventos) {
    let dataMes = "";
    try {
      dataMes = mesDe(evento.data);
      if (dataMes !== mesCanonico(evento.ano, evento.mes)) erros.push(`data e ano/mês divergentes no evento #${evento.id}`);
    } catch {
      erros.push(`data inválida no evento #${evento.id}`);
    }
    if (!new Set(["manual", "calculado", "migrado"]).has(evento.origem)) erros.push(`origem não coberta no evento #${evento.id}`);
    if (evento.tipo === "TRANSFERENCIA_PENDENTE" ? evento.ativoId !== null : evento.ativoId === null) {
      erros.push(`relação com ativo inválida no evento #${evento.id}`);
    }
    if (evento.ativoId !== null && !idsAtivos.has(evento.ativoId)) erros.push(`ativo ausente no evento #${evento.id}`);
    if (evento.tipo === "ESTORNO" && (evento.referenciaId === null || !eventosPorId.has(evento.referenciaId))) {
      erros.push(`estorno sem referência #${evento.id}`);
    }
    try {
      const valorAssinado = assinar(evento);
      eventos.push({ ...evento, ativoId: evento.ativoId === null ? null : `ativo:${evento.ativoId}`, valor: valoresEvento.get(evento.id) ?? 0n, valorAssinado });
    } catch (erro) {
      erros.push(erro instanceof Error ? erro.message : `evento inválido #${evento.id}`);
    }
  }

  eventos.sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);

  const posicoes: PosicaoNormalizada[] = [];
  const chavesPosicao = new Set<string>();
  for (const posicao of dados.posicoes) {
    const saldoInicio = converter(posicao.saldoInicio, `posicoes.saldo_inicio ${posicao.ativoId}`, true);
    const saldoFim = converter(posicao.saldoFim, `posicoes.saldo_fim ${posicao.ativoId}`, true);
    let mes = "";
    try {
      mes = mesCanonico(posicao.ano, posicao.mes);
    } catch {
      erros.push(`mês inválido na posição do ativo #${posicao.ativoId}`);
    }
    const chave = `${posicao.ativoId}|${mes}`;
    if (chavesPosicao.has(chave)) erros.push(`posição duplicada ${chave}`);
    chavesPosicao.add(chave);
    if (!idsAtivos.has(posicao.ativoId)) erros.push(`ativo ausente na posição ${chave}`);
    posicoes.push({
      ...posicao,
      ativoId: `ativo:${posicao.ativoId}`,
      saldoInicio,
      saldoFim,
      mesChave: mes,
    });
  }

  const consolidados: ConsolidadoNormalizado[] = [];
  const chavesConsolidado = new Set<string>();
  for (const consolidado of dados.consolidados) {
    const valorTotal = converter(consolidado.valorTotal, `consolidado.valor_total ${consolidado.ano}-${consolidado.mes}`, true);
    let mes = "";
    try {
      mes = mesCanonico(consolidado.ano, consolidado.mes);
    } catch {
      erros.push(`mês inválido no consolidado ${consolidado.ano}-${consolidado.mes}`);
    }
    if (chavesConsolidado.has(mes)) erros.push(`consolidado duplicado ${mes}`);
    chavesConsolidado.add(mes);
    consolidados.push({
      ...consolidado,
      valorTotal,
      mesChave: mes,
    });
  }

  if (errosM2.length > 0 || erros.length > 0) return { errosM2, erros };
  return {
    dados: { ativos, eventos, posicoes, consolidados, indicadoresUsuario: dados.indicadoresUsuario },
    errosM2,
    erros,
  };
}

/**
 * M6 (plano v4). Cada `TRANSFERENCIA_PENDENTE` é uma variação do saldo acumulado do trânsito, com a
 * direção lida por M2. Candidato a par de um trânsito positivo é um `RESGATE` não calculado do
 * mesmo valor absoluto e do mesmo mês; de um negativo, um `APORTE` nas mesmas condições.
 */
function classificarTransito(eventos: EventoNormalizado[]): ClassificacaoTransito {
  const naoCalculados = eventos.filter((evento) => evento.origem !== "calculado" && evento.valor !== 0n);
  const transitos = eventos.filter((evento) => evento.tipo === "TRANSFERENCIA_PENDENTE" && evento.valor !== 0n);
  const paresCandidatos = new Map<number, EventoNormalizado[]>();
  const usadosComoPar = new Map<number, number>();

  for (const transito of transitos) {
    const mes = mesDe(transito.data);
    const candidatos = naoCalculados.filter((evento) => {
      if (mesDe(evento.data) !== mes || evento.valor !== transito.valor) return false;
      return transito.valorAssinado > 0n ? evento.tipo === "RESGATE" : evento.tipo === "APORTE";
    });
    paresCandidatos.set(transito.id, candidatos);
    for (const candidato of candidatos) usadosComoPar.set(candidato.id, (usadosComoPar.get(candidato.id) ?? 0) + 1);
  }

  const pares: ParTransito[] = [];
  const semPar: EventoNormalizado[] = [];
  const ambiguos: string[] = [];
  for (const eventoTransito of transitos) {
    const candidatos = paresCandidatos.get(eventoTransito.id) ?? [];
    if (candidatos.length === 0) {
      semPar.push(eventoTransito);
      continue;
    }
    const eventoAtivo = candidatos[0];
    if (candidatos.length !== 1 || usadosComoPar.get(eventoAtivo.id) !== 1) {
      ambiguos.push(`evento de trânsito #${eventoTransito.id}`);
      continue;
    }
    const data = eventoAtivo.data > eventoTransito.data ? eventoAtivo.data : eventoTransito.data;
    const origemId = eventoTransito.valorAssinado > 0n ? eventoAtivo.ativoId! : TRANSITO_ID;
    const destinoId = eventoTransito.valorAssinado > 0n ? TRANSITO_ID : eventoAtivo.ativoId!;
    pares.push({ eventoTransito, eventoAtivo, origemId, destinoId, data, valor: eventoTransito.valor });
  }
  return { pares, semPar, ambiguos };
}

/**
 * M6 (plano v4): o saldo acumulado do trânsito no fim de cada mês, do primeiro mês com trânsito ao
 * último mês fechado, nunca pode ser negativo. Devolve os meses negativos, sem corrigir nada.
 */
function mesesComTransitoNegativo(eventos: EventoNormalizado[], ultimoMes: Mes | null): string[] {
  const variacoes = new Map<string, bigint>();
  for (const evento of eventos) {
    if (evento.tipo !== "TRANSFERENCIA_PENDENTE" || evento.valor === 0n) continue;
    const mes = mesDe(evento.data);
    variacoes.set(mes, (variacoes.get(mes) ?? 0n) + evento.valorAssinado);
  }
  const meses = [...variacoes.keys()].sort();
  if (meses.length === 0) return [];
  const fim = ultimoMes && ultimoMes > meses.at(-1)! ? ultimoMes : meses.at(-1)!;
  const negativos: string[] = [];
  let saldo = 0n;
  for (let mes = meses[0] as Mes; mes <= fim; mes = mesSeguinte(mes)) {
    saldo += variacoes.get(mes) ?? 0n;
    if (saldo < 0n) negativos.push(`mês ${mes}`);
  }
  return negativos;
}

function verificarEstornosLigadosAoTransito(eventos: EventoNormalizado[], pares: ParTransito[]): string[] {
  const porId = new Map(eventos.map((evento) => [evento.id, evento]));
  const consumidos = new Set(pares.flatMap((par) => [par.eventoTransito.id, par.eventoAtivo.id]));
  return eventos
    .filter((evento) => evento.tipo === "ESTORNO" && evento.valor !== 0n)
    .filter((evento) => {
      const referencia = evento.referenciaId === null ? undefined : porId.get(evento.referenciaId);
      return referencia?.tipo === "TRANSFERENCIA_PENDENTE" || (referencia !== undefined && consumidos.has(referencia.id));
    })
    .map((evento) => `estorno #${evento.id}`);
}

function verificarEstornos(dados: DadosNormalizados): string[] {
  const porId = new Map(dados.eventos.map((evento) => [evento.id, evento]));
  const referencias = new Map<number, number>();
  const erros: string[] = [];
  for (const evento of dados.eventos.filter((item) => item.tipo === "ESTORNO" && item.valor !== 0n)) {
    const referencia = evento.referenciaId === null ? undefined : porId.get(evento.referenciaId);
    if (
      !referencia ||
      referencia.tipo === "ESTORNO" ||
      referencia.data > evento.data ||
      referencia.ativoId !== evento.ativoId ||
      referencia.valor !== evento.valor
    ) {
      erros.push(`estorno inválido #${evento.id}`);
      continue;
    }
    const quantidade = (referencias.get(referencia.id) ?? 0) + 1;
    referencias.set(referencia.id, quantidade);
    if (quantidade > 1) erros.push(`mais de um estorno para #${referencia.id}`);
  }
  return erros;
}

function mapearEvento(evento: EventoNormalizado, referencia?: Evento): Evento {
  const id = `origem:${evento.id}`;
  const tipoDestino: Record<string, TipoLancamento> = {
    APORTE: "aporte",
    RESGATE: "resgate",
    RENDIMENTO: "rendimento",
    CORRECAO_MARCACAO: "marcacao",
    CAMBIO: "cambio",
    MIGRACAO_HISTORICA: "migracao",
  };
  if (evento.tipo === "ESTORNO") {
    if (!referencia) throw new Error(`referência não migrável para estorno #${evento.id}`);
    return criarEstorno(id, referencia, evento.data, [referencia]);
  }
  const tipo = tipoDestino[evento.tipo];
  if (!tipo || evento.ativoId === null) throw new Error(`tipo sem mapeamento no evento #${evento.id}`);
  conferirLancamento(tipo, evento.valorAssinado);
  return { id, ativo: evento.ativoId, data: evento.data, tipo, valor: exigirFaixa(evento.valorAssinado) };
}

function indexar<T>(itens: T[], chave: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const id = chave(item);
    const lista = mapa.get(id) ?? [];
    lista.push(item);
    mapa.set(id, lista);
  }
  return mapa;
}

function mapearPosicoes(dados: DadosNormalizados): Map<string, Map<string, PosicaoNormalizada>> {
  const porMes = new Map<string, Map<string, PosicaoNormalizada>>();
  for (const posicao of dados.posicoes) {
    const ativos = porMes.get(posicao.mesChave) ?? new Map<string, PosicaoNormalizada>();
    ativos.set(posicao.ativoId, posicao);
    porMes.set(posicao.mesChave, ativos);
  }
  return porMes;
}

function adicionarCausa(mapa: Map<string, Set<string>>, ativo: string, mes: string, motivo: string): boolean {
  const chave = chaveAtivoMes(ativo, mes);
  const causas = mapa.get(chave) ?? new Set<string>();
  const antes = causas.size;
  causas.add(motivo);
  mapa.set(chave, causas);
  return causas.size !== antes;
}

/**
 * M10 (plano v5): a origem não grava posição de saldo zero. Dentro do intervalo, mês a mês, o ativo
 * cuja posição anterior (real ou implícita) terminou em zero e que não tem nenhum evento no mês
 * na origem, inclusive calculado ou de valor zero, ganha uma posição implícita 0 → 0. Qualquer
 * outra ausência continua para M10, que a recusa.
 */
function preencherPosicoesImplicitas(dados: DadosNormalizados): { dados: DadosNormalizados; quantidade: number } {
  const porMes = mapearPosicoes(dados);
  const primeiroMes = [...porMes.keys()].sort()[0];
  const ultimoMes = dados.consolidados
    .filter((item) => item.status === "fechado" && item.fechado)
    .map((item) => item.mesChave)
    .sort()
    .at(-1);
  if (!primeiroMes || !ultimoMes) return { dados, quantidade: 0 };

  const comEvento = new Set(dados.eventos.filter((evento) => evento.ativoId !== null).map((evento) => chaveAtivoMes(evento.ativoId!, mesDe(evento.data))));
  const implicitas: PosicaoNormalizada[] = [];
  for (let mes = mesSeguinte(primeiroMes as Mes); mes <= ultimoMes; mes = mesSeguinte(mes)) {
    const anteriores = porMes.get(anteriorDe(mes));
    if (!anteriores) continue;
    for (const [ativoId, anterior] of anteriores) {
      if (anterior.saldoFim !== 0n || porMes.get(mes)?.has(ativoId) || comEvento.has(chaveAtivoMes(ativoId, mes))) continue;
      const [ano, numeroMes] = mes.split("-").map(Number);
      const posicao: PosicaoNormalizada = { ativoId, ano, mes: numeroMes, saldoInicio: 0n, saldoFim: 0n, mesChave: mes };
      const doMes = porMes.get(mes) ?? new Map<string, PosicaoNormalizada>();
      doMes.set(ativoId, posicao);
      porMes.set(mes, doMes);
      implicitas.push(posicao);
    }
  }
  if (implicitas.length === 0) return { dados, quantidade: 0 };
  return { dados: { ...dados, posicoes: [...dados.posicoes, ...implicitas] }, quantidade: implicitas.length };
}

function anteriorDe(mes: string): string {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return numeroMes === 1 ? `${ano - 1}-12` : `${ano}-${String(numeroMes - 1).padStart(2, "0")}`;
}

function validarM10(dados: DadosNormalizados): CoberturaM10 {
  const erros: string[] = [];
  const posicoesPorMes = mapearPosicoes(dados);
  const consolidadoPorMes = new Map(dados.consolidados.map((item) => [item.mesChave, item]));
  const eventosPorMes = indexar(dados.eventos, (evento) => mesDe(evento.data));
  const mesesComPosicao = [...posicoesPorMes.keys()].sort();
  const primeiroMes = mesesComPosicao[0] ?? null;
  const fechados = dados.consolidados.filter((item) => item.status === "fechado" && item.fechado).map((item) => item.mesChave).sort();
  const ultimoMes = fechados.at(-1) ?? null;

  for (const consolidado of dados.consolidados) {
    if (!new Set(["fechado", "aberto"]).has(consolidado.status)) erros.push(`status inválido ${consolidado.mesChave}`);
    if ((consolidado.status === "fechado") !== consolidado.fechado) erros.push(`status/fechado divergentes ${consolidado.mesChave}`);
  }
  if (!primeiroMes) erros.push("nenhuma posição mensal na origem");
  if (!ultimoMes) erros.push("nenhum mês fechado na origem");
  if (!primeiroMes || !ultimoMes) return { meses: [], primeiroMes, ultimoMes, mesesAntigosIgnorados: 0, erros };
  if (ultimoMes < primeiroMes) erros.push("último mês fechado anterior à primeira posição");

  const meses: Mes[] = [];
  for (let mes = primeiroMes; mes <= ultimoMes; mes = mesSeguinte(mes)) meses.push(mes);
  const primeiro = posicoesPorMes.get(primeiroMes);
  if (!primeiro || [...primeiro.values()].some((posicao) => posicao.saldoInicio !== 0n)) {
    erros.push(`saldo inicial diferente de zero em ${primeiroMes}`);
  }
  if (!(eventosPorMes.get(primeiroMes) ?? []).some((evento) => evento.origem !== "calculado")) {
    erros.push(`sem evento não calculado em ${primeiroMes}`);
  }

  const transitPorMes = new Map<string, bigint>();
  let saldoTransito = 0n;
  const todosMeses = [...new Set([...eventosPorMes.keys(), ...meses])].sort();
  for (const mes of todosMeses) {
    for (const evento of eventosPorMes.get(mes) ?? []) {
      if (evento.tipo === "TRANSFERENCIA_PENDENTE") saldoTransito += evento.valorAssinado;
    }
    transitPorMes.set(mes, saldoTransito);
  }

  for (const mes of meses) {
    const consolidado = consolidadoPorMes.get(mes);
    if (!consolidado || consolidado.status !== "fechado" || !consolidado.fechado) {
      erros.push(`mês sem fechamento válido ${mes}`);
    }
    const posicoes = posicoesPorMes.get(mes);
    if (!posicoes || posicoes.size === 0) {
      erros.push(`posições ausentes ${mes}`);
      continue;
    }
    const esperados = new Set<string>();
    const [ano, numeroMes] = mes.split("-").map(Number);
    const mesAnterior = numeroMes === 1 ? `${ano - 1}-12` : `${ano}-${String(numeroMes - 1).padStart(2, "0")}`;
    for (const ativoId of posicoesPorMes.get(mesAnterior)?.keys() ?? []) esperados.add(ativoId);
    for (const evento of eventosPorMes.get(mes) ?? []) if (evento.ativoId !== null) esperados.add(evento.ativoId);
    for (const ativoId of esperados) if (!posicoes.has(ativoId)) erros.push(`posição ausente para ${ativoId} em ${mes}`);

    const patrimonio = [...posicoes.values()].reduce((soma, posicao) => soma + posicao.saldoFim, 0n) + (transitPorMes.get(mes) ?? 0n);
    if (consolidado && consolidado.valorTotal !== patrimonio) erros.push(`valor_total divergente em ${mes}`);
  }

  const mesesComEventosFora = dados.eventos
    .filter((evento) => {
      const mes = mesDe(evento.data);
      return mes < primeiroMes || mes > ultimoMes;
    })
    .map((evento) => `evento #${evento.id} fora do intervalo`);
  erros.push(...mesesComEventosFora);

  const posicaoDepois = mesesComPosicao.filter((mes) => mes > ultimoMes);
  for (const mes of posicaoDepois) erros.push(`posição depois do último fechamento ${mes}`);

  const mesesComEventos = new Set(dados.eventos.map((evento) => mesDe(evento.data)));
  const mesesAntigosIgnorados = dados.consolidados.filter(
    (item) => item.mesChave < primeiroMes && !posicoesPorMes.has(item.mesChave) && !mesesComEventos.has(item.mesChave),
  ).length;
  return { meses, primeiroMes, ultimoMes, mesesAntigosIgnorados, erros };
}

function criarCausasIniciais(
  dados: DadosNormalizados,
  meses: Mes[],
  posicoesPorMes: Map<string, Map<string, PosicaoNormalizada>>,
  pares: ParTransito[],
): Map<string, Set<string>> {
  const causas = new Map<string, Set<string>>();
  const eventosPorMes = indexar(dados.eventos, (evento) => mesDe(evento.data));
  const paresPorMes = indexar(pares, (par) => mesDe(par.data));

  for (const mes of meses) {
    const anteriores = [...posicoesPorMes.keys()].filter((chave) => chave < mes).sort();
    const mesAnterior = anteriores.at(-1);
    for (const posicao of posicoesPorMes.get(mes)?.values() ?? []) {
      const saldoAnterior = mesAnterior ? posicoesPorMes.get(mesAnterior)?.get(posicao.ativoId)?.saldoFim ?? 0n : 0n;
      if (posicao.saldoInicio !== saldoAnterior) adicionarCausa(causas, posicao.ativoId, mes, "saldo_inicio_diverge");

      const temEvento = (eventosPorMes.get(mes) ?? []).some(
        (evento) => evento.ativoId === posicao.ativoId && evento.origem !== "calculado" && evento.valor !== 0n && evento.tipo !== "TRANSFERENCIA_PENDENTE",
      );
      const temTransferencia = (paresPorMes.get(mes) ?? []).some((par) => par.origemId === posicao.ativoId || par.destinoId === posicao.ativoId);
      const temHistoricoAnterior = [...posicoesPorMes.keys()].some((mesAnterior) => mesAnterior < mes && posicoesPorMes.get(mesAnterior)?.has(posicao.ativoId));
      if (posicao.saldoFim !== 0n && !temHistoricoAnterior && !temEvento && !temTransferencia) {
        adicionarCausa(causas, posicao.ativoId, mes, "saldo_sem_historico_de_evento");
      }
    }
  }

  const porId = new Map(dados.eventos.map((evento) => [evento.id, evento]));
  const idsConsumidos = new Set(pares.flatMap((par) => [par.eventoTransito.id, par.eventoAtivo.id]));
  for (const estorno of dados.eventos.filter((evento) => evento.tipo === "ESTORNO")) {
    const referencia = estorno.referenciaId === null ? undefined : porId.get(estorno.referenciaId);
    if (!referencia || estorno.ativoId === null) continue;
    if (idsConsumidos.has(referencia.id)) continue;
    if (referencia.origem === "calculado" || referencia.valor === 0n) {
      adicionarCausa(causas, estorno.ativoId, mesDe(estorno.data), "referencia_sem_evento_destino");
    }
  }
  return causas;
}

function valorCalculadoOrigem(eventos: EventoNormalizado[], ativoId: string, mes: string): bigint {
  return eventos
    .filter((evento) => evento.ativoId === ativoId && evento.origem === "calculado" && mesDe(evento.data) === mes)
    .reduce((soma, evento) => soma + evento.valorAssinado, 0n);
}

function somaEventosOrigem(eventos: EventoNormalizado[], ativoId: string, mes: string): bigint {
  return eventos
    .filter((evento) => evento.ativoId === ativoId && evento.origem !== "calculado" && mesDe(evento.data) === mes)
    .reduce((soma, evento) => soma + evento.valorAssinado, 0n);
}

function gerarEventoPlanejado(eventoOrigem: EventoNormalizado, evento: Evento): EventoPlanejado {
  const estorno = eventoOrigem.tipo === "ESTORNO";
  const operacao: Omit<OperacaoMigracao, "sequencia"> = {
    chave: `evento:${eventoOrigem.id}`,
    tipo: estorno ? "estornar_evento" : "lancar_evento",
    data: eventoOrigem.data,
    origemId: eventoOrigem.id,
    ...(estorno ? { referenciaOrigemId: eventoOrigem.referenciaId! } : {}),
    payload: estorno
      ? { eventoReferenciado: `origem:${eventoOrigem.referenciaId}` }
      : { ativo: evento.ativo, data: evento.data, tipo: evento.tipo, valorCentavos: evento.valor.toString() },
  };
  return { origem: eventoOrigem, evento, operacao, ordem: eventoOrigem.id };
}

function replay(
  dados: DadosNormalizados,
  cobertura: CoberturaM10,
  pares: ParTransito[],
  semPar: EventoNormalizado[],
  causas: Map<string, Set<string>>,
): ExecucaoReplay {
  const ativosFin: AtivoFinanceiro[] = dados.ativos.map((ativo) => ({ id: ativo.id, tipoAjuste: ativo.tipoAjuste, ativo: true }));
  ativosFin.push({ id: TRANSITO_ID, sistema: "transito" });
  const posicoesOrigem = mapearPosicoes(dados);
  const eventosOrigemPorMes = indexar(dados.eventos, (evento) => mesDe(evento.data));
  const paresPorMes = indexar(pares, (par) => mesDe(par.data));
  const semParPorMes = indexar(semPar, (evento) => mesDe(evento.data));
  const eventosDestino: Evento[] = [];
  const destinoPorIdOrigem = new Map<number, Evento>();
  const posicoesPorMes = new Map<string, Map<string, Posicao>>();
  const eventosPlanejados = new Map<string, EventoPlanejado[]>();
  const meses: MesSimulado[] = [];
  const novasCausasM7: Array<{ chave: string; motivo: string }> = [];
  const retornos: Record<string, Razao> = {};
  const eventosPorIdOrigem = new Map(dados.eventos.map((evento) => [evento.id, evento]));
  const idsConsumidos = new Set(pares.flatMap((par) => [par.eventoTransito.id, par.eventoAtivo.id]));

  let posicoesAnteriores = new Map<string, Posicao>();
  const eventosParaRelatorio: Evento[] = [];
  for (const mes of cobertura.meses) {
    const posicoesDaOrigem = posicoesOrigem.get(mes);
    if (!posicoesDaOrigem || posicoesDaOrigem.size === 0) continue;
    const eventosDoMesOrigem = [...(eventosOrigemPorMes.get(mes) ?? [])].sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
    const planejados: EventoPlanejado[] = [];

    for (const par of paresPorMes.get(mes) ?? []) {
      const id = `transferencia:${par.eventoTransito.id}:${par.eventoAtivo.id}`;
      const [pernaOrigem, pernaDestino] = criarTransferencia(id, par.origemId, par.destinoId, par.data, par.valor);
      planejados.push({
        origem: null,
        evento: pernaOrigem,
        ordem: Math.min(par.eventoTransito.id, par.eventoAtivo.id),
        operacao: {
          chave: `transferencia:${par.eventoTransito.id}:${par.eventoAtivo.id}`,
          tipo: "transferir",
          data: par.data,
          origemId: par.eventoTransito.id,
          referenciaOrigemId: par.eventoAtivo.id,
          payload: { origem: par.origemId, destino: par.destinoId, data: par.data, valorCentavos: par.valor.toString() },
        },
      });
      planejados.push({ origem: null, evento: pernaDestino, ordem: Math.min(par.eventoTransito.id, par.eventoAtivo.id), operacao: { ...planejados.at(-1)!.operacao } });
      eventosDestino.push(pernaOrigem, pernaDestino);
      eventosParaRelatorio.push(pernaOrigem, pernaDestino);
    }

    // M6, caso b: a variação sem contrapartida vira `migracao` no próprio trânsito, na data da
    // origem, pela função lancar_migracao_transito (exceção à K12). Nada mais é criado.
    for (const eventoTransito of semParPorMes.get(mes) ?? []) {
      const evento: Evento = {
        id: `transito:${eventoTransito.id}`,
        ativo: TRANSITO_ID,
        data: eventoTransito.data,
        tipo: "migracao",
        valor: exigirFaixa(eventoTransito.valorAssinado),
      };
      planejados.push({
        origem: null,
        evento,
        ordem: eventoTransito.id,
        operacao: {
          chave: `transito:${eventoTransito.id}`,
          tipo: "lancar_migracao_transito",
          data: evento.data,
          origemId: eventoTransito.id,
          payload: { ativo: TRANSITO_ID, data: evento.data, tipo: "migracao", valorCentavos: evento.valor.toString() },
        },
      });
      eventosDestino.push(evento);
      eventosParaRelatorio.push(evento);
    }

    for (const eventoOrigem of eventosDoMesOrigem) {
      if (eventoOrigem.origem === "calculado" || eventoOrigem.valor === 0n) continue;
      if (eventoOrigem.tipo === "TRANSFERENCIA_PENDENTE" || idsConsumidos.has(eventoOrigem.id)) continue;
      if (eventoOrigem.ativoId === null) continue;
      const chave = chaveAtivoMes(eventoOrigem.ativoId, mes);
      if (causas.has(chave)) continue;

      let referencia: Evento | undefined;
      if (eventoOrigem.tipo === "ESTORNO") {
        const referenciaOrigem = eventoOrigem.referenciaId === null ? undefined : eventosPorIdOrigem.get(eventoOrigem.referenciaId);
        referencia = eventoOrigem.referenciaId === null ? undefined : destinoPorIdOrigem.get(eventoOrigem.referenciaId);
        if (!referencia || !referenciaOrigem || causas.has(chaveAtivoMes(eventoOrigem.ativoId, mesDe(referenciaOrigem.data)))) {
          novasCausasM7.push({ chave, motivo: "referencia_substituida_por_migracao" });
          continue;
        }
      }
      try {
        const destino = mapearEvento(eventoOrigem, referencia);
        destinoPorIdOrigem.set(eventoOrigem.id, destino);
        const planejado = gerarEventoPlanejado(eventoOrigem, destino);
        planejados.push(planejado);
        eventosDestino.push(destino);
        eventosParaRelatorio.push(destino);
      } catch (erro) {
        if (erro instanceof RecusaFinanceira && erro.motivo === "faixa") {
          novasCausasM7.push({ chave, motivo: "replay_diverge" });
          continue;
        }
        throw erro;
      }
    }

    const mesIndice = cobertura.meses.indexOf(mes);
    const posicoesDoMes = posicoesOrigem.get(mes)!;
    for (const posicao of posicoesDoMes.values()) {
      const chave = chaveAtivoMes(posicao.ativoId, mes);
      if (!causas.has(chave)) continue;
      const saldoAnterior = posicoesAnteriores.get(posicao.ativoId)?.saldoFinal ?? 0n;
      const pernas = eventosDestino
        .filter((evento) => evento.tipo === "transferencia" && evento.ativo === posicao.ativoId && mesDe(evento.data) === mes)
        .reduce((soma, evento) => soma + evento.valor, 0n);
      const valorMigracao = posicao.saldoFim - saldoAnterior - pernas;
      if (valorMigracao === 0n) {
        novasCausasM7.push({ chave, motivo: "migracao_zero" });
        continue;
      }
      const evento: Evento = {
        id: `m7:${posicao.ativoId}:${mes}`,
        ativo: posicao.ativoId,
        data: ultimoDia(mes),
        tipo: "migracao",
        valor: exigirFaixa(valorMigracao),
      };
      const motivos = [...(causas.get(chave) ?? [])].sort().join("+");
      planejados.push({
        origem: null,
        evento,
        ordem: Number.MAX_SAFE_INTEGER,
        operacao: {
          chave: `m7:${posicao.ativoId}:${mes}`,
          tipo: "lancar_evento",
          data: evento.data,
          mes,
          payload: { ativo: evento.ativo, data: evento.data, tipo: "migracao", valorCentavos: evento.valor.toString(), causa: motivos },
        },
      });
      eventosDestino.push(evento);
      eventosParaRelatorio.push(evento);
    }

    planejados.sort((a, b) => {
      const dataA = a.evento.data;
      const dataB = b.evento.data;
      if (dataA !== dataB) return dataA.localeCompare(dataB);
      return a.ordem - b.ordem || a.evento.id.localeCompare(b.evento.id);
    });
    eventosPlanejados.set(mes, planejados);

    const anteriores = posicoesAnteriores;
    const saldosIniciais: Record<string, bigint> = {};
    for (const [ativoId, posicao] of anteriores) saldosIniciais[ativoId] = posicao.saldoFinal;
    const saldosReais: Record<string, bigint> = {};
    for (const posicao of posicoesDoMes.values()) saldosReais[posicao.ativoId] = posicao.saldoFim;
    const ativosRelevantes = new Set<string>([...posicoesDoMes.keys(), ...anteriores.keys()]);
    for (const evento of eventosDoMesOrigem) if (evento.ativoId !== null) ativosRelevantes.add(evento.ativoId);
    const ativosParaFechamento = ativosFin.filter((ativo) => ativo.sistema === "transito" || ativosRelevantes.has(ativo.id));
    const completo = [...ativosRelevantes].every((ativoId) => ativoId === TRANSITO_ID || posicoesDoMes.has(ativoId));
    if (!completo) continue;

    let previa;
    try {
      previa = previaFechamento({ mes, ativos: ativosParaFechamento, saldosIniciais, eventos: eventosDestino, saldosReais });
    } catch (erro) {
      if (erro instanceof RecusaFinanceira && erro.motivo === "pendencia") continue;
      for (const posicao of posicoesDoMes.values()) {
        const chave = chaveAtivoMes(posicao.ativoId, mes);
        if (!causas.has(chave)) novasCausasM7.push({ chave, motivo: "replay_diverge" });
      }
      continue;
    }

    const posicaoResultado = new Map(previa.posicoes.map((posicao) => [posicao.ativo, posicao]));
    for (const posicaoOrigem of posicoesDoMes.values()) {
      const chave = chaveAtivoMes(posicaoOrigem.ativoId, mes);
      if (causas.has(chave)) continue;
      const posicaoDestino = posicaoResultado.get(posicaoOrigem.ativoId);
      if (!posicaoDestino) continue;
      if (posicaoDestino.ajuste !== valorCalculadoOrigem(dados.eventos, posicaoOrigem.ativoId, mes)) {
        novasCausasM7.push({ chave, motivo: "ajuste_calculado_diverge" });
        continue;
      }
      const replayOrigem = posicaoOrigem.saldoInicio + somaEventosOrigem(dados.eventos, posicaoOrigem.ativoId, mes);
      if (posicaoDestino.saldoCalculado !== replayOrigem) novasCausasM7.push({ chave, motivo: "replay_diverge" });
    }

    const eventosMes = eventosDestino.filter((evento) => mesDe(evento.data) === mes);
    const eventosAnteriores = eventosDestino.filter((evento) => mesDe(evento.data) < mes);
    const mesCarteira: MesDaCarteira = {
      mes,
      estado: "fechado",
      primeiroMes: mesIndice === 0,
      vi: previa.consolidado.vi,
      vf: previa.consolidado.vf,
      eventos: eventosMes,
      eventosAnteriores,
    };
    const retorno = dietz(mesCarteira).retorno;
    retornos[mes] = retorno;
    const retornoAcumulado = acumulado(retornos, cobertura.primeiroMes!, cobertura.primeiroMes!, mes);
    const mapaNome = new Map(dados.ativos.map((ativo) => [Number(ativo.id.slice("ativo:".length)), ativo.descricao]));
    const posicoesDetalhadas = previa.posicoes.map((posicao) => ({
      ativoId: posicao.ativo,
      ativo: posicao.ativo === TRANSITO_ID ? "Em trânsito" : mapaNome.get(Number(posicao.ativo.slice("ativo:".length))) ?? posicao.ativo,
      saldoInicial: posicao.saldoInicial.toString(),
      saldoCalculado: posicao.saldoCalculado.toString(),
      saldoFinal: posicao.saldoFinal.toString(),
      ajuste: posicao.ajuste.toString(),
    }));
    const patrimonioOrigem = [...posicoesDoMes.values()].reduce((soma, posicao) => soma + posicao.saldoFim, 0n) +
      (dados.eventos
        .filter((evento) => evento.tipo === "TRANSFERENCIA_PENDENTE" && mesDe(evento.data) <= mes)
        .reduce((soma, evento) => soma + evento.valorAssinado, 0n));
    meses.push({
      mes,
      posicoes: posicoesDetalhadas,
      vi: previa.consolidado.vi.toString(),
      vf: previa.consolidado.vf.toString(),
      aportes: previa.consolidado.aportes.toString(),
      resgates: previa.consolidado.resgates.toString(),
      rendimento: previa.consolidado.rendimento.toString(),
      marcacao: previa.consolidado.marcacao.toString(),
      cambio: previa.consolidado.cambio.toString(),
      migracao: previa.consolidado.migracao.toString(),
      patrimonioOrigem: patrimonioOrigem.toString(),
      retorno,
      acumuladoDesdeInicio: retornoAcumulado,
    });
    posicoesPorMes.set(mes, posicaoResultado);
    posicoesAnteriores = posicaoResultado;
  }

  return { meses, eventos: eventosParaRelatorio, eventosPlanejados, posicoesPorMes, novasCausasM7 };
}

function montarOperacoes(
  dados: DadosNormalizados,
  cobertura: CoberturaM10,
  replayFinal: ExecucaoReplay,
): OperacaoMigracao[] {
  const operacoes: Omit<OperacaoMigracao, "sequencia">[] = [];
  for (const ativo of [...dados.ativos].sort((a, b) => a.idOrigem - b.idOrigem)) {
    operacoes.push({ chave: `ativo:${ativo.idOrigem}`, tipo: "criar_ativo", payload: { nome: ativo.descricao, tipoAjuste: ativo.tipoAjuste } });
  }

  for (const mes of cobertura.meses) {
    const eventos = [...(replayFinal.eventosPlanejados.get(mes) ?? [])];
    const eventosPorAtivo = new Map<string, EventoPlanejado>();
    for (const item of eventos) {
      if (item.operacao.tipo === "transferir") {
        if (!eventosPorAtivo.has(item.operacao.chave)) eventosPorAtivo.set(item.operacao.chave, item);
      } else {
        eventosPorAtivo.set(item.operacao.chave, item);
      }
    }
    const unicos = [...eventosPorAtivo.values()].sort((a, b) => {
      const dataA = a.operacao.data ?? "";
      const dataB = b.operacao.data ?? "";
      if (dataA !== dataB) return dataA.localeCompare(dataB);
      return a.ordem - b.ordem || a.operacao.chave.localeCompare(b.operacao.chave);
    });
    operacoes.push(...unicos.map((item) => item.operacao));

    const posicoes = replayFinal.posicoesPorMes.get(mes);
    if (!posicoes) continue;
    const saldosReais = Object.fromEntries([...posicoes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ativo, posicao]) => [ativo, posicao.saldoFinal.toString()]));
    operacoes.push({ chave: `fechamento:${mes}`, tipo: "fechar_mes", mes, payload: { mes, saldosReais } });
  }

  const ultimo = cobertura.ultimoMes;
  for (const ativo of dados.ativos.filter((item) => !item.ativo).sort((a, b) => a.idOrigem - b.idOrigem)) {
    const saldoFinal = ultimo ? replayFinal.posicoesPorMes.get(ultimo)?.get(ativo.id)?.saldoFinal ?? 0n : 0n;
    if (saldoFinal === 0n) {
      operacoes.push({ chave: `desativar:${ativo.idOrigem}`, tipo: "desativar_ativo", mes: ultimo ?? undefined, payload: { ativo: ativo.id } });
    }
  }

  return operacoes.map((operacao, indice) => ({ sequencia: indice + 1, ...operacao }));
}

function contarZeros(dados: DadosNormalizados): number {
  return dados.eventos.filter((evento) => evento.origem !== "calculado" && evento.valor === 0n).length;
}

function finalizar(
  dados: DadosNormalizados,
  usuarioDestino: string,
  sha256Origem: string,
): ResultadoSimulacao {
  const resumo = resumoVazio(dados);
  const implicitas = preencherPosicoesImplicitas(dados);
  const normalizados = implicitas.dados;

  const transito = classificarTransito(normalizados.eventos);
  const estornosTransito = verificarEstornosLigadosAoTransito(normalizados.eventos, transito.pares);
  if (estornosTransito.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("M5_ESTORNO_LIGADO_A_TRANSFERENCIA", "M5", estornosTransito)]);
  }
  if (transito.ambiguos.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("M6_TRANSITO_PAR_AMBIGUO", "M6", transito.ambiguos)]);
  }
  const cobertura = validarM10(normalizados);
  const transitoNegativo = mesesComTransitoNegativo(normalizados.eventos, cobertura.ultimoMes);
  if (transitoNegativo.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("M6_TRANSITO_SALDO_NEGATIVO", "M6", transitoNegativo)]);
  }

  const estornosInvalidos = verificarEstornos(normalizados);
  if (estornosInvalidos.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("ORIGEM_INVALIDA", "preflight", estornosInvalidos)]);
  }

  const tiposInvalidos = normalizados.eventos.filter((evento) => !TIPOS_COBERTOS.has(evento.tipo)).map((evento) => `tipo #${evento.id}`);
  if (tiposInvalidos.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("TIPO_NAO_COBERTO", "preflight", tiposInvalidos)]);
  }

  resumo.mesesConsolidadosAntigosIgnorados = cobertura.mesesAntigosIgnorados;
  const posicoesPorMes = mapearPosicoes(normalizados);
  const causas = criarCausasIniciais(normalizados, cobertura.meses, posicoesPorMes, transito.pares);

  let replayFinal: ExecucaoReplay | null = null;
  const maxIteracoes = normalizados.posicoes.length + normalizados.eventos.length + 1;
  for (let i = 0; i < maxIteracoes; i += 1) {
    const atual = replay(normalizados, cobertura, transito.pares, transito.semPar, causas);
    let mudou = false;
    for (const causa of atual.novasCausasM7) {
      const [ativo, mes] = causa.chave.split("|");
      if (ativo && mes) mudou = adicionarCausa(causas, ativo, mes, causa.motivo) || mudou;
    }
    const eventosPorId = new Map(normalizados.eventos.map((evento) => [evento.id, evento]));
    for (const estorno of normalizados.eventos.filter((evento) => evento.tipo === "ESTORNO" && evento.ativoId !== null)) {
      const referencia = estorno.referenciaId === null ? undefined : eventosPorId.get(estorno.referenciaId);
      if (!referencia || referencia.ativoId === null || !causas.has(chaveAtivoMes(referencia.ativoId, mesDe(referencia.data)))) continue;
      mudou = adicionarCausa(causas, estorno.ativoId!, mesDe(estorno.data), "estorno_cascata_m7") || mudou;
    }
    replayFinal = atual;
    if (!mudou) break;
    if (i === maxIteracoes - 1) {
      return resultadoRecusado(resumo, sha256Origem, [recusa("ORIGEM_INVALIDA", "preflight", ["replay não estabilizou"]) ]);
    }
  }

  const m7Zerados: string[] = [];
  for (const [chave] of causas) {
    const [ativoId, mes] = chave.split("|");
    const posicao = posicoesPorMes.get(mes)?.get(ativoId);
    const posicoesDestinoAnteriores = cobertura.meses
      .filter((item) => item < mes)
      .map((item) => replayFinal?.posicoesPorMes.get(item)?.get(ativoId)?.saldoFinal)
      .filter((item) => item !== undefined);
    const saldoAnterior = posicoesDestinoAnteriores.at(-1) ?? 0n;
    const pernas = (replayFinal?.eventos ?? [])
      .filter((evento) => evento.ativo === ativoId && evento.tipo === "transferencia" && mesDe(evento.data) === mes)
      .reduce((soma, evento) => soma + evento.valor, 0n);
    if (posicao && posicao.saldoFim - saldoAnterior - pernas === 0n) m7Zerados.push(`${ativoId} ${mes}`);
  }
  if (m7Zerados.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("M7_MIGRACAO_ZERO", "M7", m7Zerados)]);
  }

  if (cobertura.erros.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("M10_COBERTURA_OU_CONSISTENCIA", "M10", cobertura.erros)]);
  }

  const nomesLongos = normalizados.ativos.filter((ativo) => [...ativo.descricao].length > 100).map((ativo) => `ativo #${ativo.idOrigem}`);
  if (nomesLongos.length > 0) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("NOME_COM_MAIS_DE_100_CARACTERES", "preflight", nomesLongos)]);
  }
  if (normalizados.indicadoresUsuario > 1) {
    return resultadoRecusado(resumo, sha256Origem, [recusa("INDICIO_DE_MULTIPLOS_USUARIOS", "preflight", [`contagem de indicadores: ${normalizados.indicadoresUsuario}`])]);
  }

  if (!replayFinal) return resultadoRecusado(resumo, sha256Origem, [recusa("M10_COBERTURA_OU_CONSISTENCIA", "M10", ["nenhum mês simulável"]) ]);
  const operacoesSemHash = montarOperacoes(normalizados, cobertura, replayFinal);
  const hashPayload = {
    versao: VERSAO_PLANO,
    sha256Origem,
    usuarioDestino,
    operacoes: operacoesSemHash,
  };
  const sha256Plano = sha256(serializarEstavel(hashPayload));
  const plano: PlanoMigracao = { ...hashPayload, sha256Plano };
  const ativosEmM7 = [...causas.entries()]
    .map(([chave, motivos]) => {
      const [ativoId, mes] = chave.split("|");
      const ativo = normalizados.ativos.find((item) => item.id === ativoId);
      const saldoAnterior = cobertura.meses
        .filter((item) => item < mes)
        .map((item) => replayFinal!.posicoesPorMes.get(item)?.get(ativoId)?.saldoFinal)
        .filter((item) => item !== undefined)
        .at(-1) ?? 0n;
      const pernas = replayFinal!.eventos
        .filter((evento) => evento.ativo === ativoId && evento.tipo === "transferencia" && mesDe(evento.data) === mes)
        .reduce((soma, evento) => soma + evento.valor, 0n);
      const saldoFim = posicoesPorMes.get(mes)?.get(ativoId)?.saldoFim ?? 0n;
      return { ativo: ativo?.descricao ?? ativoId, mes, motivo: [...motivos].sort().join(","), migracao: (saldoFim - saldoAnterior - pernas).toString() };
    })
    .sort((a, b) => a.mes.localeCompare(b.mes) || a.ativo.localeCompare(b.ativo));

  resumo.mesesMigrados = replayFinal.meses.length;
  resumo.mesesComMigracao = replayFinal.meses.filter((mes) => BigInt(mes.migracao) !== 0n).length;
  resumo.ativosMesesEmM7 = ativosEmM7.length;
  resumo.eventosZeroDescartados = contarZeros(normalizados);
  resumo.transitoComoTransferencia = transito.pares.length;
  resumo.transitoComoMigracao = transito.semPar.length;
  resumo.posicoesImplicitasZero = implicitas.quantidade;
  const ultimoMes = cobertura.ultimoMes;
  for (const ativo of normalizados.ativos.filter((item) => !item.ativo)) {
    const saldoFinal = ultimoMes ? replayFinal.posicoesPorMes.get(ultimoMes)?.get(ativo.id)?.saldoFinal ?? 0n : 0n;
    if (saldoFinal === 0n) resumo.ativosDesativados += 1;
    else resumo.ativosComSaldoQuePermanecemAtivos += 1;
  }

  const relatorio: RelatorioSimulacao = {
    estado: "simulada",
    resumo,
    meses: replayFinal.meses,
    ativosEmM7,
    recusas: [],
    sha256Origem,
    sha256Plano,
  };
  return { ok: true, resumo, relatorio, plano };
}

function resultadoRecusado(resumo: ResumoSimulacao, sha256Origem: string, recusas: RecusaMigracao[]): ResultadoSimulacao {
  const relatorio: RelatorioSimulacao = {
    estado: "recusada",
    resumo,
    meses: [],
    ativosEmM7: [],
    recusas,
    sha256Origem,
  };
  return { ok: false, resumo, relatorio, recusas };
}

function hashFallback(dados: DadosNormalizados): string {
  return sha256(
    serializarEstavel({
      ativos: dados.ativos,
      eventos: dados.eventos.map((evento) => ({ ...evento, valor: evento.valor.toString(), valorAssinado: evento.valorAssinado.toString() })).sort((a, b) => a.id - b.id),
      posicoes: dados.posicoes.map((posicao) => ({ ...posicao, saldoInicio: posicao.saldoInicio.toString(), saldoFim: posicao.saldoFim.toString() })).sort((a, b) => a.mesChave.localeCompare(b.mesChave) || a.ativoId.localeCompare(b.ativoId)),
      consolidados: dados.consolidados.map((consolidado) => ({ ...consolidado, valorTotal: consolidado.valorTotal.toString() })).sort((a, b) => a.mesChave.localeCompare(b.mesChave)),
    }),
  );
}

function simularEntrada(entrada: EntradaSimulacao): ResultadoSimulacao {
  const resumo = resumoVazio(entrada.dados);
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(entrada.usuarioDestino)) {
    return resultadoRecusado(resumo, entrada.sha256Origem ?? "", [recusa("DESTINO_INVALIDO", "preflight", ["UUID do usuário de destino inválido"]) ]);
  }

  const normalizado = normalizarDados(entrada.dados);
  if (normalizado.errosM2.length > 0) {
    return resultadoRecusado(resumo, entrada.sha256Origem ?? "", [recusa("M2_CONVERSAO_INVALIDA", "M2", normalizado.errosM2)]);
  }
  if (normalizado.erros.length > 0 || !normalizado.dados) {
    return resultadoRecusado(resumo, entrada.sha256Origem ?? "", [recusa("ORIGEM_INVALIDA", "preflight", normalizado.erros)]);
  }

  const shaOrigem = entrada.sha256Origem ?? hashFallback(normalizado.dados);
  return finalizar(normalizado.dados, entrada.usuarioDestino, shaOrigem);
}

/** Simula usando uma conexão existente; nenhum método de escrita é chamado. */
export function simularMigracao(dados: DadosOrigem, opcoes: { usuarioDestino: string; sha256Origem?: string }): ResultadoSimulacao {
  return simularEntrada({ dados, usuarioDestino: opcoes.usuarioDestino, sha256Origem: opcoes.sha256Origem });
}

/** Abre uma transação de leitura para que as quatro consultas vejam o mesmo snapshot. */
export function simularBanco(db: DatabaseSync, opcoes: OpcoesDatabase): ResultadoSimulacao {
  db.exec("BEGIN DEFERRED TRANSACTION");
  try {
    const dados = lerOrigem(db);
    return simularMigracao(dados, opcoes);
  } catch {
    return resultadoRecusado(resumoVazio(), opcoes.sha256Origem ?? "", [recusa("ORIGEM_INVALIDA", "preflight", ["schema ou leitura SQLite inválida"]) ]);
  } finally {
    db.exec("ROLLBACK");
  }
}
