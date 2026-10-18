-- Migração no trânsito (ciclo 006, plano v4, issue #73): a exceção à K12 só por
-- lancar_migracao_transito, com as recusas de lancar_evento, o fechamento com a migração no
-- componente `migracao` e o isolamento entre usuários (G2). Só dados fictícios: e-mails em
-- example.com e valores dos exemplos do plano. Datas relativas ao mês corrente em America/Cuiaba.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

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
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
create function pg_temp.m(k int) returns date language sql as $$
  select (date_trunc('month', (now() at time zone 'America/Cuiaba')) - make_interval(months => k))::date;
$$;
create function pg_temp.d(k int, dia int) returns date language sql as $$
  select pg_temp.m(k) + (dia - 1);
$$;
create function pg_temp.hoje() returns date language sql as $$
  select (now() at time zone 'America/Cuiaba')::date;
$$;

insert into public.authorized_emails (email, role) values
  ('usuario.a.transito@example.com', 'user'),
  ('usuario.b.transito@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000d1', 'usuario.a.transito@example.com'),
  ('00000000-0000-4000-8000-0000000000d2', 'usuario.b.transito@example.com');

-- 1. Sonda e recusas antes de existir o trânsito
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d1');
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, 0)', pg_temp.d(4, 5))), 'recusado_sinal',
  'valor zero é uma sonda sem efeito, mesmo sem trânsito');
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, null)', pg_temp.d(4, 5))), 'recusado_sinal',
  'valor nulo é recusado');
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, 100000)', pg_temp.d(4, 5))), 'recusado_ativo_invalido',
  'sem o trânsito (antes do primeiro ativo), a migração é recusada');
select is((select count(*) from public.eventos), 0::bigint, 'as recusas não gravam nada');

-- 2. Exemplo A do plano: entrada sem contrapartida e saída parcial (exemplo B)
select pg_temp.guarda('x', public.criar_ativo('Renda fixa fictícia', 'rendimento'));
select public.lancar_evento(pg_temp.id('x'), pg_temp.d(4, 5), 'aporte', 1000000);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(4),
  jsonb_build_object(pg_temp.id('x'), 1000000))), 'ok', 'A fecha o mês inicial');

select pg_temp.guarda('t1', public.lancar_migracao_transito(pg_temp.d(3, 10), 100000));
select results_eq(format($$ select a.sistema, e.tipo::text, e.valor, e.data from public.eventos e
  join public.ativos a on a.id = e.ativo_id where e.id = %L $$, pg_temp.id('t1')),
  format($$ values ('transito'::text, 'migracao'::text, 100000::bigint, %L::date) $$, pg_temp.d(3, 10)),
  'a migração é gravada no trânsito do próprio usuário, com tipo, valor e data informados');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''migracao'', 1)',
  (select id from public.ativos where sistema = 'transito'), pg_temp.d(3, 11))), 'recusado_ativo_invalido',
  'lancar_evento continua recusando o trânsito (K12)');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 1)',
  (select id from public.ativos where sistema = 'transito'), pg_temp.d(3, 11))), 'recusado_ativo_invalido',
  'nenhum lançamento comum no trânsito');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(3),
  jsonb_build_object(pg_temp.id('x'), 1000000))), 'ok', 'exemplo A: o mês com migração no trânsito fecha');
select results_eq(format($$ select vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao
  from public.consolidados_mensais where mes = %L $$, pg_temp.m(3)),
  $$ values (1000000::bigint, 1100000::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 100000::bigint) $$,
  'exemplo A: Vf − Vi = migração +100.000, sem aporte nem resgate');
select results_eq(format($$ select p.saldo_inicial, p.saldo_final, p.ajuste from public.posicoes_mensais p
  join public.ativos a on a.id = p.ativo_id where a.sistema = 'transito' and p.mes = %L $$, pg_temp.m(3)),
  $$ values (0::bigint, 100000::bigint, 0::bigint) $$,
  'exemplo A: o trânsito fecha com 100.000, saldo calculado e ajuste zero');

select public.lancar_migracao_transito(pg_temp.d(2, 10), -40000);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(2),
  jsonb_build_object(pg_temp.id('x'), 1000000))), 'ok', 'exemplo B: o mês com saída parcial fecha');
select results_eq(format($$ select vi, vf, migracao from public.consolidados_mensais where mes = %L $$, pg_temp.m(2)),
  $$ values (1100000::bigint, 1060000::bigint, -40000::bigint) $$,
  'exemplo B: migração −40.000 no consolidado');
select results_eq(format($$ select p.saldo_final, p.ajuste from public.posicoes_mensais p
  join public.ativos a on a.id = p.ativo_id where a.sistema = 'transito' and p.mes = %L $$, pg_temp.m(2)),
  $$ values (60000::bigint, 0::bigint) $$,
  'exemplo B: o trânsito fica com 60.000');

-- 3. Recusas de data e faixa, como lancar_evento
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, 1)', pg_temp.d(2, 20))), 'recusado_mes_fechado',
  'migração em mês fechado é recusada');
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, 1)', pg_temp.hoje() + 1)), 'recusado_data_futura',
  'migração com data futura é recusada');
select is(pg_temp.erro(format('select public.lancar_migracao_transito(%L, 9007199254740992)', pg_temp.d(1, 5))), 'recusado_faixa',
  'migração fora da faixa é recusada');

-- 4. Isolamento: B só altera o próprio trânsito
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d2');
select public.criar_ativo('Ativo fictício de B', 'rendimento');
select isnt(public.lancar_migracao_transito(pg_temp.d(1, 5), 500), null, 'B lança migração no próprio trânsito');
select is((select count(*) from public.eventos), 1::bigint, 'B vê só o próprio evento');
reset role;
select is((select count(*) from public.eventos e join public.ativos a on a.id = e.ativo_id
  where e.user_id = '00000000-0000-4000-8000-0000000000d1' and a.sistema = 'transito'), 2::bigint,
  'o trânsito de A continua com as duas migrações de A');
select is((select count(*) from public.eventos e join public.ativos a on a.id = e.ativo_id
  where e.user_id = '00000000-0000-4000-8000-0000000000d2' and a.user_id = '00000000-0000-4000-8000-0000000000d2'
    and a.sistema = 'transito'), 1::bigint,
  'a migração de B fica no trânsito de B');

-- 5. Anônimo não executa a função
select pg_temp.act_as_anon();
select throws_ok(format('select public.lancar_migracao_transito(%L, 1)', pg_temp.d(1, 5)), '42501', null,
  'anon não executa lancar_migracao_transito');
reset role;

select * from finish();
rollback;
