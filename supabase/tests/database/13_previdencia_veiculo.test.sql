-- Ciclo 018, issue #182 (D18): Previdência como opção do veículo de acesso. Catálogo, conversão de
-- cada caso da tabela de D18, idempotência, ativos desativados, trânsito, marcas do Início, restrição
-- do legado e recusa pelas funções antigas e novas. Somente dados fictícios.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
create function pg_temp.act_as(p_sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
-- Código do erro (SQLSTATE) de um comando, ou 'ok'.
create function pg_temp.estado(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
create function pg_temp.veiculos(p_nome text) returns text language sql as $$
  select veiculos_acesso::text || '|' || coalesce(previdencia::text, 'nulo') from public.ativos where id = pg_temp.id(p_nome);
$$;

insert into public.authorized_emails(email,role) values ('previdencia1@example.com','user');
insert into auth.users(id,email) values ('18200000-0000-4000-8000-000000000001','previdencia1@example.com');
insert into public.authorized_emails(email,role) values ('previdencia2@example.com','user');
insert into auth.users(id,email) values ('18200000-0000-4000-8000-000000000002','previdencia2@example.com');

-- Catálogo: previdencia entre etf e plano_contrato; Não se aplica continua exclusivo.
select is(private.canonizar_veiculos_acesso('{plano_contrato,previdencia,etf}'), '{etf,previdencia,plano_contrato}'::text[], 'previdencia na ordem do catálogo');
select is(private.canonizar_veiculos_acesso('{previdencia,nao_aplicavel}'), null::text[], 'Não se aplica continua exclusivo');
select is(private.canonizar_veiculos_acesso('{fundo,etf}'), '{fundo,etf}'::text[], 'conjuntos antigos continuam canônicos');

-- Dados de partida, gravados pelo usuário 1 com o indicador nulo (o único aceito agora).
select pg_temp.act_as('18200000-0000-4000-8000-000000000001');
select pg_temp.guarda('vazio', public.cadastrar_ativo_com_atributos('Vazio','rendimento',null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null));
select pg_temp.guarda('fundo', public.cadastrar_ativo_com_atributos('Fundo','rendimento',null,null,null,null,null,null,null,'{fundo}','{}',null,null,null,null,null));
select pg_temp.guarda('plano', public.cadastrar_ativo_com_atributos('Plano','rendimento',null,null,null,null,null,null,null,'{plano_contrato}','{}',null,null,null,null,null));
select pg_temp.guarda('fundo_plano', public.cadastrar_ativo_com_atributos('Fundo e plano','rendimento',null,null,null,null,null,null,null,'{fundo,plano_contrato}','{}',null,null,null,null,null));
select pg_temp.guarda('nao_aplica', public.cadastrar_ativo_com_atributos('Não se aplica','rendimento',null,null,null,null,null,null,null,'{nao_aplicavel}','{}',null,null,null,null,null));
select pg_temp.guarda('ja', public.cadastrar_ativo_com_atributos('Já convertido','rendimento',null,null,null,null,null,null,null,'{fundo,previdencia}','{}',null,null,null,null,null));
select pg_temp.guarda('nao', public.cadastrar_ativo_com_atributos('Não','rendimento',null,null,null,null,null,null,null,'{etf}','{}',null,null,null,null,null));
select pg_temp.guarda('nulo', public.cadastrar_ativo_com_atributos('Nulo','rendimento',null,null,null,null,null,null,null,'{direto}','{}',null,null,null,null,null));
select pg_temp.guarda('desativado', public.cadastrar_ativo_com_atributos('Desativado','rendimento',null,null,null,null,null,null,null,'{plano_contrato}','{}',null,null,null,null,null));
select public.desativar_ativo(pg_temp.id('desativado'));
select is(pg_temp.veiculos('ja'), '{fundo,previdencia}|nulo', 'o cadastro novo aceita Previdência no veículo');

-- Restrição do legado: as funções antigas e novas recusam o indicador não nulo, inclusive "Não".
select is(pg_temp.estado($$select public.editar_ativo_com_atributos(pg_temp.id('vazio'),'Vazio',null,null,null,true,null,null,null,'{}','{}',null,null,null,null,null)$$),'23514','função nova recusa Sim no indicador');
select is(pg_temp.estado($$select public.editar_ativo_com_atributos(pg_temp.id('vazio'),'Vazio',null,null,null,false,null,null,null,'{}','{}',null,null,null,null,null)$$),'23514','função nova recusa Não no indicador');
select is(pg_temp.estado($$select public.editar_ativo_com_nome(pg_temp.id('vazio'),'Vazio',null,null,null,true,null,null,null)$$),'23514','editar_ativo_com_nome recusa');
select is(pg_temp.estado($$select public.editar_detalhes_ativo_taxonomia(pg_temp.id('vazio'),null,null,null,false,null,null,null)$$),'23514','editar_detalhes_ativo_taxonomia recusa');
select is(pg_temp.estado($$select public.cadastrar_ativo_taxonomia('Recusado','rendimento',null,null,null,true,null,null,null)$$),'23514','cadastrar_ativo_taxonomia recusa');
select is(pg_temp.estado($$select public.cadastrar_ativo_com_atributos('Recusado','rendimento',null,null,null,false,null,null,null,'{}','{}',null,null,null,null,null)$$),'23514','cadastrar_ativo_com_atributos recusa');
select is((select count(*) from public.ativos where nome = 'Recusado'), 0::bigint, 'nenhum cadastro recusado ficou gravado');
select is(pg_temp.estado($$select public.editar_ativo_com_atributos(pg_temp.id('vazio'),'Vazio',null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),'ok','indicador nulo continua aceito');
reset role;

-- Conversão: o legado é posto direto (sem a restrição, só dentro deste teste) e convertido pela
-- função da migração; o outro usuário também é convertido, sem tocar nos ativos do primeiro.
select pg_temp.act_as('18200000-0000-4000-8000-000000000002');
select pg_temp.guarda('outro', public.cadastrar_ativo_com_atributos('Outro dono','rendimento',null,null,null,null,null,null,null,'{fundo}','{}',null,null,null,null,null));
reset role;
alter table public.ativos drop constraint ativos_previdencia_legado_check;
update public.ativos set previdencia = true
  where id in (pg_temp.id('vazio'), pg_temp.id('fundo'), pg_temp.id('plano'), pg_temp.id('fundo_plano'),
    pg_temp.id('nao_aplica'), pg_temp.id('ja'), pg_temp.id('desativado'), pg_temp.id('outro'));
update public.ativos set previdencia = false where id = pg_temp.id('nao');
select set_config('teste.metadados', (select versao_metadados::text from public.profiles where user_id = '18200000-0000-4000-8000-000000000001'), true);
select set_config('teste.classificacao', (select versao_classificacao::text from public.profiles where user_id = '18200000-0000-4000-8000-000000000001'), true);
select set_config('teste.transito', (select to_jsonb(a)::text from public.ativos a where a.user_id = '18200000-0000-4000-8000-000000000001' and a.sistema = 'transito'), true);

select private.converter_previdencia_em_veiculo();
select is(pg_temp.veiculos('vazio'), '{previdencia}|nulo', 'Sim com veículo vazio vira Previdência');
select is(pg_temp.veiculos('fundo'), '{fundo,previdencia}|nulo', 'Sim com Fundo acrescenta Previdência na ordem');
select is(pg_temp.veiculos('plano'), '{previdencia}|nulo', 'Plano ou contrato é trocado por Previdência');
select is(pg_temp.veiculos('fundo_plano'), '{fundo,previdencia}|nulo', 'Fundo e Plano ou contrato: sai o plano, entra Previdência');
select is(pg_temp.veiculos('nao_aplica'), '{previdencia}|nulo', 'Não se aplica é trocado por Previdência');
select is(pg_temp.veiculos('ja'), '{fundo,previdencia}|nulo', 'já convertido não duplica');
select is(pg_temp.veiculos('nao'), '{etf}|nulo', 'Não só zera o indicador');
select is(pg_temp.veiculos('nulo'), '{direto}|nulo', 'Não informado não muda');
select is(pg_temp.veiculos('desativado'), '{previdencia}|nulo', 'ativo desativado também é convertido');
select is((select ativo from public.ativos where id = pg_temp.id('desativado')), false, 'e continua desativado');
select is(pg_temp.veiculos('outro'), '{fundo,previdencia}|nulo', 'outro usuário é convertido no próprio ativo');
select is((select to_jsonb(a)::text from public.ativos a where a.user_id = '18200000-0000-4000-8000-000000000001' and a.sistema = 'transito'),
  current_setting('teste.transito'), 'o trânsito fica intocado');
select is((select versao_metadados::text from public.profiles where user_id = '18200000-0000-4000-8000-000000000001'), current_setting('teste.metadados'), 'a conversão não mexe na marca de metadados');
select is((select versao_classificacao::text from public.profiles where user_id = '18200000-0000-4000-8000-000000000001'), current_setting('teste.classificacao'), 'nem na marca de classificação');

-- Idempotência e retorno da restrição.
select set_config('teste.depois', (select jsonb_agg(to_jsonb(a) order by a.id)::text from public.ativos a), true);
select private.converter_previdencia_em_veiculo();
select is((select jsonb_agg(to_jsonb(a) order by a.id)::text from public.ativos a), current_setting('teste.depois'), 'reexecutar a conversão não muda nada');
select is_empty($$select 1 from public.ativos a where private.canonizar_veiculos_acesso(a.veiculos_acesso) is distinct from a.veiculos_acesso$$, 'todos os conjuntos seguem canônicos');
select lives_ok($$alter table public.ativos add constraint ativos_previdencia_legado_check check (previdencia is null)$$, 'a restrição do legado volta a valer sobre os dados convertidos');

-- Fora da Data API.
select ok(not has_function_privilege('authenticated', 'private.converter_previdencia_em_veiculo()', 'execute'), 'authenticated não executa a conversão');
select ok(not has_function_privilege('anon', 'private.converter_previdencia_em_veiculo()', 'execute'), 'anon não executa a conversão');
select * from finish();
rollback;
