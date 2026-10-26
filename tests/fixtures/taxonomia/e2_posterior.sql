-- Consulta posterior do roteiro E2 (ciclo 013, issue #138): roda DEPOIS de aplicar a migração da
-- fase 2. Só contagens agregadas. Esperado: classes_legadas, ativos_com_legado, ativos_com_no e
-- ativos_comuns iguais aos da consulta prévia; funcoes_antigas = 0; funcoes_novas = 3;
-- auxiliar_antigo = 0; escrita_no_legado = 0 (nenhum privilégio de escrita em classes_ativo para
-- os papéis da Data API) e leitura_do_legado = 1 (só authenticated lê).
select
  (select count(*) from public.classes_ativo) as classes_legadas,
  (select count(*) from public.ativos a where a.classe_id is not null) as ativos_com_legado,
  (select count(*) from public.ativos a where a.taxonomia_id is not null) as ativos_com_no,
  (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('criar_classe', 'renomear_classe', 'excluir_classe',
      'cadastrar_ativo', 'editar_detalhes_ativo')) as funcoes_antigas,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('cadastrar_ativo_taxonomia', 'editar_detalhes_ativo_taxonomia',
      'ler_versao_classificacao')) as funcoes_novas,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'resolver_classe') as auxiliar_antigo,
  (select count(*) from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = 'classes_ativo'
      and g.grantee in ('anon', 'authenticated', 'service_role', 'public') and g.privilege_type <> 'SELECT') as escrita_no_legado,
  (select count(*) from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = 'classes_ativo'
      and g.grantee in ('anon', 'authenticated', 'service_role', 'public') and g.privilege_type = 'SELECT') as leitura_do_legado;
