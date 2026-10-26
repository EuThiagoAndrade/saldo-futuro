-- Metadados dos ativos (ciclo 012, issue #126): instituições e classes por usuário, campos
-- descritivos do ativo, ausência de classes iniciais (retiradas no ciclo 013) e isolamento (G2) das
-- funções sobre as entradas, o ativo-alvo e as referências. Só dados fictícios: e-mails em
-- example.com e nomes inventados.
begin;
create extension if not exists pgtap with schema extensions;
select plan(79);

create function pg_temp.act_as(p_sub uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;
create function pg_temp.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
end $$;
-- Executa um comando e devolve 'ok' ou a mensagem do erro (o motivo da recusa).
create function pg_temp.erro(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlerrm;
end $$;
-- Identificadores guardados por nome durante a transação.
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
-- Retrato dos campos descritivos e das entradas de um usuário, para provar que nada mudou.
create function pg_temp.retrato(p_uid uuid) returns text language sql as $$
  select coalesce((select string_agg(concat_ws('|', a.id, a.instituicao_id, a.classe_id, a.previdencia,
      a.liquidez_imediata, a.exposicao_cambial, a.isento_ir), ';' order by a.id)
    from public.ativos a where a.user_id = p_uid), '')
    || '#' || coalesce((select string_agg(i.id || '|' || i.nome, ';' order by i.id)
    from public.instituicoes i where i.user_id = p_uid), '')
    || '#' || coalesce((select string_agg(c.id || '|' || c.nome, ';' order by c.id)
    from public.classes_ativo c where c.user_id = p_uid), '');
$$;

-- Fixtures: um admin e dois usuários. O gatilho cria os perfis.
insert into public.authorized_emails (email, role) values
  ('admin.metadados@example.com', 'admin'),
  ('usuario.a.metadados@example.com', 'user'),
  ('usuario.b.metadados@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000c0', 'admin.metadados@example.com'),
  ('00000000-0000-4000-8000-0000000000c1', 'usuario.a.metadados@example.com'),
  ('00000000-0000-4000-8000-0000000000c2', 'usuario.b.metadados@example.com');

-- 1. Estrutura e grants
select ok((select relrowsecurity from pg_class where oid = 'public.instituicoes'::regclass), 'instituicoes tem RLS ativa');
select ok((select relrowsecurity from pg_class where oid = 'public.classes_ativo'::regclass), 'classes_ativo tem RLS ativa');
select table_privs_are('public', 'instituicoes', 'authenticated', array['SELECT'], 'authenticated só lê instituicoes');
select table_privs_are('public', 'classes_ativo', 'authenticated', array['SELECT'], 'authenticated só lê classes_ativo');
select table_privs_are('public', 'instituicoes', 'anon', array[]::text[], 'anon sem privilégio em instituicoes');
select table_privs_are('public', 'classes_ativo', 'anon', array[]::text[], 'anon sem privilégio em classes_ativo');
select is_empty(
  $$ select f from unnest(array[
       'public.criar_instituicao(text)', 'public.renomear_instituicao(uuid,text)', 'public.excluir_instituicao(uuid)',
       'public.criar_classe(text)', 'public.renomear_classe(uuid,text)', 'public.excluir_classe(uuid)',
       'public.cadastrar_ativo(text,public.tipo_ajuste,uuid,text,uuid,text,boolean,boolean,boolean,boolean)',
       'public.editar_detalhes_ativo(uuid,uuid,text,uuid,text,boolean,boolean,boolean,boolean)']) f
     where not has_function_privilege('authenticated', f::regprocedure, 'EXECUTE') $$,
  'authenticated executa as oito funções novas');
select hasnt_trigger('public', 'profiles', 'on_profile_created_classes',
  'perfis não têm mais o gatilho das classes iniciais (ciclo 013)');

-- 2. Sem classes iniciais: desde a taxonomia global (ciclo 013), um perfil novo nasce sem classes
-- do usuário; as entradas abaixo são todas criadas pelas funções.
select is((select count(*) from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000c1'), 0::bigint,
  'um usuário novo nasce sem classes');
select hasnt_function('private', 'criar_classes_iniciais', array['uuid'], 'o auxiliar das classes iniciais foi retirado');

-- 3. Cadastro e compatibilidade (usuário A)
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c1');
select pg_temp.guarda('ia', public.criar_instituicao('Banco Exemplo'));
select pg_temp.guarda('ca', public.criar_classe('Renda fixa'));
select pg_temp.guarda('a1', public.cadastrar_ativo('Ativo fictício A1', 'rendimento', pg_temp.id('ia'), null,
  pg_temp.id('ca'), null, true, null, false, null));
select is((select concat_ws('|', a.instituicao_id = pg_temp.id('ia'), a.classe_id = pg_temp.id('ca'), a.previdencia,
    coalesce(a.liquidez_imediata::text, 'nulo'), a.exposicao_cambial, coalesce(a.isento_ir::text, 'nulo'))
  from public.ativos a where a.id = pg_temp.id('a1')), 't|t|t|nulo|f|nulo',
  'cadastrar_ativo grava instituição, classe e indicadores em três estados');
select pg_temp.guarda('a2', public.criar_ativo('Ativo fictício A2', 'marcacao'));
select is((select num_nonnulls(a.instituicao_id, a.classe_id, a.previdencia, a.liquidez_imediata, a.exposicao_cambial,
  a.isento_ir) from public.ativos a where a.id = pg_temp.id('a2')), 0, 'criar_ativo continua criando o ativo com os campos novos nulos');
select pg_temp.guarda('at', (select a.id from public.ativos a where a.sistema = 'transito'));
select is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, null, null, true, null, null, null)',
  pg_temp.id('at'))), 'recusado_ativo_invalido', 'o trânsito não recebe campos descritivos');
select is(pg_temp.erro($$ select public.cadastrar_ativo('Ativo fictício', null, null, null, null, null, null, null, null, null) $$),
  'recusado_tipo_ajuste', 'cadastrar_ativo exige o tipo de ajuste');

-- 4. Nomes: validade e identidade (caixa e espaços nas pontas ignorados, acentos preservados)
select is(pg_temp.erro($$ select public.criar_instituicao('   ') $$), 'recusado_nome', 'nome vazio é recusado');
select is(pg_temp.erro(format('select public.criar_instituicao(%L)', repeat('x', 101))), 'recusado_nome',
  'nome com mais de 100 caracteres é recusado');
select is(pg_temp.erro($$ select public.criar_instituicao('banco exemplo') $$), 'recusado_nome_repetido',
  'nome repetido com outra caixa é recusado');
select is(pg_temp.erro($$ select public.criar_instituicao(' BANCO EXEMPLO ') $$), 'recusado_nome_repetido',
  'nome repetido com espaços nas pontas é recusado');
select pg_temp.guarda('c_acento', public.criar_classe('Classe Ação'));
select is(pg_temp.erro($$ select public.criar_classe('Classe Acao') $$), 'ok', 'nome que só difere no acento é outra entrada');
select pg_temp.guarda('c_sem', (select c.id from public.classes_ativo c where c.nome = 'Classe Acao'));
select is((select count(*) from public.classes_ativo c where lower(c.nome) in ('classe ação', 'classe acao')), 2::bigint,
  '"Classe Ação" e "Classe Acao" coexistem');
select is(pg_temp.erro($$ select public.criar_classe('classe ação') $$), 'recusado_nome_repetido',
  'classe repetida com outra caixa é recusada');
select is(pg_temp.erro($$ select public.criar_classe(' CLASSE AÇÃO ') $$), 'recusado_nome_repetido',
  'classe repetida com outra caixa e espaços nas pontas é recusada');
select is(pg_temp.erro(format('select public.renomear_classe(%L, %L)', pg_temp.id('c_sem'), 'Classe Ação')),
  'recusado_nome_repetido', 'renomear para o nome de outra entrada é recusado');
select is(pg_temp.erro(format('select public.renomear_classe(%L, %L)', pg_temp.id('c_acento'), ' CLASSE AÇÃO ')), 'ok',
  'renomear para o próprio nome com outra caixa é aceito');
select is((select c.nome from public.classes_ativo c where c.id = pg_temp.id('c_acento')), 'CLASSE AÇÃO',
  'o nome renomeado é gravado sem os espaços nas pontas');
select is(pg_temp.erro(format('select public.renomear_instituicao(%L, %L)', pg_temp.id('ia'), 'Banco Exemplo')), 'ok',
  'renomear uma instituição para o mesmo nome é aceito');

-- 5. Nome novo no cadastro e na edição: reaproveita pela identidade ou cria
select pg_temp.guarda('a3', public.cadastrar_ativo('Ativo fictício A3', 'rendimento', null, ' banco exemplo ', null,
  'classe ação', null, null, null, null));
select is((select a.instituicao_id = pg_temp.id('ia') and a.classe_id = pg_temp.id('c_acento')
  from public.ativos a where a.id = pg_temp.id('a3')), true, 'o nome novo reaproveita a entrada de mesma identidade');
select is((select count(*) from public.instituicoes), 1::bigint, 'o reaproveitamento não cria instituição');
select pg_temp.guarda('a4', public.cadastrar_ativo('Ativo fictício A4', 'rendimento', null, 'Corretora Fictícia', null,
  'Classe Acao', null, null, null, null));
select is((select a.classe_id = pg_temp.id('c_sem') from public.ativos a where a.id = pg_temp.id('a4')), true,
  'o nome sem acento reaproveita a entrada sem acento, não a acentuada');
select is((select count(*) from public.instituicoes i join public.ativos a on a.instituicao_id = i.id
           where a.id = pg_temp.id('a4') and i.nome = 'Corretora Fictícia'), 1::bigint,
  'o nome novo cria a instituição na mesma transação');
select is(pg_temp.erro(format('select public.cadastrar_ativo(%L, %L, %L, %L, null, null, null, null, null, null)',
  'Ativo fictício', 'rendimento', pg_temp.id('ia'), 'Outra')), 'recusado_referencia_dupla', 'id e nome novo juntos são recusados');
select is(pg_temp.erro($$ select public.cadastrar_ativo('Ativo fictício', 'rendimento', null, '   ', null, null, null, null, null, null) $$),
  'recusado_nome', 'nome novo vazio é recusado');
select is((select count(*) from public.ativos a where a.nome = 'Ativo fictício'), 0::bigint, 'cadastros recusados não gravam ativo');

-- 6. Edição, inclusive de ativo desativado
select public.editar_detalhes_ativo(pg_temp.id('a2'), pg_temp.id('ia'), null, pg_temp.id('ca'), null, false, true, true, false);
select is((select concat_ws('|', a.instituicao_id = pg_temp.id('ia'), a.classe_id = pg_temp.id('ca'), a.previdencia,
  a.liquidez_imediata, a.exposicao_cambial, a.isento_ir) from public.ativos a where a.id = pg_temp.id('a2')),
  't|t|f|t|t|f', 'a edição substitui os campos descritivos');
select public.desativar_ativo(pg_temp.id('a4'));
select is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, null, null, null, null, null, true)',
  pg_temp.id('a4'))), 'ok', 'ativo desativado pode ser editado');
select is((select num_nonnulls(a.instituicao_id, a.classe_id) || '|' || a.isento_ir from public.ativos a
  where a.id = pg_temp.id('a4')), '0|true', 'a edição do desativado limpa as referências e grava o indicador');

-- 7. Exclusão só sem ativo vinculado
select is(pg_temp.erro(format('select public.excluir_instituicao(%L)', pg_temp.id('ia'))), 'recusado_em_uso',
  'instituição em uso não é excluída');
select is(pg_temp.erro(format('select public.excluir_classe(%L)', pg_temp.id('ca'))), 'recusado_em_uso',
  'classe em uso não é excluída');
select pg_temp.guarda('i_solta', public.criar_instituicao('Instituição sem uso'));
select is(pg_temp.erro(format('select public.excluir_instituicao(%L)', pg_temp.id('i_solta'))), 'ok',
  'instituição sem uso é excluída');
select is_empty(format('select 1 from public.instituicoes where id = %L', pg_temp.id('i_solta')), 'a instituição excluída some');
select pg_temp.guarda('c_solta', public.criar_classe('Cripto'));
select is(pg_temp.erro(format('select public.excluir_classe(%L)', pg_temp.id('c_solta'))), 'ok', 'classe sem uso é excluída');

-- 8. Nenhuma escrita direta
select throws_ok($$ insert into public.instituicoes (user_id, nome) values ('00000000-0000-4000-8000-0000000000c1', 'x') $$,
  '42501', null, 'A não insere instituição direto');
select throws_ok($$ update public.classes_ativo set nome = 'x' $$, '42501', null, 'A não altera classe direto');
select throws_ok($$ delete from public.instituicoes $$, '42501', null, 'A não exclui instituição direto');
select throws_ok($$ update public.ativos set classe_id = null $$, '42501', null, 'A não altera os campos do ativo direto');

-- Entradas próprias de B e do admin, para as tentativas abaixo (o mesmo nome em outro usuário é aceito).
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c2');
select pg_temp.guarda('ib', public.criar_instituicao('Banco Exemplo'));
select pg_temp.guarda('cb', public.criar_classe('Fundos'));
select pg_temp.guarda('b1', public.criar_ativo('Ativo fictício B1', 'rendimento'));
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c0');
select pg_temp.guarda('iadm', public.criar_instituicao('Banco Fictício do Admin'));
select pg_temp.guarda('cadm', public.criar_classe('Fundos'));
select pg_temp.guarda('adm1', public.criar_ativo('Ativo fictício do admin', 'rendimento'));
reset role;
select set_config('teste.retrato_a', pg_temp.retrato('00000000-0000-4000-8000-0000000000c1'), true);
select ok(pg_temp.id('ib') is not null, 'B cria uma instituição com o mesmo nome de uma de A');

-- 9. Isolamento: B e o admin, cada um com a própria sessão, não leem nem alteram nada de A
create function pg_temp.tentativas(p_ator text, p_inst uuid, p_classe uuid, p_ativo uuid) returns setof text
language plpgsql as $$
begin
  return next is_empty($q$ select 1 from public.instituicoes where user_id = '00000000-0000-4000-8000-0000000000c1' $q$,
    p_ator || ' não lê instituições de A');
  return next is_empty($q$ select 1 from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000c1' $q$,
    p_ator || ' não lê classes de A');
  return next is(pg_temp.erro(format('select public.renomear_instituicao(%L, %L)', pg_temp.id('ia'), 'Tentativa')),
    'recusado_instituicao_inexistente', p_ator || ' não renomeia instituição de A');
  return next is(pg_temp.erro(format('select public.excluir_instituicao(%L)', pg_temp.id('ia'))),
    'recusado_instituicao_inexistente', p_ator || ' não exclui instituição de A');
  return next is(pg_temp.erro(format('select public.renomear_classe(%L, %L)', pg_temp.id('ca'), 'Tentativa')),
    'recusado_classe_inexistente', p_ator || ' não renomeia classe de A');
  return next is(pg_temp.erro(format('select public.excluir_classe(%L)', pg_temp.id('ca'))),
    'recusado_classe_inexistente', p_ator || ' não exclui classe de A');
  -- Ativo-alvo de A, com três variações de referência.
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, null, null, null, null, null, null)',
    pg_temp.id('a1'))), 'recusado_ativo_inexistente', p_ator || ' não edita ativo de A com referências nulas');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, %L, null, %L, null, true, true, true, true)',
    pg_temp.id('a1'), p_inst, p_classe)), 'recusado_ativo_inexistente', p_ator || ' não edita ativo de A com as próprias referências');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, %L, null, %L, null, null, null, null)',
    pg_temp.id('a1'), 'Instituição da tentativa', 'Classe da tentativa')), 'recusado_ativo_inexistente',
    p_ator || ' não edita ativo de A com nomes novos');
  -- Referências a entradas de A, no próprio cadastro e na própria edição.
  return next is(pg_temp.erro(format('select public.cadastrar_ativo(%L, %L, %L, null, null, null, null, null, null, null)',
    'Ativo da tentativa', 'rendimento', pg_temp.id('ia'))), 'recusado_instituicao_inexistente',
    p_ator || ' não cadastra ativo com instituição de A');
  return next is(pg_temp.erro(format('select public.cadastrar_ativo(%L, %L, null, null, %L, null, null, null, null, null)',
    'Ativo da tentativa', 'rendimento', pg_temp.id('ca'))), 'recusado_classe_inexistente',
    p_ator || ' não cadastra ativo com classe de A');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, %L, null, null, null, null, null, null, null)',
    p_ativo, pg_temp.id('ia'))), 'recusado_instituicao_inexistente', p_ator || ' não usa instituição de A no próprio ativo');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, %L, null, null, null, null, null)',
    p_ativo, pg_temp.id('ca'))), 'recusado_classe_inexistente', p_ator || ' não usa classe de A no próprio ativo');
end $$;

select pg_temp.act_as('00000000-0000-4000-8000-0000000000c2');
select * from pg_temp.tentativas('B', pg_temp.id('ib'), pg_temp.id('cb'), pg_temp.id('b1'));
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000c0');
select * from pg_temp.tentativas('o admin', pg_temp.id('iadm'), pg_temp.id('cadm'), pg_temp.id('adm1'));
reset role;

select is(pg_temp.retrato('00000000-0000-4000-8000-0000000000c1'), current_setting('teste.retrato_a'),
  'depois das tentativas, os ativos, instituições e classes de A continuam iguais');
select is_empty($$ select 1 from public.instituicoes where nome = 'Instituição da tentativa' $$,
  'nenhuma instituição foi criada pelas tentativas');
select is_empty($$ select 1 from public.classes_ativo where nome = 'Classe da tentativa' $$,
  'nenhuma classe foi criada pelas tentativas');
select is_empty($$ select 1 from public.ativos where nome = 'Ativo da tentativa' $$, 'nenhum ativo foi criado pelas tentativas');

-- 10. Anônimo e exclusão do usuário
select pg_temp.act_as_anon();
select throws_ok($$ select public.cadastrar_ativo('x', 'rendimento', null, null, null, null, null, null, null, null) $$,
  '42501', null, 'anon não executa cadastrar_ativo');
reset role;
select lives_ok($$ delete from auth.users where id = '00000000-0000-4000-8000-0000000000c1' $$,
  'o usuário com ativos ligados a instituições e classes pode ser excluído');
select is(pg_temp.retrato('00000000-0000-4000-8000-0000000000c1'), '##', 'a exclusão leva ativos, instituições e classes');

select * from finish();
rollback;
