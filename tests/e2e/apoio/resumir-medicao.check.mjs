import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estatisticas } from './resumir-medicao.mjs';

test('mediana par e p95 pelo posto ceil(0,95*n), preservando série bruta', () => {
  const serie = Array.from({ length: 20 }, (_, i) => 20 - i);
  assert.deepEqual(estatisticas(serie), { n: 20, mediana: 10.5, p95: 19, min: 1, max: 20 });
  assert.equal(serie[0], 20);
  assert.equal(estatisticas([1, 100, 2]).mediana, 2);
});

test('série ausente, duração negativa ou não finita nunca vira estatística válida', () => {
  for (const serie of [[], [-1], [NaN], [Infinity]]) assert.throws(() => estatisticas(serie));
});
