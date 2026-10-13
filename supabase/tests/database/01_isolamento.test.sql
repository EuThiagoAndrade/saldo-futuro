-- Isolamento por RLS (G2): grants, políticas e ausência de bypass do admin.
-- Só e-mails fictícios em example.com.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

-- Simula a Data API: papel do banco e claims do JWT, só dentro da transação.
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

-- Fixtures: um admin e dois usuários, autorizados na lista. O gatilho cria os perfis.
insert into public.authorized_emails (email, role) values
  ('admin.teste@example.com', 'admin'),
  ('usuario.a.teste@example.com', 'user'),
  ('usuario.b.teste@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a0', 'admin.teste@example.com'),
  ('00000000-0000-4000-8000-0000000000a1', 'usuario.a.teste@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', 'usuario.b.teste@example.com');

-- Estrutura e grants
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity $$,
  'toda tabela de public tem RLS ativa');
select table_privs_are('public', 'authorized_emails', 'anon', array[]::text[], 'anon sem privilégio em authorized_emails');
select table_privs_are('public', 'profiles', 'anon', array[]::text[], 'anon sem privilégio em profiles');
select table_privs_are('public', 'authorized_emails', 'authenticated', array['DELETE', 'INSERT', 'SELECT'],
  'authenticated só lê, insere e exclui na lista');
select table_privs_are('public', 'profiles', 'authenticated', array['SELECT'], 'authenticated só lê perfis');
select table_privs_are('public', 'authorized_emails', 'supabase_auth_admin', array['SELECT'],
  'supabase_auth_admin só lê a lista');
select table_privs_are('public', 'profiles', 'supabase_auth_admin', array[]::text[],
  'supabase_auth_admin sem privilégio em profiles');

-- Usuário A
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
select results_eq($$ select user_id from public.profiles $$,
  $$ values ('00000000-0000-4000-8000-0000000000a1'::uuid) $$, 'A lê só o próprio perfil');
select is_empty($$ select 1 from public.authorized_emails $$, 'A não lê a lista de e-mails');
select throws_ok($$ insert into public.authorized_emails (email, role) values ('intruso.teste@example.com', 'user') $$,
  '42501', null, 'A não insere na lista');
select throws_ok($$ update public.profiles set role = 'admin' where user_id = '00000000-0000-4000-8000-0000000000a1' $$,
  '42501', null, 'A não altera o próprio papel');
select throws_ok($$ delete from public.profiles $$, '42501', null, 'A não exclui perfil');
select throws_ok($$ update public.authorized_emails set role = 'admin' $$, '42501', null, 'A não altera a lista');
select throws_ok($$ insert into public.profiles (user_id, email, role) values (gen_random_uuid(), 'x.teste@example.com', 'admin') $$,
  '42501', null, 'A não insere perfil');
select is(private.is_admin(), false, 'is_admin é falso para A');

-- Usuário B
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a2');
select is_empty($$ select 1 from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1' $$,
  'B não lê o perfil de A');
select results_eq($$ select user_id from public.profiles $$,
  $$ values ('00000000-0000-4000-8000-0000000000a2'::uuid) $$, 'B lê só o próprio perfil');
select lives_ok($$ delete from public.authorized_emails $$, 'B tenta excluir da lista, sem efeito');
reset role;
select is((select count(*) from public.authorized_emails where email like '%.teste@example.com'), 3::bigint,
  'a lista permanece intacta depois da tentativa de B');

-- Administrador: gerencia a lista, sem bypass sobre perfis alheios
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a0');
select results_eq($$ select email from public.authorized_emails where email like '%.teste@example.com' order by email $$,
  $$ values ('admin.teste@example.com'), ('usuario.a.teste@example.com'), ('usuario.b.teste@example.com') $$,
  'admin lê a lista');
select lives_ok($$ insert into public.authorized_emails (email, role) values ('novo.teste@example.com', 'user') $$,
  'admin insere na lista');
select results_eq($$ select email from public.authorized_emails where email = 'novo.teste@example.com' $$,
  $$ values ('novo.teste@example.com') $$, 'admin lê o e-mail inserido');
select throws_ok($$ insert into public.authorized_emails (email, role) values ('Maiuscula.Teste@Example.com', 'user') $$,
  '23514', null, 'a lista recusa e-mail fora do formato normalizado');
select throws_ok($$ update public.authorized_emails set role = 'admin' where email = 'novo.teste@example.com' $$,
  '42501', null, 'admin não altera linha da lista');
select lives_ok($$ delete from public.authorized_emails where email = 'novo.teste@example.com' $$,
  'admin exclui da lista');
select is_empty($$ select 1 from public.authorized_emails where email = 'novo.teste@example.com' $$,
  'o e-mail excluído saiu da lista');
select results_eq($$ select user_id from public.profiles $$,
  $$ values ('00000000-0000-4000-8000-0000000000a0'::uuid) $$, 'admin lê só o próprio perfil');
select throws_ok($$ update public.profiles set role = 'admin' where user_id = '00000000-0000-4000-8000-0000000000a1' $$,
  '42501', null, 'admin não altera perfil alheio');
select is(private.is_admin(), true, 'is_admin é verdadeiro para o admin');

-- Anônimo
reset role;
select pg_temp.act_as_anon();
select throws_ok($$ select 1 from public.profiles $$, '42501', null, 'anon não lê perfis');
select throws_ok($$ select 1 from public.authorized_emails $$, '42501', null, 'anon não lê a lista');
select throws_ok($$ insert into public.authorized_emails (email, role) values ('anon.teste@example.com', 'user') $$,
  '42501', null, 'anon não insere na lista');

-- Revogação (D1): remover da lista e excluir o usuário deixa o ex-usuário sem linhas
reset role;
select lives_ok($$
  delete from public.authorized_emails where email = 'usuario.a.teste@example.com';
  delete from auth.users where id = '00000000-0000-4000-8000-0000000000a1';
$$, 'procedimento de revogação executa');
select is_empty($$ select 1 from public.profiles where user_id = '00000000-0000-4000-8000-0000000000a1' $$,
  'o perfil do usuário excluído cai em cascata');
select pg_temp.act_as('00000000-0000-4000-8000-0000000000a1');
select is_empty($$ select 1 from public.profiles $$, 'o ex-usuário não lê perfis');
select is_empty($$ select 1 from public.authorized_emails $$, 'o ex-usuário não lê a lista');

select * from finish();
rollback;
