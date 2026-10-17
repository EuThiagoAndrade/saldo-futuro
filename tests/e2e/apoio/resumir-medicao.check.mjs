import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gunzipSync } from 'node:zlib';
import { compactarSerie, estatisticas, transportesRepetidos } from './resumir-medicao.mjs';

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

test('rejeição de transporte só passa com repetição 2xx da mesma categoria no mesmo pedido, sempre listada', () => {
  const pedido = (status, extra = []) => [
    { id: 'm1', pedido: 'p1', caminho: '/', tipo: 'supabase', categoria: 'ativos', inicio: 10, ms: 2, status: 200 },
    { id: 'm1', pedido: 'p1', caminho: '/', tipo: 'supabase', categoria: 'eventos', inicio: 20, ms: 1.5, status: 0 },
    ...extra,
    { id: 'm1', pedido: 'p1', caminho: '/', tipo: 'servidor', ms: 1300, status },
  ];
  const repetida = { id: 'm1', pedido: 'p1', caminho: '/', tipo: 'supabase', categoria: 'eventos', inicio: 1022, ms: 4, status: 206 };
  assert.deepEqual(transportesRepetidos(pedido(200, [repetida])), [{ id: 'm1', caminho: '/', categoria: 'eventos', inicio: 20, ms: 1.5, repeticaoInicio: 1022, repeticaoStatus: 206 }]);
  assert.deepEqual(transportesRepetidos(pedido(200, [repetida]).filter((r) => r.status !== 0)), []);
  assert.throws(() => transportesRepetidos(pedido(200)), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(500, [repetida])), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, categoria: 'ativos' }])), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, pedido: 'p2' }])), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, status: 503 }])), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, inicio: 15 }])), /investigar/);
  // Duas rejeições não podem usar a mesma repetição; um erro HTTP do Supabase nunca é aceito.
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, inicio: 21.5, ms: 1, status: 0 }, repetida])), /investigar/);
  assert.throws(() => transportesRepetidos(pedido(200, [{ ...repetida, inicio: 30, status: 401 }, repetida])), /investigar/);
});
