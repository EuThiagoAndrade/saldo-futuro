import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ErroLeitura } from "../../src/lib/leitura";
import { comTrava, NOME_TRAVA } from "../../src/lib/migracao/diario";
import { estadoAbstrato, lerEstadoDestino } from "../../src/lib/migracao/destino";
import { conferir, gravarNoDiretorio, type ResultadoGravacao } from "../../src/lib/migracao/gravar";
import { prepararCenario } from "./apoio/cenarios";
import {
  carteiraComPosicaoImplicita,
  carteiraComTransitoSemPar,
  carteiraCompleta,
  carteiraGrande,
  clienteComFalhas,
  criarOrigem,
  type Falhas,
  segurarTravaDaCarteira,
  simularOrigem,
} from "./apoio/migracao";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Gravação e conferência da migração (issue #64) no Supabase local, com a sessão de usuários
// fictícios e as funções autenticadas da aplicação. Origens SQLite fictícias em diretório
// temporário; nenhum dado real.

const FUNCOES = ["criar_ativo", "lancar_evento", "estornar_evento", "transferir", "fechar_mes", "desativar_ativo"] as const;

test.describe("migração: gravar e conferir", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let pasta: string;
  let origem: string;
  let origemTransito: string;

  test.beforeAll(async () => {
    u = await criarUsuarios("migracao", {
      completa: "user",
      b: "user",
      ...Object.fromEntries(FUNCOES.map((f) => [`pos-${f}`, "user" as const])),
      emexecucao: "user",
      semefeito: "user",
      divergente: "user",
      externo: "user",
      naovazio: "user",
      reexecucao: "user",
      volume: "user",
      cli: "user",
      transito: "user",
      semfuncao: "user",
      implicita: "user",
      "pos-lancar_migracao_transito": "user",
    });
    pasta = mkdtempSync(join(tmpdir(), "saldo-futuro-migracao-64-"));
    origem = criarOrigem(pasta, "completa", carteiraCompleta());
    origemTransito = criarOrigem(pasta, "transito", carteiraComTransitoSemPar());
  });
  test.afterAll(async () => {
    await removerUsuarios(u);
    rmSync(pasta, { recursive: true, force: true });
  });

  function diretorio(nome: string): string {
    return mkdtempSync(join(pasta, `${nome}-`));
  }

  async function gravarComo(usuario: UsuarioDeTeste, dir: string, falhas: Falhas = {}, tempoLimiteMs?: number, arquivo = origem) {
    const cliente = await clienteComFalhas(usuario, falhas);
    const { plano, relatorio } = simularOrigem(arquivo, usuario.id);
    const resultado = await gravarNoDiretorio(dir, cliente, plano, usuario.id, { tempoLimiteMs });
    return { cliente, plano, relatorio, resultado };
  }

  async function contagens(cliente: SupabaseClient) {
    const estado = await lerEstadoDestino(cliente);
    return { ativos: estado.ativos.length, eventos: estado.eventos.length, transferencias: estado.transferencias.length, meses: estado.consolidados.length };
  }

  function linhasDoDiario(dir: string, sha: string) {
    return readFileSync(join(dir, `diario-${sha}.jsonl`), "utf8").trim().split("\n").map((l) => JSON.parse(l));
  }

  test("carteira completa: gravar e depois conferir sem diferença; simular e gravar dão os mesmos consolidados", async () => {
    const dir = diretorio("completa");
    const { cliente, plano, relatorio, resultado } = await gravarComo(u.completa, dir);
    expect(resultado).toMatchObject({ result: "executed", motivo: "concluida", confirmadas: plano.operacoes.length });
    expect(new Set(plano.operacoes.map((o) => o.tipo))).toEqual(new Set(FUNCOES));
    // Janeiro é N/D por começar a carteira (Vi = 0); março, pela migração (P15).
    expect(relatorio.meses.filter((m) => m.retorno === "N/D").map((m) => m.mes)).toEqual(["2025-01", "2025-03"]);
    expect(relatorio.meses.filter((m) => m.migracao !== "0").map((m) => m.mes)).toEqual(["2025-03"]);

    const conferencia = await conferir(cliente, plano, relatorio);
    expect(conferencia).toEqual({ ok: true, meses: 4, diferencas: {} });

    // Propriedade: os consolidados do destino são os da simulação, campo a campo.
    const { data } = await cliente.from("consolidados_mensais").select("mes, vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao").order("mes");
    expect(data!.map((c) => ({ ...c, mes: c.mes.slice(0, 7) }))).toEqual(
      relatorio.meses.map((m) => ({
        mes: m.mes,
        vi: Number(m.vi),
        vf: Number(m.vf),
        aportes: Number(m.aportes),
        resgates: Number(m.resgates),
        rendimento: Number(m.rendimento),
        marcacao: Number(m.marcacao),
        cambio: Number(m.cambio),
        migracao: Number(m.migracao),
      })),
    );
    expect(data!.map((c) => c.vf)).toEqual([171500, 172510, 175010, 180510]);
    expect(data!.find((c) => c.mes.startsWith("2025-03"))!.migracao).toBe(1500);

    // O diário registra intenção e resultado de cada operação, sem valores.
    const diario = linhasDoDiario(dir, plano.sha256Plano);
    expect(diario.filter((l) => l.tipo === "intencao")).toHaveLength(plano.operacoes.length);
    expect(diario.filter((l) => l.tipo === "resultado")).toHaveLength(plano.operacoes.length);
    expect(JSON.stringify(diario)).not.toContain("Fictício");
    expect(JSON.stringify(diario)).not.toContain("valorCentavos");
  });

  test("trânsito sem contrapartida (plano v4): migração no trânsito e pares reais; gravar e conferir sem diferença", async () => {
    const dir = diretorio("transito");
    const { cliente, plano, relatorio, resultado } = await gravarComo(u.transito, dir, {}, undefined, origemTransito);
    expect(resultado).toMatchObject({ result: "executed", motivo: "concluida", confirmadas: plano.operacoes.length });
    expect(plano.versao).toBe(2);
    expect(plano.operacoes.filter((o) => o.tipo === "lancar_migracao_transito")).toHaveLength(2);
    expect(plano.operacoes.filter((o) => o.tipo === "transferir")).toHaveLength(2);
    expect(plano.operacoes.filter((o) => o.tipo === "criar_ativo")).toHaveLength(2);
    expect(await conferir(cliente, plano, relatorio)).toEqual({ ok: true, meses: 5, diferencas: {} });

    const { data } = await cliente.from("consolidados_mensais").select("mes, vf, aportes, resgates, migracao").order("mes");
    expect(data!.map((c) => [c.mes.slice(0, 7), c.vf, c.aportes, c.resgates, c.migracao])).toEqual([
      ["2025-01", 130000, 130000, 0, 0],
      ["2025-02", 140000, 0, 0, 10000],
      ["2025-03", 136000, 0, 0, -4000],
      ["2025-04", 136000, 0, 0, 0],
      ["2025-05", 136000, 0, 0, 0],
    ]);
    // O trânsito fecha cada mês com o saldo acumulado da origem, sem ajuste.
    const transito = (await cliente.from("ativos").select("id").eq("sistema", "transito")).data![0].id;
    const { data: posicoes } = await cliente.from("posicoes_mensais").select("mes, saldo_final, ajuste").eq("ativo_id", transito).order("mes");
    expect(posicoes!.map((p) => [p.mes.slice(0, 7), p.saldo_final, p.ajuste])).toEqual([
      ["2025-02", 10000, 0],
      ["2025-03", 6000, 0],
      ["2025-04", 36000, 0],
      ["2025-05", 6000, 0],
    ]);
    const nd = relatorio.meses.filter((m) => m.retorno === "N/D").map((m) => m.mes);
    expect(nd).toEqual(expect.arrayContaining(["2025-02", "2025-03"]));
    expect(nd).not.toContain("2025-04");
    expect(nd).not.toContain("2025-05");
  });

  test("posição implícita zero (plano v5): gravar e conferir sem diferença, com saldo real 0 no fechamento", async () => {
    const arquivo = criarOrigem(pasta, "implicita", carteiraComPosicaoImplicita());
    const { relatorio: comPosicoes } = simularOrigem(origem, u.implicita.id);
    const dir = diretorio("implicita");
    const { cliente, plano, relatorio, resultado } = await gravarComo(u.implicita, dir, {}, undefined, arquivo);
    expect(relatorio.resumo.posicoesImplicitasZero).toBe(2);
    expect(resultado).toMatchObject({ result: "executed", motivo: "concluida", confirmadas: plano.operacoes.length });
    expect(await conferir(cliente, plano, relatorio)).toEqual({ ok: true, meses: 4, diferencas: {} });
    // Os meses e consolidados são os mesmos da origem com as posições zeradas gravadas.
    expect(relatorio.meses).toEqual(comPosicoes.meses);
    const gama = plano.operacoes.find((o) => o.tipo === "desativar_ativo")!.payload.ativo as string;
    const saldos = (mes: string) => plano.operacoes.find((o) => o.chave === `fechamento:${mes}`)!.payload.saldosReais as Record<string, string>;
    expect([saldos("2025-03")[gama], saldos("2025-04")[gama]]).toEqual(["0", "0"]);
    expect((await contagens(cliente)).meses).toBe(4);
  });

  test("sem a função lancar_migracao_transito no banco, a sonda impede a carga, sem escrita nem diário", async () => {
    const dir = diretorio("semfuncao");
    const { cliente, plano, resultado } = await gravarComo(u.semfuncao, dir, { semFuncao: "lancar_migracao_transito" }, undefined, origemTransito);
    expect(resultado).toMatchObject({ result: "not_executed", motivo: "funcao_ausente", enviadas: 0, confirmadas: 0 });
    expect(await contagens(cliente)).toEqual({ ativos: 0, eventos: 0, transferencias: 0, meses: 0 });
    expect(() => readFileSync(join(dir, `diario-${plano.sha256Plano}.jsonl`))).toThrow();
  });

  test("resposta perdida depois do commit de lancar_migracao_transito: para sem reenviar e a retomada reconhece o efeito uma vez", async () => {
    const usuario = u["pos-lancar_migracao_transito"];
    const dir = diretorio("pos-lancar_migracao_transito");
    const primeira = await gravarComo(usuario, dir, { rpc: "lancar_migracao_transito", modo: "depois", pular: 1 }, undefined, origemTransito);
    expect(primeira.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida" });
    const segunda = await gravarComo(usuario, dir, {}, undefined, origemTransito);
    expect(segunda.resultado).toMatchObject({ result: "executed", motivo: "concluida" });
    const diario = linhasDoDiario(dir, segunda.plano.sha256Plano);
    const desconhecida = diario.find((l) => l.tipo === "desconhecida");
    expect(segunda.plano.operacoes[desconhecida.sequencia - 1].tipo).toBe("lancar_migracao_transito");
    expect(diario.filter((l) => l.tipo === "reconhecida")).toEqual([expect.objectContaining({ sequencia: desconhecida.sequencia })]);
    expect(diario.filter((l) => l.tipo === "intencao" && l.sequencia === desconhecida.sequencia)).toHaveLength(1);
    expect(await conferir(segunda.cliente, segunda.plano, segunda.relatorio)).toEqual({ ok: true, meses: 5, diferencas: {} });
  });

  test("reexecução depois de concluído reconhece o plano inteiro e não grava", async () => {
    const dir = diretorio("reexecucao");
    await gravarComo(u.reexecucao, dir);
    const { cliente, resultado } = await gravarComo(u.reexecucao, dir);
    expect(resultado).toMatchObject({ result: "already_executed_and_reconciled", motivo: "ja_concluida", enviadas: 0 });
    expect(await contagens(cliente)).toMatchObject({ meses: 4 });
  });

  test("leitura pela aplicação: o mês migrado e o acumulado que o inclui ficam N/D", async ({ page }) => {
    await entrar(page, u.completa);
    const cartao = (p: Page, titulo: string) => p.locator("div.rounded-md", { has: p.getByText(titulo, { exact: true }) });
    await expect(cartao(page, "Patrimônio")).toContainText("R$ 1.805,10");
    await expect(cartao(page, "Rentabilidade em abril de 2025")).not.toContainText("N/D");
    await page.goto(`/?${new URLSearchParams({ periodo: "desde_inicio", de: "", ate: "" })}`);
    await expect(cartao(page, "Rentabilidade de janeiro de 2025 a abril de 2025")).toContainText("N/D");
  });

  for (const funcao of FUNCOES) {
    test(`resposta perdida depois do commit de ${funcao}: para sem reenviar e a retomada reconhece o efeito uma vez`, async () => {
      const usuario = u[`pos-${funcao}`];
      const dir = diretorio(`pos-${funcao}`);
      const primeira = await gravarComo(usuario, dir, { rpc: funcao, modo: "depois" });
      expect(primeira.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida" });
      const antes = await contagens(primeira.cliente);

      const segunda = await gravarComo(usuario, dir);
      // A última operação do plano reconhecida na retomada completa a carga sem nova escrita.
      expect(segunda.resultado).toMatchObject(
        funcao === "desativar_ativo" ? { result: "already_executed_and_reconciled", motivo: "ja_concluida" } : { result: "executed", motivo: "concluida" },
      );
      const diario = linhasDoDiario(dir, segunda.plano.sha256Plano);
      const desconhecida = diario.find((l) => l.tipo === "desconhecida");
      expect(diario.filter((l) => l.tipo === "reconhecida")).toEqual([expect.objectContaining({ sequencia: desconhecida.sequencia })]);
      // A operação perdida não foi reenviada: uma só intenção para ela.
      expect(diario.filter((l) => l.tipo === "intencao" && l.sequencia === desconhecida.sequencia)).toHaveLength(1);
      expect(segunda.resultado.enviadas).toBe(segunda.plano.operacoes.length - desconhecida.sequencia);
      expect(antes.ativos).toBeGreaterThan(0);
      expect(await conferir(segunda.cliente, segunda.plano, segunda.relatorio)).toEqual({ ok: true, meses: 4, diferencas: {} });
    });
  }

  test("chamada ainda em execução durante a releitura: para, não reenvia e retoma depois que ela termina", async () => {
    const dir = diretorio("emexecucao");
    const trava = await segurarTravaDaCarteira(u.emexecucao.id);
    let liberada = false;
    try {
      const primeira = await gravarComo(u.emexecucao, dir, {}, 1500);
      expect(primeira.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida", enviadas: 1 });

      // A chamada original continua esperando a trava: a releitura não vê efeito e nada é enviado.
      const segunda = await gravarComo(u.emexecucao, dir, {}, 1500);
      expect(segunda.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida_sem_efeito", enviadas: 0 });
      expect((await contagens(segunda.cliente)).ativos).toBe(0);

      await trava.liberar();
      liberada = true;
      await expect.poll(async () => (await contagens(segunda.cliente)).ativos, { timeout: 15_000 }).toBe(2);

      const terceira = await gravarComo(u.emexecucao, dir);
      expect(terceira.resultado).toMatchObject({ result: "executed", motivo: "concluida" });
      const diario = linhasDoDiario(dir, terceira.plano.sha256Plano);
      expect(diario.filter((l) => l.sequencia === 1).map((l) => l.tipo)).toEqual(["intencao", "desconhecida", "reconhecida"]);
      expect(await conferir(terceira.cliente, terceira.plano, terceira.relatorio)).toMatchObject({ ok: true });
    } finally {
      if (!liberada) await trava.liberar();
    }
  });

  test("operação desconhecida cujo efeito não aparece mantém o migrador parado, sem escrita", async () => {
    const dir = diretorio("semefeito");
    const primeira = await gravarComo(u.semefeito, dir, { rpc: "lancar_evento", modo: "antes" });
    expect(primeira.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida" });
    const antes = await contagens(primeira.cliente);
    for (let i = 0; i < 2; i++) {
      const outra = await gravarComo(u.semefeito, dir);
      expect(outra.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "desconhecida_sem_efeito", enviadas: 0 });
    }
    expect(await contagens(primeira.cliente)).toEqual(antes);
  });

  test("estado divergente (evento a mais no destino) para sem escrita", async () => {
    const dir = diretorio("divergente");
    const primeira = await gravarComo(u.divergente, dir, { rpc: "fechar_mes", modo: "depois" });
    expect(primeira.resultado.motivo).toBe("desconhecida");
    const ativo = (await primeira.cliente.from("ativos").select("id").is("sistema", null).limit(1)).data![0].id;
    expect((await primeira.cliente.rpc("lancar_evento", { p_ativo: ativo, p_data: "2025-02-20", p_tipo: "aporte", p_valor: 1 })).error).toBeNull();
    const antes = await contagens(primeira.cliente);
    const segunda = await gravarComo(u.divergente, dir);
    expect(segunda.resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "estado_divergente", enviadas: 0 });
    expect(segunda.resultado.diferencas).toMatchObject({ eventos: 1 });
    expect(await contagens(primeira.cliente)).toEqual(antes);
  });

  test("escrita de fora durante a carga é detectada antes da escrita seguinte", async () => {
    const dir = diretorio("externo");
    const externo = await clienteDoUsuario(u.externo);
    let enviadasAntes = 0;
    const falhas: Falhas = {
      antesDaChamada: {
        n: 5,
        fn: async () => {
          const ativo = (await externo.from("ativos").select("id").is("sistema", null).limit(1)).data![0].id;
          expect((await externo.rpc("lancar_evento", { p_ativo: ativo, p_data: "2025-01-02", p_tipo: "aporte", p_valor: 1 })).error).toBeNull();
          enviadasAntes = (await contagens(externo)).eventos;
        },
      },
    };
    const { cliente, resultado } = await gravarComo(u.externo, dir, falhas);
    expect(resultado).toMatchObject({ result: "ambiguous_human_intervention_required", motivo: "estado_divergente", enviadas: 5 });
    expect((await contagens(cliente)).eventos).toBe(enviadasAntes + 1);
  });

  test("destino não vazio recusa a primeira execução sem gravar nem criar diário", async () => {
    const cliente = await clienteDoUsuario(u.naovazio);
    await prepararCenario(cliente, [{ criarAtivo: "x", nome: "Ativo fictício já existente", tipoAjuste: "rendimento" }]);
    const dir = diretorio("naovazio");
    const { resultado, plano } = await gravarComo(u.naovazio, dir);
    expect(resultado).toMatchObject({ result: "not_executed", motivo: "destino_nao_vazio", enviadas: 0 });
    expect(() => readFileSync(join(dir, `diario-${plano.sha256Plano}.jsonl`))).toThrow();
    expect(await contagens(cliente)).toEqual({ ativos: 2, eventos: 0, transferencias: 0, meses: 0 });
  });

  test("segunda instância com a trava presente não lê nem grava", async () => {
    const dir = diretorio("trava");
    let segunda: ResultadoGravacao | undefined;
    await comTrava(dir, async () => {
      segunda = (await gravarComo(u.naovazio, dir)).resultado;
    });
    expect(segunda).toMatchObject({ result: "not_executed", motivo: "trava_presente", enviadas: 0 });
    writeFileSync(join(dir, NOME_TRAVA), "trava deixada por um processo interrompido\n");
    expect((await gravarComo(u.naovazio, dir)).resultado).toMatchObject({ result: "not_executed", motivo: "trava_presente" });
  });

  test("isolamento A/B: a gravação de A não toca B, e o plano de B não grava com a sessão de A", async () => {
    const clienteB = await clienteDoUsuario(u.b);
    await prepararCenario(clienteB, [
      { criarAtivo: "x", nome: "Ativo fictício de B", tipoAjuste: "rendimento" },
      { lancar: "x", data: "2025-01-03", tipo: "aporte", valor: 7700 },
      { fechar: "2025-01", saldos: { x: 7700 } },
    ]);
    const antesB = estadoAbstrato(await lerEstadoDestino(clienteB), new Map());

    const estadoA = await lerEstadoDestino(await clienteDoUsuario(u.completa));
    expect(estadoA.ativos.some((a) => a.nome === "Ativo fictício de B")).toBe(false);

    const dir = diretorio("isolamento");
    const clienteA = await clienteComFalhas(u.completa, {});
    const { plano } = simularOrigem(origem, u.b.id);
    const resultado = await gravarNoDiretorio(dir, clienteA, plano, u.completa.id);
    expect(resultado).toMatchObject({ result: "not_executed", motivo: "usuario_divergente", enviadas: 0 });
    expect(estadoAbstrato(await lerEstadoDestino(clienteB), new Map())).toEqual(antesB);
  });

  test("ponto de entrada: simular, gravar e conferir pelo CLI, com a sessão em local/ e saída só de contagens", async () => {
    const local = join(process.cwd(), "local");
    const localExistia = existsSync(local);
    if (!localExistia) mkdirSync(local);
    const dir = mkdtempSync(join(local, ".issue-64-cli-"));
    try {
      const banco = criarOrigem(dir, "origem", carteiraCompleta());
      const cliente = await clienteDoUsuario(u.cli);
      const { data } = await cliente.auth.getSession();
      writeFileSync(join(dir, "sessao.json"), JSON.stringify({ access_token: data.session!.access_token, refresh_token: data.session!.refresh_token }));
      const cli = (...args: string[]) =>
        spawnSync(process.execPath, ["--import", "./scripts/register-ts-loader.mjs", "./scripts/migracao-cli.mjs", ...args], {
          cwd: process.cwd(),
          encoding: "utf8",
          env: { ...process.env, SUPABASE_SECRET_KEY: "" },
        });

      const simulada = cli("simular", "--db", banco, "--user-id", u.cli.id, "--out-dir", join(dir, "saida"));
      expect(simulada.status, simulada.stderr).toBe(0);
      const { plano } = JSON.parse(simulada.stdout) as { plano: string };

      const gravada = cli("gravar", "--db", banco, "--plano", plano, "--sessao", join(dir, "sessao.json"), "--out-dir", join(dir, "saida"));
      expect(gravada.status, gravada.stderr).toBe(0);
      expect(JSON.parse(gravada.stdout)).toMatchObject({ result: "executed", motivo: "concluida" });

      const conferida = cli("conferir", "--db", banco, "--sessao", join(dir, "sessao.json"));
      expect(conferida.status, conferida.stderr).toBe(0);
      expect(JSON.parse(conferida.stdout)).toMatchObject({ ok: true, meses: 4, diferencas: {} });

      for (const saida of [simulada.stdout, gravada.stdout, conferida.stdout]) {
        expect(saida).not.toContain("Fictício");
        expect(saida).not.toContain("180510");
        expect(saida).not.toContain(data.session!.access_token);
      }

      // A chave secreta nunca é aceita no lugar da publicável.
      const comSecreta = spawnSync(
        process.execPath,
        ["--import", "./scripts/register-ts-loader.mjs", "./scripts/migracao-cli.mjs", "conferir", "--db", banco, "--sessao", join(dir, "sessao.json")],
        { cwd: process.cwd(), encoding: "utf8", env: { ...process.env, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_SECRET_KEY } },
      );
      expect(comSecreta.status).toBe(2);
      expect(comSecreta.stderr).toContain("chave publicável");
    } finally {
      rmSync(dir, { recursive: true, force: true });
      if (!localExistia) rmSync(local, { recursive: true, force: true });
    }
  });

  test("carteira com mais de 1.000 eventos: grava, confere tudo e para na falha de página e na mudança entre leituras", async () => {
    test.setTimeout(600_000);
    const arquivo = criarOrigem(pasta, "volume", carteiraGrande());
    const cliente = await clienteComFalhas(u.volume, {});
    const { plano, relatorio } = simularOrigem(arquivo, u.volume.id);
    expect(plano.operacoes.filter((o) => o.tipo === "lancar_evento").length).toBeGreaterThan(1000);
    const resultado = await gravarNoDiretorio(diretorio("volume"), cliente, plano, u.volume.id);
    expect(resultado).toMatchObject({ result: "executed", motivo: "concluida" });
    expect(await conferir(cliente, plano, relatorio)).toEqual({ ok: true, meses: 11, diferencas: {} });

    const comFalhaDePagina = await clienteComFalhas(u.volume, { pagina: { tabela: "eventos", de: 1000 } });
    await expect(conferir(comFalhaDePagina, plano, relatorio)).rejects.toThrow(ErroLeitura);

    const ativo = (await cliente.from("ativos").select("id").is("sistema", null)).data![0].id;
    let inserido = false;
    const mudanca = conferir(cliente, plano, relatorio, {
      leitura: {
        aposPagina: async () => {
          if (inserido) return;
          inserido = true;
          expect((await cliente.rpc("lancar_evento", { p_ativo: ativo, p_data: "2024-12-02", p_tipo: "aporte", p_valor: 1 })).error).toBeNull();
        },
      },
    });
    await expect(mudanca).rejects.toThrow(ErroLeitura);
  });
});
