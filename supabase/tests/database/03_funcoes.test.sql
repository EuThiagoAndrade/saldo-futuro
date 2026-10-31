-- Regras de função (G2): search_path fixo e EXECUTE só para os papéis previstos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

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
       and ((has_function_privilege('anon', p.oid, 'EXECUTE') and p.oid <> 'public.keepalive()'::regprocedure)
         or (has_function_privilege('authenticated', p.oid, 'EXECUTE') and p.oid::regprocedure::text <> all (array[
           'private.is_admin()',
           'criar_ativo(text,tipo_ajuste)',
           'desativar_ativo(uuid)',
           'lancar_evento(uuid,date,tipo_evento,bigint)',
           'lancar_migracao_transito(date,bigint)',
           'estornar_evento(uuid,date)',
           'transferir(uuid,uuid,date,bigint)',
           'corrigir_transferencia(uuid,date)',
           'fechar_mes(date,jsonb)',
           'reabrir_mes(date)',
           'carregar_benchmark(uuid,date,date,jsonb)',
           'criar_instituicao(text)',
           'renomear_instituicao(uuid,text)',
           'excluir_instituicao(uuid)',
           'cadastrar_ativo_taxonomia(text,tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean)',
           'editar_detalhes_ativo_taxonomia(uuid,uuid,text,uuid,boolean,boolean,boolean,boolean)',
           'ler_versao_classificacao()', 'ler_versao_metadados()',
           'editar_ativo_com_nome(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean)',
           'cadastrar_ativo_com_atributos(text,tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)',
           'editar_ativo_com_atributos(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)']))) $$,
  'anon e authenticated só executam as funções previstas (lista explícita de assinaturas)');

-- A lista é fechada: uma função nova executável por authenticated reprova a asserção acima.
create function public.funcao_nao_listada() returns integer language sql set search_path = '' as $$ select 1 $$;
revoke execute on function public.funcao_nao_listada() from public, anon;
grant execute on function public.funcao_nao_listada() to authenticated;
select isnt_empty(
  $$ select p.oid::regprocedure
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and has_function_privilege('authenticated', p.oid, 'EXECUTE')
       and p.oid::regprocedure::text <> all (array[
         'criar_ativo(text,tipo_ajuste)', 'desativar_ativo(uuid)', 'lancar_evento(uuid,date,tipo_evento,bigint)',
         'lancar_migracao_transito(date,bigint)', 'estornar_evento(uuid,date)', 'transferir(uuid,uuid,date,bigint)',
         'corrigir_transferencia(uuid,date)', 'fechar_mes(date,jsonb)', 'reabrir_mes(date)',
         'carregar_benchmark(uuid,date,date,jsonb)', 'criar_instituicao(text)', 'renomear_instituicao(uuid,text)',
         'excluir_instituicao(uuid)',
         'cadastrar_ativo_taxonomia(text,tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean)',
         'editar_detalhes_ativo_taxonomia(uuid,uuid,text,uuid,boolean,boolean,boolean,boolean)',
         'ler_versao_classificacao()', 'ler_versao_metadados()',
           'editar_ativo_com_nome(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean)',
           'cadastrar_ativo_com_atributos(text,tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)',
           'editar_ativo_com_atributos(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)']) $$,
  'uma função fora da lista executável por authenticated é detectada');
drop function public.funcao_nao_listada();

-- Funções de escrita da carteira (D13): security definer e fora do alcance de anon.
select is_empty(
  $$ select p.oid::regprocedure from pg_proc p
     where p.oid in ('public.criar_ativo(text,public.tipo_ajuste)'::regprocedure,
       'public.desativar_ativo(uuid)'::regprocedure,
       'public.lancar_evento(uuid,date,public.tipo_evento,bigint)'::regprocedure,
       'public.lancar_migracao_transito(date,bigint)'::regprocedure,
       'public.estornar_evento(uuid,date)'::regprocedure, 'public.transferir(uuid,uuid,date,bigint)'::regprocedure,
       'public.corrigir_transferencia(uuid,date)'::regprocedure, 'public.fechar_mes(date,jsonb)'::regprocedure,
       'public.reabrir_mes(date)'::regprocedure, 'public.carregar_benchmark(uuid,date,date,jsonb)'::regprocedure,
       'public.criar_instituicao(text)'::regprocedure, 'public.renomear_instituicao(uuid,text)'::regprocedure,
       'public.excluir_instituicao(uuid)'::regprocedure,
       'public.cadastrar_ativo_taxonomia(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean)'::regprocedure,
       'public.editar_detalhes_ativo_taxonomia(uuid,uuid,text,uuid,boolean,boolean,boolean,boolean)'::regprocedure,
       'public.cadastrar_ativo_com_atributos(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)'::regprocedure,
       'public.editar_ativo_com_atributos(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)'::regprocedure)
       and (not p.prosecdef or has_function_privilege('anon', p.oid, 'EXECUTE')) $$,
  'as funções da carteira, dos metadados e da taxonomia dos ativos e a carga de benchmark são security definer e anon não as executa');
select is_empty(
  $$ select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname in ('travar_carteira', 'hoje', 'ultimo_mes_fechado',
       'conferir_data_lancamento', 'saldo_atual', 'apurar_mes', 'na_faixa', 'benchmark_imutavel',
       'conferir_nome', 'resolver_instituicao', 'normalizar_nome', 'taxonomia_equivalente',
       'versao_classificacao_ativo', 'canonizar_conjunto', 'canonizar_veiculos_acesso',
       'canonizar_indexadores_remuneracao', 'regime_tributario_valido', 'cobertura_fgc_valida', 'prazo_resgate_valido',
       'gravar_atributos_ativo')
       and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE')) $$,
  'os auxiliares da carteira, dos metadados, da taxonomia e dos benchmarks em private não são executáveis pela Data API');

select function_privs_are('private', 'is_admin', array[]::name[], 'authenticated', array['EXECUTE'],
  'authenticated executa is_admin');
select function_privs_are('private', 'before_user_created', array['jsonb']::name[], 'supabase_auth_admin',
  array['EXECUTE'], 'supabase_auth_admin executa o hook');
select is_empty(
  $$ select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname in ('is_admin', 'handle_new_user') and not p.prosecdef $$,
  'is_admin e handle_new_user são security definer');

-- public.keepalive(): consulta trivial para o cron, sem acesso a tabela
select function_privs_are('public', 'keepalive', array[]::name[], 'anon', array['EXECUTE'],
  'anon executa keepalive');
select function_privs_are('public', 'keepalive', array[]::name[], 'authenticated', array[]::text[],
  'authenticated não executa keepalive');
select is((select prosecdef from pg_proc where oid = 'public.keepalive()'::regprocedure), false,
  'keepalive é security invoker');
select is_empty(
  $$ select 1 from pg_proc where oid = 'public.keepalive()'::regprocedure
     and prosrc ~* '\m(from|join|into|update|delete)\M' $$,
  'keepalive não referencia tabela no corpo');
select is_empty(
  $$ select 1 from pg_depend d
     where d.classid = 'pg_proc'::regclass and d.objid = 'public.keepalive()'::regprocedure
       and d.refclassid = 'pg_class'::regclass $$,
  'keepalive não depende de nenhuma tabela');
set local role anon;
select is(public.keepalive(), 1, 'anon chama keepalive e recebe 1');
reset role;

select * from finish();
rollback;
