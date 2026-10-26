-- Verificação da aplicação nova (ciclo 013, issue #138): chama só as funções novas e lê o que a
-- tela lê, como a aplicação da fase 2 faz. Roda antes e depois da migração da fase 2 (aplicação
-- nova com o banco expandido, e depois com o legado só de leitura); cada conferência lança erro se
-- falhar. Deixa um ativo fictício por execução, sem tocar nos dados da carga. Só dados fictícios.
--
-- Uso: docker exec -i supabase_db_saldo-futuro psql -U postgres -v ON_ERROR_STOP=1 < app_nova_verificacao.sql
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
  v_f2 uuid := '00000000-0000-4000-8000-0000000000f2';
  v_nome text := 'Ativo verificação ' || to_char(clock_timestamp(), 'HH24MISSUS');
  v_ativo uuid;
  v_antes bigint;
  v_legado bigint;
  v_classes_antes bigint;
begin
  perform pg_temp.entrar(v_f2);
  v_antes := public.ler_versao_classificacao()::bigint;
  select count(*) into v_legado from public.ativos where user_id = v_f2 and classe_id is not null;
  select count(*) into v_classes_antes from public.classes_ativo where user_id = v_f2;

  -- A tela lê a árvore inteira (39 nós) e o legado só para a dica.
  perform pg_temp.confere((select count(*) from public.taxonomia_ativos) = 39, 'a árvore tem 39 nós');
  perform pg_temp.confere((select count(*) from public.classes_ativo where user_id = v_f2) = v_classes_antes, 'o legado é legível');

  -- Cadastro novo com um tipo do nível 3 e com instituição nova.
  v_ativo := public.cadastrar_ativo_taxonomia(v_nome, 'rendimento', null, 'Banco Exemplo',
    'a5000000-0000-4000-8000-000000020201', null, null, null, null);
  perform pg_temp.confere((select taxonomia_id = 'a5000000-0000-4000-8000-000000020201' and classe_id is null
    from public.ativos where id = v_ativo), 'cadastro novo grava só o nó');
  perform pg_temp.confere(public.ler_versao_classificacao()::bigint = v_antes + 1, 'cadastro com nó incrementa a marca');

  -- Edição nova: troca o nó, preserva o legado, aceita limpar.
  perform public.editar_detalhes_ativo_taxonomia(v_ativo, null, null, 'a5000000-0000-4000-8000-000000060100', null, true, null, null);
  perform pg_temp.confere((select taxonomia_id = 'a5000000-0000-4000-8000-000000060100' from public.ativos where id = v_ativo),
    'edição nova troca o nó');
  perform public.editar_detalhes_ativo_taxonomia(v_ativo, null, null, null, null, null, null, null);
  perform pg_temp.confere((select taxonomia_id is null from public.ativos where id = v_ativo), 'edição nova limpa o nó');
  perform pg_temp.confere(public.ler_versao_classificacao()::bigint = v_antes + 3, 'três mudanças de nó, três incrementos');

  -- Edição de um ativo da carga, com legado: o legado continua exatamente como estava.
  perform public.editar_detalhes_ativo_taxonomia(a.id, null, null, 'a5000000-0000-4000-8000-000000020000', null, null, null, null)
    from public.ativos a where a.nome = 'Ativo F2-01';
  perform pg_temp.confere((select count(*) from public.ativos where user_id = v_f2 and classe_id is not null) = v_legado,
    'a edição nova não mexe no legado classe_id');

  -- Recusas.
  begin
    perform public.editar_detalhes_ativo_taxonomia(v_ativo, null, null, gen_random_uuid(), null, null, null, null);
    raise exception 'falhou: nó inexistente aceito';
  exception when others then
    perform pg_temp.confere(sqlerrm = 'recusado_taxonomia_inexistente', 'nó inexistente recusado: ' || sqlerrm);
  end;
  raise notice 'app_nova_verificacao: todas as conferências passaram';
end $$;
