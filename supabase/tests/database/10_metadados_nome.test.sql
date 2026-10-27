begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
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
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
insert into public.authorized_emails(email,role) values ('metadados1@example.com','user');
insert into auth.users(id,email) values ('15100000-0000-4000-8000-000000000001','metadados1@example.com');
insert into public.authorized_emails(email,role) values ('metadados2@example.com','user');
insert into auth.users(id,email) values ('15100000-0000-4000-8000-000000000002','metadados2@example.com');
insert into public.authorized_emails(email,role) values ('metadados3@example.com','admin');
insert into auth.users(id,email) values ('15100000-0000-4000-8000-000000000003','metadados3@example.com');

select pg_temp.act_as('15100000-0000-4000-8000-000000000001');
select pg_temp.guarda('a',public.criar_ativo('Nome antigo','rendimento'));
select is(public.ler_versao_metadados(),'2','inserções de trânsito e ativo incrementam a versão');
select public.editar_ativo_com_nome(pg_temp.id('a'),'Nome novo',null,null,null,null,null,null,null);
select is((select nome from public.ativos where id=pg_temp.id('a')),'Nome novo','edita nome');
select is(public.ler_versao_metadados(),'3','nome incrementa versão');
select public.editar_ativo_com_nome(pg_temp.id('a'),'Nome antigo',null,null,null,null,null,null,null);
select is(public.ler_versao_metadados(),'4','A B A é detectado');
select public.editar_ativo_com_nome(pg_temp.id('a'),'Nome antigo',null,null,null,null,null,null,null);
select is(public.ler_versao_metadados(),'4','mesmo estado não incrementa');
select pg_temp.guarda('outro',public.criar_ativo('Nome repetido','rendimento'));
select public.editar_ativo_com_nome(pg_temp.id('a'),'Nome repetido',null,null,null,null,null,null,null);
select is((select count(*) from public.ativos where nome='Nome repetido'),2::bigint,'duplicados permitidos');
select public.desativar_ativo(pg_temp.id('a'));
select lives_ok($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Desativado',null,null,null,null,null,null,null)$$,'edita desativado');
select is((select tipo_ajuste::text from public.ativos where id=pg_temp.id('a')),'rendimento','tipo preservado');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),' ',null,'Instituição desfeita',null,null,null,null,null)$$),'recusado_nome','nome vazio recusado');
select is_empty($$select 1 from public.instituicoes where nome='Instituição desfeita'$$,'recusa não cria instituição');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),repeat('X',101),null,null,null,null,null,null,null)$$),'recusado_nome','101 caracteres recusados');
select lives_ok($$select public.editar_ativo_com_nome(pg_temp.id('a'),repeat('😀',100),null,null,null,null,null,null,null)$$,'100 pontos Unicode permitidos');
select public.editar_ativo_com_nome(pg_temp.id('a'),U&'\00A0Nome\00A0',null,null,null,null,null,null,null);
select is((select nome from public.ativos where id=pg_temp.id('a')),U&'\00A0Nome\00A0','btrim preserva NBSP');
select is(pg_temp.erro($$select public.editar_ativo_com_nome((select id from public.ativos where sistema='transito'),'Inválido',null,null,null,null,null,null,null)$$),'recusado_ativo_invalido','trânsito recusado');
select pg_temp.guarda('inst',public.criar_instituicao('Instituição fictícia'));
select set_config('teste.versao',public.ler_versao_metadados(),true);
select public.renomear_instituicao(pg_temp.id('inst'),'Instituição outra');
select public.renomear_instituicao(pg_temp.id('inst'),'Instituição fictícia');
select is(public.ler_versao_metadados()::bigint,current_setting('teste.versao')::bigint+2,'instituição A B A');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('a'),pg_temp.id('inst'),null,'a5000000-0000-4000-8000-000000020000',null,null,null,null);
select is(public.ler_versao_metadados()::bigint,current_setting('teste.versao')::bigint+3,'RPC anterior muda vínculos e marca');
select set_config('teste.versao',public.ler_versao_metadados(),true);
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Não gravar',null,'Rollback fictício',gen_random_uuid(),null,null,null,null)$$),'recusado_taxonomia_inexistente','recusa depois de resolver instituição');
select is_empty($$select 1 from public.instituicoes where nome='Rollback fictício'$$,'rollback inclui instituição');
select is(public.ler_versao_metadados(),current_setting('teste.versao'),'rollback inclui contador');
reset role;
select pg_temp.act_as('15100000-0000-4000-8000-000000000002');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Invasão',null,null,null,null,null,null,null)$$),'recusado_ativo_inexistente','outro dono ou admin não edita');
select is((select count(*) from public.ativos where id=pg_temp.id('a')),0::bigint,'RLS não expõe ativo alheio');
reset role;
select pg_temp.act_as('15100000-0000-4000-8000-000000000003');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Invasão',null,null,null,null,null,null,null)$$),'recusado_ativo_inexistente','outro dono ou admin não edita');
select is((select count(*) from public.ativos where id=pg_temp.id('a')),0::bigint,'RLS não expõe ativo alheio');
reset role;

select pg_temp.act_as('15100000-0000-4000-8000-000000000002');
select pg_temp.guarda('instituicao_b',public.criar_instituicao('Instituição de outro dono'));
reset role;
select pg_temp.act_as('15100000-0000-4000-8000-000000000001');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Tentativa cruzada',pg_temp.id('instituicao_b'),null,null,null,null,null,null)$$),'recusado_instituicao_inexistente','não aceita instituição de outro dono');
select is(pg_temp.erro($$select public.editar_ativo_com_nome(pg_temp.id('a'),null,null,null,null,null,null,null,null)$$),'recusado_nome','nome nulo recusado');
reset role;
update public.profiles set versao_metadados=9223372036854775807 where user_id='15100000-0000-4000-8000-000000000001';
select pg_temp.act_as('15100000-0000-4000-8000-000000000001');
select is(public.ler_versao_metadados(),'9223372036854775807','marca exata acima de 2 elevado a 53');
select throws_ok($$select public.editar_ativo_com_nome(pg_temp.id('a'),'Estouro',null,null,null,null,null,null,null)$$,'22003',null,'overflow aborta edição');
reset role;
update public.profiles set versao_metadados=10 where user_id='15100000-0000-4000-8000-000000000001';
select lives_ok($$delete from auth.users where id='15100000-0000-4000-8000-000000000001'$$,'cascata não quebra com triggers');
select is((select count(*) from public.ativos where user_id='15100000-0000-4000-8000-000000000001'),0::bigint,'cascata remove ativos');
select ok(not has_function_privilege('anon','public.ler_versao_metadados()','execute'),'anon não lê versão');
select ok(not has_function_privilege('authenticated','private.incrementar_metadados()','execute'),'helper não executável');
select table_privs_are('public','ativos','authenticated',array['SELECT'],'escrita direta vedada');
select * from finish();
rollback;
