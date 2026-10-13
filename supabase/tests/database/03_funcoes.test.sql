-- Regras de função (G2): search_path fixo e EXECUTE só para os papéis previstos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and p.prokind = 'f'
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c = 'search_path=""') $$,
  'toda função de public e private tem search_path fixo e vazio');

select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and p.prokind = 'f'
       and exists (
         select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
         where a.grantee = 0 and a.privilege_type = 'EXECUTE') $$,
  'nenhuma função de public e private é executável por PUBLIC');

select is_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and p.prokind = 'f'
       and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or (has_function_privilege('authenticated', p.oid, 'EXECUTE') and p.proname <> 'is_admin')) $$,
  'anon e authenticated só executam as funções previstas');

select function_privs_are('private', 'is_admin', array[]::name[], 'authenticated', array['EXECUTE'],
  'authenticated executa is_admin');
select function_privs_are('private', 'before_user_created', array['jsonb']::name[], 'supabase_auth_admin',
  array['EXECUTE'], 'supabase_auth_admin executa o hook');
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname in ('is_admin', 'handle_new_user') and not p.prosecdef $$,
  'is_admin e handle_new_user são security definer');

select * from finish();
rollback;
