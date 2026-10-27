-- Concorrência na carteira (issue #27, R1-1 do plano): duas sessões reais pelo dblink, que
-- gravam e depois removem as próprias fixtures fictícias. Sem esperas por tempo: uma sessão
-- segura a trava por usuário (D13) numa transação aberta, e a outra usa lock_timeout curto ou
-- dblink_send_query. O resultado aceito é a operação concorrente incluída na apuração ou
-- recusada, nunca um mês fechado que diverge dos eventos nem gravação parcial.
begin;
create extension if not exists pgtap with schema extensions;
create extension if not exists dblink with schema extensions;
select plan(5);

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
    json_build_object('sub', '00000000-0000-4000-8000-0000000000e1', 'role', 'authenticated')::text));
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
    delete from auth.users where id = '00000000-0000-4000-8000-0000000000e1';
    delete from public.authorized_emails where email = 'concorrencia.nome@example.com'; $q$);
end $$;

-- Sessão administrativa (postgres) para criar e remover as fixtures, confirmadas de verdade.
select extensions.dblink_connect('admin', format('host=%s port=%s dbname=%s user=postgres password=postgres',
  coalesce(host(inet_server_addr()), 'localhost'), current_setting('port'), current_database()));
select pg_temp.limpar();
select extensions.dblink_exec('admin', $q$
  insert into public.authorized_emails (email, role) values ('concorrencia.nome@example.com', 'user');
  insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000e1', 'concorrencia.nome@example.com'); $q$);

select pg_temp.conectar('s1');
select pg_temp.conectar('s2');
select set_config('teste.x1', (select id::text from extensions.dblink('s1',
  $q$ select public.criar_ativo('Conta fictícia X1', 'rendimento') $q$) as t(id uuid)), true);
select pg_temp.exige('s1', format($q$ select public.lancar_evento(%L, %L, 'aporte', 100000) $q$,
  current_setting('teste.x1'), pg_temp.m(8) + 1));


select pg_temp.exige('s1','begin');
select is(pg_temp.remoto('s1',format($q$select public.editar_ativo_com_nome(%L,'Primeiro',null,null,null,null,null,null,null)$q$,current_setting('teste.x1'))),'ok','primeira sessão renomeia e segura trava');
select pg_temp.exige('s2', $q$set lock_timeout = '200ms'$q$);
select is(pg_temp.remoto('s2',format($q$select public.editar_ativo_com_nome(%L,'Segundo',null,null,null,null,null,null,null)$q$,current_setting('teste.x1'))),'canceling statement due to lock timeout','nova RPC respeita trava');
select is(pg_temp.remoto('s2',format($q$select public.editar_detalhes_ativo_taxonomia(%L,null,null,null,true,null,null,null)$q$,current_setting('teste.x1'))),'canceling statement due to lock timeout','RPC anterior usa mesma trava');
select pg_temp.exige('s1','commit');
select is(pg_temp.remoto('s2',format($q$select public.editar_ativo_com_nome(%L,'Segundo',null,null,null,null,null,null,null)$q$,current_setting('teste.x1'))),'ok','segunda sessão conclui após commit');
select is((select nome from extensions.dblink('admin',format($q$select nome from public.ativos where id=%L$q$,current_setting('teste.x1'))) as t(nome text)),'Segundo','ordem serial respeitada');
select extensions.dblink_disconnect('s1');
select extensions.dblink_disconnect('s2');
select pg_temp.limpar();
select extensions.dblink_disconnect('admin');
select * from finish();
rollback;
