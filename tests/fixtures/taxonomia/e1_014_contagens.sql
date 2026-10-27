-- Contagens do roteiro E1 do ciclo 014 (issue #144): rodam ANTES e DEPOIS de aplicar a migração da
-- ampliação da árvore. Só o catálogo global, que não tem dado de usuário. Esperado antes: 39 nós
-- (6, 21 e 12); depois: 133 (6, 23 e 104). amostra_original = 3 nas duas: três nós do ciclo 013
-- (um de cada nível) com o mesmo UUID e nome. A prova completa de que os 39 não mudam é o pgTAP 09 e
-- o ensaio local. Nenhuma consulta a ativos, perfis ou usuários.
select
  (select count(*) from public.taxonomia_ativos) as nos,
  (select count(*) from public.taxonomia_ativos where nivel = 1) as nivel_1,
  (select count(*) from public.taxonomia_ativos where nivel = 2) as nivel_2,
  (select count(*) from public.taxonomia_ativos where nivel = 3) as nivel_3,
  (select count(*) from public.taxonomia_ativos t
    join (values
      ('a5000000-0000-4000-8000-000000010000'::uuid, 'Caixa e disponibilidades'),
      ('a5000000-0000-4000-8000-000000020201'::uuid, 'CDB'),
      ('a5000000-0000-4000-8000-000000060500'::uuid, 'Outros alternativos')) o (id, nome)
      on o.id = t.id and o.nome = t.nome) as amostra_original;
