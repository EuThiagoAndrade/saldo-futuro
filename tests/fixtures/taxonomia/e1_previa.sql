-- Consulta prévia do roteiro E1 (ciclo 013, issue #137): roda ANTES de aplicar a migração da
-- taxonomia, sobre o schema que ainda não tem taxonomia_id. Só contagens agregadas: nenhum nome,
-- identificador ou grupo por usuário. A normalização é a mesma de private.normalizar_nome (sem caixa,
-- sem acento e sem espaços nas pontas) e os oito nomes são os da equivalência mínima (D17).
-- "ficarao_sem_no" é a previsão de ativos comuns sem classe macro depois do preenchimento.
select
  (select count(*) from public.ativos a where a.sistema is null) as ativos_comuns,
  (select count(*) from public.ativos a where a.sistema = 'transito') as transito,
  (select count(*)
   from public.ativos a
   left join public.classes_ativo c on c.user_id = a.user_id and c.id = a.classe_id
   where a.sistema is null
     and not coalesce(lower(translate(btrim(c.nome),
       'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
       'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc')) in (
       'caixa e disponibilidades', 'renda fixa', 'renda variavel', 'investimentos no exterior',
       'criptoativos e ativos digitais', 'cripto', 'alternativos, moedas, outros', 'outros'), false)
  ) as ficarao_sem_no;
