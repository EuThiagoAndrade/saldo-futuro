-- Somente no projeto local descartável, depois da migração do ciclo 018. Confere cada caso da tabela
-- de D18 e o retrato integral do resto (só `veiculos_acesso` e `previdencia` dos ativos podem mudar).
DO $$ begin
  if (select linhas from private.retrato_upgrade_182) is distinct from jsonb_build_object(
    'ativos', (select coalesce(jsonb_agg(x.l order by x.l::text),'[]'::jsonb) from (select to_jsonb(a) - array['veiculos_acesso','previdencia'] as l from public.ativos a) x),
    'eventos', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.eventos x),
    'transferencias', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.transferencias x),
    'consolidados_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.consolidados_mensais x),
    'posicoes_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.posicoes_mensais x),
    'instituicoes', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.instituicoes x),
    'profiles', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.profiles x))
  then raise exception 'retrato financeiro/descritivo divergente'; end if;
  if exists (select 1 from private.casos_upgrade_182 c join public.ativos a on a.nome = c.nome
             where a.veiculos_acesso is distinct from c.esperado or a.previdencia is not null) then
    raise exception 'caso de conversão divergente da tabela de D18';
  end if;
  if exists (select 1 from public.ativos where previdencia is not null) then raise exception 'sobrou indicador não nulo'; end if;
end $$;
select 'retrato integral preservado e casos de D18 convertidos' as resultado;
select a.nome, a.veiculos_acesso::text from public.ativos a join private.casos_upgrade_182 c on c.nome = a.nome order by a.nome;
-- Depois da migração, o código novo é aceito e o indicador não nulo é recusado.
select set_config('request.jwt.claims','{"sub":"18200000-0000-4000-8000-000000000008","role":"authenticated"}',false);
select public.editar_ativo_com_atributos((select id from public.ativos where nome = 'Nulo fictício'), 'Nulo fictício',
  null, null, null, null, null, null, null, '{direto,previdencia}', '{}', null, null, null, null, null);
select veiculos_acesso::text = '{direto,previdencia}' as codigo_novo_aceito from public.ativos where nome = 'Nulo fictício';
DO $$ begin
  perform public.editar_ativo_com_nome((select id from public.ativos where nome = 'Nulo fictício'), 'Nulo fictício',
    null, null, null, true, null, null, null);
  raise exception 'o indicador não nulo foi aceito depois da migração';
exception when check_violation then null;
end $$;
select 'indicador não nulo recusado' as resultado;
