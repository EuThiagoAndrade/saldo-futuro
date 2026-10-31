-- Somente no projeto local descartável saldo-futuro-issue182-upgrade, antes da migração do ciclo 018.
-- Ativos fictícios com o indicador Previdência em todos os casos da tabela de D18, eventos e fechamento;
-- simula a tela nova editando antes da migração (o campo oculto devolve o "Sim") e guarda o retrato.
insert into public.authorized_emails(email,role) values ('upgrade182@example.com','user');
insert into auth.users(id,email) values ('18200000-0000-4000-8000-000000000008','upgrade182@example.com');
select set_config('request.jwt.claims','{"sub":"18200000-0000-4000-8000-000000000008","role":"authenticated"}',false);
create table private.casos_upgrade_182 (nome text primary key, previdencia boolean, veiculos text[], esperado text[]);
insert into private.casos_upgrade_182 values
  ('Vazio fictício', true, '{}', '{previdencia}'),
  ('Fundo fictício', true, '{fundo}', '{fundo,previdencia}'),
  ('Plano fictício', true, '{plano_contrato}', '{previdencia}'),
  ('Fundo e plano fictício', true, '{fundo,plano_contrato}', '{fundo,previdencia}'),
  ('Não se aplica fictício', true, '{nao_aplicavel}', '{previdencia}'),
  ('Não fictício', false, '{etf}', '{etf}'),
  ('Nulo fictício', null, '{direto}', '{direto}'),
  ('Desativado fictício', true, '{plano_contrato}', '{previdencia}');
select public.cadastrar_ativo_com_atributos(c.nome, 'rendimento', null, null, null, c.previdencia, null, null, null,
  c.veiculos, '{}', null, null, null, null, null) from private.casos_upgrade_182 c;
select set_config('teste.fundo', (select id::text from public.ativos where nome = 'Fundo fictício'), false);
select public.lancar_evento(current_setting('teste.fundo')::uuid, '2025-01-02', 'aporte', 100000);
select public.fechar_mes('2025-01-01', jsonb_build_object(current_setting('teste.fundo'), 100100));
select public.desativar_ativo((select id from public.ativos where nome = 'Desativado fictício'));
-- A tela nova, antes da migração, edita um ativo com "Sim": o campo oculto devolve o valor sem alterá-lo.
select public.editar_ativo_com_atributos((select id from public.ativos where nome = 'Plano fictício'), 'Plano fictício',
  null, null, null, true, null, null, null, '{plano_contrato}', '{}', 'previdencia_regressivo', null, null, null, null);
select (select previdencia from public.ativos where nome = 'Plano fictício') as sim_preservado_antes_da_migracao;
-- Antes da migração, o banco ainda recusa o código novo no veículo, sem gravar nada.
DO $$ begin
  perform public.editar_ativo_com_atributos((select id from public.ativos where nome = 'Nulo fictício'), 'Nulo fictício',
    null, null, null, null, null, null, null, '{previdencia}', '{}', null, null, null, null, null);
  raise exception 'o código novo foi aceito antes da migração';
exception when others then
  if sqlerrm <> 'recusado_veiculos_acesso' then raise; end if;
end $$;
update private.casos_upgrade_182 set veiculos = '{plano_contrato}' where nome = 'Plano fictício';
create table private.retrato_upgrade_182 as select jsonb_build_object(
  'ativos', (select coalesce(jsonb_agg(x.l order by x.l::text),'[]'::jsonb) from (select to_jsonb(a) - array['veiculos_acesso','previdencia'] as l from public.ativos a) x),
  'eventos', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.eventos x),
  'transferencias', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.transferencias x),
  'consolidados_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.consolidados_mensais x),
  'posicoes_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.posicoes_mensais x),
  'instituicoes', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.instituicoes x),
  'profiles', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.profiles x)) as linhas;
select 'retrato anterior guardado' as resultado;
