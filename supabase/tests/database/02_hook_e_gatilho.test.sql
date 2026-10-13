-- Hook "before user created" e gatilho de perfil (G2, ADR-003).
-- O gatilho é a segunda barreira: a inserção direta em auth.users simula o hook desligado.
-- Só e-mails fictícios em example.com.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into public.authorized_emails (email, role) values
  ('admin.teste@example.com', 'admin'),
  ('usuario.a.teste@example.com', 'user');

-- Hook: comportamento da função. O papel postgres não pode assumir supabase_auth_admin; a
-- execução como esse papel é coberta pelo teste ponta a ponta de cadastro (issue B, Item B3).
select is(
  private.before_user_created('{"user": {"email": "usuario.a.teste@example.com"}}'::jsonb),
  '{}'::jsonb, 'o hook aceita e-mail listado');
select is(
  private.before_user_created('{"user": {"email": "Usuario.A.Teste@Example.COM"}}'::jsonb),
  '{}'::jsonb, 'o hook aceita e-mail listado com outra combinação de maiúsculas');
select is(
  private.before_user_created('{"user": {"email": "  usuario.a.teste@example.com "}}'::jsonb),
  '{}'::jsonb, 'o hook ignora espaços nas pontas');
select is(
  private.before_user_created('{"user": {"email": "fora.teste@example.com"}}'::jsonb),
  '{"error": {"http_code": 403, "message": "Acesso não autorizado."}}'::jsonb,
  'o hook recusa e-mail ausente da lista');
select is(
  private.before_user_created('{"user": {"email": null}}'::jsonb),
  '{"error": {"http_code": 403, "message": "Acesso não autorizado."}}'::jsonb,
  'o hook recusa e-mail nulo');
select is(
  private.before_user_created('{"user": {}}'::jsonb),
  '{"error": {"http_code": 403, "message": "Acesso não autorizado."}}'::jsonb,
  'o hook recusa evento sem e-mail');

-- Hook: o que o supabase_auth_admin precisa para executá-lo
select ok(has_schema_privilege('supabase_auth_admin', 'private', 'USAGE'), 'supabase_auth_admin usa o schema private');
select ok(has_schema_privilege('supabase_auth_admin', 'public', 'USAGE'), 'supabase_auth_admin usa o schema public');
select ok(
  exists (select 1 from pg_policies
          where schemaname = 'public' and tablename = 'authorized_emails' and cmd = 'SELECT'
            and roles = '{supabase_auth_admin}'),
  'supabase_auth_admin lê a lista por política própria');

-- O hook não é executável por quem não é o GoTrue
set local role authenticated;
select throws_ok($$ select private.before_user_created('{}'::jsonb) $$, '42501', null,
  'authenticated não executa o hook');
reset role;
set local role anon;
select throws_ok($$ select private.before_user_created('{}'::jsonb) $$, '42501', null,
  'anon não executa o hook');
reset role;

-- Gatilho: perfil criado com o papel inicial da lista
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000b0', 'Admin.Teste@Example.com'),
  ('00000000-0000-4000-8000-0000000000b1', 'usuario.a.teste@example.com');
select results_eq(
  $$ select user_id, email, role::text from public.profiles
     where user_id in ('00000000-0000-4000-8000-0000000000b0', '00000000-0000-4000-8000-0000000000b1')
     order by user_id $$,
  $$ values ('00000000-0000-4000-8000-0000000000b0'::uuid, 'admin.teste@example.com', 'admin'),
            ('00000000-0000-4000-8000-0000000000b1'::uuid, 'usuario.a.teste@example.com', 'user') $$,
  'o gatilho cria o perfil com o e-mail normalizado e o papel inicial da lista');

-- Gatilho: segunda barreira para e-mail fora da lista, com o hook simulado como desligado
select throws_ok(
  $$ insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000b2', 'fora.teste@example.com') $$,
  'P0001', 'Acesso não autorizado.', 'o gatilho recusa e-mail ausente da lista');
select is_empty($$ select 1 from auth.users where email = 'fora.teste@example.com' $$,
  'o usuário recusado pelo gatilho não existe em auth.users');
select throws_ok(
  $$ insert into auth.users (id) values ('00000000-0000-4000-8000-0000000000b3') $$,
  'P0001', 'Acesso não autorizado.', 'o gatilho recusa e-mail nulo');
select is_empty($$ select 1 from auth.users where id = '00000000-0000-4000-8000-0000000000b3' $$,
  'o usuário sem e-mail não existe em auth.users');

-- O gatilho só é chamado pelo gatilho
select function_privs_are('private', 'handle_new_user', array[]::name[], 'authenticated', array[]::text[],
  'authenticated não executa handle_new_user');
select function_privs_are('private', 'handle_new_user', array[]::name[], 'anon', array[]::text[],
  'anon não executa handle_new_user');
select function_privs_are('private', 'handle_new_user', array[]::name[], 'supabase_auth_admin', array[]::text[],
  'supabase_auth_admin não executa handle_new_user diretamente');
select has_trigger('auth', 'users', 'on_auth_user_created', 'o gatilho de perfil existe em auth.users');

select * from finish();
rollback;
