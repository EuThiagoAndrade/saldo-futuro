-- Somente no projeto local descartável saldo-futuro-issue172-upgrade, antes da migração do ciclo 017.
-- Usuário, instituição, classe, indicadores, aporte e fechamento fictícios; guarda o retrato integral.
insert into public.authorized_emails(email,role) values ('upgrade172@example.com','user');
insert into auth.users(id,email) values ('17200000-0000-4000-8000-000000000008','upgrade172@example.com');
select set_config('request.jwt.claims','{"sub":"17200000-0000-4000-8000-000000000008","role":"authenticated"}',false);
select set_config('teste.ativo',public.cadastrar_ativo_taxonomia('Ativo fictício de upgrade','rendimento',null,'Instituição fictícia de upgrade','a5000000-0000-4000-8000-000000020000',true,false,null,true)::text,false);
select set_config('teste.desativado',public.criar_ativo('Ativo fictício desativado','rendimento')::text,false);
select public.lancar_evento(current_setting('teste.ativo')::uuid,'2025-01-02','aporte',100000);
select public.fechar_mes('2025-01-01',jsonb_build_object(current_setting('teste.ativo'),100100));
select public.desativar_ativo(current_setting('teste.desativado')::uuid);
create table private.retrato_upgrade_172 as select jsonb_build_object('ativos', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.ativos x),'eventos', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.eventos x),'transferencias', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.transferencias x),'consolidados_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.consolidados_mensais x),'posicoes_mensais', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.posicoes_mensais x),'instituicoes', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.instituicoes x),'classes_ativo', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.classes_ativo x),'profiles', (select coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]'::jsonb) from public.profiles x)) as linhas;
select 'retrato anterior guardado' as resultado;
