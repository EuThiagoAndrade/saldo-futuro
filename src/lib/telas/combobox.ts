// Política de seleção do seletor de ativo com busca (ciclo 009, BL-010; DESIGN.md 6.8). Funções
// puras: o componente só liga o estado ao DOM. Só há seleção confirmada quando a pessoa escolhe
// uma opção da lista; qualquer edição do texto depois disso desfaz a seleção, e o valor enviado
// é sempre o ID da última opção confirmada, ou vazio.

export interface Opcao {
  id: string;
  nome: string;
}

export interface EstadoCombo {
  /** Texto visível no campo. */
  texto: string;
  /** Texto que filtra a lista; vazio logo depois de uma confirmação, para listar tudo. */
  filtro: string;
  aberta: boolean;
  /** Índice da opção destacada na lista filtrada, ou -1. */
  ativa: number;
  /** Seleção confirmada; o ID enviado é o dela. */
  confirmada: Opcao | null;
  /** Última confirmação, a que o Esc com a lista fechada restaura. */
  ultima: Opcao | null;
}

export interface Configuracao {
  opcoes: readonly Opcao[];
  /** Opção sem valor no topo da lista, como "Todos os ativos" no filtro. */
  opcaoVazia?: Opcao;
}

/** Minúsculas, sem acentos nem diferença de caixa: "Ação" e "acao" são o mesmo texto. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

/** Ordem de apresentação: pelo nome exibido, em pt-BR; nomes iguais mantêm a ordem recebida. */
export function ordenarPorNome<T extends { nome: string }>(itens: readonly T[]): T[] {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function todas(c: Configuracao): Opcao[] {
  return c.opcaoVazia ? [c.opcaoVazia, ...c.opcoes] : [...c.opcoes];
}

/** Opções que correspondem ao filtro (substring); filtro vazio lista tudo. */
export function listaFiltrada(c: Configuracao, filtro: string): Opcao[] {
  const busca = normalizar(filtro.trim());
  return todas(c).filter((o) => busca === "" || normalizar(o.nome).includes(busca));
}

/** Estado inicial: um ID que está na lista começa confirmado; senão, a opção vazia (se houver) ou nada. */
export function estadoInicial(c: Configuracao, valorInicial = ""): EstadoCombo {
  const inicial = valorInicial ? c.opcoes.find((o) => o.id === valorInicial) : undefined;
  const confirmada = inicial ?? c.opcaoVazia ?? null;
  return { texto: confirmada?.nome ?? "", filtro: "", aberta: false, ativa: -1, confirmada, ultima: confirmada };
}

/** O valor enviado: o ID da seleção confirmada, ou vazio. */
export function valorEnviado(e: EstadoCombo): string {
  return e.confirmada?.id ?? "";
}

export function editar(c: Configuracao, e: EstadoCombo, texto: string): EstadoCombo {
  const vazio = texto.trim() === "";
  // Texto vazio equivale à opção vazia ("Todos os ativos"); qualquer outro texto desfaz a seleção.
  const confirmada = vazio ? (c.opcaoVazia ?? null) : null;
  const lista = listaFiltrada(c, texto);
  return { ...e, texto, filtro: texto, confirmada, aberta: true, ativa: lista.length ? 0 : -1 };
}

export function abrir(c: Configuracao, e: EstadoCombo): EstadoCombo {
  if (e.aberta) return e;
  const lista = listaFiltrada(c, e.filtro);
  const noConfirmado = e.confirmada ? lista.findIndex((o) => o.id === e.confirmada!.id) : -1;
  return { ...e, aberta: true, ativa: noConfirmado >= 0 ? noConfirmado : lista.length ? 0 : -1 };
}

export function confirmar(e: EstadoCombo, opcao: Opcao): EstadoCombo {
  return { ...e, texto: opcao.nome, filtro: "", aberta: false, ativa: -1, confirmada: opcao, ultima: opcao };
}

/** Saída do campo sem confirmar: fecha a lista e mantém o texto, sem valor. */
export function sair(e: EstadoCombo): EstadoCombo {
  return { ...e, aberta: false, ativa: -1 };
}

/** Esc: com a lista aberta só a fecha; fechada, volta texto e valor à última confirmação. */
export function escapar(e: EstadoCombo): EstadoCombo {
  if (e.aberta) return sair(e);
  return { ...e, texto: e.ultima?.nome ?? "", filtro: "", ativa: -1, confirmada: e.ultima };
}

export function mover(c: Configuracao, e: EstadoCombo, tecla: "ArrowDown" | "ArrowUp" | "Home" | "End"): EstadoCombo {
  const aberta = abrir(c, e);
  const ultimo = listaFiltrada(c, aberta.filtro).length - 1;
  if (ultimo < 0) return aberta;
  if (!e.aberta && (tecla === "ArrowDown" || tecla === "ArrowUp")) return aberta;
  const ativa =
    tecla === "Home" ? 0 : tecla === "End" ? ultimo : tecla === "ArrowDown" ? Math.min(aberta.ativa + 1, ultimo) : Math.max(aberta.ativa - 1, 0);
  return { ...aberta, ativa };
}

/** Mensagem de validade do campo de texto; vazia quando o campo está válido. */
export function mensagemDeValidade(e: EstadoCombo, obrigatorio: boolean, mensagemObrigatoria: string): string {
  if (e.confirmada) return "";
  if (e.texto.trim() !== "") return "Escolha um ativo da lista.";
  return obrigatorio ? mensagemObrigatoria : "";
}
