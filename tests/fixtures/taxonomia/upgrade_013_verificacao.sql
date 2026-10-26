-- Verificação do ensaio local de upgrade depois da migração da taxonomia (ciclo 013, issue #137,
-- R1-6): o preenchimento, a marca de coerência e as RPCs antigas e novas sobre os dados da carga
-- upgrade_012.sql. Cada conferência lança erro se falhar; ao fim, um NOTICE resume. Só dados fictícios.
--
-- Uso: docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < upgrade_013_verificacao.sql
create function pg_temp.entrar(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
create function pg_temp.confere(p_ok boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_ok is distinct from true then
    raise exception 'falhou: %', p_msg;
  end if;
end $$;

do $$
declare
  v_e1 uuid := '00000000-0000-4000-8000-0000000000e1';
  v_e2 uuid := '00000000-0000-4000-8000-0000000000e2';
  v_e3 uuid := '00000000-0000-4000-8000-0000000000e3';
  v_ativo uuid;
  v_antes text;
  v_classes_antes bigint;
begin
  -- Preenchimento: exatamente o previsto, por nome de ativo (ensaio fictício).
  perform pg_temp.confere((select array_agg(a.nome || '=' || coalesce(t.nome, 'nulo') order by a.nome)
    from public.ativos a left join public.taxonomia_ativos t on t.id = a.taxonomia_id where a.user_id = v_e1 and a.sistema is null)
    = array['Ativo E1-01=Renda fixa', 'Ativo E1-02=Renda variável', 'Ativo E1-03=Renda variável', 'Ativo E1-04=Criptoativos e ativos digitais',
      'Ativo E1-05=Criptoativos e ativos digitais', 'Ativo E1-06=Alternativos, moedas, outros', 'Ativo E1-07=Alternativos, moedas, outros',
      'Ativo E1-08=Investimentos no exterior', 'Ativo E1-09=Caixa e disponibilidades', 'Ativo E1-10=nulo', 'Ativo E1-11=nulo',
      'Ativo E1-12=nulo', 'Ativo E1-13=nulo', 'Ativo E1-14=Renda fixa', 'Ativo E1-15=nulo'], 'usuário 1: mapeamento por ativo');
  perform pg_temp.confere((select array_agg(a.nome || '=' || coalesce(t.nome, 'nulo') order by a.nome)
    from public.ativos a left join public.taxonomia_ativos t on t.id = a.taxonomia_id where a.user_id = v_e2 and a.sistema is null)
    = array['Ativo E2-01=Renda fixa', 'Ativo E2-02=nulo', 'Ativo E2-03=nulo'], 'usuário 2: mapeamento por ativo');
  perform pg_temp.confere((select count(*) from public.ativos a where a.user_id = v_e3 and a.taxonomia_id is not null) = 0,
    'usuário 3: nenhum ativo recebeu nó');
  perform pg_temp.confere((select count(*) from public.ativos where sistema = 'transito' and taxonomia_id is not null) = 0,
    'o trânsito segue sem nó');
  perform pg_temp.confere((select count(*) from public.ativos where sistema is null and classe_id is not null) = 16,
    'o legado classe_id está intacto nos 16 ativos que o tinham');
  -- Marca de coerência: uma mudança por ativo mapeado.
  perform pg_temp.confere((select array_agg(p.versao_classificacao order by p.email) from public.profiles p)
    = array[10::bigint, 1, 0], 'marcas: 10 mapeados no usuário 1, 1 no 2 e 0 no 3');
  -- Perfil novo: sem classes e sem sementes.
  insert into public.authorized_emails (email, role) values ('usuario.e4.ensaio@example.com', 'user');
  insert into auth.users (id, email) values ('00000000-0000-4000-8000-0000000000e4', 'usuario.e4.ensaio@example.com');
  perform pg_temp.confere((select count(*) from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000e4') = 0,
    'perfil novo nasce sem classes');
  perform pg_temp.confere((select versao_classificacao from public.profiles where email = 'usuario.e4.ensaio@example.com') = 0,
    'perfil novo nasce com a marca zero');

  -- RPCs novas: o cadastro com perfil novo e a edição.
  perform pg_temp.entrar('00000000-0000-4000-8000-0000000000e4');
  v_ativo := public.cadastrar_ativo_taxonomia('Ativo E4-01', 'rendimento', null, null, 'a5000000-0000-4000-8000-000000020201', null, null, null, null);
  perform pg_temp.confere(public.ler_versao_classificacao() = '1', 'perfil novo: cadastro com nó incrementa a marca');
  -- RPCs antigas na janela: cadastro antigo deixa o nó nulo; edição antiga zera o nó e incrementa.
  v_ativo := public.cadastrar_ativo('Ativo E4-02', 'marcacao', null, null, null, 'Classe antiga', null, null, null, null);
  perform pg_temp.confere((select taxonomia_id is null and classe_id is not null from public.ativos where id = v_ativo),
    'cadastro antigo: legado sem nó');
  perform pg_temp.confere(public.ler_versao_classificacao() = '1', 'cadastro antigo não mexe na marca');
  select a.id into v_ativo from public.ativos a where a.nome = 'Ativo E4-01';
  perform public.editar_detalhes_ativo(v_ativo, null, null, null, 'Classe antiga', null, null, null, null);
  perform pg_temp.confere((select taxonomia_id is null from public.ativos where id = v_ativo), 'edição antiga zera o nó');
  perform pg_temp.confere(public.ler_versao_classificacao() = '2', 'edição antiga que zera o nó incrementa a marca');

  -- Ativo mapeado no preenchimento (usuário 1) editado pela edição antiga: fica "Sem classe", legado preservado.
  perform pg_temp.entrar(v_e1);
  select a.id into v_ativo from public.ativos a where a.nome = 'Ativo E1-01';
  select c.id into v_antes from public.classes_ativo c join public.ativos a on a.classe_id = c.id where a.id = v_ativo;
  perform public.editar_detalhes_ativo(v_ativo, null, null, v_antes::uuid, null, null, null, null, null);
  perform pg_temp.confere((select taxonomia_id is null and classe_id = v_antes::uuid from public.ativos where id = v_ativo),
    'ativo mapeado editado pela tela antiga fica Sem classe e mantém o legado');
  perform pg_temp.confere(public.ler_versao_classificacao() = '11', 'a marca do usuário 1 passou de 10 para 11');
  -- E o CRUD antigo de classes segue.
  select count(*) into v_classes_antes from public.classes_ativo where user_id = v_e1;
  perform public.criar_classe('Classe do ensaio');
  perform pg_temp.confere((select count(*) from public.classes_ativo where user_id = v_e1) = v_classes_antes + 1, 'CRUD antigo de classes segue');
  raise notice 'upgrade_013_verificacao: todas as conferências passaram';
end $$;
