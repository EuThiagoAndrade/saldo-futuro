import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export function compactarSerie(dados) {
  return gzipSync(JSON.stringify(dados)).toString('base64');
}

export function estatisticas(valores) {
  if (!valores.length || valores.some((v) => !Number.isFinite(v) || v < 0)) throw new Error('Série inválida.');
  const ordenada = [...valores].sort((a, b) => a - b);
  const n = ordenada.length;
  return { n, mediana: n % 2 ? ordenada[(n - 1) / 2] : (ordenada[n / 2 - 1] + ordenada[n / 2]) / 2,
    p95: ordenada[Math.ceil(0.95 * n) - 1], min: ordenada[0], max: ordenada.at(-1) };
}

/**
 * Rejeição de transporte (status 0) repetida com sucesso pelo próprio cliente (fetchWithRetry do
 * postgrest-js) é aceita e listada: mesma categoria, mesmo pedido, resposta 2xx posterior e pedido do
 * servidor em 2xx. Qualquer outra resposta fora de 2xx/3xx continua interrompendo a publicação.
 */
export function transportesRepetidos(consultas) {
  const ok = (status) => status >= 200 && status < 400;
  const usadas = new Set();
  const ocorrencias = [];
  for (const r of consultas) {
    if (ok(r.status)) continue;
    const servidor = consultas.find((p) => p.tipo === 'servidor' && p.pedido === r.pedido);
    const repeticao = r.tipo === 'supabase' && r.status === 0 && servidor && ok(servidor.status) && consultas.find((q) => q !== r && !usadas.has(q)
      && q.tipo === 'supabase' && q.pedido === r.pedido && q.categoria === r.categoria && q.inicio >= r.inicio + r.ms && ok(q.status));
    if (!repeticao) throw new Error('Resposta de servidor/Supabase com erro; investigar, sem descartar.');
    usadas.add(repeticao);
    ocorrencias.push({ id: r.id, caminho: r.caminho, categoria: r.categoria, inicio: r.inicio, ms: r.ms, repeticaoInicio: repeticao.inicio, repeticaoStatus: repeticao.status });
  }
  return ocorrencias;
}

export function resumir() {
  const pasta = 'local/issue-52';
  const destino = '_project/drafts/005_logo_mobile_desempenho_navegacao/005_validation';
  const linhas = (arquivo) => readFileSync(`${pasta}/${arquivo}`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const ambiente = JSON.parse(readFileSync(`${pasta}/ambiente.json`, 'utf8'));
  const amostras = linhas('amostras.ndjson');
  const consultas = linhas('consultas.ndjson');
  if (ambiente.piloto || ambiente.blocos.length !== 18 || ambiente.blocos.some((b) => !b.fim) || amostras.some((r) => r.tipo === 'falha') || amostras.filter((r) => r.tipo === 'limpeza' && r.resultado === 'passou').length !== 18) throw new Error('Ensaio incompleto/falho ou piloto.');
  const medidas = amostras.filter((r) => r.tipo === 'amostra');
  if (medidas.length !== 2880) throw new Error(`Esperadas 2880 amostras, observadas ${medidas.length}.`);
  const repetidas = transportesRepetidos(consultas);
  const grupos = new Map();
  for (const r of medidas) {
    const chave = `${r.rodada}|${r.atraso}|${r.volume}|${r.origem} → ${r.destino}|${r.condicao}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(r);
  }
  if (grupos.size !== 144 || [...grupos.values()].some((g) => g.length !== 20)) throw new Error('Matriz incompleta.');
  const porId = new Map();
  for (const r of consultas) { if (!porId.has(r.id)) porId.set(r.id, []); porId.get(r.id).push(r); }
  const arredondar = (n) => Math.round(n * 100) / 100;
  const series = medidas.map((r) => ({ ...r, feedback: arredondar(r.feedback), pronto: arredondar(r.pronto),
    // Sem querystring, cabeçalhos, corpo ou usuário. Mantém ordem temporal e categoria.
    pedidos: (porId.get(r.id) ?? []).filter((p) => p.tipo === 'servidor').map((p) => ({ caminho: p.caminho, prefetch: p.prefetch, ms: arredondar(p.ms), status: p.status,
      consultas: (porId.get(r.id) ?? []).filter((q) => q.tipo === 'supabase' && q.pedido === p.pedido).map((q) => [q.categoria, arredondar(q.inicio), arredondar(q.ms), q.status]) })),
  }));
  if (!consultas.some((r) => r.tipo === 'supabase')) throw new Error('Instrumentação sem consultas.');
  const resumo = [...grupos].map(([chave, g]) => {
    const pedidos = g.flatMap((r) => (porId.get(r.id) ?? []).filter((q) => q.tipo === 'servidor' && q.caminho === r.destino && !q.prefetch));
    return { chave, feedback: estatisticas(g.map((r) => r.feedback)), pronto: estatisticas(g.map((r) => r.pronto)),
      servidor: pedidos.length ? estatisticas(pedidos.map((r) => r.ms)) : null,
      chamadasPorAmostra: estatisticas(g.map((r) => (porId.get(r.id) ?? []).filter((q) => q.tipo === 'supabase').length)),
      prefetch: g.reduce((s, r) => s + (porId.get(r.id) ?? []).filter((q) => q.tipo === 'servidor' && q.prefetch).length, 0) };
  });
  const dados = { ambiente, transportesRepetidos: repetidas, navegador: JSON.parse(readFileSync(`${pasta}/navegador.json`, 'utf8')), volumes: JSON.parse(readFileSync(`${pasta}/volumes.json`, 'utf8')), resumo, series,
    adicionais: amostras.filter((r) => r.tipo !== 'amostra'),
    primeiraRenderizacao: consultas.filter((r) => amostras.some((a) => a.tipo === 'primeira_renderizacao' && a.id === r.id) && r.caminho === '/'),
  };
  const fence = '````';
  const payload = compactarSerie(dados).match(/.{1,120}/g).join('\n');
  const artefato = [
    '# Séries sanitizadas de navegação — ciclo 005',
    '',
    'JSON UTF-8 sem perda, compactado com gzip e codificado em Base64. Durações individuais arredondadas a 0,01 ms; resumos calculados antes do arredondamento. Cada consulta é [categoria, início relativo ao pedido em ms, duração em ms, status].',
    '',
    `Rejeições de transporte (status 0) repetidas com sucesso pelo cliente no mesmo pedido, mantidas nas séries sem descarte: ${repetidas.length}${repetidas.map((o) => `; amostra ${o.id}, ${o.caminho}, ${o.categoria}, rejeição em ${o.inicio.toFixed(1)} ms e repetição ${o.repeticaoStatus} em ${o.repeticaoInicio.toFixed(1)} ms`).join('')}. Lista completa em \`transportesRepetidos\`.`,
    '',
    'Extração para `005_validation_series.json` com Node.js:',
    '',
    '```js',
    "const fs = require('node:fs');",
    "const zlib = require('node:zlib');",
    "const md = fs.readFileSync('005_validation_series.md', 'utf8');",
    "const base64 = md.match(/````base64\\n([\\s\\S]*?)\\n````/)[1].replace(/\\s/g, '');",
    "fs.writeFileSync('005_validation_series.json', zlib.gunzipSync(Buffer.from(base64, 'base64')));",
    '```',
    '',
    `${fence}base64`,
    payload,
    fence,
    '',
  ].join('\n');
  writeFileSync(`${destino}_series.md`, artefato);
  const f = (n) => n.toFixed(1);
  const tabela = ['| Rodada | Atraso ms | Volume | Par | Condição | Feedback med/p95 ms | Pronto med/p95 ms | Servidor med/p95 ms | Chamadas med/p95 por amostra | Prefetch pedidos |',
    '| :-- | --: | :-- | :-- | :-- | --: | --: | --: | --: | --: |',
    ...resumo.map((r) => `| ${r.chave.split('|').join(' | ')} | ${f(r.feedback.mediana)}/${f(r.feedback.p95)} | ${f(r.pronto.mediana)}/${f(r.pronto.p95)} | ${r.servidor ? `${f(r.servidor.mediana)}/${f(r.servidor.p95)}` : 'sem pedido'} | ${r.chamadasPorAmostra.mediana}/${r.chamadasPorAmostra.p95} | ${r.prefetch} |`)];
  writeFileSync(`${pasta}/tabela.md`, tabela.join('\n') + '\n');
  console.log(`2880 amostras, ${consultas.length} registros sanitizados, 144 grupos completos; limpeza confirmada; ${repetidas.length} rejeição(ões) de transporte repetida(s) com sucesso, listada(s) na série.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) resumir();
