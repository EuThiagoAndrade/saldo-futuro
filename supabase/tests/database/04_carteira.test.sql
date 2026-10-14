-- Carteira (issue #27): isolamento (G2), escrita só pelas funções (D13), imutabilidade (H4) e as
-- regras de lançamento e fechamento da KB-004, com os casos de referência CR-01 a CR-18.
-- Só dados fictícios: e-mails em example.com e valores dos casos. As datas são relativas ao mês
-- corrente em America/Cuiaba (m(k) = k meses atrás), para não depender do dia da execução.
begin;
create extension if not exists pgtap with schema extensions;
select plan(112);

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
-- Executa um comando e devolve 'ok' ou a mensagem do erro (o motivo da recusa).
create function pg_temp.erro(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlerrm;
end $$;
create function pg_temp.detalhe(p_sql text) returns text language plpgsql as $$
declare v_detalhe text;
begin
  execute p_sql;
  return null;
exception when others then
  get stacked diagnostics v_detalhe = pg_exception_detail;
  return v_detalhe;
end $$;
-- Identificadores guardados por nome durante a transação.
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
-- Datas relativas: primeiro dia do mês k meses atrás, e o dia d desse mês.
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
  ('admin.carteira@example.com', 'admin'),
  ('usuario.a.carteira@example.com', 'user'),
  ('usuario.b.carteira@example.com', 'user'),
  ('usuario.c.carteira@example.com', 'user'),
  ('usuario.d.carteira@example.com', 'user'),
  ('usuario.e.carteira@example.com', 'user'),
  ('usuario.f.carteira@example.com', 'user'),
  ('usuario.g.carteira@example.com', 'user'),
  ('usuario.h.carteira@example.com', 'user'),
  ('usuario.i.carteira@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000b0', 'admin.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b1', 'usuario.a.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b2', 'usuario.b.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b3', 'usuario.c.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b4', 'usuario.d.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b5', 'usuario.e.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b6', 'usuario.f.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b7', 'usuario.g.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b8', 'usuario.h.carteira@example.com'),
  ('00000000-0000-4000-8000-0000000000b9', 'usuario.i.carteira@example.com');

-- 1. Estrutura e privilégios (D13)
select table_privs_are('public', t, 'authenticated', array['SELECT'], 'authenticated só lê ' || t)
from unnest(array['ativos', 'transferencias', 'eventos', 'consolidados_mensais', 'posicoes_mensais']) t;
select table_privs_are('public', t, 'anon', array[]::text[], 'anon sem privilégio em ' || t)
from unnest(array['ativos', 'transferencias', 'eventos', 'consolidados_mensais', 'posicoes_mensais']) t;

-- 2. Usuário A: fechamento com ajuste positivo e negativo (CR-12) e reabertura (CR-15, CR-16)
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b1');
select pg_temp.guarda('a1', public.criar_ativo('Renda fixa fictícia', 'rendimento'));
select pg_temp.guarda('a2', public.criar_ativo('Ações fictícias', 'marcacao'));
select is((select count(*) from public.ativos where sistema = 'transito'), 1::bigint,
  'criar ativo cria o trânsito do usuário uma única vez');
select pg_temp.guarda('a_e0', public.lancar_evento(pg_temp.id('a1'), pg_temp.d(8, 5), 'aporte', 1000000));
select public.lancar_evento(pg_temp.id('a2'), pg_temp.d(8, 5), 'aporte', 500000);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8),
  jsonb_build_object(pg_temp.id('a1'), 1000000, pg_temp.id('a2'), 500000))), 'ok', 'A fecha o mês inicial');

-- Escrita direta recusada para o próprio usuário, inclusive alteração e exclusão de evento (H4)
select throws_ok(format($$ insert into public.ativos (user_id, nome, tipo_ajuste) values (%L, 'x', 'rendimento') $$,
  '00000000-0000-4000-8000-0000000000b1'), '42501', null, 'A não insere ativo direto');
select throws_ok(format($$ insert into public.eventos (user_id, ativo_id, data, tipo, valor) values (%L, %L, %L, 'aporte', 1) $$,
  '00000000-0000-4000-8000-0000000000b1', pg_temp.id('a1'), pg_temp.d(7, 1)), '42501', null, 'A não insere evento direto');
select throws_ok($$ update public.eventos set valor = 1 $$, '42501', null, 'A não altera evento');
select throws_ok($$ delete from public.eventos $$, '42501', null, 'A não exclui evento');
select throws_ok($$ update public.ativos set ativo = false $$, '42501', null, 'A não altera ativo direto');
select throws_ok(format($$ insert into public.transferencias (user_id, data) values (%L, %L) $$,
  '00000000-0000-4000-8000-0000000000b1', pg_temp.d(7, 1)), '42501', null, 'A não insere transferência direto');
select throws_ok($$ delete from public.consolidados_mensais $$, '42501', null, 'A não exclui consolidado direto');
select throws_ok($$ update public.posicoes_mensais set ajuste = 0 $$, '42501', null, 'A não altera posição direto');

select public.lancar_evento(pg_temp.id('a1'), pg_temp.d(7, 10), 'aporte', 10000);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(7),
  jsonb_build_object(pg_temp.id('a1'), 1015000, pg_temp.id('a2'), 480000))), 'ok', 'CR-12: A fecha o segundo mês');
select results_eq(format($$ select vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao
  from public.consolidados_mensais where mes = %L $$, pg_temp.m(7)),
  $$ values (1500000::bigint, 1495000::bigint, 10000::bigint, 0::bigint, 5000::bigint, -20000::bigint, 0::bigint, 0::bigint) $$,
  'CR-12: consolidado com Vi, Vf e componentes');
select results_eq(format($$ select saldo_inicial, saldo_final, ajuste, tipo_ajuste::text from public.posicoes_mensais
  where mes = %L order by ajuste desc $$, pg_temp.m(7)),
  $$ values (1000000::bigint, 1015000::bigint, 5000::bigint, 'rendimento'), (500000::bigint, 480000::bigint, -20000::bigint, 'marcacao') $$,
  'CR-12: ajuste +5.000 de rendimento em A1 e −20.000 de marcação em A2');
select is((select count(*) from public.posicoes_mensais p join public.ativos a on a.id = p.ativo_id
  where a.sistema = 'transito'), 0::bigint, 'o trânsito sem saldo nem evento não gera posição');

select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(5), '{}')), 'recusado_sequencia',
  'CR-15: fechar fora da sequência é recusado');
select is(pg_temp.erro(format('select public.reabrir_mes(%L)', pg_temp.m(8))), 'recusado_reabertura',
  'CR-15: só o último mês fechado reabre');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 1)', pg_temp.id('a1'), pg_temp.d(7, 20))),
  'recusado_mes_fechado', 'lançamento em mês fechado é recusado');
select is(pg_temp.erro(format('select public.reabrir_mes(%L)', pg_temp.m(7))), 'ok', 'CR-16: A reabre o último mês');
select is((select count(*) from public.consolidados_mensais where mes = pg_temp.m(7)), 0::bigint,
  'CR-16: a reabertura remove o consolidado');
select is((select count(*) from public.posicoes_mensais where mes = pg_temp.m(7)), 0::bigint,
  'CR-16: a reabertura remove as posições e os ajustes');
select is((select count(*) from public.eventos), 3::bigint, 'CR-16: os eventos lançados não mudam');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(7),
  jsonb_build_object(pg_temp.id('a1'), 1015000, pg_temp.id('a2'), 480000))), 'ok', 'CR-16: A fecha o mês de novo');
select is((select vf from public.consolidados_mensais where mes = pg_temp.m(7)), 1495000::bigint,
  'CR-16: o novo fechamento repete o CR-12');

-- 3. Isolamento: B, o admin e o anônimo não leem nem alteram a carteira de A
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b2');
select is_empty($$ select 1 from public.ativos $$, 'B não lê ativos de A');
select is_empty($$ select 1 from public.eventos $$, 'B não lê eventos de A');
select is_empty($$ select 1 from public.transferencias $$, 'B não lê transferências de A');
select is_empty($$ select 1 from public.consolidados_mensais $$, 'B não lê consolidados de A');
select is_empty($$ select 1 from public.posicoes_mensais $$, 'B não lê posições de A');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 1)', pg_temp.id('a1'), pg_temp.d(1, 1))),
  'recusado_ativo_invalido', 'B não lança no ativo de A');
select is(pg_temp.erro(format('select public.estornar_evento(%L, %L)', pg_temp.id('a_e0'), pg_temp.d(1, 1))),
  'recusado_evento_inexistente', 'B não estorna evento de A');
select is(pg_temp.erro(format('select public.desativar_ativo(%L)', pg_temp.id('a1'))),
  'recusado_ativo_inexistente', 'B não desativa ativo de A');
select pg_temp.guarda('b1', public.criar_ativo('Ativo fictício de B', 'rendimento'));
select is(pg_temp.erro(format('select public.transferir(%L, %L, %L, 100)', pg_temp.id('b1'), pg_temp.id('a1'), pg_temp.d(1, 1))),
  'recusado_ativo_invalido', 'B não transfere para o ativo de A');
select is(pg_temp.erro(format('select public.reabrir_mes(%L)', pg_temp.m(7))), 'recusado_reabertura',
  'B não reabre o mês de A');
select public.lancar_evento(pg_temp.id('b1'), pg_temp.d(8, 3), 'aporte', 100);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8),
  jsonb_build_object(pg_temp.id('b1'), 100, pg_temp.id('a1'), 1))), 'recusado_saldos_invalidos',
  'B não informa saldo de ativo de A');
reset role;
select is((select count(*) from public.consolidados_mensais where user_id = '00000000-0000-4000-8000-0000000000b1'),
  2::bigint, 'a carteira de A segue com dois meses fechados');

select pg_temp.act_as('00000000-0000-4000-8000-0000000000b0');
select is_empty($$ select 1 from public.ativos $$, 'o admin não lê ativos alheios');
select is_empty($$ select 1 from public.eventos $$, 'o admin não lê eventos alheios');
select is_empty($$ select 1 from public.consolidados_mensais $$, 'o admin não lê consolidados alheios');
select is_empty($$ select 1 from public.posicoes_mensais $$, 'o admin não lê posições alheias');
select throws_ok($$ delete from public.eventos $$, '42501', null, 'o admin não exclui eventos');

reset role;
select pg_temp.act_as_anon();
select throws_ok($$ select 1 from public.eventos $$, '42501', null, 'anon não lê eventos');
select throws_ok(format($$ select public.lancar_evento(%L, %L, 'aporte', 1) $$, pg_temp.id('a1'), pg_temp.d(1, 1)),
  '42501', null, 'anon não executa as funções da carteira');

-- 4. Usuário C: sinais (CR-01), estorno (CR-03), transferência (CR-04, CR-05), pendência (CR-13)
--    e trânsito no fechamento (CR-17)
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b3');
select pg_temp.guarda('c1', public.criar_ativo('Conta fictícia C1', 'rendimento'));
select pg_temp.guarda('c2', public.criar_ativo('Conta fictícia C2', 'rendimento'));
select pg_temp.guarda('ct', (select id from public.ativos where sistema = 'transito'));

select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, %L, %s)', pg_temp.id('c1'), pg_temp.d(8, 2), t, v)), r,
  'CR-01: ' || t || ' ' || v || ' → ' || r)
from (values ('aporte', 10000, 'ok'), ('aporte', -10000, 'recusado_sinal'), ('resgate', -10000, 'ok'),
  ('resgate', 10000, 'recusado_sinal'), ('rendimento', -500, 'ok'), ('rendimento', 500, 'ok'), ('marcacao', -300, 'ok'),
  ('cambio', 200, 'ok'), ('migracao', -100, 'ok'), ('rendimento', 0, 'recusado_sinal'),
  ('transferencia', 100, 'recusado_tipo'), ('estorno', 100, 'recusado_tipo')) as x(t, v, r);
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 1)', pg_temp.id('ct'), pg_temp.d(8, 2))),
  'recusado_ativo_invalido', 'K12: nada é lançado direto no trânsito');

select public.lancar_evento(pg_temp.id('c1'), pg_temp.d(8, 2), 'aporte', 500000);
select pg_temp.guarda('c_e2', public.lancar_evento(pg_temp.id('c1'), pg_temp.d(8, 10), 'aporte', 100000));
select is(pg_temp.erro(format('select public.estornar_evento(%L, %L)', pg_temp.id('c_e2'), pg_temp.d(8, 9))),
  'recusado_data', 'estorno anterior ao evento é recusado');
select pg_temp.guarda('c_e3', public.estornar_evento(pg_temp.id('c_e2'), pg_temp.d(8, 12)));
select is((select valor from public.eventos where id = pg_temp.id('c_e3')), -100000::bigint,
  'CR-03: o estorno vale o oposto do evento');
select is(pg_temp.erro(format('select public.estornar_evento(%L, %L)', pg_temp.id('c_e2'), pg_temp.d(8, 13))),
  'recusado_ja_estornado', 'CR-03: segundo estorno é recusado');
select is(pg_temp.erro(format('select public.estornar_evento(%L, %L)', pg_temp.id('c_e3'), pg_temp.d(8, 13))),
  'recusado_estorno_invalido', 'CR-03: estorno de estorno é recusado');

select pg_temp.guarda('c_t1', public.transferir(pg_temp.id('c1'), pg_temp.id('ct'), pg_temp.d(8, 10), 200000));
select public.transferir(pg_temp.id('ct'), pg_temp.id('c2'), pg_temp.d(8, 20), 200000);
select results_eq($$ select transferencia_id, count(*), sum(valor)::bigint from public.eventos
  where tipo = 'transferencia' group by transferencia_id having sum(valor) <> 0 or count(*) <> 2 $$,
  $$ select null::uuid, 0::bigint, 0::bigint where false $$, 'CR-04: cada transferência tem duas pernas de soma zero');
select is(pg_temp.erro(format('select public.estornar_evento(%L, %L)',
  (select id from public.eventos where transferencia_id = pg_temp.id('c_t1') and valor < 0), pg_temp.d(8, 21))),
  'recusado_estorno_invalido', 'CR-04: a perna não é estornada sozinha');
select is(pg_temp.erro(format('select public.transferir(%L, %L, %L, 0)', pg_temp.id('c1'), pg_temp.id('c2'), pg_temp.d(8, 21))),
  'recusado_valor', 'CR-04: transferência de valor zero é recusada');
select is(pg_temp.erro(format('select public.transferir(%L, %L, %L, 100)', pg_temp.id('c1'), pg_temp.id('c1'), pg_temp.d(8, 21))),
  'recusado_mesmo_ativo', 'CR-04: transferência para o mesmo ativo é recusada');

select pg_temp.guarda('c_t3', public.transferir(pg_temp.id('c1'), pg_temp.id('ct'), pg_temp.d(8, 5), 10000));
select is(pg_temp.erro(format('select public.corrigir_transferencia(%L, %L)', pg_temp.id('c_t3'), pg_temp.d(8, 8))), 'ok',
  'CR-05: a transferência é corrigida inteira');
select results_eq(format($$ select a.sistema is not null, e.valor from public.eventos e join public.ativos a on a.id = e.ativo_id
  where e.transferencia_id = %L and e.tipo = 'estorno' order by e.valor $$, pg_temp.id('c_t3')),
  $$ values (true, -10000::bigint), (false, 10000::bigint) $$, 'CR-05: a correção devolve +10.000 à origem e −10.000 ao trânsito');
select is(pg_temp.erro(format('select public.corrigir_transferencia(%L, %L)', pg_temp.id('c_t3'), pg_temp.d(8, 9))),
  'recusado_ja_corrigida', 'CR-05: segunda correção é recusada');

select public.transferir(pg_temp.id('c1'), pg_temp.id('ct'), pg_temp.d(8, 25), 50000);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('c1'), 250000))),
  'recusado_pendencia', 'CR-13: falta o saldo real de C2');
select is(pg_temp.detalhe(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('c1'), 250000))),
  jsonb_build_array(pg_temp.id('c2'))::text, 'CR-13: a pendência lista só C2, nunca o trânsito');
select is((select count(*) from public.consolidados_mensais), 0::bigint, 'CR-13: a recusa não grava nada');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8),
  jsonb_build_object(pg_temp.id('c1'), 250000, pg_temp.id('c2'), 200000, pg_temp.id('ct'), 50000))),
  'recusado_saldos_invalidos', 'K12: o trânsito não recebe saldo real');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8),
  jsonb_build_object(pg_temp.id('c1'), 250000, pg_temp.id('c2'), 200000))), 'ok', 'CR-17: C fecha o mês');
select results_eq(format($$ select vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao
  from public.consolidados_mensais where mes = %L $$, pg_temp.m(8)),
  $$ values (0::bigint, 500000::bigint, 510000::bigint, -10000::bigint, 200::bigint, -300::bigint, 200::bigint, -100::bigint) $$,
  'CR-17: Vf inclui o trânsito; o estorno conta como aporte; a identidade fecha');
select results_eq(format($$ select saldo_final, ajuste from public.posicoes_mensais where mes = %L and ativo_id = %L $$,
  pg_temp.m(8), pg_temp.id('ct')), $$ values (50000::bigint, 0::bigint) $$,
  'CR-17: o trânsito fecha com o saldo calculado e ajuste zero');
select results_eq(format($$ select saldo_final, ajuste, tipo_ajuste::text from public.posicoes_mensais where mes = %L and ativo_id = %L $$,
  pg_temp.m(8), pg_temp.id('c1')), $$ values (250000::bigint, 200::bigint, 'rendimento') $$,
  'CR-17: o ajuste de C1 é rendimento');

-- 5. Usuário D: início da carteira e datas (CR-06, K7, K13), desativação
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b4');
select pg_temp.guarda('d1', public.criar_ativo('Conta fictícia D1', 'rendimento'));
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('d1'), 0))),
  'recusado_inicio', 'CR-06 s01: sem eventos, não há o que fechar');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 10000)', pg_temp.id('d1'), pg_temp.d(7, 10))),
  'ok', 'CR-06 s02: aporte aceito antes do primeiro fechamento');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(6), jsonb_build_object(pg_temp.id('d1'), 10000))),
  'recusado_inicio', 'CR-06 s03: o primeiro fechamento só no mês do evento mais antigo');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(7), jsonb_build_object(pg_temp.id('d1'), 10000))),
  'ok', 'CR-06 s04: o primeiro fechamento define o início');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.d(8, 15))),
  'recusado_mes_fechado', 'CR-06 s05: lançamento anterior ao início é recusado');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.d(7, 20))),
  'recusado_mes_fechado', 'CR-06 s06: lançamento em mês fechado é recusado');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.d(6, 5))),
  'ok', 'CR-06 s07: lançamento no primeiro mês aberto é aceito');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.hoje() + 1)),
  'recusado_data_futura', 'CR-06 s08 (K13): lançamento futuro é recusado');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.hoje())),
  'ok', 'CR-06 s09: lançamento com a data de hoje é aceito');
select is(pg_temp.erro(format('select public.reabrir_mes(%L)', pg_temp.m(7))), 'ok', 'CR-06 s10: reabrir o primeiro mês');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 5000)', pg_temp.id('d1'), pg_temp.d(8, 15))),
  'ok', 'CR-06 s11: sem mês fechado, qualquer data até hoje é aceita');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(7), jsonb_build_object(pg_temp.id('d1'), 15000))),
  'recusado_inicio', 'CR-06 s12: o início agora é o mês mais antigo');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('d1'), 5000))),
  'ok', 'CR-06 s13: fecha o novo mês inicial');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(0), '{}')), 'recusado_mes_nao_terminado',
  'CR-18 (K13): o mês corrente não fecha');
select pg_temp.guarda('d2', public.criar_ativo('Conta fictícia D2', 'rendimento'));
select is(pg_temp.erro(format('select public.desativar_ativo(%L)', pg_temp.id('d1'))), 'recusado_saldo_nao_zero',
  'ativo com saldo não é desativado');
select is(pg_temp.erro(format('select public.desativar_ativo(%L)', pg_temp.id('d2'))), 'ok', 'ativo com saldo zero é desativado');
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 1)', pg_temp.id('d2'), pg_temp.hoje())),
  'recusado_ativo_invalido', 'ativo desativado não recebe lançamento');
select is(pg_temp.erro(format('select public.desativar_ativo(%L)',
  (select id from public.ativos where sistema = 'transito'))), 'recusado_ativo_invalido', 'o trânsito não é desativado');

-- 6. Faixa monetária (CR-07 a CR-11, D11): um usuário por caso
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b5');
select pg_temp.guarda('e1', public.criar_ativo('Conta fictícia E1', 'rendimento'));
select public.lancar_evento(pg_temp.id('e1'), pg_temp.d(8, 2), 'aporte', 9007199254740991);
select public.lancar_evento(pg_temp.id('e1'), pg_temp.d(8, 3), 'rendimento', 2);
select public.lancar_evento(pg_temp.id('e1'), pg_temp.d(8, 4), 'rendimento', -2);
select is(pg_temp.erro(format('select public.lancar_evento(%L, %L, ''aporte'', 9007199254740992)', pg_temp.id('e1'), pg_temp.d(8, 5))),
  'recusado_faixa', 'evento acima de 2^53 − 1 é recusado');
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('e1'), 9007199254740991))),
  'ok', 'CR-07: subtotal acima de 2^53 volta exato para a faixa');
select results_eq($$ select saldo_final, ajuste from public.posicoes_mensais $$,
  $$ values (9007199254740991::bigint, 0::bigint) $$, 'CR-07: saldo final exato, sem ajuste');

reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b6');
select pg_temp.guarda('f1', public.criar_ativo('Conta fictícia F1', 'rendimento'));
select count(public.lancar_evento(pg_temp.id('f1'), pg_temp.d(8, 2), 'rendimento', 9007199254740991)) from generate_series(1, 1025);
select count(public.lancar_evento(pg_temp.id('f1'), pg_temp.d(8, 3), 'rendimento', -9007199254740991)) from generate_series(1, 1025);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('f1'), 100))),
  'ok', 'CR-08: cancelamento com subtotal acima de 64 bits');
select results_eq($$ select c.vi, c.vf, c.rendimento, p.ajuste, p.saldo_final from public.consolidados_mensais c
  join public.posicoes_mensais p using (user_id, mes) $$,
  $$ values (0::bigint, 100::bigint, 100::bigint, 100::bigint, 100::bigint) $$, 'CR-08: ajuste e Vf de 100 centavos');

reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b7');
select pg_temp.guarda('g1', public.criar_ativo('Conta fictícia G1', 'rendimento'));
select public.lancar_evento(pg_temp.id('g1'), pg_temp.d(8, 2), 'aporte', 9007199254740991);
select public.fechar_mes(pg_temp.m(8), jsonb_build_object(pg_temp.id('g1'), 9007199254740991));
select public.lancar_evento(pg_temp.id('g1'), pg_temp.d(7, 2), 'aporte', 1);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(7), jsonb_build_object(pg_temp.id('g1'), 9007199254740991))),
  'recusado_faixa', 'CR-09: saldo calculado fora da faixa');

reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b8');
select pg_temp.guarda('h1', public.criar_ativo('Conta fictícia H1', 'rendimento'));
select public.lancar_evento(pg_temp.id('h1'), pg_temp.d(8, 2), 'resgate', -9007199254740991);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8), jsonb_build_object(pg_temp.id('h1'), 9007199254740991))),
  'recusado_faixa', 'CR-10: ajuste entre saldos de sinais opostos fora da faixa');

reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000b9');
select pg_temp.guarda('i1', public.criar_ativo('Conta fictícia I1', 'rendimento'));
select pg_temp.guarda('i2', public.criar_ativo('Conta fictícia I2', 'rendimento'));
select public.lancar_evento(pg_temp.id('i1'), pg_temp.d(8, 2), 'aporte', 9007199254740991);
select public.lancar_evento(pg_temp.id('i2'), pg_temp.d(8, 2), 'aporte', 9007199254740991);
select is(pg_temp.erro(format('select public.fechar_mes(%L, %L)', pg_temp.m(8),
  jsonb_build_object(pg_temp.id('i1'), 9007199254740991, pg_temp.id('i2'), 9007199254740991))),
  'recusado_faixa', 'CR-11: consolidado fora da faixa');

reset role;
select is((select count(*) from public.consolidados_mensais where user_id in
  ('00000000-0000-4000-8000-0000000000b8', '00000000-0000-4000-8000-0000000000b9')), 0::bigint,
  'CR-10 e CR-11: as recusas não gravam nada');
select is((select count(*) from public.consolidados_mensais where user_id = '00000000-0000-4000-8000-0000000000b7'), 1::bigint,
  'CR-09: a recusa preserva o mês anterior e não grava o seguinte');

select * from finish();
rollback;
