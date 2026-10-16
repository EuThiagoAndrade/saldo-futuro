// Comando único: node tests/e2e/apoio/medir-navegacao.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { resumir } from './resumir-medicao.mjs';

const executar = (comando, args, opcoes = {}) => {
  const r = spawnSync(comando, args, { encoding: 'utf8', shell: process.platform === 'win32', ...opcoes });
  if (r.status !== 0) throw new Error(`Falha no comando ${comando} (código ${r.status}).`);
  return r.stdout;
};
const status = JSON.parse(executar('npx', ['supabase', 'status', '-o', 'json']));
if (new URL(status.API_URL).hostname !== '127.0.0.1') throw new Error('Somente backend local.');
const pasta = resolve('local/issue-52');
mkdirSync(pasta, { recursive: true });
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: status.SECRET_KEY, NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: 'true',
  MEDIR_NAVEGACAO: '1', MEDICAO_LOG: resolve(pasta, 'consultas.ndjson') };
writeFileSync(env.MEDICAO_LOG, '');
writeFileSync(env.MEDICAO_LOG + '.processos', '');
writeFileSync(resolve(pasta, 'amostras.ndjson'), '');
executar('node', ['--test', 'tests/e2e/apoio/medicao-fetch.check.mjs', 'tests/e2e/apoio/resumir-medicao.check.mjs'], { stdio: 'inherit' });
executar('npm', ['run', 'build'], { env, stdio: 'inherit' });
const ambiente = {
  revisao: executar('git', ['rev-parse', 'HEAD']).trim(),
  diff: executar('git', ['diff', '--stat']).trim(),
  build: readFileSync('.next/BUILD_ID', 'utf8').trim(), node: process.version,
  sistema: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0].model,
  cpus: os.cpus().length, memoriaGiB: os.totalmem() / 2 ** 30,
  supabase: executar('npx', ['supabase', '--version']).trim(), viewport: [1280, 900],
  concorrencia: 1, inicio: new Date().toISOString(), piloto: env.MEDICAO_PILOTO === '1',
  fontes: Object.fromEntries(['tests/e2e/navegacao-desempenho.spec.ts', 'tests/e2e/apoio/medicao-fetch.mjs', 'tests/e2e/apoio/medicao.config.ts', 'tests/e2e/apoio/medir-navegacao.mjs'].map((p) => [p, createHash('sha256').update(readFileSync(p)).digest('hex')])),
  blocos: [],
};
const salvarAmbiente = () => writeFileSync(resolve(pasta, 'ambiente.json'), JSON.stringify(ambiente, null, 2));
salvarAmbiente();
let indice = 0;
let volumes;
for (const rodada of (ambiente.piloto ? [1] : [1, 2, 3])) for (const atraso of (ambiente.piloto ? [50] : [0, 50, 100])) for (const volume of ['vazia', 'cheia']) {
  const bloco = { rodada, atraso, volume, inicio: new Date().toISOString() };
  ambiente.blocos.push(bloco); salvarAmbiente();
  executar('npx', ['playwright', 'test', '--config=tests/e2e/apoio/medicao.config.ts'], { env: { ...env,
    MEDICAO_BLOCO: JSON.stringify([rodada, atraso, volume]), MEDICAO_IDENTIFICADOR_BASE: String(++indice * 100_000) }, stdio: 'inherit' });
  const atual = readFileSync(resolve(pasta, 'volumes.json'), 'utf8');
  if (volumes && volumes !== atual) throw new Error('Volumes divergentes entre blocos.');
  volumes = atual;
  bloco.fim = new Date().toISOString(); salvarAmbiente();
}
if (env.MEDICAO_PILOTO !== '1') resumir();
