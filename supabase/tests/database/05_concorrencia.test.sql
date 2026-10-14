-- Concorrência na carteira (issue #27, R1-1 do plano): duas sessões reais pelo dblink, que
-- gravam e depois removem as próprias fixtures fictícias. Sem esperas por tempo: uma sessão
-- segura a trava por usuário (D13) numa transação aberta, e a outra usa lock_timeout curto ou
-- dblink_send_query. O resultado aceito é a operação concorrente incluída na apuração ou
-- recusada, nunca um mês fechado que diverge dos eventos nem gravação parcial.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select plan(13);

create function pg_temp.m(k int) returns date language sql as $$
  select (date_trunc('month', (now() at time zone 'America/Cuiaba')) - make_interval(months => k))::date;
$$;
-- Conecta pelo endereço do próprio servidor, com senha (o dblink exige credencial de quem
-- não é superusuário). O usuário e a senha são os padrões do Supabase local.
create function pg_temp.conectar(p_nome text) returns void language plpgsql as $$
begin
  perform extensions.dblink_connect(p_nome, format('host=%s port=%s dbname=%s user=postgres password=postgres',
    coalesce(host(inet_server_addr()), 'localhost'), current_setting('port'), current_database()));
  perform extensions.dblink_exec(p_nome, format(
    $q$ select set_config('request.jwt.claims', %L, false); set role authenticated; $q$,
    json_build_object('sub', '00000000-0000-4000-8000-0000000000c1', 'role', 'authenticated')::text));
end $$;
-- Executa na sessão e devolve 'ok' ou a mensagem do erro.
create function pg_temp.remoto(p_nome text, p_sql text) returns text language plpgsql as $$
begin
  if p_sql ~* '^\s*select' then
    perform * from extensions.dblink(p_nome, p_sql) as t(r text);
  else
    perform extensions.dblink_exec(p_nome, p_sql);
  end if;
  return 'ok';
exception when others then
  return sqlerrm;
end $$;
-- Passo de preparação: precisa dar certo e não imprime nada que pareça TAP.
create function pg_temp.exige(p_nome text, p_sql text) returns void language plpgsql as $$
declare v_r text := pg_temp.remoto(p_nome, p_sql);
begin
  if v_r <> 'ok' then
    raise exception 'passo de preparação falhou: % → %', p_sql, v_r;
  end if;
end $$;
create function pg_temp.resultado(p_nome text) returns text language plpgsql as $$
begin
  perform * from extensions.dblink_get_result(p_nome) as t(r text);
  perform * from extensions.dblink_get_result(p_nome, false) as t(r text);
  return 'ok';
exception when others then
  perform * from extensions.dblink_get_result(p_nome, false) as t(r text);
  return sqlerrm;
end $$;
create function pg_temp.limpar() returns void language plpgsql as $$
begin
  perform extensions.dblink_exec('admin', $q$
    delete from auth.users where id = '00000000-0000-4000-8000-0000000000c1';
    delete from public.authorized_emails where email = 'concorrencia.carteira@example.com'; $q$);
end $$;

-- Sessão administrativa (postgres) para criar e remover as fixtures, confirmadas de verdade.
select extensions.dblink_connect('admin', format('host=%s port=%s dbname=%s user=postgres password=postgres',
  coalesce(host(inet_server_addr()), 'localhost'), current_setting('port'), current_database()));
select pg_temp.limpar();
select extensions.dblink_exec('admin', $q$
  insert into public.authorized_emails (email, role) values ('concorrencia.carteira@example.com', 'user');
  insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000c1', 'concorrencia.carteira@example.com'); $q$);

select pg_temp.conectar('s1');
select pg_temp.conectar('s2');
select set_config('teste.x1', (select id::text from extensions.dblink('s1',
  $q$ select public.criar_ativo('Conta fictícia X1', 'rendimento') $q$) as t(id uuid)), true);
select pg_temp.exige('s1', format($q$ select public.lancar_evento(%L, %L, 'aporte', 100000) $q$,
  current_setting('teste.x1'), pg_temp.m(8) + 1));

-- 1. Lançamento contra fechamento, com a trava ocupada: o fechamento é recusado.
select pg_temp.exige('s1', 'begin');
select is(pg_temp.remoto('s1', format($q$ select public.lancar_evento(%L, %L, 'aporte', 1000) $q$,
  current_setting('teste.x1'), pg_temp.m(8) + 19)), 'ok', 'S1 lança e segura a trava sem confirmar');
select pg_temp.exige('s2', $q$ set lock_timeout = '200ms' $q$);
select is(pg_temp.remoto('s2', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(8),
  jsonb_build_object(current_setting('teste.x1'), 101000))),
  'canceling statement due to lock timeout', 'S2 não fecha enquanto o lançamento não termina');
select pg_temp.exige('s1', 'commit');
select pg_temp.exige('s2', $q$ set lock_timeout = 0 $q$);

-- 2. Lançamento contra fechamento, com o fechamento esperando: o lançamento entra na apuração.
select pg_temp.exige('s1', 'begin');
select pg_temp.exige('s1', format($q$ select public.lancar_evento(%L, %L, 'aporte', 500) $q$,
  current_setting('teste.x1'), pg_temp.m(8) + 24));
select is(extensions.dblink_send_query('s2', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(8),
  jsonb_build_object(current_setting('teste.x1'), 101600))), 1, 'S2 pede o fechamento enquanto S1 segura a trava');
select pg_temp.exige('s1', 'commit');
select is(pg_temp.resultado('s2'), 'ok', 'S2 fecha depois que S1 confirma');
select results_eq(format($q$ select * from extensions.dblink('admin', %L) as t(aportes bigint, vf bigint, ajuste bigint) $q$,
  format($s$ select c.aportes, c.vf, p.ajuste from public.consolidados_mensais c join public.posicoes_mensais p using (user_id, mes)
    where c.user_id = '00000000-0000-4000-8000-0000000000c1' and c.mes = %L $s$, pg_temp.m(8))),
  $$ values (101500::bigint, 101600::bigint, 100::bigint) $$,
  'o lançamento concorrente entra no fechamento, e o ajuste só cobre o resto');

-- 3. Criação de ativo contra fechamento: o fechamento não deixa o ativo novo de fora.
select pg_temp.exige('s1', 'begin');
select set_config('teste.x2', (select id::text from extensions.dblink('s1',
  $q$ select public.criar_ativo('Conta fictícia X2', 'rendimento') $q$) as t(id uuid)), true);
select pg_temp.exige('s1', format($q$ select public.lancar_evento(%L, %L, 'aporte', 300) $q$,
  current_setting('teste.x2'), pg_temp.m(7) + 2));
select extensions.dblink_send_query('s2', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(7),
  jsonb_build_object(current_setting('teste.x1'), 101600)));
select pg_temp.exige('s1', 'commit');
select is(pg_temp.resultado('s2'), 'recusado_pendencia', 'o fechamento concorrente vê o ativo novo e o exige');

-- 4. Fechamento contra fechamento do mesmo mês: o segundo é recusado.
select pg_temp.exige('s1', 'begin');
select is(pg_temp.remoto('s1', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(7),
  jsonb_build_object(current_setting('teste.x1'), 101600, current_setting('teste.x2'), 300))), 'ok',
  'S1 fecha o mês e segura a trava');
select extensions.dblink_send_query('s2', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(7),
  jsonb_build_object(current_setting('teste.x1'), 101600, current_setting('teste.x2'), 300)));
select pg_temp.exige('s1', 'commit');
select is(pg_temp.resultado('s2'), 'recusado_sequencia', 'o segundo fechamento do mesmo mês é recusado');
select is((select n from extensions.dblink('admin', format($q$ select count(*) from public.consolidados_mensais
  where user_id = '00000000-0000-4000-8000-0000000000c1' and mes = %L $q$, pg_temp.m(7))) as t(n bigint)), 1::bigint,
  'o mês tem um único consolidado');

-- 5. Fechamento contra reabertura: nunca fecha um mês depois de um mês aberto.
select pg_temp.exige('s1', 'begin');
select is(pg_temp.remoto('s1', format($q$ select public.reabrir_mes(%L) $q$, pg_temp.m(7))), 'ok',
  'S1 reabre o último mês e segura a trava');
select extensions.dblink_send_query('s2', format($q$ select public.fechar_mes(%L, %L) $q$, pg_temp.m(6),
  jsonb_build_object(current_setting('teste.x1'), 101600, current_setting('teste.x2'), 300)));
select pg_temp.exige('s1', 'commit');
select is(pg_temp.resultado('s2'), 'recusado_sequencia', 'o mês seguinte ao reaberto não fecha');

-- Nenhum mês fechado diverge dos eventos: saldo final − inicial − ajuste = soma dos eventos.
select is_empty(format($q$ select * from extensions.dblink('admin', %L) as t(mes date) $q$, $s$
  select p.mes from public.posicoes_mensais p
  where p.user_id = '00000000-0000-4000-8000-0000000000c1'
  group by p.mes
  having sum(p.saldo_final - p.saldo_inicial - p.ajuste) <> coalesce((select sum(e.valor) from public.eventos e
    where e.user_id = '00000000-0000-4000-8000-0000000000c1'
      and e.data >= p.mes and e.data < (p.mes + interval '1 month')::date), 0) $s$),
  'nenhum mês fechado diverge dos eventos');
select is((select n from extensions.dblink('admin', $q$ select count(*) from public.consolidados_mensais
  where user_id = '00000000-0000-4000-8000-0000000000c1' $q$) as t(n bigint)), 1::bigint,
  'resta só o primeiro mês fechado');

select extensions.dblink_disconnect('s1');
select extensions.dblink_disconnect('s2');
select pg_temp.limpar();
select extensions.dblink_disconnect('admin');

select * from finish();
rollback;
