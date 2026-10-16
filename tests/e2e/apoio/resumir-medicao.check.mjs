import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { compactarSerie, estatisticas } from './resumir-medicao.mjs';

test('mediana par e p95 pelo posto ceil(0,95*n), preservando série bruta', () => {
  const serie = Array.from({ length: 20 }, (_, i) => 20 - i);
  assert.deepEqual(estatisticas(serie), { n: 20, mediana: 10.5, p95: 19, min: 1, max: 20 });
  assert.equal(serie[0], 20);
  assert.equal(estatisticas([1, 100, 2]).mediana, 2);
});

test('série ausente, duração negativa ou não finita nunca vira estatística válida', () => {
  for (const serie of [[], [-1], [NaN], [Infinity]]) assert.throws(() => estatisticas(serie));
});

test('série sanitizada compactada preserva exatamente os dados JSON e caracteres Unicode', () => {
  const dados = { resumo: [{ chave: 'Início → Lançamentos', n: 2 }], series: [{ pedidos: [['ativos', 1.25, 2.5, 200]] }] };
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(compactarSerie(dados), 'base64')).toString('utf8')), dados);
});
