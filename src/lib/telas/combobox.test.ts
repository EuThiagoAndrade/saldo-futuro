import { expect, it } from "vitest";
import {
  abrir, confirmar, type Configuracao, editar, escapar, estadoInicial, listaFiltrada, mensagemDeValidade, mover, normalizar,
  ordenarPorNome, sair, valorEnviado,
} from "./combobox";

// Somente nomes fictícios.
const A = { id: "id-a", nome: "Ação Fictícia" };
const B = { id: "id-b", nome: "Fundo Beta" };
const C = { id: "id-c", nome: "Cofrinho" };
const config: Configuracao = { opcoes: [A, B, C] };
const filtro: Configuracao = { opcoes: [A, B, C], opcaoVazia: { id: "", nome: "Todos os ativos" } };

it("normaliza acentos e caixa", () => {
  expect(normalizar("Ação")).toBe("acao");
  expect(normalizar("ÓLEO")).toBe("oleo");
  expect(normalizar("Em trânsito")).toBe("em transito");
});

it("ordena pelo nome exibido em pt-BR, com acentos, 'Em trânsito' e nomes iguais", () => {
  const nomes = (l: { nome: string }[]) => l.map((x) => x.nome);
  expect(nomes(ordenarPorNome([{ nome: "Zeta" }, { nome: "Ágata" }, { nome: "beta" }, { nome: "Em trânsito" }, { nome: "Alfa" }]))).toEqual(["Ágata", "Alfa", "beta", "Em trânsito", "Zeta"]);
  expect(ordenarPorNome([{ nome: "Café", id: 1 }, { nome: "Café", id: 2 }]).map((x) => x.id)).toEqual([1, 2]);
  expect(ordenarPorNome([])).toEqual([]);
});

it("nomes que diferem só pelo acento ficam em ordem determinística e distintos", () => {
  expect(ordenarPorNome([{ nome: "Acao" }, { nome: "Ação" }]).map((x) => x.nome)).toEqual(["Acao", "Ação"]);
});

it("busca por substring, sem diferenciar maiúsculas nem acentos", () => {
  expect(listaFiltrada(config, "acao")).toEqual([A]);
  expect(listaFiltrada(config, "FICT")).toEqual([A]);
  expect(listaFiltrada(config, "o")).toEqual([A, B, C]);
  expect(listaFiltrada(config, "zzz")).toEqual([]);
  expect(listaFiltrada(config, "")).toEqual([A, B, C]);
  expect(listaFiltrada({ opcoes: [] }, "a")).toEqual([]);
});

it("o filtro mantém 'Todos os ativos' no topo e ele casa com a busca pelo próprio nome", () => {
  expect(listaFiltrada(filtro, "")[0]).toEqual({ id: "", nome: "Todos os ativos" });
  expect(listaFiltrada(filtro, "todos")).toEqual([{ id: "", nome: "Todos os ativos" }]);
});

it("selecionar A, editar o texto para B sem selecionar: o valor enviado fica vazio e o envio é bloqueado", () => {
  let e = confirmar(abrir(config, estadoInicial(config)), A);
  expect(valorEnviado(e)).toBe("id-a");
  expect(mensagemDeValidade(e, true, "Escolha um ativo.")).toBe("");
  e = editar(config, e, "Fundo Beta");
  expect(e.texto).toBe("Fundo Beta");
  expect(valorEnviado(e)).toBe("");
  expect(mensagemDeValidade(e, true, "Escolha um ativo.")).toBe("Escolha um ativo da lista.");
  // Digitar o nome completo não seleciona sozinho; a opção ativa é a primeira correspondência.
  expect(e.confirmada).toBeNull();
  expect(listaFiltrada(config, e.filtro)[e.ativa]).toEqual(B);
});

it("apagar a seleção de um campo obrigatório usa a mensagem do servidor; opcional fica válido", () => {
  const e = editar(config, confirmar(estadoInicial(config), A), "");
  expect(valorEnviado(e)).toBe("");
  expect(mensagemDeValidade(e, true, "Escolha o ativo de origem.")).toBe("Escolha o ativo de origem.");
  expect(mensagemDeValidade(e, false, "x")).toBe("");
  expect(mensagemDeValidade(editar(config, e, "   "), true, "Escolha um ativo.")).toBe("Escolha um ativo.");
});

it("Esc com a lista aberta só a fecha; com a lista fechada restaura a última confirmação", () => {
  let e = confirmar(estadoInicial(config), A);
  e = editar(config, e, "Fun");
  expect(e.aberta).toBe(true);
  e = escapar(e);
  expect(e).toMatchObject({ aberta: false, texto: "Fun", confirmada: null });
  e = escapar(e);
  expect(e).toMatchObject({ texto: "Ação Fictícia", confirmada: A });
  expect(valorEnviado(e)).toBe("id-a");
  // Sem confirmação anterior, volta ao vazio.
  expect(escapar(escapar(editar(config, estadoInicial(config), "xx")))).toMatchObject({ texto: "", confirmada: null });
});

it("saída sem confirmar fecha a lista e mantém o texto, sem valor", () => {
  const e = sair(editar(config, estadoInicial(config), "Fun"));
  expect(e).toMatchObject({ aberta: false, texto: "Fun" });
  expect(valorEnviado(e)).toBe("");
  expect(mensagemDeValidade(e, true, "Escolha um ativo.")).toBe("Escolha um ativo da lista.");
});

it("filtro com seleção inicial da URL, retorno a 'Todos os ativos' e ID desconhecido", () => {
  const comAtivo = estadoInicial(filtro, "id-b");
  expect(comAtivo).toMatchObject({ texto: "Fundo Beta", confirmada: B });
  expect(valorEnviado(comAtivo)).toBe("id-b");
  // Reabrir a lista mostra todas as opções, com a confirmada destacada.
  const aberta = abrir(filtro, comAtivo);
  expect(listaFiltrada(filtro, aberta.filtro)).toHaveLength(4);
  expect(listaFiltrada(filtro, aberta.filtro)[aberta.ativa]).toEqual(B);
  const todos = confirmar(aberta, { id: "", nome: "Todos os ativos" });
  expect(valorEnviado(todos)).toBe("");
  expect(mensagemDeValidade(todos, false, "x")).toBe("");
  expect(estadoInicial(filtro, "inexistente")).toMatchObject({ texto: "Todos os ativos", confirmada: { id: "" } });
  expect(estadoInicial(filtro, "")).toMatchObject({ texto: "Todos os ativos" });
  // Texto vazio equivale a "Todos os ativos".
  expect(valorEnviado(editar(filtro, comAtivo, ""))).toBe("");
  expect(mensagemDeValidade(editar(filtro, comAtivo, ""), false, "x")).toBe("");
  expect(mensagemDeValidade(editar(filtro, comAtivo, "abc"), false, "x")).toBe("Escolha um ativo da lista.");
});

it("estado inicial dos obrigatórios é vazio e sem ID; reiniciar restaura o estado inicial", () => {
  const inicial = estadoInicial(config);
  expect(inicial).toMatchObject({ texto: "", confirmada: null, aberta: false, ativa: -1 });
  expect(valorEnviado(inicial)).toBe("");
  const sujo = editar(config, confirmar(inicial, A), "xyz");
  expect(estadoInicial(config)).toEqual(inicial);
  expect(sujo).not.toEqual(inicial);
});

it("só emite IDs das opções recebidas", () => {
  expect(estadoInicial(config, "id-que-nao-existe").confirmada).toBeNull();
  let e = estadoInicial(config);
  for (const texto of ["a", "ab", "zzz", ""]) e = editar(config, e, texto);
  expect(valorEnviado(e)).toBe("");
});

it("setas, Home e End percorrem a lista filtrada sem sair dos limites", () => {
  let e = editar(config, estadoInicial(config), "o");
  expect(e.ativa).toBe(0);
  e = mover(config, e, "ArrowDown");
  e = mover(config, e, "ArrowDown");
  e = mover(config, e, "ArrowDown");
  expect(e.ativa).toBe(2);
  e = mover(config, e, "ArrowUp");
  expect(e.ativa).toBe(1);
  expect(mover(config, e, "Home").ativa).toBe(0);
  expect(mover(config, e, "End").ativa).toBe(2);
  // Com a lista fechada, a seta só abre; lista vazia não tem opção ativa.
  const fechada = sair(e);
  expect(mover(config, fechada, "ArrowDown")).toMatchObject({ aberta: true });
  expect(editar(config, estadoInicial(config), "zzz").ativa).toBe(-1);
  expect(mover(config, editar(config, estadoInicial(config), "zzz"), "ArrowDown").ativa).toBe(-1);
});

it("nomes iguais aparecem como opções distintas e a seleção é pelo ID", () => {
  const dupla: Configuracao = { opcoes: [{ id: "x1", nome: "Caixa" }, { id: "x2", nome: "Caixa" }] };
  expect(listaFiltrada(dupla, "caixa")).toHaveLength(2);
  expect(valorEnviado(confirmar(estadoInicial(dupla), dupla.opcoes[1]))).toBe("x2");
});
