-- Consulta posterior do roteiro E1 (ciclo 013, issue #137): roda DEPOIS de aplicar a migração da
-- taxonomia. Só contagens agregadas. Esperado: ativos_comuns e transito iguais aos da consulta
-- prévia; sem_no igual a ficarao_sem_no; transito_sem_no igual a transito; nos_do_catalogo = 39.
-- Essas contagens não provam, sozinhas, que nenhum dado financeiro mudou (R1-7).
select
  (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
  (select count(*) from public.ativos a where a.sistema is null and a.taxonomia_id is null) as sem_no,
  (select count(*) from public.ativos a where a.sistema = 'transito') as transito,
  (select count(*) from public.ativos a where a.sistema = 'transito' and a.taxonomia_id is null) as transito_sem_no,
  (select count(*) from public.taxonomia_ativos) as nos_do_catalogo;
