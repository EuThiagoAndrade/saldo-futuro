-- Retrato integral do ensaio local de upgrade (ciclo 013, issue #137, R1-6): uma linha por registro,
-- em JSON, de tudo o que não pode mudar com a migração da taxonomia. De ativos e profiles sai só a
-- coluna nova (taxonomia_id e versao_classificacao). Roda antes e depois; a saída das duas execuções
-- deve ser idêntica (diff). Só dados fictícios do próprio ensaio.
select 'ativos|' || (to_jsonb(t) - 'taxonomia_id')::text from public.ativos t
union all select 'profiles|' || (to_jsonb(t) - 'versao_classificacao')::text from public.profiles t
union all select 'eventos|' || to_jsonb(t)::text from public.eventos t
union all select 'transferencias|' || to_jsonb(t)::text from public.transferencias t
union all select 'consolidados_mensais|' || to_jsonb(t)::text from public.consolidados_mensais t
union all select 'posicoes_mensais|' || to_jsonb(t)::text from public.posicoes_mensais t
union all select 'instituicoes|' || to_jsonb(t)::text from public.instituicoes t
union all select 'classes_ativo|' || to_jsonb(t)::text from public.classes_ativo t
order by 1;
