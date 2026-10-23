-- Benchmarks (issue #29): leitura por qualquer autenticado, escrita só pela função de carga do
-- admin (D10), semente (D9), imutabilidade de código e periodicidade (D8) e cobertura (K4, CR-48).
-- Valores fictícios de 0,04% ao dia; e-mails em example.com.
begin;
create extension if not exists pgtap with schema extensions;
select plan(45);

create function pg_temp.act_as(p_sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
end $$;
create function pg_temp.erro(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlerrm;
end $$;
-- Valores de 0,04 nas datas dadas, no formato que a função de carga recebe.
create function pg_temp.valores(p_datas date[]) returns jsonb language sql as $$
  select coalesce(jsonb_agg(jsonb_build_object('data', d::text, 'valor', '0.04') order by d), '[]'::jsonb)
  from unnest(p_datas) d;
$$;
create function pg_temp.carga(p_bench uuid, p_ini date, p_fim date, p_valores jsonb) returns text language sql as $$
  select pg_temp.erro(format('select public.carregar_benchmark(%L, %L, %L, %L)', p_bench, p_ini, p_fim, p_valores));
$$;
create function pg_temp.cobertura(p_bench uuid) returns text language sql as $$
  select inicio || '/' || fim from public.coberturas_benchmark where benchmark_id = p_bench;
$$;

insert into public.authorized_emails (email, role) values
  ('admin.bench@example.com', 'admin'), ('usuario.bench@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000d0', 'admin.bench@example.com'),
  ('00000000-0000-4000-8000-0000000000d1', 'usuario.bench@example.com');
-- Benchmark fictício só para o teste de cobertura.
insert into public.benchmarks (id, codigo_sgs, nome, periodicidade)
values ('00000000-0000-4000-8000-0000000000e1', 999001, 'Série fictícia de teste', 'diaria');

-- 1. Privilégios e semente
select table_privs_are('public', t, 'authenticated', array['SELECT'], 'authenticated só lê ' || t)
from unnest(array['benchmarks', 'valores_benchmark', 'coberturas_benchmark']) t;
select table_privs_are('public', t, 'anon', array[]::text[], 'anon sem privilégio em ' || t)
from unnest(array['benchmarks', 'valores_benchmark', 'coberturas_benchmark']) t;
select results_eq($$ select codigo_sgs, nome, periodicidade from public.benchmarks where codigo_sgs in (12, 433) order by codigo_sgs $$,
  $$ values (12, 'CDI', 'diaria'), (433, 'IPCA', 'mensal') $$, 'D9: catálogo semeado com CDI (12, diária) e IPCA (433, mensal)');
select results_eq($$ select codigo_sgs, nome, periodicidade from public.benchmarks where codigo_sgs = 189 $$,
  $$ values (189, 'IGP-M', 'mensal') $$, 'ciclo 011 (BL-007): IGP-M (189, mensal) acrescentado ao catálogo');
select is((select codigo_sgs from public.benchmarks where codigo_sgs in (12, 189, 433) order by id desc limit 1), 189,
  'ciclo 011: IGP-M fica por último na ordem de id do catálogo, depois de CDI e IPCA');

-- 2. Usuário comum: lê, não grava, não carrega
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d1');
select is((select count(*) from public.benchmarks where codigo_sgs in (12, 433)), 2::bigint, 'o usuário lê o catálogo');
select throws_ok($$ insert into public.benchmarks (codigo_sgs, nome, periodicidade) values (1, 'x', 'diaria') $$,
  '42501', null, 'o usuário não insere no catálogo');
select throws_ok($$ insert into public.valores_benchmark (benchmark_id, data, valor)
  select id, '2026-01-02', 1 from public.benchmarks where codigo_sgs = 12 $$, '42501', null, 'o usuário não insere valor');
select throws_ok($$ delete from public.coberturas_benchmark $$, '42501', null, 'o usuário não exclui cobertura');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2025-12-31', pg_temp.valores(array['2025-12-01'::date])),
  'recusado_nao_admin', 'o usuário não executa a carga');

-- 3. Admin: também sem escrita direta (D10)
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select throws_ok($$ update public.benchmarks set nome = 'x' $$, '42501', null, 'o admin não altera o catálogo direto');
select throws_ok($$ insert into public.valores_benchmark (benchmark_id, data, valor)
  select id, '2026-01-02', 1 from public.benchmarks where codigo_sgs = 12 $$, '42501', null, 'o admin não insere valor direto');
select throws_ok($$ delete from public.valores_benchmark $$, '42501', null, 'o admin não exclui valor direto');
select throws_ok($$ insert into public.coberturas_benchmark (benchmark_id, inicio, fim)
  select id, '2026-01-01', '2026-01-02' from public.benchmarks where codigo_sgs = 12 $$, '42501', null,
  'o admin não grava cobertura direto');

-- 4. Validação antes de gravar: qualquer item inválido recusa a carga inteira
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30',
  '[{"data": "2026-01-02", "valor": "0.04"}, {"data": "2026-01-05", "valor": 0.04}]'), 'recusado_valores_invalidos',
  'valor que não é texto é recusado');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30',
  '[{"data": "2026-01-02", "valor": "0,04"}]'), 'recusado_valores_invalidos', 'valor fora do formato decimal é recusado');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30',
  pg_temp.valores(array['2026-01-02', '2026-02-02']::date[])), 'recusado_valores_invalidos', 'valor fora da janela é recusado');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30',
  pg_temp.valores(array['2026-01-02', '2026-01-02']::date[])), 'recusado_valores_invalidos', 'data repetida é recusada');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-01-30', '2025-12-01',
  pg_temp.valores(array['2026-01-02'::date])), 'recusado_janela_invalida', 'janela invertida é recusada');
select is(pg_temp.carga((select id from public.benchmarks where codigo_sgs = 433), '2026-01-01', '2026-02-28',
  '[{"data": "2026-01-15", "valor": "0.33"}]'), 'recusado_valores_invalidos', 'série mensal só aceita o dia 1');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30', '[]'),
  'recusado_sem_valores', 'primeira carga sem valores é recusada');
select is((select count(*) from public.valores_benchmark where benchmark_id = '00000000-0000-4000-8000-0000000000e1'), 0::bigint,
  'as recusas não gravaram nenhum valor');
select is(pg_temp.cobertura('00000000-0000-4000-8000-0000000000e1'), null, 'as recusas não gravaram cobertura');

-- 5. Cobertura (CR-48): primeira carga até o último valor; buraco; continuidade; extensão para trás
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-12-01', '2026-01-30',
  pg_temp.valores(array['2025-12-01', '2026-01-30']::date[])), 'ok', 'primeira carga aceita');
select is(pg_temp.cobertura('00000000-0000-4000-8000-0000000000e1'), '2025-12-01/2026-01-30',
  'a cobertura vai do início pedido ao último valor');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-03-01', '2026-03-31',
  pg_temp.valores(array['2026-03-31'::date])), 'recusado_buraco', 'CR-48 s1: carga que deixaria buraco é recusada');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-01-31', '2026-02-28',
  pg_temp.valores(array['2026-02-02', '2026-02-27']::date[])), 'ok', 'CR-48 s2: carga contínua aceita');
select is(pg_temp.cobertura('00000000-0000-4000-8000-0000000000e1'), '2025-12-01/2026-02-27',
  'CR-48 s2: a cobertura vai até o último valor gravado');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-01-31', '2026-02-28',
  pg_temp.valores(array['2026-02-02', '2026-02-27']::date[])), 'ok', 'repetir a carga bem-sucedida é aceito');
select results_eq($$ select count(*), max(data) from public.valores_benchmark where benchmark_id = '00000000-0000-4000-8000-0000000000e1' $$,
  $$ values (4::bigint, '2026-02-27'::date) $$, 'a repetição não muda os valores (idempotente)');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2025-11-01', '2025-11-30',
  pg_temp.valores(array['2025-11-03', '2025-11-28']::date[])), 'ok', 'CR-48 s3: extensão para trás aceita');
select is(pg_temp.cobertura('00000000-0000-4000-8000-0000000000e1'), '2025-11-01/2026-02-27',
  'CR-48 s3: o início recua e o fim continua');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-02-28', '2026-03-31', '[]'),
  'recusado_sem_valores', 'CR-48 s4: carga contínua sem valores é recusada');
select is(pg_temp.carga('00000000-0000-4000-8000-0000000000e1', '2026-01-31', '2026-02-28',
  '[{"data": "2026-02-02", "valor": "0.05"}]'), 'ok', 'a fonte revisa a janela');
select results_eq($$ select data, valor from public.valores_benchmark
  where benchmark_id = '00000000-0000-4000-8000-0000000000e1' and data >= '2026-01-31' order by data $$,
  $$ values ('2026-02-02'::date, 0.05::numeric) $$, 'a revisão substitui todos os valores da janela');
select is(pg_temp.cobertura('00000000-0000-4000-8000-0000000000e1'), '2025-11-01/2026-02-02',
  'a cobertura acompanha o último valor gravado depois da revisão');

-- 6. Precisão (D1) e imutabilidade (D8)
select is(pg_temp.carga((select id from public.benchmarks where codigo_sgs = 433), '2026-01-01', '2026-01-31',
  '[{"data": "2026-01-01", "valor": "0.00012345"}]'), 'ok', 'carga mensal aceita');
reset role;
select is((select valor::text from public.valores_benchmark v join public.benchmarks b on b.id = v.benchmark_id
  where b.codigo_sgs = 433 and v.data = '2026-01-01'), '0.00012345', 'D1: o valor é gravado exatamente como publicado');
select throws_ok($$ update public.benchmarks set periodicidade = 'mensal' where codigo_sgs = 12 $$, 'P0001',
  'recusado_benchmark_imutavel', 'D8: a periodicidade não muda');
select throws_ok($$ update public.benchmarks set codigo_sgs = 11 where codigo_sgs = 12 $$, 'P0001',
  'recusado_benchmark_imutavel', 'D8: o código SGS não muda');

select pg_temp.act_as_anon();
select throws_ok($$ select 1 from public.benchmarks $$, '42501', null, 'anon não lê o catálogo');

select * from finish();
rollback;
