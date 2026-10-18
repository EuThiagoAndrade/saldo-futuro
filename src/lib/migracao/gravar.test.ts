import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { comTrava, diarioEmArquivo, NOME_TRAVA, TravaPresente } from "./diario";
import { contagensEsperadas, diferencas, type EstadoDestino, estadoAbstrato, estadoEsperado, iguais, TRANSITO } from "./destino";
import { gravar, hashDoPlano } from "./gravar";
import { serializarEstavel, sha256 } from "./quantias";
import { type OperacaoMigracao, type PlanoMigracao, VERSAO_PLANO } from "./tipos";

// Comparação por efeitos completos, diário e trava da gravação (issue #64). Plano e destino
// fictícios; os cenários contra o banco estão em tests/e2e/migracao.spec.ts.

const USUARIO = "00000000-0000-4000-8000-000000000064";

function plano(operacoes: Omit<OperacaoMigracao, "sequencia">[]): PlanoMigracao {
  const base = { versao: VERSAO_PLANO, sha256Origem: "a".repeat(64), usuarioDestino: USUARIO, operacoes: operacoes.map((o, i) => ({ sequencia: i + 1, ...o })) };
  return { ...base, sha256Plano: sha256(serializarEstavel(base)) };
}

const OPERACOES: Omit<OperacaoMigracao, "sequencia">[] = [
  { chave: "ativo:1", tipo: "criar_ativo", payload: { nome: "Fundo Fictício X", tipoAjuste: "rendimento" } },
  { chave: "ativo:2", tipo: "criar_ativo", payload: { nome: "Fundo Fictício Y", tipoAjuste: "marcacao" } },
  { chave: "evento:1", tipo: "lancar_evento", data: "2025-01-05", payload: { ativo: "ativo:1", data: "2025-01-05", tipo: "aporte", valorCentavos: "10000" } },
  { chave: "evento:2", tipo: "lancar_evento", data: "2025-01-06", payload: { ativo: "ativo:2", data: "2025-01-06", tipo: "aporte", valorCentavos: "5000" } },
  { chave: "evento:3", tipo: "estornar_evento", data: "2025-01-07", payload: { eventoReferenciado: "origem:2" } },
  {
    chave: "transferencia:4:5",
    tipo: "transferir",
    data: "2025-01-08",
    payload: { origem: "ativo:1", destino: TRANSITO, data: "2025-01-08", valorCentavos: "3000" },
  },
  { chave: "fechamento:2025-01", tipo: "fechar_mes", mes: "2025-01", payload: { mes: "2025-01", saldosReais: { "ativo:1": "7000", "ativo:2": "0", [TRANSITO]: "3000" } } },
  { chave: "desativar:2", tipo: "desativar_ativo", payload: { ativo: "ativo:2" } },
];
const PLANO = plano(OPERACOES);

/** O destino como o banco o teria depois do plano inteiro, com UUIDs fictícios. */
function destinoCompleto(): EstadoDestino {
  return {
    marca: { meses: [["2025-01-01", "t"]], eventos: 5, transferencias: 1, ativos: 3, ultimaDesativacao: "t" },
    ativos: [
      { id: "u-t", nome: "Em trânsito", tipo_ajuste: null, sistema: "transito", ativo: true },
      { id: "u-1", nome: "Fundo Fictício X", tipo_ajuste: "rendimento", sistema: null, ativo: true },
      { id: "u-2", nome: "Fundo Fictício Y", tipo_ajuste: "marcacao", sistema: null, ativo: false },
    ],
    eventos: [
      { id: "e-1", ativo_id: "u-1", data: "2025-01-05", tipo: "aporte", valor: 10000, estorno_de: null, transferencia_id: null },
      { id: "e-2", ativo_id: "u-2", data: "2025-01-06", tipo: "aporte", valor: 5000, estorno_de: null, transferencia_id: null },
      { id: "e-3", ativo_id: "u-2", data: "2025-01-07", tipo: "estorno", valor: -5000, estorno_de: "e-2", transferencia_id: null },
      { id: "e-4", ativo_id: "u-1", data: "2025-01-08", tipo: "transferencia", valor: -3000, estorno_de: null, transferencia_id: "t-1" },
      { id: "e-5", ativo_id: "u-t", data: "2025-01-08", tipo: "transferencia", valor: 3000, estorno_de: null, transferencia_id: "t-1" },
    ],
    transferencias: [{ id: "t-1", data: "2025-01-08" }],
    consolidados: [{ mes: "2025-01-01", vi: 0, vf: 10000, aportes: 15000, resgates: 0, rendimento: 0, marcacao: 0, cambio: 0, migracao: 0 }],
    posicoes: [
      { mes: "2025-01-01", ativo_id: "u-1", saldo_inicial: 0, saldo_final: 7000, ajuste: 0 },
      { mes: "2025-01-01", ativo_id: "u-2", saldo_inicial: 0, saldo_final: 0, ajuste: 0 },
      { mes: "2025-01-01", ativo_id: "u-t", saldo_inicial: 0, saldo_final: 3000, ajuste: 0 },
    ],
  };
}

const MAPA = new Map([
  ["u-1", "ativo:1"],
  ["u-2", "ativo:2"],
]);

const pastas: string[] = [];
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true });
});
function pasta(): string {
  const p = mkdtempSync(join(tmpdir(), "saldo-futuro-gravar-"));
  pastas.push(p);
  return p;
}

describe("comparação por efeitos completos", () => {
  it("o destino depois do plano inteiro é igual ao estado esperado do plano", () => {
    expect(iguais(estadoAbstrato(destinoCompleto(), MAPA), estadoEsperado(PLANO, PLANO.operacoes.length))).toBe(true);
  });

  it("distingue o antes e o depois de desativar_ativo e do fechamento", () => {
    const destino = estadoAbstrato(destinoCompleto(), MAPA);
    expect(diferencas(destino, estadoEsperado(PLANO, 7))).toEqual({ ativos: 2 });
    expect(diferencas(destino, estadoEsperado(PLANO, 6))).toEqual({ ativos: 2, meses: 1, posicoes: 3 });
  });

  it("o destino vazio, com ou sem o trânsito, é o prefixo zero", () => {
    const vazio: EstadoDestino = { ...destinoCompleto(), ativos: [], eventos: [], transferencias: [], consolidados: [], posicoes: [] };
    expect(iguais(estadoAbstrato(vazio, new Map()), estadoEsperado(PLANO, 0))).toBe(true);
    vazio.ativos = [destinoCompleto().ativos[0]];
    expect(iguais(estadoAbstrato(vazio, new Map()), estadoEsperado(PLANO, 0))).toBe(true);
    expect(iguais(estadoAbstrato(vazio, new Map()), estadoEsperado(PLANO, 1))).toBe(false);
  });

  it("um evento a mais, um ativo fora do mapa ou uma perna solta são diferenças", () => {
    const comEvento = destinoCompleto();
    comEvento.eventos.push({ ...comEvento.eventos[0], id: "e-9" });
    expect(diferencas(estadoAbstrato(comEvento, MAPA), estadoEsperado(PLANO, 8))).toEqual({ eventos: 1 });

    expect(diferencas(estadoAbstrato(destinoCompleto(), new Map([["u-1", "ativo:1"]])), estadoEsperado(PLANO, 8))).toMatchObject({ ativos: 2 });

    const pernaSolta = destinoCompleto();
    pernaSolta.eventos = pernaSolta.eventos.filter((e) => e.id !== "e-5");
    expect(diferencas(estadoAbstrato(pernaSolta, MAPA), estadoEsperado(PLANO, 8))).toEqual({ transferencias: 2 });
  });

  it("o estorno é comparado pelo evento que ele estorna, não só pelo valor", () => {
    const outro = destinoCompleto();
    outro.eventos[2] = { ...outro.eventos[2], estorno_de: "e-1" };
    expect(diferencas(estadoAbstrato(outro, MAPA), estadoEsperado(PLANO, 8))).toEqual({ eventos: 2 });
  });

  it("a migração no trânsito (plano v4) é comparada como evento do trânsito, com tipo e valor", () => {
    const comMigracao = plano([
      ...OPERACOES.slice(0, 6),
      {
        chave: "transito:9",
        tipo: "lancar_migracao_transito",
        data: "2025-01-20",
        payload: { ativo: TRANSITO, data: "2025-01-20", tipo: "migracao", valorCentavos: "-1000" },
      },
    ]);
    const destino = destinoCompleto();
    destino.consolidados = [];
    destino.posicoes = [];
    destino.ativos[2] = { ...destino.ativos[2], ativo: true };
    const evento = { id: "e-9", ativo_id: "u-t", data: "2025-01-20", tipo: "migracao" as const, valor: -1000, estorno_de: null, transferencia_id: null };
    expect(diferencas(estadoAbstrato(destino, MAPA), estadoEsperado(comMigracao, 7))).toEqual({ eventos: 1 });
    destino.eventos.push(evento);
    expect(iguais(estadoAbstrato(destino, MAPA), estadoEsperado(comMigracao, 7))).toBe(true);
    // No ativo comum, o mesmo evento é outra coisa.
    destino.eventos[destino.eventos.length - 1] = { ...evento, ativo_id: "u-1" };
    expect(diferencas(estadoAbstrato(destino, MAPA), estadoEsperado(comMigracao, 7))).toEqual({ eventos: 2 });
    expect(contagensEsperadas(estadoEsperado(comMigracao, 7))).toMatchObject({ eventos: 6 });
  });

  it("contagens esperadas da marca contam as duas pernas e o trânsito", () => {
    expect(contagensEsperadas(estadoEsperado(PLANO, 8))).toEqual({ ativos: 3, eventos: 5, transferencias: 1, meses: ["2025-01"] });
  });
});

describe("diário e trava", () => {
  it("o diário só acrescenta linhas e recusa a última linha incompleta", async () => {
    const arquivo = join(pasta(), "diario.jsonl");
    const diario = diarioEmArquivo(arquivo);
    expect(await diario.ler()).toEqual([]);
    await diario.acrescentar({ tipo: "intencao", sequencia: 1, chave: "ativo:1" });
    await diario.acrescentar({ tipo: "resultado", sequencia: 1, chave: "ativo:1", id: "u-1" });
    expect((await diario.ler()).map((e) => e.tipo)).toEqual(["intencao", "resultado"]);
    writeFileSync(arquivo, `${readFileSync(arquivo, "utf8")}{"tipo":"inten`);
    await expect(diario.ler()).rejects.toThrow("incompleta");
  });

  it("a trava é exclusiva e só sai com quem a criou", async () => {
    const dir = pasta();
    await comTrava(dir, async () => {
      expect(existsSync(join(dir, NOME_TRAVA))).toBe(true);
      await expect(comTrava(dir, async () => "nunca")).rejects.toBeInstanceOf(TravaPresente);
    });
    expect(existsSync(join(dir, NOME_TRAVA))).toBe(false);
  });
});

describe("pré-condições da gravação", () => {
  const semCliente = new Proxy({}, { get: () => { throw new Error("o destino não deveria ser acessado"); } }) as never;
  const diarioVazio = { ler: async () => [], acrescentar: async () => { throw new Error("nada deveria ser gravado"); } };

  it("recusa plano alterado e usuário diferente sem tocar no destino", async () => {
    const alterado = structuredClone(PLANO);
    (alterado.operacoes[2].payload as Record<string, unknown>).valorCentavos = "10001";
    expect(hashDoPlano(alterado)).not.toBe(PLANO.sha256Plano);
    expect(await gravar(semCliente, alterado, USUARIO, diarioVazio)).toMatchObject({ result: "not_executed", motivo: "plano_invalido" });
    expect(await gravar(semCliente, PLANO, "00000000-0000-4000-8000-000000000065", diarioVazio)).toMatchObject({
      result: "not_executed",
      motivo: "usuario_divergente",
    });
  });

  it("recusa plano de versão anterior, mesmo com hash íntegro, antes de qualquer acesso (R4-2)", async () => {
    const antigo = { ...PLANO, versao: 1 } as unknown as PlanoMigracao;
    antigo.sha256Plano = hashDoPlano(antigo);
    expect(await gravar(semCliente, antigo, USUARIO, diarioVazio)).toMatchObject({ result: "not_executed", motivo: "plano_invalido", enviadas: 0 });
  });

  it("recusa diário de outro plano e diário fora de sequência", async () => {
    const outro = { ler: async () => [{ tipo: "cabecalho" as const, versao: 1 as const, sha256Origem: "a".repeat(64), sha256Plano: "b".repeat(64), usuarioDestino: USUARIO }], acrescentar: diarioVazio.acrescentar };
    expect(await gravar(semCliente, PLANO, USUARIO, outro)).toMatchObject({ motivo: "diario_divergente" });
    const foraDeOrdem = {
      ler: async () => [
        { tipo: "cabecalho" as const, versao: 1 as const, sha256Origem: PLANO.sha256Origem, sha256Plano: PLANO.sha256Plano, usuarioDestino: USUARIO },
        { tipo: "resultado" as const, sequencia: 2, chave: "ativo:2", id: "u-2" },
      ],
      acrescentar: diarioVazio.acrescentar,
    };
    expect(await gravar(semCliente, PLANO, USUARIO, foraDeOrdem)).toMatchObject({ motivo: "diario_divergente" });
  });
});
