-- Retrato integral do ensaio local de upgrade da fase 2 (ciclo 013, issue #138): uma linha por
-- registro, em JSON, de todas as tabelas de dados e do catálogo, sem excluir nenhuma coluna. A
-- migração da fase 2 só retira funções, então a saída antes e depois deve ser idêntica (diff),
-- inclusive o legado classes_ativo, ativos.classe_id e a marca versao_classificacao. Só dados
-- fictícios do próprio ensaio.
select 'ativos|' || to_jsonb(t)::text from public.ativos t
union all select 'profiles|' || to_jsonb(t)::text from public.profiles t
union all select 'eventos|' || to_jsonb(t)::text from public.eventos t
union all select 'transferencias|' || to_jsonb(t)::text from public.transferencias t
union all select 'consolidados_mensais|' || to_jsonb(t)::text from public.consolidados_mensais t
union all select 'posicoes_mensais|' || to_jsonb(t)::text from public.posicoes_mensais t
union all select 'instituicoes|' || to_jsonb(t)::text from public.instituicoes t
union all select 'classes_ativo|' || to_jsonb(t)::text from public.classes_ativo t
union all select 'taxonomia_ativos|' || to_jsonb(t)::text from public.taxonomia_ativos t
order by 1;
