import { test, expect, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { mesSeguinte } from '../../src/lib/financeiro/datas';
import { sqlLocal } from './apoio/banco';
import { clienteDoUsuario, criarUsuarios, entrar, removerUsuarios, type UsuarioDeTeste } from './apoio/supabase';

test.skip(process.env.MEDIR_NAVEGACAO !== '1', 'Ensaio optativo, somente pelo comando dedicado.');
test.setTimeout(14_400_000);

const destinos = {
  '/': { titulo: 'Início', pronto: 'main section[aria-label="Gráficos"] > :last-child' },
  '/lancamentos': { titulo: 'Lançamentos', pronto: 'main #lancamentos-do-mes' },
  '/ativos': { titulo: 'Ativos', pronto: 'main #ativos-da-aba > *' },
  '/benchmarks': { titulo: 'Benchmarks', pronto: 'main a[href^="/benchmarks/comparacao"]' },
};
type Rota = keyof typeof destinos;
const pares: [Rota, Rota][] = [['/', '/lancamentos'], ['/lancamentos', '/'], ['/', '/ativos'], ['/ativos', '/']];
let serial = Number(process.env.MEDICAO_IDENTIFICADOR_BASE ?? 0);
const pasta = 'local/issue-52';
const pastaD13Evidencia = 'local/issue-57';
const viewport = { width: 1280, height: 900 };
const benchmark = '00500000-0000-4000-8000-000000000052';
const errosDoNavegador = new WeakMap<Page, string[]>();
const observados = new WeakSet<Page>();

async function novaPagina(contexto: BrowserContext) {
  const page = await contexto.newPage();
  const erros: string[] = []; errosDoNavegador.set(page, erros);
  page.on('pageerror', (erro) => {
    erros.push(erro.name);
    // Diagnóstico apenas local/ignorado; nunca copiado para as séries publicáveis.
    appendFileSync(`${pasta}/erros-browser.ndjson`, JSON.stringify({ nome: erro.name, mensagem: erro.message }) + '\n');
  });
  return page;
}

// Serializável pelo Playwright; preserva só o cronômetro sintético em sessionStorage
// quando o clique troca de documento. Nenhum estado financeiro ou de sessão é salvo.
function observarNavegacao() {
  type Alvo = { titulo: string; seletor: string; vazio: boolean };
  type Estado = Alvo & { inicio: number; origemTempo: number };
  const w = window as typeof window & { sfObservando?: boolean; sfAlvo?: Alvo; medicao?: { inicio: number; feedback?: number; pronto?: number; nativa: boolean } };
  if (w.sfObservando) return;
  w.sfObservando = true;
  const monitorar = (estado: Estado) => {
    const m = { inicio: estado.inicio, nativa: estado.origemTempo !== performance.timeOrigin } as NonNullable<typeof w.medicao>;
    w.medicao = m;
    const frame = () => {
      const decorrido = performance.timeOrigin + performance.now() - estado.inicio;
      const visivel = (e: Element) => e.getClientRects().length > 0;
      const cabecalho = [...document.querySelectorAll('main h1')].some((e) => e.textContent === estado.titulo && visivel(e));
      const carregando = [...document.querySelectorAll('main [role="status"], main [aria-busy="true"]')].some((e) => visivel(e) && /carregando/i.test(e.textContent ?? ''));
      if ((cabecalho || carregando) && m.feedback === undefined) m.feedback = decorrido;
      const marcador = estado.vazio
        ? [...document.querySelectorAll('main h2')].some((e) => e.textContent === 'Patrimônio e rentabilidade aparecem depois do primeiro fechamento' && visivel(e))
        : [...document.querySelectorAll(estado.seletor)].some(visivel);
      if (cabecalho && marcador) { m.pronto = decorrido; sessionStorage.removeItem('sf_medicao_cronometro'); }
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const salvo = sessionStorage.getItem('sf_medicao_cronometro');
  if (salvo) monitorar(JSON.parse(salvo) as Estado);
  document.addEventListener('click', () => {
    if (!w.sfAlvo) return;
    const estado = { ...w.sfAlvo, inicio: performance.timeOrigin + performance.now(), origemTempo: performance.timeOrigin };
    delete w.sfAlvo;
    sessionStorage.setItem('sf_medicao_cronometro', JSON.stringify(estado));
    monitorar(estado);
  }, { capture: true });
}

function limparBenchmark() {
  sqlLocal(`delete from public.benchmarks where id = '${benchmark}';`);
}

async function benchmarkFicticio(usuario: UsuarioDeTeste) {
  limparBenchmark();
  sqlLocal(`insert into public.benchmarks (id, codigo_sgs, nome, periodicidade) values ('${benchmark}', 9000052, 'Índice fictício 005', 'mensal');`);
  const cliente = await clienteDoUsuario(usuario);
  let mes = '2021-10';
  const valores = Array.from({ length: 60 }, () => {
    const data = `${mes}-01`; mes = mesSeguinte(mes); return { data, valor: '0.5' };
  });
  expect((await cliente.rpc('carregar_benchmark', { p_benchmark: benchmark, p_data_inicial: valores[0].data, p_data_final: valores.at(-1)!.data, p_valores: valores })).error).toBeNull();
}

async function identificar(context: BrowserContext, atraso: number) {
  const id = `m${++serial}`;
  await context.addCookies([
    { name: 'sf_medicao', value: id, url: 'http://127.0.0.1:3105' },
    { name: 'sf_atraso', value: String(atraso), url: 'http://127.0.0.1:3105' },
  ]);
  return id;
}

async function pronto(page: Page, rota: Rota, cheio: boolean) {
  await expect(page.getByRole('heading', { level: 1, name: destinos[rota].titulo, exact: true })).toBeVisible();
  if (rota === '/' && !cheio) {
    await expect(page.getByText('Patrimônio e rentabilidade aparecem depois do primeiro fechamento', { exact: true })).toBeVisible();
  } else await expect(page.locator(destinos[rota].pronto).first()).toBeVisible();
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
}

async function medir(page: Page, origem: Rota, destino: Rota, cheio: boolean) {
  await pronto(page, origem, cheio);
  expect(errosDoNavegador.get(page) ?? []).toEqual([]);
  const link = page.getByRole('navigation', { name: 'Menu lateral', exact: true }).getByRole('link', { name: destinos[destino].titulo, exact: true });
  if (!observados.has(page)) {
    await page.addInitScript(observarNavegacao); await page.evaluate(observarNavegacao); observados.add(page);
  }
  await page.evaluate((alvo) => {
    (window as typeof window & { sfAlvo?: typeof alvo; medicao?: unknown }).sfAlvo = alvo;
    delete (window as typeof window & { medicao?: unknown }).medicao;
  }, { titulo: destinos[destino].titulo, seletor: destinos[destino].pronto, vazio: destino === '/' && !cheio });
  await link.click();
  try {
    await page.waitForFunction(() => (window as typeof window & { medicao?: { pronto?: number } }).medicao?.pronto !== undefined, undefined, { timeout: 20_000 });
  } catch (erro) {
    writeFileSync(`${pasta}/falha-marcador.json`, JSON.stringify(await page.evaluate(() => ({ caminho: location.pathname, titulo: document.title, principais: document.querySelectorAll('main').length, titulos: [...document.querySelectorAll('h1,h2')].map((e) => ({ texto: e.textContent, visivel: e.getClientRects().length > 0 })), corpo: document.body.innerText.slice(0, 1500), medicao: (window as typeof window & { medicao?: unknown }).medicao })), null, 2));
    await page.screenshot({ path: `${pasta}/falha-marcador.png` });
    console.log('Diagnóstico do marcador preservado somente em local/issue-52; exceções:', errosDoNavegador.get(page));
    throw erro;
  }
  await pronto(page, destino, cheio);
  expect(errosDoNavegador.get(page) ?? []).toEqual([]);
  return page.evaluate(() => (window as typeof window & { medicao: { inicio: number; feedback: number; pronto: number; nativa: boolean } }).medicao);
}

async function carga(usuario: UsuarioDeTeste) {
  const cliente = await clienteDoUsuario(usuario);
  const ids: string[] = [];
  for (let i = 0; i < 30; i++) {
    const r = await cliente.rpc('criar_ativo', { p_nome: `Ativo fictício ${i + 1}`, p_tipo_ajuste: 'rendimento' });
    expect(r.error).toBeNull(); ids.push(r.data as string);
  }
  let mes = '2021-10';
  const saldos = Object.fromEntries(ids.map((id) => [id, 0]));
  for (let i = 0; i < 60; i++, mes = mesSeguinte(mes)) {
    for (const r of await Promise.all(ids.map((id) => cliente.rpc('lancar_evento', { p_ativo: id, p_data: `${mes}-05`, p_tipo: 'aporte', p_valor: 10000 })))) expect(r.error).toBeNull();
    for (const id of ids) saldos[id] += 10100;
    expect((await cliente.rpc('fechar_mes', { p_mes: `${mes}-01`, p_saldos: saldos })).error).toBeNull();
  }
  return { ids, saldos };
}

async function volumes(usuario: UsuarioDeTeste) {
  const cliente = await clienteDoUsuario(usuario);
  const contagens: Record<string, number> = {};
  for (const tabela of ['ativos', 'eventos', 'posicoes_mensais', 'consolidados_mensais', 'transferencias', 'benchmarks', 'valores_benchmark', 'coberturas_benchmark']) {
    const r = await cliente.from(tabela).select('*', { count: 'exact', head: true });
    expect(r.error).toBeNull(); contagens[tabela] = r.count!;
  }
  return contagens;
}

async function sessao(browser: Browser, usuario: UsuarioDeTeste) {
  const c = await browser.newContext({ viewport });
  try { await entrar(await c.newPage(), usuario); return await c.storageState(); }
  finally { await c.close(); }
}

test('baseline por clique, três rodadas, 20 amostras, dois volumes, primeira visita/revisita e atrasos 0/50/100', async ({ browser }) => {
  expect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname).toBe('127.0.0.1');
  const u: Record<string, UsuarioDeTeste> = {};
  try {
    Object.assign(u, await criarUsuarios('medicao005', { vazia: 'user', cheia: 'user', admin: 'admin' }));
    await benchmarkFicticio(u.admin);
    // Primeira renderização autenticada do servidor separada da baseline.
    const inicial = await browser.newContext({ viewport });
    const inicio = performance.now();
    const primeiroId = await identificar(inicial, 0);
    try { await entrar(await inicial.newPage(), u.vazia); }
    finally { appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'primeira_renderizacao', id: primeiroId, bloco: process.env.MEDICAO_BLOCO, ms: performance.now() - inicio, incluiLogin: true }) + '\n'); await inicial.close(); }
    await carga(u.cheia);
    const quantidades = { vazia: await volumes(u.vazia), cheia: await volumes(u.cheia) };
    expect(quantidades.cheia.eventos).toBeGreaterThan(1000);
    expect(quantidades.cheia.posicoes_mensais).toBeGreaterThan(1000);
    writeFileSync(`${pasta}/volumes.json`, JSON.stringify(quantidades, null, 2));
    const estados = { vazia: await sessao(browser, u.vazia), cheia: await sessao(browser, u.cheia) };
    writeFileSync(`${pasta}/navegador.json`, JSON.stringify({ versao: browser.version() }));
    const piloto = process.env.MEDICAO_PILOTO === '1';
    const [rodada, atraso, volume] = JSON.parse(process.env.MEDICAO_BLOCO!) as [number, number, 'vazia' | 'cheia'];
    expect([1, 2, 3]).toContain(rodada); expect([0, 50, 100]).toContain(atraso); expect(['vazia', 'cheia']).toContain(volume);
    {
      const cheio = volume === 'cheia';
      // O protocolo inteiro pode ultrapassar a validade de uma sessão. Renovar por login
      // fora do cronômetro de cada bloco mantém contextos novos sem reutilizar token expirado.
      estados[volume] = await sessao(browser, u[volume]);
      for (const [origem, destino] of pares) for (const condicao of ['primeira', 'revisita']) {
        const grupo = await browser.newContext({ viewport, storageState: estados[volume] });
        try {
          const pagina = await novaPagina(grupo);
          if (condicao === 'revisita') {
            await identificar(grupo, atraso);
            await pagina.goto(origem);
            for (let i = 0; i < 5; i++) { await medir(pagina, origem, destino, cheio); await medir(pagina, destino, origem, cheio); }
          }
          for (let amostra = 1; amostra <= (piloto ? 1 : 20); amostra++) {
            const contexto = condicao === 'primeira' ? await browser.newContext({ viewport, storageState: estados[volume] }) : grupo;
            try {
              const id = await identificar(contexto, atraso);
              const page = condicao === 'primeira' ? await novaPagina(contexto) : pagina;
              if (condicao === 'primeira') await page.goto(origem);
              await pronto(page, origem, cheio);
              // Janela fixa de estabilização; prefetch continua normal e é contabilizado.
              await page.waitForTimeout(150);
              const tempos = await medir(page, origem, destino, cheio);
              appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'amostra', id, rodada, atraso, volume, origem, destino, condicao, amostra, feedback: tempos.feedback, pronto: tempos.pronto, nativa: tempos.nativa }) + '\n');
              if (condicao === 'revisita') { await identificar(contexto, atraso); await medir(page, destino, origem, cheio); }
            } catch (erro) {
              appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'falha', rodada, atraso, volume, origem, destino, condicao, amostra }) + '\n');
              throw erro;
            } finally { if (condicao === 'primeira') await contexto.close(); }
          }
        } finally { await grupo.close(); }
        console.log(`Rodada ${rodada}: ${atraso} ms, ${volume}, ${origem} → ${destino}, ${condicao}: ${piloto ? 'piloto 1/1' : '20/20'}`);
      }
    }
    // Percurso adicional sem escrita: ciclo completo, filtro/período e histórico.
    if (rodada === 3 && atraso === 100 || piloto) {
      const c = await browser.newContext({ viewport, storageState: estados[volume] });
      try {
        const id = await identificar(c, 0); const p = await novaPagina(c);
        await p.goto('/');
        for (const [o, d] of [['/', '/lancamentos'], ['/lancamentos', '/ativos'], ['/ativos', '/benchmarks'], ['/benchmarks', '/']] as [Rota, Rota][]) {
          const tempos = await medir(p, o, d, volume === 'cheia');
          appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'percurso', id, volume, origem: o, destino: d, feedback: tempos.feedback, pronto: tempos.pronto }) + '\n');
        }
        if (piloto) {
          await p.evaluate(() => document.addEventListener('click', (evento) => {
            const link = (evento.target as Element).closest('a');
            if (link) { evento.preventDefault(); evento.stopImmediatePropagation(); location.assign(link.href); }
          }, { capture: true, once: true }));
          expect((await medir(p, '/', '/ativos', volume === 'cheia')).nativa).toBe(true);
          await p.goto('/');
        }
        if (volume === 'cheia') {
          await p.getByLabel('Período', { exact: true }).selectOption('desde_inicio');
          await p.getByRole('button', { name: 'Ver período', exact: true }).click();
          await expect(p).toHaveURL(/periodo=desde_inicio/);
          await pronto(p, '/', true); await p.goBack(); await pronto(p, '/', true);
        }
        await p.goto('/lancamentos'); await p.getByLabel('Mês', { exact: true }).fill('2026-09');
        await p.getByRole('button', { name: 'Filtrar', exact: true }).click();
        await expect(p).toHaveURL(/mes=2026-09/); await pronto(p, '/lancamentos', volume === 'cheia');
        for (const [rota, titulo] of [['/conta', 'Conta'], ['/transferencias', 'Transferências'], ['/lancamentos/fechamento/2026-10', 'Fechamento']] as const) {
          await p.goto(rota); await expect(p.getByRole('heading', { level: 1 })).toContainText(titulo); await expect(p.locator('main').getByRole('alert')).toHaveCount(0);
        }
        appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'adicional', volume, resultado: 'passou', escrita: false }) + '\n');
      } finally { await c.close(); }
    }
  } catch (erro) {
    appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'falha', fase: 'bloco', bloco: process.env.MEDICAO_BLOCO }) + '\n');
    throw erro;
  } finally {
    // Nomes fixos permitem limpar também preparação parcialmente concluída.
    const restos = { ...u, vazia: u.vazia ?? { email: 'medicao005.vazia@example.com', id: '', papel: 'user' as const }, cheia: u.cheia ?? { email: 'medicao005.cheia@example.com', id: '', papel: 'user' as const }, admin: u.admin ?? { email: 'medicao005.admin@example.com', id: '', papel: 'admin' as const } };
    try { limparBenchmark(); } finally { await removerUsuarios(restos); }
    appendFileSync(`${pasta}/amostras.ndjson`, JSON.stringify({ tipo: 'limpeza', resultado: 'passou' }) + '\n');
  }
});

for (const [alvo, alteracao, prova] of [
  ['posicoes_mensais', 'entre_paginas_de_posicoes', 'd54054'],
  ['transferencias', 'entre_componentes_da_marca', 'd54055'],
] as const) test(`prova D13 no Next real: alteração ${alteracao.replaceAll('_', ' ')} devolve só a versão nova`, async ({ page }) => {
  test.skip(process.env.MEDICAO_D13 !== '1', 'Prova isolada da coerência no servidor Next de produção local.');
  const pastaD13 = process.env.MEDICAO_D13_GATE_DIR;
  expect(pastaD13).toBeTruthy();
  mkdirSync(pastaD13!, { recursive: true });
  const prontoD13 = `${pastaD13}/${prova}.ready`;
  const liberarD13 = `${pastaD13}/${prova}.release`;
  for (const caminho of [prontoD13, liberarD13]) if (existsSync(caminho)) unlinkSync(caminho);

  let usuarios: Record<string, UsuarioDeTeste> = {};
  let navegacao: ReturnType<typeof page.goto> | undefined;
  try {
    expect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname).toBe('127.0.0.1');
    usuarios = await criarUsuarios('d13next', { a: 'user' });
    const cliente = await clienteDoUsuario(usuarios.a);
    const { ids, saldos } = await carga(usuarios.a);
    await entrar(page, usuarios.a);
    await identificar(page.context(), 0);
    await page.context().addCookies([{ name: 'sf_d13', value: prova, url: 'http://127.0.0.1:3105' }, { name: 'sf_d13_alvo', value: alvo, url: 'http://127.0.0.1:3105' }]);

    navegacao = page.goto('/');
    await expect.poll(() => existsSync(prontoD13), { timeout: 120_000 }).toBe(true);

    const mes = '2026-09-01';
    expect((await cliente.rpc('reabrir_mes', { p_mes: mes })).error).toBeNull();
    const saldosNovos = { ...saldos, [ids[0]]: saldos[ids[0]] + 100_000 };
    expect((await cliente.rpc('fechar_mes', { p_mes: mes, p_saldos: saldosNovos })).error).toBeNull();
    writeFileSync(liberarD13, 'release');

    const resposta = await navegacao;
    expect(resposta?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: 'Início' })).toBeVisible();
    await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
    const patrimonio = page.locator('main').getByText('Patrimônio', { exact: true }).first().locator('..');
    const distribuicao = page.getByRole('figure').filter({ hasText: 'Distribuição por ativo em setembro de 2026' });
    await distribuicao.getByText('Ver os números').click();
    const linhaAtivo1 = distribuicao.getByRole('rowheader', { name: 'Ativo fictício 1', exact: true }).locator('..');
    // A marca final vai ao banco, vê o refechamento e a composição inteira é lida de novo.
    await expect(linhaAtivo1).toContainText('R$ 7.060,00');
    await expect(patrimonio).toContainText('R$ 182.800,00');
    mkdirSync(pastaD13Evidencia, { recursive: true });
    appendFileSync(`${pastaD13Evidencia}/prova-d13.ndjson`, JSON.stringify({ tipo: 'prova_d13_next', resultado: 'versao_nova_inteira', alteracao, detalhe_da_posicao_atualizado: true, patrimonio_atualizado: true }) + '\n');
  } finally {
    writeFileSync(liberarD13, 'release');
    await navegacao?.catch(() => null);
    if (Object.keys(usuarios).length) await removerUsuarios(usuarios);
    for (const caminho of [prontoD13, liberarD13]) if (existsSync(caminho)) unlinkSync(caminho);
  }
});
