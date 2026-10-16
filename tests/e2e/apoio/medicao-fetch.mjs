// Preload exclusivo do ensaio optativo. Nunca importado pelo produto.
import { AsyncLocalStorage } from 'node:async_hooks';
import { Server } from 'node:http';
import { appendFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { cloneResponse } from 'next/dist/server/lib/clone-response.js';

if (process.env.MEDIR_NAVEGACAO === '1') {
  const backend = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(backend.hostname)) throw new Error('Ensaio exige Supabase local.');
  const contexto = new AsyncLocalStorage();
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
    const inicio = performance.now();
    const caminho = new URL(req.url, 'http://localhost').pathname;
    const prefetch = req.headers['next-router-prefetch'] === '1' || req.headers.purpose === 'prefetch';
    const pedido = { id, pedido: `${id}-${inicio}`, caminho, prefetch };
    res.once('finish', () => registrar({ ...pedido, tipo: 'servidor', ms: performance.now() - inicio, status: res.statusCode }));
    return contexto.run({ ...pedido, atraso, inicio }, () => emitir.call(this, evento, ...args));
  };
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
      // O próprio Next evita Response.clone() por um problema do Undici. Reutilizar
      // seu helper fixado preserva status/cabeçalhos/URL/corpo, sem uma nova dependência.
      const [resposta, copia] = cloneResponse(await original(input, init));
      await copia.arrayBuffer();
      status = resposta.status;
      return resposta;
    } finally {
      registrar({ id: ctx.id, pedido: ctx.pedido, caminho: ctx.caminho, prefetch: ctx.prefetch, tipo: 'supabase', categoria, inicio: inicio - ctx.inicio, ms: performance.now() - inicio, status, atraso: ctx.atraso });
    }
  };
}
