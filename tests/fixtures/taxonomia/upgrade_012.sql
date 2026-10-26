-- Carga fictícia do ensaio local de upgrade (ciclo 013, issue #137, R1-6). Roda sobre o schema da
-- última migração do ciclo 012 (20261024000829), ainda sem taxonomia_id, num Supabase local
-- descartável. Só dados fictícios: e-mails em example.com e nomes inventados. Cada usuário nasce
-- com as cinco classes iniciais (gatilho do ciclo 012); o resto é criado como o produto criaria,
-- pelas funções, com variações de caixa, acento e espaços nos nomes das classes.
--
-- Uso (contêiner local; sem conexão remota):
--   docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < upgrade_012.sql

insert into public.authorized_emails (email, role) values
  ('usuario.e1.ensaio@example.com', 'user'),
  ('usuario.e2.ensaio@example.com', 'user'),
  ('usuario.e3.ensaio@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000e1', 'usuario.e1.ensaio@example.com'),
  ('00000000-0000-4000-8000-0000000000e2', 'usuario.e2.ensaio@example.com'),
  ('00000000-0000-4000-8000-0000000000e3', 'usuario.e3.ensaio@example.com');

-- Variações de nome que o produto aceitaria (a identidade é lower(btrim(nome))).
insert into public.classes_ativo (user_id, nome) values
  ('00000000-0000-4000-8000-0000000000e1', ' Criptoativos e Ativos Digitais '),
  ('00000000-0000-4000-8000-0000000000e1', 'RENDA VARIAVEL'),
  ('00000000-0000-4000-8000-0000000000e1', 'investimentos no exterior'),
  ('00000000-0000-4000-8000-0000000000e1', 'Caixa e Disponibilidades'),
  ('00000000-0000-4000-8000-0000000000e1', 'Ações'),
  ('00000000-0000-4000-8000-0000000000e1', 'Alternativos, Moedas, Outros'),
  ('00000000-0000-4000-8000-0000000000e1', 'Renda fixa e variável');
-- O terceiro usuário não tem nenhuma classe.
delete from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000e3';

create function pg_temp.entrar(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
create function pg_temp.mes() returns date language sql as $$
  select (date_trunc('month', (now() at time zone 'America/Cuiaba')) - interval '3 months')::date;
$$;
-- Cria o ativo pelas funções do produto: classe por nome exato (ou nenhuma), aporte no mês inicial.
create function pg_temp.novo(p_uid uuid, p_nome text, p_tipo public.tipo_ajuste, p_classe text, p_aporte bigint)
returns uuid language plpgsql as $$
declare
  v_id uuid;
  v_classe uuid;
begin
  perform pg_temp.entrar(p_uid);
  v_id := public.criar_ativo(p_nome, p_tipo);
  if p_classe is not null then
    select c.id into v_classe from public.classes_ativo c where c.user_id = p_uid and c.nome = p_classe;
    perform public.editar_detalhes_ativo(v_id, null, 'Banco Exemplo', v_classe, null, null, true, null, null);
  end if;
  if p_aporte > 0 then
    perform public.lancar_evento(v_id, pg_temp.mes() + 4, 'aporte', p_aporte);
  end if;
  return v_id;
end $$;

-- Usuário 1: todas as equivalências, variações de nome, classes sem equivalente e sem classe.
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-01', 'rendimento', 'Renda fixa', 1000000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-02', 'marcacao', 'Renda variável', 2000000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-03', 'marcacao', 'RENDA VARIAVEL', 300000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-04', 'rendimento', 'Cripto', 400000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-05', 'marcacao', ' Criptoativos e Ativos Digitais ', 500000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-06', 'rendimento', 'Outros', 600000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-07', 'rendimento', 'Alternativos, Moedas, Outros', 700000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-08', 'marcacao', 'investimentos no exterior', 800000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-09', 'rendimento', 'Caixa e Disponibilidades', 900000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-10', 'marcacao', 'Fundos', 100000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-11', 'marcacao', 'Ações', 110000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-12', 'rendimento', 'Renda fixa e variável', 120000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-13', 'rendimento', null, 130000);
-- Desativados (sem saldo): um com equivalência e um sem.
select public.desativar_ativo(pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-14', 'rendimento', 'Renda fixa', 0));
select public.desativar_ativo(pg_temp.novo('00000000-0000-4000-8000-0000000000e1', 'Ativo E1-15', 'rendimento', 'Fundos', 0));

-- Usuário 2: só as classes iniciais.
select pg_temp.novo('00000000-0000-4000-8000-0000000000e2', 'Ativo E2-01', 'rendimento', 'Renda fixa', 250000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e2', 'Ativo E2-02', 'marcacao', 'Fundos', 260000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e2', 'Ativo E2-03', 'rendimento', null, 270000);

-- Usuário 3: sem classes; dois ativos sem classe e um deles sem posição.
select pg_temp.novo('00000000-0000-4000-8000-0000000000e3', 'Ativo E3-01', 'rendimento', null, 50000);
select pg_temp.novo('00000000-0000-4000-8000-0000000000e3', 'Ativo E3-02', 'marcacao', null, 0);

-- Fecha o mês inicial de cada usuário (saldo real igual ao calculado), para haver consolidado e posições.
do $$
declare
  v_uid uuid;
begin
  for v_uid in select unnest(array['00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000e2',
    '00000000-0000-4000-8000-0000000000e3']::uuid[]) loop
    perform pg_temp.entrar(v_uid);
    perform public.fechar_mes(pg_temp.mes(), (
      select jsonb_object_agg(a.id, coalesce((select sum(e.valor) from public.eventos e where e.ativo_id = a.id), 0))
      from public.ativos a where a.user_id = v_uid and a.ativo and a.sistema is null
        and exists (select 1 from public.eventos e where e.ativo_id = a.id)));
  end loop;
end $$;
