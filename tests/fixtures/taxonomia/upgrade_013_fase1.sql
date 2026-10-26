-- Carga fictícia do ensaio local de upgrade da fase 2 (ciclo 013, issue #138). Roda sobre o schema
-- da migração da fase 1 (20261026204955), isto é, com a taxonomia global, as funções novas e as
-- antigas ainda disponíveis (janela de transição), antes da migração da fase 2. Só dados
-- fictícios: e-mails em example.com e nomes inventados.
--
-- O estado reproduz o que a janela produz: classes do usuário criadas pelo produto antigo, ativos
-- cadastrados e editados pelas funções antigas (sem nó, "Sem classe" com a dica do legado), ativos
-- cadastrados pelas funções novas (com nó, de qualquer nível) e um ativo mapeado e depois editado
-- pela tela antiga (nó zerado). Há eventos e um mês fechado por usuário.
--
-- Uso (contêiner local; sem conexão remota):
--   docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < upgrade_013_fase1.sql

insert into public.authorized_emails (email, role) values
  ('usuario.f1.ensaio@example.com', 'user'),
  ('usuario.f2.ensaio@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000f1', 'usuario.f1.ensaio@example.com'),
  ('00000000-0000-4000-8000-0000000000f2', 'usuario.f2.ensaio@example.com');

-- Perfis novos nascem sem classes (fim das sementes, fase 1): o legado vem do produto antigo.
insert into public.classes_ativo (user_id, nome) values
  ('00000000-0000-4000-8000-0000000000f1', 'Renda fixa'),
  ('00000000-0000-4000-8000-0000000000f1', 'Fundos'),
  ('00000000-0000-4000-8000-0000000000f1', 'Ações'),
  ('00000000-0000-4000-8000-0000000000f2', 'Fundos');

create function pg_temp.entrar(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
create function pg_temp.mes() returns date language sql as $$
  select (date_trunc('month', (now() at time zone 'America/Cuiaba')) - interval '3 months')::date;
$$;
create function pg_temp.classe(p_uid uuid, p_nome text) returns uuid language sql as $$
  select c.id from public.classes_ativo c where c.user_id = p_uid and c.nome = p_nome;
$$;
create function pg_temp.aporte(p_ativo uuid, p_valor bigint) returns void language sql as $$
  select public.lancar_evento(p_ativo, pg_temp.mes() + 4, 'aporte', p_valor);
$$;

-- Usuário 1.
select pg_temp.entrar('00000000-0000-4000-8000-0000000000f1');
-- Cadastro e edição antigos (janela): ficam com o legado e sem nó.
select pg_temp.aporte(public.cadastrar_ativo('Ativo F1-01', 'rendimento', null, 'Banco Exemplo',
  pg_temp.classe('00000000-0000-4000-8000-0000000000f1', 'Fundos'), null, null, true, null, null), 1000000);
select pg_temp.aporte(public.cadastrar_ativo('Ativo F1-02', 'marcacao', null, null, null, 'Classe criada na janela',
  null, null, null, null), 2000000);
-- Cadastro novo, com nó de cada nível.
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo F1-03', 'rendimento', null, 'Banco Exemplo',
  'a5000000-0000-4000-8000-000000020000', null, null, null, null), 300000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo F1-04', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000020200', null, null, null, true), 400000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo F1-05', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000030101', true, null, null, null), 500000);
-- Mapeado e depois editado pela tela antiga: nó zerado, legado gravado, marca incrementada.
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo F1-06', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000060100', null, null, null, null), 600000);
select public.editar_detalhes_ativo(a.id, null, null, pg_temp.classe('00000000-0000-4000-8000-0000000000f1', 'Ações'), null,
  null, null, null, null) from public.ativos a where a.nome = 'Ativo F1-06';
-- Sem classe nenhuma, e um desativado sem posição.
select pg_temp.aporte(public.criar_ativo('Ativo F1-07', 'rendimento'), 70000);
select public.desativar_ativo(public.cadastrar_ativo_taxonomia('Ativo F1-08', 'rendimento', null, null,
  'a5000000-0000-4000-8000-000000010100', null, null, null, null));

-- Usuário 2.
select pg_temp.entrar('00000000-0000-4000-8000-0000000000f2');
select pg_temp.aporte(public.cadastrar_ativo('Ativo F2-01', 'rendimento', null, null,
  pg_temp.classe('00000000-0000-4000-8000-0000000000f2', 'Fundos'), null, null, null, null, null), 250000);
select pg_temp.aporte(public.cadastrar_ativo_taxonomia('Ativo F2-02', 'marcacao', null, null,
  'a5000000-0000-4000-8000-000000050202', null, null, null, null), 260000);

-- Fecha o mês inicial de cada usuário (saldo real igual ao calculado).
do $$
declare
  v_uid uuid;
begin
  for v_uid in select unnest(array['00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000f2']::uuid[]) loop
    perform pg_temp.entrar(v_uid);
    perform public.fechar_mes(pg_temp.mes(), (
      select jsonb_object_agg(a.id, coalesce((select sum(e.valor) from public.eventos e where e.ativo_id = a.id), 0))
      from public.ativos a where a.user_id = v_uid and a.ativo and a.sistema is null
        and exists (select 1 from public.eventos e where e.ativo_id = a.id)));
  end loop;
end $$;
