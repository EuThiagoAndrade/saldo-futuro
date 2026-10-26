-- Consulta prévia do roteiro E2 (ciclo 013, issue #138): roda ANTES de aplicar a migração da fase
-- 2. Só contagens agregadas: nenhum nome, identificador ou grupo por usuário. A migração só retira
-- funções; estas contagens não podem mudar. As funções de classe aparecem aqui para comparar com
-- a consulta posterior.
select
  (select count(*) from public.classes_ativo) as classes_legadas,
  (select count(*) from public.ativos a where a.classe_id is not null) as ativos_com_legado,
  (select count(*) from public.ativos a where a.taxonomia_id is not null) as ativos_com_no,
  (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('criar_classe', 'renomear_classe', 'excluir_classe',
      'cadastrar_ativo', 'editar_detalhes_ativo')) as funcoes_antigas;
