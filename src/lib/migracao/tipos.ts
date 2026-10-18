export type OrigemValorMonetario = number | bigint | string | null | Uint8Array;

export interface AtivoOrigem {
  id: number;
  descricao: string;
  classificacao: string | null;
  ativo: boolean;
}

export interface EventoOrigem {
  id: number;
  ativoId: number | null;
  data: string;
  ano: number;
  mes: number;
  tipo: string;
  valor: OrigemValorMonetario;
  referenciaId: number | null;
  origem: string;
  observacao: string | null;
}

export interface PosicaoOrigem {
  ativoId: number;
  ano: number;
  mes: number;
  saldoInicio: OrigemValorMonetario;
  saldoFim: OrigemValorMonetario;
}

export interface ConsolidadoOrigem {
  ano: number;
  mes: number;
  valorTotal: OrigemValorMonetario;
  status: string;
  fechado: boolean;
}

export interface DadosOrigem {
  ativos: AtivoOrigem[];
  eventos: EventoOrigem[];
  posicoes: PosicaoOrigem[];
  consolidados: ConsolidadoOrigem[];
  indicadoresUsuario: number;
}

export interface AtivoNormalizado extends Omit<AtivoOrigem, "id"> {
  id: string;
  idOrigem: number;
  tipoAjuste: "rendimento" | "marcacao";
}

export interface EventoNormalizado extends Omit<EventoOrigem, "ativoId" | "referenciaId" | "valor"> {
  ativoId: string | null;
  referenciaId: number | null;
  valor: bigint;
  valorAssinado: bigint;
}

export interface PosicaoNormalizada extends Omit<PosicaoOrigem, "ativoId" | "saldoInicio" | "saldoFim"> {
  ativoId: string;
  saldoInicio: bigint;
  saldoFim: bigint;
  mesChave: string;
}

export interface ConsolidadoNormalizado extends Omit<ConsolidadoOrigem, "valorTotal"> {
  valorTotal: bigint;
  mesChave: string;
}

export interface DadosNormalizados {
  ativos: AtivoNormalizado[];
  eventos: EventoNormalizado[];
  posicoes: PosicaoNormalizada[];
  consolidados: ConsolidadoNormalizado[];
  indicadoresUsuario: number;
}

export type CodigoRecusa =
  | "M2_CONVERSAO_INVALIDA"
  | "M5_ESTORNO_LIGADO_A_TRANSFERENCIA"
  | "M6_TRANSITO_SEM_PAR_UNICO"
  | "M7_MIGRACAO_ZERO"
  | "M10_COBERTURA_OU_CONSISTENCIA"
  | "NOME_COM_MAIS_DE_100_CARACTERES"
  | "INDICIO_DE_MULTIPLOS_USUARIOS"
  | "ORIGEM_INVALIDA"
  | "TIPO_NAO_COBERTO"
  | "DESTINO_INVALIDO";

export interface RecusaMigracao {
  codigo: CodigoRecusa;
  etapa: "M2" | "M5" | "M6" | "M7" | "M10" | "preflight";
  quantidade: number;
  detalhes: string[];
}

export interface ResumoSimulacao {
  ativos: number;
  eventos: number;
  eventosPorTipo: Record<string, number>;
  mesesMigrados: number;
  mesesComMigracao: number;
  ativosMesesEmM7: number;
  eventosZeroDescartados: number;
  mesesConsolidadosAntigosIgnorados: number;
  ativosDesativados: number;
  ativosComSaldoQuePermanecemAtivos: number;
}

export interface PosicaoSimulada {
  ativoId: string;
  ativo: string;
  saldoInicial: string;
  saldoCalculado: string;
  saldoFinal: string;
  ajuste: string;
}

export interface MesSimulado {
  mes: string;
  posicoes: PosicaoSimulada[];
  vi: string;
  vf: string;
  aportes: string;
  resgates: string;
  rendimento: string;
  marcacao: string;
  cambio: string;
  migracao: string;
  patrimonioOrigem: string;
  retorno: number | "N/D";
  acumuladoDesdeInicio: number | "N/D";
}

export interface OperacaoMigracao {
  sequencia: number;
  chave: string;
  tipo: "criar_ativo" | "lancar_evento" | "estornar_evento" | "transferir" | "fechar_mes" | "desativar_ativo";
  data?: string;
  mes?: string;
  origemId?: number;
  referenciaOrigemId?: number;
  payload: Record<string, unknown>;
}

export interface PlanoMigracao {
  versao: 1;
  sha256Origem: string;
  sha256Plano: string;
  usuarioDestino: string;
  operacoes: OperacaoMigracao[];
}

export interface RelatorioSimulacao {
  estado: "simulada" | "recusada";
  resumo: ResumoSimulacao;
  meses: MesSimulado[];
  ativosEmM7: Array<{ ativo: string; mes: string; motivo: string; migracao: string }>;
  recusas: RecusaMigracao[];
  sha256Origem: string;
  sha256Plano?: string;
}

export type ResultadoSimulacao =
  | { ok: true; resumo: ResumoSimulacao; relatorio: RelatorioSimulacao; plano: PlanoMigracao }
  | { ok: false; resumo: ResumoSimulacao; relatorio: RelatorioSimulacao; recusas: RecusaMigracao[] };
