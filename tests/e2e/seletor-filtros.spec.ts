import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { prepararCenario } from "./apoio/cenarios";
import { clienteDoUsuario, configurado, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from "./apoio/supabase";

// Seletor de ativo com filtros em Novo lançamento e Transferências (ciclo 019, issue #191, BL-022; DESIGN.md
// 6.8 e 6.12). Dois ativos homônimos em instituições diferentes, um sem vínculo, um desativado (que não é
// selecionável) e o trânsito. Usuário, nomes e valores fictícios exclusivos deste arquivo.

const MOVEL = { width: 360, height: 800 };
const DESKTOP = { width: 1280, height: 900 };
const WCAG = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const no = (codigo: string) => `a5000000-0000-4000-8000-000000${codigo}`;
const CAIXA_ESPECIE = "010200";
const CDB = "020201";
const RENDA_VARIAVEL = "030000";
// Parâmetros dos filtros: nenhum pode chegar à ação do servidor do lançamento ou da transferência.
const PARAMETROS_DO_FILTRO = [
  "classe",
  "instituicao",
  "veiculo",
  "indexador",
  "regime",
  "isento_ir",
  "prazo_resgate_tipo",
  "prazo_resgate_dias",
  "prazo_resgate_unidade",
  "prazo_resgate_comparacao",
  "liquidez_imediata",
  "fgc",
  "exposicao_cambial",
];

test.describe("seletor de ativo com filtros (#191)", () => {
  test.skip(!configurado, "Roda só com o Supabase local configurado.");
  test.describe.configure({ mode: "serial" });

  let u: Record<string, UsuarioDeTeste>;
  let cliente: SupabaseClient;
  const ids: Record<string, string> = {};
  const inst: Record<string, string> = {};

  test.beforeAll(async () => {
    u = await criarUsuarios("seletor191", { dono: "user" });
    cliente = await clienteDoUsuario(u.dono);
    Object.assign(
      ids,
      await prepararCenario(cliente, [
        { criarAtivo: "h1", nome: "Fundo Homônimo", tipoAjuste: "rendimento" },
        { criarAtivo: "h2", nome: "Fundo Homônimo", tipoAjuste: "rendimento" },
        { criarAtivo: "solto", nome: "Ativo solto fictício", tipoAjuste: "rendimento" },
        { criarAtivo: "antigo", nome: "Ativo antigo fictício", tipoAjuste: "rendimento" },
        { lancar: "h1", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
        { lancar: "h2", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
        { lancar: "solto", data: "2025-12-01", tipo: "aporte", valor: 1000000 },
      ]),
    );
    for (const nome of ["Um", "Dois", "Três"]) {
      const r = await cliente.rpc("criar_instituicao", { p_nome: `Banco ${nome} fictício` });
      expect(r.error).toBeNull();
      inst[nome] = r.data as string;
    }
    const detalhar = async (ativo: string, taxonomia: string, instituicao: string) => {
      const r = await cliente.rpc("editar_detalhes_ativo_taxonomia", {
        p_ativo: ativo,
        p_instituicao: instituicao,
        p_instituicao_nova: null,
        p_taxonomia: taxonomia,
        p_previdencia: null,
        p_liquidez_imediata: null,
        p_exposicao_cambial: null,
        p_isento_ir: null,
      });
      expect(r.error).toBeNull();
    };
    await detalhar(ids.h1, no(CDB), inst.Um);
    await detalhar(ids.h2, no(RENDA_VARIAVEL), inst.Dois);
    await detalhar(ids.antigo, no(CAIXA_ESPECIE), inst["Três"]);
    expect((await cliente.rpc("desativar_ativo", { p_ativo: ids.antigo })).error).toBeNull();
  });
  test.afterAll(async () => {
    if (u) await removerUsuarios(u);
  });

  const valorOculto = (page: Page, nome: string) => page.locator(`input[type=hidden][name="${nome}"]`).inputValue();
  const naLista = (page: Page) => page.getByRole("listbox").getByRole("option");
  const nomes = (page: Page) =>
    naLista(page).evaluateAll((els) => els.map((el) => document.getElementById(el.getAttribute("aria-labelledby") ?? "")?.textContent ?? el.textContent));
  /** O seletor inteiro (campo, segunda linha e painel de filtros) pelo id do campo. */
  const seletor = (page: Page, id: string) => page.locator(`[data-seletor-ativo="${id}"]`);
  const resumoFiltrar = (page: Page, id: string) => seletor(page, id).locator("summary").filter({ hasText: /^Filtrar (ativos|origem|destino)/ });
  const abrirPainel = async (page: Page, id: string) => {
    const painel = seletor(page, id).locator("details").first();
    if ((await painel.getAttribute("open")) === null) await resumoFiltrar(page, id).click();
  };
  const lista = async (page: Page, id: string, nome: string) => {
    await abrirPainel(page, id);
    const campo = seletor(page, id).getByRole("group", { name: nome, exact: true });
    if ((await campo.locator("details").getAttribute("open")) === null) await campo.locator("summary").click();
    return campo;
  };
  const marcar = async (page: Page, id: string, grupo: string, opcao: string) => {
    const campo = await lista(page, id, grupo);
    await campo.getByRole("checkbox", { name: opcao, exact: true }).check();
  };
  const abrirMaisFiltros = async (page: Page, id: string) => {
    await abrirPainel(page, id);
    const resumo = seletor(page, id).locator("summary", { hasText: /^Mais filtros$/ });
    if ((await resumo.locator("xpath=..").getAttribute("open")) === null) await resumo.click();
  };
  const campo = (page: Page, id: string) => page.locator(`#${id}`);
  const abrirLista = async (page: Page, id: string) => {
    await campo(page, id).click();
    await expect(page.getByRole("listbox")).toBeVisible();
  };
  const escolher = async (page: Page, id: string, nome: string, detalhe: string) => {
    await campo(page, id).fill(nome);
    await naLista(page).filter({ hasText: detalhe }).click();
  };
  const chavesEnviadas = (page: Page) => page.getByRole("main").locator("form").first().evaluate((f) => [...new FormData(f as HTMLFormElement).keys()]);
  const registradas = async (ativo: string) => {
    const r = await cliente.from("eventos").select("tipo, valor, data, transferencia_id").eq("ativo_id", ativo).neq("valor", 1000000);
    expect(r.error).toBeNull();
    return r.data!;
  };

  test("Novo lançamento: opções com nome, instituição e classe, o trânsito fora, e o ativo confirmado continua identificável", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/lancamentos/novo");
    await abrirLista(page, "lancamento-ativo");
    // O desativado e o trânsito não são selecionáveis aqui; os homônimos se distinguem pela segunda linha.
    expect(await nomes(page)).toEqual(["Ativo solto fictício", "Fundo Homônimo", "Fundo Homônimo"]);
    await expect(naLista(page).nth(0)).toContainText("Sem instituição · Sem classe");
    // Nomes iguais mantêm a ordem recebida; cada um é identificado pela própria segunda linha.
    await expect(naLista(page).filter({ hasText: "Banco Dois fictício · Renda variável" })).toHaveCount(1);
    await expect(naLista(page).filter({ hasText: "Banco Um fictício · CDB" })).toHaveCount(1);
    // A busca continua pelo nome: o texto da instituição não encontra nada.
    await campo(page, "lancamento-ativo").fill("Banco Um");
    await expect(page.getByRole("status")).toHaveText("Nenhum ativo encontrado.");
    await escolher(page, "lancamento-ativo", "Homônimo", "Banco Um fictício");
    expect(await valorOculto(page, "ativo")).toBe(ids.h1);
    // Fechada a lista, o campo mostra o nome e, logo abaixo, a segunda linha.
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(campo(page, "lancamento-ativo")).toHaveValue("Fundo Homônimo");
    await expect(seletor(page, "lancamento-ativo").getByText("Banco Um fictício · CDB", { exact: true })).toBeVisible();
    await expect(campo(page, "lancamento-ativo")).toHaveAccessibleDescription("Banco Um fictício · CDB");
  });

  test("filtros do seletor: opções só dos ativos selecionáveis, restringem a lista sem desfazer a seleção, e nenhum campo do filtro é enviado", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/lancamentos/novo");
    // O painel começa recolhido, e "Mais filtros" também.
    await expect(seletor(page, "lancamento-ativo").locator("details").first()).not.toHaveAttribute("open");
    // Sem frase de abertura no painel, e sem divisória acima do primeiro grupo.
    await abrirPainel(page, "lancamento-ativo");
    await expect(seletor(page, "lancamento-ativo").getByText(/Opções marcadas no mesmo campo|Marcar uma classe inclui|continua escolhido/)).toHaveCount(0);
    expect(await seletor(page, "lancamento-ativo").locator("section").first().evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
    await resumoFiltrar(page, "lancamento-ativo").click();
    await expect(resumoFiltrar(page, "lancamento-ativo")).not.toContainText("com filtro");
    const classe = await lista(page, "lancamento-ativo", "Classe");
    // Só o que os ativos selecionáveis usam: a classe e a instituição do desativado não aparecem (R1-1).
    await expect(classe.locator("label")).toHaveText(["Renda fixa", "Renda fixa › Crédito bancário", "Renda fixa › Crédito bancário › CDB", "Renda variável", "Sem classe"]);
    const instituicao = await lista(page, "lancamento-ativo", "Instituição");
    await expect(instituicao.locator("label")).toHaveText(["Banco Dois fictício", "Banco Um fictício", "Sem instituição"]);
    await expect(seletor(page, "lancamento-ativo").locator("summary", { hasText: /^Mais filtros$/ }).locator("xpath=..")).not.toHaveAttribute("open");

    // Escolhe o homônimo do Banco Dois e depois restringe a lista ao Banco Um: a seleção confirmada não muda.
    await escolher(page, "lancamento-ativo", "Homônimo", "Banco Dois fictício");
    expect(await valorOculto(page, "ativo")).toBe(ids.h2);
    await marcar(page, "lancamento-ativo", "Instituição", "Banco Um fictício");
    await expect(resumoFiltrar(page, "lancamento-ativo")).toContainText("1 campo com filtro");
    await expect(campo(page, "lancamento-ativo")).toHaveValue("Fundo Homônimo");
    expect(await valorOculto(page, "ativo")).toBe(ids.h2);
    await expect(seletor(page, "lancamento-ativo").getByText("Banco Dois fictício · Renda variável", { exact: true })).toBeVisible();
    await abrirLista(page, "lancamento-ativo");
    expect(await nomes(page)).toEqual(["Fundo Homônimo"]);
    await expect(naLista(page)).toContainText("Banco Um fictício · CDB");
    await page.keyboard.press("Escape");

    // Classe combina por E com a instituição, e "Sem classe" é exclusivo.
    await marcar(page, "lancamento-ativo", "Classe", "Renda variável");
    await expect(resumoFiltrar(page, "lancamento-ativo")).toContainText("2 campos com filtro");
    await campo(page, "lancamento-ativo").click();
    await expect(page.getByRole("status")).toHaveText("Nenhum ativo encontrado com os filtros atuais.");
    await page.keyboard.press("Escape");

    // Nenhum campo do filtro vai para o servidor: só os campos do próprio lançamento.
    const enviadas = await chavesEnviadas(page);
    for (const parametro of PARAMETROS_DO_FILTRO) expect(enviadas, parametro).not.toContain(parametro);
    expect(enviadas).toContain("ativo");
    expect(enviadas.filter((c) => c === "ativo")).toHaveLength(1);

    // Limpar filtros devolve a lista inteira e o foco ao resumo; a seleção continua.
    await seletor(page, "lancamento-ativo").getByRole("button", { name: "Limpar filtros" }).click();
    await expect(resumoFiltrar(page, "lancamento-ativo")).not.toContainText("com filtro");
    await expect(resumoFiltrar(page, "lancamento-ativo")).toBeFocused();
    expect(await valorOculto(page, "ativo")).toBe(ids.h2);
    await campo(page, "lancamento-ativo").click();
    await expect(naLista(page)).toHaveCount(3);
  });

  test("o lançamento é registrado para o homônimo escolhido, com as mensagens do servidor mantidas", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/lancamentos/novo");
    // Pelo filtro: restringe ao Banco Um e escolhe a única opção.
    await marcar(page, "lancamento-ativo", "Instituição", "Banco Um fictício");
    await abrirLista(page, "lancamento-ativo");
    await naLista(page).first().click();
    expect(await valorOculto(page, "ativo")).toBe(ids.h1);
    await page.getByLabel("Valor").fill("12,34");
    await page.getByRole("button", { name: "Registrar lançamento" }).click();
    await expect(page).toHaveURL(/\/lancamentos\/?(\?.*)?$/);
    await expect.poll(async () => (await registradas(ids.h1)).map((e) => e.valor)).toEqual([1234]);
    expect(await registradas(ids.h2)).toEqual([]);
    // Sem escolher o ativo, a mensagem de sempre.
    await page.goto("/lancamentos/novo");
    await page.getByLabel("Valor").fill("1,00");
    await page.getByRole("button", { name: "Registrar lançamento" }).click();
    await expect(campo(page, "lancamento-ativo")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Escolha um ativo.")).toBeVisible();
  });

  test("Transferências: origem e destino filtram de forma independente, e o trânsito sai só com filtro", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/transferencias");
    // Sem filtro, o trânsito é opção, com segunda linha própria.
    await abrirLista(page, "transferencia-origem");
    expect(await nomes(page)).toEqual(["Ativo solto fictício", "Em trânsito", "Fundo Homônimo", "Fundo Homônimo"]);
    await expect(naLista(page).filter({ hasText: "Em trânsito" })).toContainText("Ativo de sistema");
    await expect(naLista(page).filter({ hasText: "Em trânsito" })).not.toContainText("Sem instituição");
    await page.keyboard.press("Escape");

    await marcar(page, "transferencia-origem", "Instituição", "Banco Um fictício");
    await expect(resumoFiltrar(page, "transferencia-origem")).toContainText("1 campo com filtro");
    await expect(resumoFiltrar(page, "transferencia-destino")).not.toContainText("com filtro");
    await abrirLista(page, "transferencia-origem");
    expect(await nomes(page)).toEqual(["Fundo Homônimo"]);
    await expect(naLista(page)).toContainText("Banco Um fictício · CDB");
    await page.keyboard.press("Escape");
    // O destino não é afetado, e o trânsito continua nele.
    await abrirLista(page, "transferencia-destino");
    expect(await nomes(page)).toEqual(["Ativo solto fictício", "Em trânsito", "Fundo Homônimo", "Fundo Homônimo"]);
    await page.keyboard.press("Escape");
    // Cada painel tem o nome do seu campo, para não haver dois "Filtrar ativos" iguais na tela.
    await expect(resumoFiltrar(page, "transferencia-origem")).toContainText("Filtrar origem");
    await expect(resumoFiltrar(page, "transferencia-destino")).toContainText("Filtrar destino");
    await expect(page.getByText("Filtrar ativos")).toHaveCount(0);
    // Os grupos do filtro de cada seletor ficam em h3, abaixo do h2 da seção.
    await abrirPainel(page, "transferencia-origem");
    await expect(seletor(page, "transferencia-origem").getByRole("heading", { level: 3 }).first()).toHaveText("Classe e instituição");
  });

  test("a transferência é registrada entre os homônimos escolhidos e o formulário limpa os filtros", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/transferencias");
    await marcar(page, "transferencia-origem", "Instituição", "Banco Um fictício");
    await abrirLista(page, "transferencia-origem");
    await naLista(page).first().click();
    expect(await valorOculto(page, "origem")).toBe(ids.h1);
    await marcar(page, "transferencia-destino", "Instituição", "Banco Dois fictício");
    await abrirLista(page, "transferencia-destino");
    await naLista(page).first().click();
    expect(await valorOculto(page, "destino")).toBe(ids.h2);
    const enviadas = await chavesEnviadas(page);
    for (const parametro of PARAMETROS_DO_FILTRO) expect(enviadas, parametro).not.toContain(parametro);
    await page.getByLabel("Valor").fill("5,00");
    await page.getByRole("button", { name: "Transferir" }).click();
    await expect(page.getByText("Transferência registrada.")).toBeVisible();
    await expect.poll(async () => (await registradas(ids.h1)).filter((e) => e.transferencia_id !== null).map((e) => e.valor)).toEqual([-500]);
    expect((await registradas(ids.h2)).filter((e) => e.transferencia_id !== null).map((e) => e.valor)).toEqual([500]);
    // O reset depois do sucesso esvazia origem, destino e os filtros.
    await expect(campo(page, "transferencia-origem")).toHaveValue("");
    expect(await valorOculto(page, "origem")).toBe("");
    await expect(resumoFiltrar(page, "transferencia-origem")).not.toContainText("com filtro");
    await expect(resumoFiltrar(page, "transferencia-destino")).not.toContainText("com filtro");
    await abrirLista(page, "transferencia-origem");
    expect(await nomes(page)).toHaveLength(4);
  });

  test("prazo no filtro do seletor: campos condicionais inativos não causam erro, e Enter não envia o formulário", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/lancamentos/novo");
    await abrirMaisFiltros(page, "lancamento-ativo");
    const prazo = page.locator("#lancamento-ativo-filtro-prazo");
    const dias = page.locator("#lancamento-ativo-filtro-prazo-dias");
    await prazo.selectOption({ label: "Prazo em dias" });
    // Com "Prazo em dias" incompleto, o filtro é inválido: a mensagem de /ativos e nenhuma opção.
    await expect(seletor(page, "lancamento-ativo").getByRole("status")).toHaveText("Não foi possível aplicar os filtros: Com Prazo em dias, escolha a comparação, os dias e a unidade.");
    await page.locator("#lancamento-ativo-filtro-prazo-comparacao").selectOption({ label: "Até" });
    await dias.fill("30");
    await page.locator("#lancamento-ativo-filtro-prazo-unidade").selectOption({ label: "Dias corridos" });
    await expect(seletor(page, "lancamento-ativo").getByRole("status")).toHaveCount(0);
    await expect(resumoFiltrar(page, "lancamento-ativo")).toContainText("1 campo com filtro");
    // Enter no campo de dias não envia o lançamento.
    await dias.press("Enter");
    await expect(page).toHaveURL(/\/lancamentos\/novo$/);
    await expect(page.getByText("Escolha um ativo.")).toHaveCount(0);
    // Trocar a situação deixa os valores antigos nos campos ocultos, que são ignorados em vez de dar erro.
    await prazo.selectOption({ label: "No vencimento" });
    await expect(seletor(page, "lancamento-ativo").getByRole("status")).toHaveCount(0);
    await expect(resumoFiltrar(page, "lancamento-ativo")).toContainText("1 campo com filtro");
    await prazo.selectOption({ value: "" });
    await expect(seletor(page, "lancamento-ativo").getByRole("status")).toHaveCount(0);
    await expect(resumoFiltrar(page, "lancamento-ativo")).not.toContainText("com filtro");
    await abrirLista(page, "lancamento-ativo");
    await expect(naLista(page)).toHaveCount(3);
  });

  for (const tamanho of [MOVEL, DESKTOP]) {
    test(`painéis e listas abertos, sem violações nem rolagem horizontal, com alvos de 44 px em ${tamanho.width} px`, async ({ page }) => {
      await page.setViewportSize(tamanho);
      await entrar(page, u.dono);
      for (const [rota, seletores] of [
        ["/lancamentos/novo", ["lancamento-ativo"]],
        ["/transferencias", ["transferencia-origem", "transferencia-destino"]],
      ] as const) {
        await page.goto(rota);
        for (const id of seletores) {
          await abrirMaisFiltros(page, id);
          for (const grupo of ["Classe", "Instituição"]) {
            const lis = await lista(page, id, grupo);
            const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
            expect(resultado.violations, `${rota} ${id} ${grupo}`).toEqual([]);
            const largura = await page.evaluate(() => ({ cliente: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
            expect(largura.rolagem, `${rota} ${id} ${grupo}`).toBeLessThanOrEqual(largura.cliente);
            for (const alvo of await lis.getByRole("checkbox").all()) {
              expect((await alvo.locator("xpath=..").boundingBox())!.height, `${rota} ${id} ${grupo}`).toBeGreaterThanOrEqual(44);
            }
          }
          for (const resumo of await seletor(page, id).locator("summary").filter({ visible: true }).all()) {
            expect((await resumo.boundingBox())!.height, `${rota} ${id}`).toBeGreaterThanOrEqual(44);
          }
          // Lista de opções aberta, com a segunda linha: alvos de 44 px e sem violações.
          await campo(page, id).click();
          const opcoes: Locator = naLista(page);
          for (const opcao of await opcoes.all()) expect((await opcao.boundingBox())!.height, `${rota} ${id} opção`).toBeGreaterThanOrEqual(44);
          const resultado = await new AxeBuilder({ page }).withTags(WCAG).analyze();
          expect(resultado.violations, `${rota} ${id} lista`).toEqual([]);
          await page.keyboard.press("Escape");
        }
      }
    });
  }

  test("o filtro Ativo de Lançamentos continua como estava, sem segunda linha nem painel", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await entrar(page, u.dono);
    await page.goto("/lancamentos");
    await page.getByLabel("Ativo").click();
    await expect(page.getByRole("listbox").getByRole("option").first()).toHaveText("Todos os ativos");
    await expect(page.getByRole("listbox")).not.toContainText("Sem instituição");
    await expect(page.getByText("Filtrar ativos")).toHaveCount(0);
  });
});
