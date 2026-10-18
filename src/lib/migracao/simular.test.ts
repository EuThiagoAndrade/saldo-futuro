import { existsSync, mkdirSync, readFileSync, mkdtempSync, rmSync, rmdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { paraCentavosOrigem } from "./quantias";
import { simularBanco } from "./simular";

interface CasoMigracao {
  id: string;
  entrada: {
    ativos: Array<{ id: number; descricao: string; classificacao: string | null; ativo: boolean }>;
    eventos: Array<Record<string, unknown>>;
    posicoes: Array<Record<string, unknown>>;
    consolidados: Array<Record<string, unknown>>;
  };
  esperado: Record<string, string>;
}

const RAIZ = process.cwd();
const DDL = readFileSync(join(RAIZ, "tests/fixtures/migracao/origem.sql"), "utf8");
const CASOS = JSON.parse(readFileSync(join(RAIZ, "tests/fixtures/financeiro/casos_referencia.json"), "utf8")) as { casos: CasoMigracao[] };
const CASOS_MIGRACAO = CASOS.casos.filter((caso) => caso.id.startsWith("CR-M"));
const USER_ID = "00000000-0000-4000-8000-000000000063";
const HASH_ORIGEM = "a".repeat(64);
const bancosParaFechar: DatabaseSync[] = [];

function popularBanco(db: DatabaseSync, entrada: CasoMigracao["entrada"]): void {
  db.exec(DDL);

  const ativo = db.prepare("INSERT INTO ativos (id, descricao, classificacao, ativo) VALUES (?, ?, ?, ?)");
  for (const item of entrada.ativos) ativo.run(item.id, item.descricao, item.classificacao, Number(item.ativo));

  const evento = db.prepare(
    "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, evento_referencia_id, origem, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const item of [...entrada.eventos].sort((a, b) => Number(a.id) - Number(b.id))) {
    evento.run(
      Number(item.id),
      item.ativo_id === null || item.ativo_id === undefined ? null : Number(item.ativo_id),
      String(item.data_evento),
      Number(item.ano),
      Number(item.mes),
      String(item.tipo_evento),
      item.valor as number,
      item.evento_referencia_id === null || item.evento_referencia_id === undefined ? null : Number(item.evento_referencia_id),
      String(item.origem ?? "manual"),
      item.observacao === null || item.observacao === undefined ? null : String(item.observacao),
    );
  }

  const posicao = db.prepare("INSERT INTO posicoes_mensais (ativo_id, ano, mes, saldo_inicio, saldo_fim) VALUES (?, ?, ?, ?, ?)");
  for (const item of entrada.posicoes) posicao.run(Number(item.ativo_id), Number(item.ano), Number(item.mes), item.saldo_inicio as number, item.saldo_fim as number);

  const consolidado = db.prepare(
    "INSERT INTO consolidado_mensal (ano, mes, valor_total, status, fechado) VALUES (?, ?, ?, ?, ?)",
  );
  for (const item of entrada.consolidados) consolidado.run(Number(item.ano), Number(item.mes), item.valor_total as number, String(item.status), Number(Boolean(item.fechado)));
}

function criarBanco(entrada: CasoMigracao["entrada"]): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  bancosParaFechar.push(db);
  popularBanco(db, entrada);
  return db;
}

function caso(id: string): CasoMigracao {
  const encontrado = CASOS_MIGRACAO.find((item) => item.id === id);
  if (!encontrado) throw new Error(`caso ausente: ${id}`);
  return encontrado;
}

function simular(casoMigracao: CasoMigracao) {
  const db = criarBanco(casoMigracao.entrada);
  return simularBanco(db, { usuarioDestino: USER_ID, sha256Origem: HASH_ORIGEM });
}

function obterEsperado(resultado: Extract<ReturnType<typeof simularBanco>, { ok: true }>, casoMigracao: CasoMigracao, chave: string): string {
  if (chave === "ajuste_tipo") {
    const ativo = resultado.plano.operacoes.find((operacao) => operacao.tipo === "criar_ativo");
    return String(ativo?.payload.tipoAjuste);
  }
  if (chave === "m7") {
    return resultado.relatorio.ativosEmM7.map((item) => `${item.ativo}@${item.mes}`).join(",");
  }
  if (chave === "posicoes_implicitas_zero") return String(resultado.resumo.posicoesImplicitasZero);
  const operacao = /^operacoes\.(.+)$/.exec(chave);
  if (operacao) return String(resultado.plano.operacoes.filter((item) => item.tipo === operacao[1]).length);
  if (chave === "operacao_fev") {
    return resultado.plano.operacoes.some((operacao) => operacao.tipo === "transferir" && operacao.data?.startsWith("2025-02"))
      ? "transferir"
      : "nenhuma";
  }

  const correspondencia = /^(jan|fev|mar|abr)2025\.(.+)$/.exec(chave);
  if (!correspondencia) throw new Error(`chave esperada desconhecida: ${chave}`);
  const mes = { jan: "2025-01", fev: "2025-02", mar: "2025-03", abr: "2025-04" }[correspondencia[1]];
  const resultadoMes = resultado.relatorio.meses.find((item) => item.mes === mes);
  if (!resultadoMes) throw new Error(`mês ausente: ${mes}`);
  const campo = correspondencia[2];
  if (campo === "patrimonio") return resultadoMes.patrimonioOrigem;
  if (campo === "acumulado") return String(resultadoMes.acumuladoDesdeInicio);
  if (campo === "retorno") return String(resultadoMes.retorno);
  if (campo === "migracao") return resultadoMes.migracao;
  if (campo === "aportes" || campo === "resgates" || campo === "rendimento" || campo === "marcacao" || campo === "cambio") {
    return resultadoMes[campo];
  }
  // "Em_trânsito" é o trânsito; "X" é o primeiro ativo comum; outra letra é o ativo cujo nome termina nela.
  const rotulo = campo.split(".")[0];
  const posicao =
    rotulo === "Em_trânsito"
      ? resultadoMes.posicoes.find((item) => item.ativo === "Em trânsito")
      : rotulo === "X"
        ? resultadoMes.posicoes.find((item) => item.ativo !== "Em trânsito")
        : resultadoMes.posicoes.find((item) => item.ativo.endsWith(` ${rotulo}`));
  if (!posicao) throw new Error(`posição ausente: ${campo} em ${mes}`);
  if (campo.endsWith(".saldo_fim")) return posicao.saldoFinal;
  throw new Error(`campo esperado desconhecido: ${campo}`);
}

function recusa(db: DatabaseSync, codigo: string, quantidade?: number): void {
  const resultado = simularBanco(db, { usuarioDestino: USER_ID, sha256Origem: HASH_ORIGEM });
  expect(resultado.ok).toBe(false);
  if (resultado.ok) throw new Error("esperava recusa");
  expect(resultado.recusas[0]?.codigo).toBe(codigo);
  if (quantidade !== undefined) expect(resultado.recusas[0]?.quantidade).toBe(quantidade);
  expect("plano" in resultado).toBe(false);
  expect("operacoes" in resultado.relatorio).toBe(false);
}

afterEach(() => {
  while (bancosParaFechar.length > 0) bancosParaFechar.pop()?.close();
});

describe("simulação de migração da origem", () => {
  it.each(CASOS_MIGRACAO)("reproduz os valores fictícios de $id", (casoMigracao) => {
    const resultado = simular(casoMigracao);
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (!resultado.ok) throw new Error(resultado.recusas.map((item) => item.codigo).join(","));
    for (const [chave, esperado] of Object.entries(casoMigracao.esperado)) {
      expect(obterEsperado(resultado, casoMigracao, chave), `${casoMigracao.id}.${chave}`).toBe(esperado);
    }
  });

  it("lê a tabela consolidado_mensal definida no contrato da origem", () => {
    const resultado = simular(caso("CR-M01"));
    expect(resultado.ok).toBe(true);
  });

  it("gera plano idêntico para os mesmos dados, origem e usuário", () => {
    const casoMigracao = caso("CR-M03");
    const primeira = simular(casoMigracao);
    const segunda = simular(casoMigracao);
    expect(primeira.ok, JSON.stringify(primeira)).toBe(true);
    expect(segunda.ok).toBe(true);
    if (!primeira.ok || !segunda.ok) return;
    expect(segunda.plano.sha256Plano).toBe(primeira.plano.sha256Plano);
    expect(segunda.plano.operacoes).toEqual(primeira.plano.operacoes);
  });

  it("converte INTEGER, REAL curto e TEXT decimal sem arredondar", () => {
    expect(paraCentavosOrigem(123n)).toBe(12300n);
    expect(paraCentavosOrigem(19.99)).toBe(1999n);
    expect(paraCentavosOrigem("1234.5")).toBe(123450n);
    expect(paraCentavosOrigem("0.01")).toBe(1n);
    expect(paraCentavosOrigem(-19.99, true)).toBe(-1999n);
    expect(paraCentavosOrigem("-0.01", true)).toBe(-1n);
  });

  it.each([1.005, 1.234, 1e21, -1, "1.005", "1e3", "1234567890123456", null])(
    "recusa a conversão M2 inválida %s",
    (valor) => {
      expect(() => paraCentavosOrigem(valor)).toThrow();
    },
  );

  it("M2 recusa a simulação inteira sem plano de operações", () => {
    const db = criarBanco(caso("CR-M01").entrada);
    db.prepare("UPDATE eventos SET valor = 1.234 WHERE id = 2").run();
    recusa(db, "M2_CONVERSAO_INVALIDA");
  });

  it("M5 recusa estorno que referencia evento de trânsito", () => {
    const db = criarBanco(caso("CR-M02").entrada);
    db.prepare(
      "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, evento_referencia_id, origem) VALUES (4, 1, '2025-02-07', 2025, 2, 'ESTORNO', 30, 3, 'manual')",
    ).run();
    recusa(db, "M5_ESTORNO_LIGADO_A_TRANSFERENCIA");
  });

  it("M5 recusa estorno de evento consumido pelo pareamento M6", () => {
    const db = criarBanco(caso("CR-M02").entrada);
    db.prepare(
      "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, evento_referencia_id, origem) VALUES (4, 1, '2025-02-07', 2025, 2, 'ESTORNO', 30, 2, 'manual')",
    ).run();
    recusa(db, "M5_ESTORNO_LIGADO_A_TRANSFERENCIA");
  });

  it("M6 (v4): trânsito sem par vira migração no trânsito, sem aporte, resgate, ativo ou transferência", () => {
    const resultado = simular(caso("CR-M04"));
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resumo).toMatchObject({ ativos: 1, transitoComoMigracao: 2, transitoComoTransferencia: 0 });
    const tipos = resultado.plano.operacoes.map((operacao) => operacao.tipo);
    expect(tipos.filter((tipo) => tipo === "criar_ativo")).toHaveLength(1);
    expect(tipos).not.toContain("transferir");
    const migracoes = resultado.plano.operacoes.filter((operacao) => operacao.tipo === "lancar_migracao_transito");
    expect(migracoes.map((operacao) => operacao.payload)).toEqual([
      { ativo: "sistema:em-transito", data: "2025-02-10", tipo: "migracao", valorCentavos: "100000" },
      { ativo: "sistema:em-transito", data: "2025-03-15", tipo: "migracao", valorCentavos: "-100000" },
    ]);
    const lancamentos = resultado.plano.operacoes.filter((operacao) => operacao.tipo === "lancar_evento");
    expect(lancamentos.map((operacao) => operacao.payload.tipo)).toEqual(["aporte"]);
    // A migração do mês vem antes do fechamento desse mês.
    const indice = (chave: string) => resultado.plano.operacoes.findIndex((operacao) => operacao.chave === chave);
    expect(indice("transito:2")).toBeLessThan(indice("fechamento:2025-02"));
    expect(indice("fechamento:2025-01")).toBeLessThan(indice("transito:2"));
    expect(indice("transito:3")).toBeLessThan(indice("fechamento:2025-03"));
    // Identidade: Vf − Vi = componentes, com a migração no componente próprio.
    for (const mes of resultado.relatorio.meses) {
      const componentes = ["aportes", "resgates", "rendimento", "marcacao", "cambio", "migracao"] as const;
      const soma = componentes.reduce((total, campo) => total + BigInt(mes[campo]), 0n);
      expect(BigInt(mes.vf) - BigInt(mes.vi), mes.mes).toBe(soma);
      expect(mes.vf, mes.mes).toBe(mes.patrimonioOrigem);
    }
    expect(resultado.plano.versao).toBe(2);
  });

  it("M6 (v4): par em outro mês não pareia; o resgate fica fluxo do seu mês e o trânsito vira migração", () => {
    const entrada = structuredClone(caso("CR-M02").entrada);
    const transito = entrada.eventos.find((evento) => evento.id === 3)!;
    Object.assign(transito, { data_evento: "2025-03-06", mes: 3 });
    entrada.posicoes.push({ ativo_id: 1, ano: 2025, mes: 3, saldo_inicio: 70.0, saldo_fim: 70.0 });
    entrada.consolidados[1].valor_total = 70.0;
    entrada.consolidados.push({ ano: 2025, mes: 3, valor_total: 100.0, status: "fechado", fechado: true });
    const resultado = simular({ ...caso("CR-M02"), entrada });
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (!resultado.ok) return;
    const fev = resultado.relatorio.meses.find((mes) => mes.mes === "2025-02")!;
    const mar = resultado.relatorio.meses.find((mes) => mes.mes === "2025-03")!;
    expect(fev).toMatchObject({ resgates: "-3000", migracao: "0", vf: "7000" });
    expect(mar).toMatchObject({ resgates: "0", migracao: "3000", vf: "10000", retorno: "N/D" });
    expect(resultado.plano.operacoes.some((operacao) => operacao.tipo === "transferir")).toBe(false);
  });

  it("M6 (v4) recusa par ambíguo com a contagem de eventos de trânsito", () => {
    const doisCandidatos = criarBanco(caso("CR-M02").entrada);
    doisCandidatos.prepare(
      "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (4, 1, '2025-02-07', 2025, 2, 'RESGATE', 30, 'manual')",
    ).run();
    recusa(doisCandidatos, "M6_TRANSITO_PAR_AMBIGUO", 1);

    const candidatoCompartilhado = criarBanco(caso("CR-M02").entrada);
    candidatoCompartilhado.prepare(
      "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (4, NULL, '2025-02-08', 2025, 2, 'TRANSFERENCIA_PENDENTE', 30, 'manual')",
    ).run();
    recusa(candidatoCompartilhado, "M6_TRANSITO_PAR_AMBIGUO", 2);
  });

  it("M6 (v4) recusa saldo de trânsito negativo no fim do mês, com a contagem de meses", () => {
    const db = criarBanco(caso("CR-M04").entrada);
    db.prepare("UPDATE eventos SET valor = 1500 WHERE id = 3").run();
    recusa(db, "M6_TRANSITO_SALDO_NEGATIVO", 1);

    const semEntrada = criarBanco(caso("CR-M04").entrada);
    semEntrada.prepare("DELETE FROM eventos WHERE id = 2").run();
    recusa(semEntrada, "M6_TRANSITO_SALDO_NEGATIVO", 1);
  });

  it("M10 (v5): posição implícita zero em meses seguidos, com saldo real 0 no fechamento e M9 no fim", () => {
    const resultado = simular(caso("CR-M08"));
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resumo).toMatchObject({ posicoesImplicitasZero: 2, ativosDesativados: 1, mesesMigrados: 4 });
    const fechamento = (mes: string) => resultado.plano.operacoes.find((operacao) => operacao.chave === `fechamento:${mes}`)!;
    expect((fechamento("2025-03").payload.saldosReais as Record<string, string>)["ativo:2"]).toBe("0");
    expect((fechamento("2025-04").payload.saldosReais as Record<string, string>)["ativo:2"]).toBe("0");
    const desativar = resultado.plano.operacoes.findIndex((operacao) => operacao.tipo === "desativar_ativo");
    expect(desativar).toBeGreaterThan(resultado.plano.operacoes.findIndex((operacao) => operacao.chave === "fechamento:2025-04"));
    for (const mes of resultado.relatorio.meses) {
      const componentes = ["aportes", "resgates", "rendimento", "marcacao", "cambio", "migracao"] as const;
      expect(BigInt(mes.vf) - BigInt(mes.vi), mes.mes).toBe(componentes.reduce((total, campo) => total + BigInt(mes[campo]), 0n));
      expect(mes.vf, mes.mes).toBe(mes.patrimonioOrigem);
    }
  });

  it("M10 (v5): o ativo que continua ativo também recebe a posição implícita e não é desativado", () => {
    const entrada = structuredClone(caso("CR-M08").entrada);
    entrada.ativos[1].ativo = true;
    const resultado = simular({ ...caso("CR-M08"), entrada });
    expect(resultado.ok, JSON.stringify(resultado)).toBe(true);
    if (resultado.ok) {
      expect(resultado.resumo).toMatchObject({ posicoesImplicitasZero: 2, ativosDesativados: 0 });
      expect(resultado.plano.operacoes.some((operacao) => operacao.tipo === "desativar_ativo")).toBe(false);
    }
  });

  it.each([
    ["evento manual no mês", "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (9, 2, '2025-03-05', 2025, 3, 'APORTE', 10, 'manual')"],
    ["evento calculado no mês", "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (9, 2, '2025-03-31', 2025, 3, 'RENDIMENTO', 1, 'calculado')"],
    ["evento de valor zero no mês", "INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (9, 2, '2025-03-05', 2025, 3, 'RENDIMENTO', 0, 'manual')"],
  ])("M10 (v5) mantém a recusa da posição ausente com %s", (_nome, sql) => {
    const db = criarBanco(caso("CR-M08").entrada);
    db.prepare(sql).run();
    recusa(db, "M10_COBERTURA_OU_CONSISTENCIA");
  });

  it("M10 (v5) mantém a recusa da posição ausente depois de saldo diferente de zero", () => {
    const db = criarBanco(caso("CR-M08").entrada);
    db.prepare("DELETE FROM eventos WHERE id = 3").run();
    db.prepare("UPDATE posicoes_mensais SET saldo_fim = 2000 WHERE ativo_id = 2 AND mes = 2").run();
    db.prepare("UPDATE consolidado_mensal SET valor_total = 12000 WHERE mes = 2").run();
    recusa(db, "M10_COBERTURA_OU_CONSISTENCIA", 1);
  });

  it("M6 (v4): a direção vem de observacao, com o valor sempre positivo na origem", () => {
    const db = criarBanco(caso("CR-M05").entrada);
    const valores = db.prepare("SELECT valor, observacao FROM eventos WHERE tipo_evento = 'TRANSFERENCIA_PENDENTE' ORDER BY id").all();
    expect(valores).toEqual([
      { valor: 1000, observacao: "positivo" },
      { valor: 400, observacao: "negativo" },
    ]);
    const resultado = simularBanco(db, { usuarioDestino: USER_ID, sha256Origem: HASH_ORIGEM });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.relatorio.meses.map((mes) => mes.migracao)).toEqual(["0", "100000", "-40000"]);
  });

  it("M7 recusa migração calculada em zero antes de emitir operações", () => {
    const db = criarBanco(caso("CR-M03").entrada);
    db.prepare("UPDATE posicoes_mensais SET saldo_fim = 70 WHERE ano = 2025 AND mes = 2").run();
    db.prepare("UPDATE consolidado_mensal SET valor_total = 100 WHERE ano = 2025 AND mes = 2").run();
    recusa(db, "M7_MIGRACAO_ZERO");
  });

  it.each([
    ["status e flag de fechamento divergentes", (db: DatabaseSync) => db.prepare("UPDATE consolidado_mensal SET status = 'aberto', fechado = 0 WHERE ano = 2025 AND mes = 1").run()],
    ["valor_total incompatível", (db: DatabaseSync) => db.prepare("UPDATE consolidado_mensal SET valor_total = 999 WHERE ano = 2025 AND mes = 1").run()],
    ["posição ausente apesar do evento", (db: DatabaseSync) => db.prepare("DELETE FROM posicoes_mensais WHERE ano = 2025 AND mes = 1").run()],
    ["evento em mês aberto depois do último fechamento", (db: DatabaseSync) => db.prepare("INSERT INTO eventos (id, ativo_id, data_evento, ano, mes, tipo_evento, valor, origem) VALUES (9, 1, '2025-02-01', 2025, 2, 'RENDIMENTO', 1, 'manual')").run()],
  ])("M10 recusa %s", (_nome, mutar) => {
    const db = criarBanco(caso("CR-M01").entrada);
    mutar(db);
    recusa(db, "M10_COBERTURA_OU_CONSISTENCIA");
  });

  it("M10 ignora meses antigos somente com consolidado e informa a contagem", () => {
    const entrada = caso("CR-M01").entrada;
    const db = criarBanco(entrada);
    db.prepare("INSERT INTO consolidado_mensal (ano, mes, valor_total, status, fechado) VALUES (2024, 12, 50, 'fechado', 1)").run();
    const resultado = simularBanco(db, { usuarioDestino: USER_ID, sha256Origem: HASH_ORIGEM });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.resumo.mesesConsolidadosAntigosIgnorados).toBe(1);
  });

  it("recusa nome acima de 100 caracteres e indício de mais de um usuário", () => {
    const longo = criarBanco(caso("CR-M01").entrada);
    longo.prepare("UPDATE ativos SET descricao = ? WHERE id = 1").run("x".repeat(101));
    recusa(longo, "NOME_COM_MAIS_DE_100_CARACTERES");

    const multi = criarBanco(caso("CR-M01").entrada);
    multi.exec("CREATE TABLE users (id TEXT PRIMARY KEY); INSERT INTO users (id) VALUES ('u1'), ('u2')");
    recusa(multi, "INDICIO_DE_MULTIPLOS_USUARIOS");
  });

  it("M9 desativa ativo de saldo zero somente após o último fechamento", () => {
    const entrada = structuredClone(caso("CR-M01").entrada);
    entrada.eventos.push(
      { id: 5, ativo_id: 1, data_evento: "2025-01-25", ano: 2025, mes: 1, tipo_evento: "RESGATE", valor: 118.99, origem: "manual" },
    );
    entrada.posicoes[0].saldo_fim = 0;
    entrada.consolidados[0].valor_total = 0;
    entrada.ativos[0].ativo = false;
    const resultado = simular({ ...caso("CR-M01"), entrada });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      const desativar = resultado.plano.operacoes.findIndex((operacao) => operacao.tipo === "desativar_ativo");
      const fechar = resultado.plano.operacoes.findIndex((operacao) => operacao.tipo === "fechar_mes");
      expect(desativar).toBeGreaterThan(fechar);
    }
  });

  it("abre a origem como read-only e o código do modo simular não importa Supabase", () => {
    const pasta = mkdtempSync(join(tmpdir(), "saldo-futuro-migracao-"));
    try {
      const arquivo = join(pasta, "origem.sqlite");
      const gravador = new DatabaseSync(arquivo);
      gravador.exec(DDL);
      gravador.close();
      const somenteLeitura = new DatabaseSync(arquivo, { readOnly: true });
      const resultado = simularBanco(somenteLeitura, { usuarioDestino: USER_ID, sha256Origem: HASH_ORIGEM });
      expect(resultado.ok).toBe(false);
      expect(() => somenteLeitura.exec("INSERT INTO ativos (id, descricao) VALUES (1, 'não gravar')")).toThrow();
      somenteLeitura.close();
      const cli = readFileSync(join(RAIZ, "scripts/migracao-cli.mjs"), "utf8");
      expect(cli).toMatch(/readOnly:\s*true/);
      expect(cli).not.toMatch(/(?:from|import).*supabase/i);
    } finally {
      rmSync(pasta, { recursive: true, force: true });
    }
  });

  it("executa o CLI, grava relatório e plano só no diretório local e mostra apenas contagens", () => {
    const local = join(RAIZ, "local");
    const localExistia = existsSync(local);
    if (!localExistia) mkdirSync(local);
    const pasta = mkdtempSync(join(local, ".issue-63-cli-"));
    const arquivo = join(pasta, "origem.sqlite");
    const diretorioSaida = join(pasta, "saida");
    let gravador: DatabaseSync | undefined;
    try {
      gravador = new DatabaseSync(arquivo);
      popularBanco(gravador, caso("CR-M01").entrada);
      gravador.close();
      gravador = undefined;

      const resultado = spawnSync(
        process.execPath,
        [
          "--import",
          "./scripts/register-ts-loader.mjs",
          "./scripts/migracao-cli.mjs",
          "simular",
          "--db",
          arquivo,
          "--user-id",
          USER_ID,
          "--out-dir",
          diretorioSaida,
        ],
        { cwd: RAIZ, encoding: "utf8" },
      );
      expect(resultado.status, resultado.stderr).toBe(0);
      const saida = JSON.parse(resultado.stdout) as { estado: string; resumo: Record<string, unknown>; relatorio: string; plano: string };
      expect(saida.estado).toBe("simulada");
      expect(saida.resumo).toMatchObject({ ativos: 1, eventos: 4, mesesMigrados: 1 });
      expect(resultado.stdout).not.toContain("Fundo Renda Variável");
      expect(resultado.stdout).not.toContain("11899");
      expect(saida.relatorio).toContain("local/.issue-63-cli-");
      expect(saida.plano).toContain("local/.issue-63-cli-");
      expect(existsSync(join(RAIZ, saida.relatorio))).toBe(true);
      expect(existsSync(join(RAIZ, saida.plano))).toBe(true);
      expect(JSON.parse(readFileSync(join(RAIZ, saida.relatorio), "utf8")).estado).toBe("simulada");
    } finally {
      gravador?.close();
      rmSync(pasta, { recursive: true, force: true });
      if (!localExistia) rmdirSync(local);
    }
  });
});
