import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const preload = new URL('./medicao-fetch.mjs', import.meta.url).href;
test('preload inativo por padrão e recusa backend remoto quando ativado', () => {
  execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(preload)});`], { env: { ...process.env, MEDIR_NAVEGACAO: '0' } });
  assert.throws(() => execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(preload)});`], {
    env: { ...process.env, MEDIR_NAVEGACAO: '1', NEXT_PUBLIC_SUPABASE_URL: 'https://example.com' }, stdio: 'pipe',
  }));
});

test('correlaciona servidor/consulta, aplica atraso e não registra query, cookie ou corpo', () => {
  const pasta = mkdtempSync(join(tmpdir(), 'sf-medicao-'));
  const log = join(pasta, 'consultas.ndjson');
  try {
    execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { createServer } from 'node:http';
      const backend = createServer((req,res) => { res.writeHead(206, { 'x-prova': 'ficticio' }); res.end('payload-ficticio-nao-registrar'); });
      await new Promise(r => backend.listen(0, '127.0.0.1', r));
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:' + backend.address().port;
      await import(${JSON.stringify(preload)});
      const app = createServer(async (req,res) => {
        const r = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/ativos?segredo=falso');
        if (r.status !== 206 || r.headers.get('x-prova') !== 'ficticio' || !r.url.endsWith('/rest/v1/ativos?segredo=falso')) throw new Error('Metadados mudaram.');
        res.end(await r.text());
      });
      await new Promise(r => app.listen(0, '127.0.0.1', r));
      const resposta = await fetch('http://127.0.0.1:' + app.address().port + '/ativos', { headers: { cookie: 'sf_medicao=m42; sf_atraso=50; sessao=nao-registrar' } });
      if (await resposta.text() !== 'payload-ficticio-nao-registrar') throw new Error('Resposta mudou.');
      await new Promise(r => app.close(r)); await new Promise(r => backend.close(r));
    `], { env: { ...process.env, MEDIR_NAVEGACAO: '1', MEDICAO_LOG: log }, stdio: 'pipe' });
    const texto = readFileSync(log, 'utf8');
    assert.doesNotMatch(texto, /segredo|falso|payload|nao-registrar/);
    const registros = texto.trim().split('\n').map(JSON.parse);
    const consulta = registros.find((r) => r.tipo === 'supabase');
    const servidor = registros.find((r) => r.tipo === 'servidor');
    assert.equal(consulta.id, 'm42'); assert.equal(consulta.categoria, 'ativos');
    assert.equal(consulta.pedido, servidor.pedido); assert.equal(consulta.status, 206);
    assert.ok(consulta.ms >= 45); assert.ok(servidor.ms >= consulta.ms);
  } finally { rmSync(pasta, { recursive: true }); }
});
