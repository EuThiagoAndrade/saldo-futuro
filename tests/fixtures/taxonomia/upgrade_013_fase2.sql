-- Carga fictícia do ensaio local de upgrade da ampliação da árvore (ciclo 014, issue #144). Roda sobre
-- o schema da migração da fase 2 do ciclo 013 (20261026215542), isto é, com a taxonomia de 39 nós,
-- só as funções novas e o legado de classes somente leitura, antes da migração da ampliação. Só
-- dados fictícios: e-mails em example.com e nomes inventados.
--
-- O estado tem ativos ligados a nós de nível 1, 2 e 3 (inclusive pais que vão ganhar filhos),
-- ativos sem classe, um com o legado, um desativado, eventos e um mês fechado por usuário. A
-- migração só insere nós no catálogo; o retrato integral antes e depois deve diferir apenas
-- pelos 94 nós novos.
--
-- Uso (contêiner local; sem conexão remota):
--   docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < upgrade_013_fase2.sql

insert into public.authorized_emails (email, role) values
  ('usuario.g1.ensaio@example.com', 'user'),
  ('usuario.g2.ensaio@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000e1', 'usuario.g1.ensaio@example.com'),
  ('00000000-0000-4000-8000-0000000000e2', 'usuario.g2.ensaio@example.com');

-- Legado do produto antigo (só leitura desde a fase 2): escrito aqui como dono do banco.
insert into public.classes_ativo (user_id, nome) values
  ('00000000-0000-4000-8000-0000000000e1', 'Fundos');

create function pg_temp.entrar(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
create function pg_temp.mes() returns date language sql as $$
  select (date_trunc('month', (now() at time zone 'America/Cuiaba')) - interval '3 months')::date;
$$;
create function pg_temp.aporte(p_ativo uuid, p_valor bigint) returns void language sql as $$
  select public.lancar_evento(p_ativo, pg_temp.mes() + 4, 'aporte', p_valor);
$$;

-- Usuário 1: nós de cada nível, inclusive pais que a ampliação completa com filhos.
select pg_temp.entrar('00000000-0000-4000-8000-0000000000e1');
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G1-01', 'rendimento', null, 'Banco Exemplo',
  'a5000000-0000-4000-8000-000000020000', null, null, null, null), 1000000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G1-02', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000020100', null, null, null, null), 2000000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G1-03', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000020201', null, null, null, true), 300000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G1-04', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000030200', true, null, null, null), 400000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G1-05', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000060100', null, null, null, null), 500000);
-- Sem classe, e um desativado sem posição.
select pg_temp.aporte(public.criar_ativo('Ativo G1-06', 'rendimento'), 60000);
select public.desativar_ativo(public.cadastrar_ativo_taxonomia('Ativo G1-07', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000050100', null, null, null, null));
-- Um ativo só com o legado (dica "antes: X"), como deixado pela janela do ciclo 013.
update public.ativos set classe_id = (select c.id from public.classes_ativo c
  where c.user_id = '00000000-0000-4000-8000-0000000000e1' and c.nome = 'Fundos')
where nome = 'Ativo G1-06';

-- Usuário 2.
select pg_temp.entrar('00000000-0000-4000-8000-0000000000e2');
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G2-01', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000040300', null, null, true, null), 250000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo G2-02', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000050202', null, null, null, null), 260000);

-- Fecha o mês inicial de cada usuário (saldo real igual ao calculado).
do $$
declare
  v_uid uuid;
begin
  for v_uid in select unnest(array['00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e2']::uuid[]) loop
    perform pg_temp.entrar(v_uid);
    perform public.fechar_mes(pg_temp.mes(), (
      select jsonb_object_agg(a.id, coalesce((select sum(e.valor) from public.eventos e where e.ativo_id = a.id), 0))
      from public.ativos a where a.user_id = v_uid and a.ativo and a.sistema is null
        and exists (select 1 from public.eventos e where e.ativo_id = a.id)));
  end loop;
end $$;
