// Preload exclusivo do ensaio optativo. Nunca importado pelo produto.
import { AsyncLocalStorage } from 'node:async_hooks';
import { Server } from 'node:http';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { cloneResponse } from 'next/dist/server/lib/clone-response.js';

if (process.env.MEDIR_NAVEGACAO === '1') {
  const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(backend.hostname)) throw new Error('Ensaio exige Supabase local.');
  const contexto = new AsyncLocalStorage();
  const travasD13 = new Set();
  const registrar = (registro) => appendFileSync(process.env.MEDICAO_LOG, JSON.stringify(registro) + '\n');
  const processo = (tipo, detalhe = {}) => appendFileSync(process.env.MEDICAO_LOG + '.processos', JSON.stringify({ tipo, node: process.version, pid: process.pid, ppid: process.ppid, instante: new Date().toISOString(), uptime: process.uptime(), ...detalhe }) + '\n');
  processo('inicio');
  process.on('exit', (codigo) => processo('fim', { codigo }));
  process.on('uncaughtExceptionMonitor', (erro) => processo('excecao', { nome: erro.name }));
  const emitir = Server.prototype.emit;
  Server.prototype.emit = function (evento, ...args) {
    if (evento !== 'request') return emitir.call(this, evento, ...args);
    const [req, res] = args;
    const cookie = req.headers.cookie ?? '';
    const id = /(?:^|;\s*)sf_medicao=(m[0-9]+)/.exec(cookie)?.[1];
    if (!id) return emitir.call(this, evento, ...args);
    const atraso = Number(/(?:^|;\s*)sf_atraso=(0|50|100)(?:;|$)/.exec(cookie)?.[1] ?? 0);
    const provaD13 = /(?:^|;\s*)sf_d13=(d[0-9]+)(?:;|$)/.exec(cookie)?.[1];
    // Ponto da pausa: depois da primeira página de posições (entre páginas dos insumos) ou antes da
    // primeira contagem de transferências sair (entre componentes da marca lidos juntos).
    const alvoD13 = /(?:^|;\s*)sf_d13_alvo=(posicoes_mensais|transferencias)(?:;|$)/.exec(cookie)?.[1] ?? 'posicoes_mensais';
    const inicio = performance.now();
    const caminho = new URL(req.url, 'http://localhost').pathname;
    const prefetch = req.headers['next-router-prefetch'] === '1' || req.headers.purpose === 'prefetch';
    const pedido = { id, pedido: `${id}-${inicio}`, caminho, prefetch };
    res.once('finish', () => registrar({ ...pedido, tipo: 'servidor', ms: performance.now() - inicio, status: res.statusCode }));
    return contexto.run({ ...pedido, atraso, provaD13, alvoD13, inicio }, () => emitir.call(this, evento, ...args));
  };
  const aguardarMutacaoD13 = async (prova) => {
    const pastaD13 = process.env.MEDICAO_D13_GATE_DIR;
    if (!pastaD13) throw new Error('A prova D13 exige MEDICAO_D13_GATE_DIR local.');
    travasD13.add(prova);
    mkdirSync(pastaD13, { recursive: true });
    const pronto = `${pastaD13}/${prova}.ready`;
    const liberar = `${pastaD13}/${prova}.release`;
    writeFileSync(pronto, 'ready');
    const limite = Date.now() + 120_000;
    while (!existsSync(liberar)) {
      if (Date.now() >= limite) throw new Error('Tempo excedido aguardando a mutação fictícia da prova D13.');
      await esperar(25);
    }
  };
  const pausarD13 = (ctx, categoria) => ctx.provaD13 && categoria === ctx.alvoD13 && !travasD13.has(ctx.provaD13);
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const ctx = contexto.getStore();
    if (url.hostname === 'api.bcb.gov.br') throw new Error('SGS real proibido no ensaio.');
    if (!ctx || url.origin !== backend.origin) return original(input, init);
    const categoria = url.pathname.startsWith('/rest/v1/') ? url.pathname.slice('/rest/v1/'.length) : url.pathname.startsWith('/auth/v1/') ? 'sessao' : 'outro';
    // Allowlist: nenhum filtro, identificador de usuário ou payload é registrado.
    if (!/^(sessao|outro|profiles|ativos|eventos|transferencias|consolidados_mensais|posicoes_mensais|benchmarks|valores_benchmark|coberturas_benchmark)$/.test(categoria)) throw new Error('Categoria inesperada.');
    const inicio = performance.now();
    let status = 0;
    try {
      if (ctx.atraso) await esperar(ctx.atraso);
      if (categoria === 'transferencias' && pausarD13(ctx, categoria)) await aguardarMutacaoD13(ctx.provaD13);
      // O próprio Next evita Response.clone() por um problema do Undici. Reutilizar
      // seu helper fixado preserva status/cabeçalhos/URL/corpo, sem uma nova dependência.
      const [resposta, copia] = cloneResponse(await original(input, init));
      await copia.arrayBuffer();
      status = resposta.status;
      if (categoria === 'posicoes_mensais' && pausarD13(ctx, categoria)) await aguardarMutacaoD13(ctx.provaD13);
      return resposta;
    } finally {
      registrar({ id: ctx.id, pedido: ctx.pedido, caminho: ctx.caminho, prefetch: ctx.prefetch, tipo: 'supabase', categoria, inicio: inicio - ctx.inicio, ms: performance.now() - inicio, status, atraso: ctx.atraso });
    }
  };
}
