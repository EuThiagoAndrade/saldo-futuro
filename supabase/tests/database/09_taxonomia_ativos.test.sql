-- Taxonomia global de classes de ativos, fase 1 (ciclo 013, issue #137): catálogo e suas restrições,
-- vínculo opcional do ativo, marca de coerência da classificação (R1-2), RPCs novas e antigas na
-- janela de transição, equivalência mínima do legado e isolamento (G2). Só dados fictícios:
-- e-mails em example.com e nomes inventados.
begin;
create extension if not exists pgtap with schema extensions;
select plan(158);

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
create function pg_temp.guarda(p_nome text, p_id uuid) returns uuid language sql as $$
  select set_config('teste.' || p_nome, p_id::text, true)::uuid;
$$;
create function pg_temp.id(p_nome text) returns uuid language sql as $$
  select current_setting('teste.' || p_nome)::uuid;
$$;
-- Nó da árvore aprovada pelo código (por exemplo, '2.2.1'), montado aqui, sem ler o catálogo: é a
-- identidade estável da especificação, no formato fixado na migração.
create function pg_temp.no(p_codigo text) returns uuid language sql as $$
  select ('a5000000-0000-4000-8000-000000'
    || (select string_agg(lpad(x, 2, '0'), '') from unnest(string_to_array(p_codigo, '.')) x)
    || repeat('00', 3 - cardinality(string_to_array(p_codigo, '.'))))::uuid;
$$;
-- Marca de coerência de um usuário, lida como dono do banco.
create function pg_temp.versao(p_uid uuid) returns bigint language sql as $$
  select p.versao_classificacao from public.profiles p where p.user_id = p_uid;
$$;
-- Linhas do ativo sem o vínculo da taxonomia, para provar que nada mais mudou.
create function pg_temp.retrato_ativos(p_uid uuid) returns text language sql as $$
  select coalesce(md5(string_agg((to_jsonb(a) - 'taxonomia_id')::text, ';' order by a.id)), '')
  from (select a.* from public.ativos a where a.user_id = p_uid) a;
$$;
-- Tenta, dentro de uma subtransação, uma mudança que incrementaria a marca e força o erro depois.
create function pg_temp.tenta_e_desfaz(p_ativo uuid, p_taxonomia uuid) returns void language plpgsql as $$
begin
  perform public.editar_detalhes_ativo_taxonomia(p_ativo, null, null, p_taxonomia, null, null, null, null);
  raise exception 'desfaz';
exception when others then
  if sqlerrm <> 'desfaz' then
    raise;
  end if;
end $$;

-- Fixtures: um admin e três usuários. O gatilho cria os perfis.
insert into public.authorized_emails (email, role) values
  ('admin.taxonomia@example.com', 'admin'),
  ('usuario.a.taxonomia@example.com', 'user'),
  ('usuario.b.taxonomia@example.com', 'user'),
  ('usuario.c.taxonomia@example.com', 'user');
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000d0', 'admin.taxonomia@example.com'),
  ('00000000-0000-4000-8000-0000000000d1', 'usuario.a.taxonomia@example.com'),
  ('00000000-0000-4000-8000-0000000000d2', 'usuario.b.taxonomia@example.com'),
  ('00000000-0000-4000-8000-0000000000d3', 'usuario.c.taxonomia@example.com');

-- 1. Estrutura, permissões e funções
select ok((select relrowsecurity from pg_class where oid = 'public.taxonomia_ativos'::regclass), 'taxonomia_ativos tem RLS ativa');
select table_privs_are('public', 'taxonomia_ativos', 'authenticated', array['SELECT'], 'authenticated só lê o catálogo');
select table_privs_are('public', 'taxonomia_ativos', 'anon', array[]::text[], 'anon sem privilégio no catálogo');
select table_privs_are('public', 'taxonomia_ativos', 'service_role', array[]::text[], 'service_role sem privilégio no catálogo');
select columns_are('public', 'taxonomia_ativos', array['id', 'parent_id', 'nivel', 'nome', 'ordem', 'parent_nivel'],
  'o catálogo é global: sem user_id, só a árvore e o nível do pai derivado');
select col_type_is('public', 'profiles', 'versao_classificacao', 'bigint', 'a marca de coerência é bigint');
select col_not_null('public', 'profiles', 'versao_classificacao', 'a marca de coerência não é nula');
select has_trigger('public', 'ativos', 'ativos_versao_classificacao', 'ativos têm o gatilho da marca de coerência');
select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname in
  ('cadastrar_ativo', 'editar_detalhes_ativo', 'cadastrar_ativo_taxonomia', 'editar_detalhes_ativo_taxonomia',
   'ler_versao_classificacao')), 5::bigint,
  'cada função de cadastro, edição e leitura da marca tem uma única assinatura (sem sobrecarga ambígua)');
select is_empty(
  $$ select f from unnest(array[
       'public.cadastrar_ativo_taxonomia(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean)',
       'public.editar_detalhes_ativo_taxonomia(uuid,uuid,text,uuid,boolean,boolean,boolean,boolean)',
       'public.ler_versao_classificacao()']) f
     where not has_function_privilege('authenticated', f::regprocedure, 'EXECUTE')
        or has_function_privilege('anon', f::regprocedure, 'EXECUTE') $$,
  'authenticated executa as três funções novas e anon não');
select is((select concat_ws('|', p.prosecdef, p.provolatile, p.prorettype::regtype) from pg_proc p
  where p.oid = 'public.ler_versao_classificacao()'::regprocedure), 'f|s|text',
  'ler_versao_classificacao é security invoker, stable e devolve texto');

-- 2. A árvore aprovada, exatamente
select is((select count(*) from public.taxonomia_ativos), 39::bigint, 'o catálogo tem 39 nós');
select is((select array_agg(n order by nivel) from (select nivel, count(*) n from public.taxonomia_ativos group by nivel) c),
  array[6::bigint, 21, 12], 'são 6 classes macro, 21 subclasses e 12 tipos');
select is((
  with recursive arv as (
    select t.id, t.nome, t.ordem::text as codigo, array[t.ordem] as caminho from public.taxonomia_ativos t where t.parent_id is null
    union all
    select t.id, t.nome, a.codigo || '.' || t.ordem, a.caminho || t.ordem
    from public.taxonomia_ativos t join arv a on t.parent_id = a.id)
  select array_agg(codigo || ' ' || nome order by caminho) from arv),
  array['1 Caixa e disponibilidades', '1.1 Saldos em conta', '1.2 Dinheiro em espécie',
    '2 Renda fixa', '2.1 Dívida soberana', '2.2 Crédito bancário', '2.2.1 CDB', '2.2.2 RDB', '2.2.3 Letras bancárias',
    '2.3 Crédito corporativo', '2.3.1 Debêntures', '2.3.2 Notas comerciais',
    '2.4 Crédito estruturado', '2.4.1 Recebíveis imobiliários', '2.4.2 Recebíveis do agronegócio', '2.4.3 Outros recebíveis',
    '3 Renda variável', '3.1 Participações em empresas', '3.1.1 Ações ordinárias', '3.1.2 Ações preferenciais',
    '3.2 Imóveis de renda', '3.3 Desenvolvimento imobiliário',
    '4 Investimentos no exterior', '4.1 Dívida soberana no exterior', '4.2 Crédito privado no exterior',
    '4.3 Participações em empresas no exterior', '4.4 Imóveis no exterior',
    '5 Criptoativos e ativos digitais', '5.1 Criptoativos sem lastro', '5.2 Stablecoins', '5.2.1 Com reservas',
    '5.2.2 Algorítmicas', '5.3 Outros ativos digitais',
    '6 Alternativos, moedas, outros', '6.1 Ouro', '6.2 Outras commodities', '6.3 Exposição a moedas',
    '6.4 Estratégias multiexposição', '6.5 Outros alternativos'],
  'a árvore, na ordem de apresentação, é a aprovada');
select is_empty(
  $$ with recursive arv as (
       select t.id, t.ordem::text as codigo from public.taxonomia_ativos t where t.parent_id is null
       union all
       select t.id, a.codigo || '.' || t.ordem from public.taxonomia_ativos t join arv a on t.parent_id = a.id)
     select codigo from arv where id <> pg_temp.no(codigo) $$,
  'toda identidade é fixa e derivada do código da especificação');
select is((select id from public.taxonomia_ativos where nome = 'CDB'), 'a5000000-0000-4000-8000-000000020201'::uuid,
  'o UUID do CDB é o fixado');
select is_empty($$ select 1 from public.taxonomia_ativos where nome ~ '[0-9]' or nome ~* '(taxa|indexador|cdi|ipca|selic|lci|lca)' $$,
  'nenhum nó carrega taxa, indexador ou benefício tributário no nome');

-- 3. Restrições do catálogo (como dono do banco; as tentativas são desfeitas pelo próprio teste)
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 1, 'Raiz com pai', 9) $f$, pg_temp.no('2')), '23514', null, 'uma raiz com pai é recusada');
select throws_ok($$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), null, 2, 'Subclasse sem pai', 9) $$, '23514', null, 'um nível 2 sem pai é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 4, 'Nível quatro', 9) $f$, pg_temp.no('2.2.1')), '23514', null, 'o nível 4 é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 3, 'Tipo sob raiz', 9) $f$, pg_temp.no('2')), '23503', null, 'um nível 3 sob uma raiz é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 2, 'Subclasse sob subclasse', 9) $f$, pg_temp.no('2.2')), '23503', null,
  'um nível 2 sob outra subclasse é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 2, '   ', 9) $f$, pg_temp.no('2')), '23514', null, 'nome vazio é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 2, %L, 9) $f$, pg_temp.no('2'), repeat('x', 101)), '23514', null,
  'nome com mais de 100 caracteres é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 2, 'Ordem zero', 0) $f$, pg_temp.no('2')), '23514', null, 'ordem não positiva é recusada');
select throws_ok($$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), null, 1, ' RENDA FIXÁ ', 9) $$, '23505', null,
  'raiz repetida com outra caixa, acento e espaços nas pontas é recusada');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 3, ' cdb ', 9) $f$, pg_temp.no('2.2')), '23505', null,
  'irmão repetido com outra caixa e espaços nas pontas é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 3, 'Debentures', 9) $f$, pg_temp.no('2.3')), '23505', null,
  'irmão que só difere no acento é recusado');
select throws_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), %L, 2, 'Outra subclasse', 1) $f$, pg_temp.no('2')), '23505', null,
  'ordem repetida entre irmãos é recusada');
select throws_ok($$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (gen_random_uuid(), null, 1, 'Outra raiz', 1) $$, '23505', null, 'ordem repetida entre raízes é recusada');
select lives_ok(format($f$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
  values (%L, %L, 2, 'Dívida soberana', 4) $f$, gen_random_uuid(), pg_temp.no('3')), 'o mesmo nome sob outro pai é aceito');
select is((select count(*) from public.taxonomia_ativos), 40::bigint, 'só a inserção válida entrou no catálogo');
delete from public.taxonomia_ativos where parent_id = pg_temp.no('3') and ordem = 4;
select throws_ok(format($f$ update public.taxonomia_ativos set parent_id = %L where id = %L $f$, pg_temp.no('2.2.1'), pg_temp.no('2.2')),
  '23503', null, 'um nó não pode passar a descendente de si mesmo (sem ciclo)');
select throws_ok(format($f$ update public.taxonomia_ativos set parent_id = %L where id = %L $f$, pg_temp.no('2.1'), pg_temp.no('2')),
  '23514', null, 'uma raiz não ganha pai');
select throws_ok(format($f$ update public.taxonomia_ativos set nivel = 3 where id = %L $f$, pg_temp.no('2.2')), '23503', null,
  'mudar o nível de um nó com filhos é recusado');
select throws_ok(format($f$ delete from public.taxonomia_ativos where id = %L $f$, pg_temp.no('2.2')), '23503', null,
  'um nó com filhos não é excluído');
select is((select count(*) from public.taxonomia_ativos), 39::bigint, 'depois das tentativas, o catálogo continua com 39 nós');

-- 4. Leitura e escrita pela Data API
select pg_temp.act_as_anon();
select throws_ok($$ select count(*) from public.taxonomia_ativos $$, '42501', null, 'anon não lê o catálogo');
reset role;
create function pg_temp.sessao_da_api(p_ator text) returns setof text language plpgsql as $$
begin
  return next is((select count(*) from public.taxonomia_ativos), 39::bigint, p_ator || ' lê as 39 entradas do catálogo');
  return next throws_ok($q$ insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem)
    values (gen_random_uuid(), null, 1, 'Intrusa', 9) $q$, '42501', null, p_ator || ' não insere no catálogo');
  return next throws_ok($q$ update public.taxonomia_ativos set nome = 'x' $q$, '42501', null, p_ator || ' não altera o catálogo');
  return next throws_ok($q$ delete from public.taxonomia_ativos $q$, '42501', null, p_ator || ' não exclui do catálogo');
  return next throws_ok($q$ update public.profiles set versao_classificacao = 0 $q$, '42501', null,
    p_ator || ' não reinicia a marca de coerência');
  return next throws_ok($q$ update public.ativos set taxonomia_id = null $q$, '42501', null,
    p_ator || ' não escreve o vínculo do ativo direto');
end $$;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d1');
select * from pg_temp.sessao_da_api('A');
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select * from pg_temp.sessao_da_api('o admin');
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d2');
select is((select count(*) from public.taxonomia_ativos), 39::bigint, 'B lê o catálogo inteiro');
select is_empty($$ select 1 from public.profiles where user_id <> '00000000-0000-4000-8000-0000000000d2' $$,
  'B não lê o perfil, nem a marca, de outro usuário');
reset role;

-- 5. Vínculo do ativo (como dono do banco)
insert into public.ativos (user_id, nome, tipo_ajuste, sistema) values
  ('00000000-0000-4000-8000-0000000000d3', 'Em trânsito', null, 'transito');
select throws_ok($$ insert into public.ativos (user_id, nome, tipo_ajuste, taxonomia_id)
  values ('00000000-0000-4000-8000-0000000000d3', 'Ativo da chave', 'rendimento', gen_random_uuid()) $$, '23503', null,
  'um nó inexistente é recusado pela chave');
select throws_ok(format($f$ update public.ativos set taxonomia_id = %L where sistema = 'transito' $f$, pg_temp.no('1')),
  '23514', null, 'o trânsito não recebe classe');
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d3'), 0::bigint, 'as tentativas recusadas não mexem na marca');

-- 6. Equivalência mínima do legado (D17)
select is(private.normalizar_nome(' Renda FIXÁ '), 'renda fixa', 'a identidade ignora caixa, acento e espaços nas pontas');
select is(private.normalizar_nome('AÇÃO Êxtase Üñ'), 'acao extase uñ', 'a transliteração cobre os caracteres do português');
select is(private.normalizar_nome(E'  Renda fixa'), E' renda fixa',
  'só o espaço comum das pontas é removido, como no btrim do banco');
select is(private.taxonomia_equivalente('Renda fixa'), pg_temp.no('2'), '"Renda fixa" mapeia para a classe 2');
select is(private.taxonomia_equivalente(' RENDA VARIÁVEL '), pg_temp.no('3'), 'caixa, acento e espaços são ignorados');
select is(private.taxonomia_equivalente('renda variavel'), pg_temp.no('3'), 'o nome sem acento também mapeia');
select is(private.taxonomia_equivalente('caixa e disponibilidades'), pg_temp.no('1'), '"Caixa e disponibilidades" mapeia para a classe 1');
select is(private.taxonomia_equivalente('Investimentos no Exterior'), pg_temp.no('4'), '"Investimentos no exterior" mapeia para a classe 4');
select is(private.taxonomia_equivalente('Criptoativos e Ativos Digitais'), pg_temp.no('5'), 'o nome completo da classe 5 mapeia');
select is(private.taxonomia_equivalente(' CRIPTO '), pg_temp.no('5'), 'o alias "Cripto" mapeia para a classe 5');
select is(private.taxonomia_equivalente('Alternativos, moedas, outros'), pg_temp.no('6'), 'o nome completo da classe 6 mapeia');
select is(private.taxonomia_equivalente('Outros'), pg_temp.no('6'), 'o alias "Outros" mapeia para a classe 6');
select is(private.taxonomia_equivalente('Fundos'), null::uuid, '"Fundos" fica sem nó');
select is(private.taxonomia_equivalente('Ações'), null::uuid, 'um nome personalizado fica sem nó');
select is(private.taxonomia_equivalente('Renda fixa e variável'), null::uuid, 'não há busca parcial');
select is(private.taxonomia_equivalente('Renda  fixa'), null::uuid, 'espaços internos não são colapsados');
select is(private.taxonomia_equivalente('Outros ativos'), null::uuid, 'um nome que apenas contém um alias fica sem nó');
select is(private.taxonomia_equivalente('   '), null::uuid, 'nome vazio fica sem nó');
select is(private.taxonomia_equivalente(null), null::uuid, 'ausência de legado fica sem nó');

-- 7. Preenchimento do legado (a mesma instrução da migração) e a marca de coerência (usuário C)
-- O legado é criado direto, como existia antes da migração; o gatilho da marca já está ativo.
insert into public.classes_ativo (user_id, nome) values
  ('00000000-0000-4000-8000-0000000000d3', 'Renda fixa'), ('00000000-0000-4000-8000-0000000000d3', 'CRIPTO'),
  ('00000000-0000-4000-8000-0000000000d3', 'Fundos'), ('00000000-0000-4000-8000-0000000000d3', 'Renda Variavel');
insert into public.ativos (user_id, nome, tipo_ajuste, classe_id, ativo, desativado_em)
select '00000000-0000-4000-8000-0000000000d3', v.nome, 'rendimento', c.id, v.ativo, case when v.ativo then null else now() end
from (values ('Ativo C1', 'Renda fixa', true), ('Ativo C2', 'CRIPTO', true), ('Ativo C3', 'Fundos', true),
  ('Ativo C4', 'Renda Variavel', false)) v (nome, classe, ativo)
join public.classes_ativo c on c.user_id = '00000000-0000-4000-8000-0000000000d3' and c.nome = v.classe;
insert into public.ativos (user_id, nome, tipo_ajuste) values ('00000000-0000-4000-8000-0000000000d3', 'Ativo C5', 'marcacao');
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d3'), 0::bigint,
  'ativos sem nó (com ou sem legado) não mexem na marca');
select set_config('teste.retrato_c', pg_temp.retrato_ativos('00000000-0000-4000-8000-0000000000d3'), true);
update public.ativos a
set taxonomia_id = private.taxonomia_equivalente(c.nome)
from public.classes_ativo c
where c.user_id = a.user_id and c.id = a.classe_id and a.sistema is null
  and private.taxonomia_equivalente(c.nome) is not null;
select is((select array_agg(a.nome || '=' || coalesce(a.taxonomia_id::text, 'nulo') order by a.nome) from public.ativos a
  where a.user_id = '00000000-0000-4000-8000-0000000000d3' and a.sistema is null),
  array['Ativo C1=' || pg_temp.no('2'), 'Ativo C2=' || pg_temp.no('5'), 'Ativo C3=nulo', 'Ativo C4=' || pg_temp.no('3'),
    'Ativo C5=nulo'], 'o preenchimento mapeia só o que é equivalente, inclusive o ativo desativado');
select is((select taxonomia_id from public.ativos where sistema = 'transito' and user_id = '00000000-0000-4000-8000-0000000000d3'),
  null::uuid, 'o trânsito continua sem nó');
select is(pg_temp.retrato_ativos('00000000-0000-4000-8000-0000000000d3'), current_setting('teste.retrato_c'),
  'nenhuma outra coluna do ativo mudou, nem o legado classe_id');
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d3'), 3::bigint, 'o preenchimento registra uma mudança por ativo mapeado');
update public.ativos a
set taxonomia_id = private.taxonomia_equivalente(c.nome)
from public.classes_ativo c
where c.user_id = a.user_id and c.id = a.classe_id and a.sistema is null
  and private.taxonomia_equivalente(c.nome) is not null;
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d3'), 3::bigint, 'repetir o preenchimento não muda nada, nem a marca');
select is((select count(*) from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000d3'), 4::bigint,
  'o legado classes_ativo continua intacto');
select throws_ok($$ update public.profiles set versao_classificacao = -1 $$, '23514', null, 'a marca não aceita valor negativo');

-- 8. RPCs novas (usuário A)
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d1');
select is(public.ler_versao_classificacao(), '0', 'um perfil sem classificação lê a marca 0');
select pg_temp.guarda('ia', public.criar_instituicao('Banco Exemplo'));
select pg_temp.guarda('a_macro', public.cadastrar_ativo_taxonomia('Ativo A macro', 'rendimento', pg_temp.id('ia'), null,
  pg_temp.no('2'), true, null, false, null));
select pg_temp.guarda('a_sub', public.cadastrar_ativo_taxonomia('Ativo A sub', 'rendimento', null, ' banco exemplo ',
  pg_temp.no('2.2'), null, null, null, null));
select pg_temp.guarda('a_tipo', public.cadastrar_ativo_taxonomia('Ativo A tipo', 'marcacao', null, null, pg_temp.no('2.2.1'),
  null, null, null, true));
select pg_temp.guarda('a_sem', public.cadastrar_ativo_taxonomia('Ativo A sem classe', 'rendimento', null, null, null,
  null, null, null, null));
select is((select array_agg(coalesce(a.taxonomia_id::text, 'nulo') order by a.nome) from public.ativos a
  where a.user_id = '00000000-0000-4000-8000-0000000000d1' and a.sistema is null),
  array[pg_temp.no('2')::text, 'nulo', pg_temp.no('2.2')::text, pg_temp.no('2.2.1')::text],
  'o cadastro aceita um nó de qualquer nível, ou nenhum');
select is((select count(*) from public.ativos a where a.user_id = '00000000-0000-4000-8000-0000000000d1'
  and a.classe_id is not null), 0::bigint, 'o cadastro novo não escreve o legado classe_id');
select is((select concat_ws('|', a.instituicao_id = pg_temp.id('ia'), a.previdencia, coalesce(a.liquidez_imediata::text, 'nulo'),
    a.exposicao_cambial, coalesce(a.isento_ir::text, 'nulo')) from public.ativos a where a.id = pg_temp.id('a_macro')),
  't|t|nulo|f|nulo', 'o cadastro novo grava instituição e indicadores em três estados');
select is((select count(*) from public.instituicoes), 1::bigint, 'o nome novo de instituição reaproveita a entrada de mesma identidade');
select is((select count(*) from public.ativos where sistema = 'transito'), 1::bigint, 'o cadastro novo garante o trânsito, uma vez');
select is(public.ler_versao_classificacao(), '3', 'três cadastros com nó, uma mudança cada; o sem nó não conta');
select is(pg_temp.erro(format('select public.cadastrar_ativo_taxonomia(%L, %L, null, null, %L, null, null, null, null)',
  'Ativo fictício', 'rendimento', gen_random_uuid())), 'recusado_taxonomia_inexistente', 'um nó inexistente é recusado no cadastro');
select is(pg_temp.erro($$ select public.cadastrar_ativo_taxonomia('Ativo fictício', null, null, null, null, null, null, null, null) $$),
  'recusado_tipo_ajuste', 'o cadastro novo exige o tipo de ajuste');
select is(pg_temp.erro(format('select public.cadastrar_ativo_taxonomia(%L, %L, %L, %L, null, null, null, null, null)',
  'Ativo fictício', 'rendimento', pg_temp.id('ia'), 'Outra')), 'recusado_referencia_dupla', 'id e nome novo de instituição juntos são recusados');
select is((select count(*) from public.ativos a where a.nome = 'Ativo fictício'), 0::bigint, 'cadastros recusados não gravam ativo');
select is(public.ler_versao_classificacao(), '3', 'cadastros recusados não mexem na marca');

-- Edição nova: preserva o legado, troca o nó, limpa e aceita desativado
select pg_temp.guarda('a_legado', public.cadastrar_ativo('Ativo A legado', 'rendimento', null, null, null, 'Classe antiga',
  null, null, null, null));
select is((select concat_ws('|', a.classe_id is not null, coalesce(a.taxonomia_id::text, 'nulo')) from public.ativos a
  where a.id = pg_temp.id('a_legado')), 't|nulo', 'o cadastro antigo cria o ativo com legado e sem nó (Sem classe)');
select is(public.ler_versao_classificacao(), '3', 'o cadastro antigo não mexe na marca');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('a_legado'), null, null, pg_temp.no('2.4'), true, true, true, true);
select is((select concat_ws('|', a.classe_id is not null, a.taxonomia_id = pg_temp.no('2.4'), a.previdencia) from public.ativos a
  where a.id = pg_temp.id('a_legado')), 't|t|t', 'a edição nova troca o nó e preserva o legado classe_id');
select is(public.ler_versao_classificacao(), '4', 'a edição que muda o nó incrementa a marca');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('a_legado'), null, null, pg_temp.no('2.4'), false, null, null, null);
select is(public.ler_versao_classificacao(), '4', 'editar outros campos com o mesmo nó não incrementa a marca');
select is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, null, null, %L, null, null, null, null)',
  pg_temp.id('a_legado'), gen_random_uuid())), 'recusado_taxonomia_inexistente', 'um nó inexistente é recusado na edição');
select is((select a.taxonomia_id from public.ativos a where a.id = pg_temp.id('a_legado')), pg_temp.no('2.4'),
  'a edição recusada não altera o ativo');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('a_legado'), null, null, null, null, null, null, null);
select is((select concat_ws('|', a.classe_id is not null, coalesce(a.taxonomia_id::text, 'nulo')) from public.ativos a
  where a.id = pg_temp.id('a_legado')), 't|nulo', 'limpar o nó é permitido e o legado continua');
select is(public.ler_versao_classificacao(), '5', 'limpar um nó incrementa a marca');
select pg_temp.guarda('at', (select a.id from public.ativos a where a.sistema = 'transito'));
select is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, null, null, %L, null, null, null, null)',
  pg_temp.id('at'), pg_temp.no('1'))), 'recusado_ativo_invalido', 'o trânsito não recebe classe pela edição nova');
select public.desativar_ativo(pg_temp.id('a_sem'));
select is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, null, null, %L, null, null, null, null)',
  pg_temp.id('a_sem'), pg_temp.no('1.1'))), 'ok', 'um ativo desativado pode ser editado');
select is(public.ler_versao_classificacao(), '6', 'a edição do desativado também incrementa a marca');

-- Janela de transição: a edição antiga limpa o nó e o cadastro antigo deixa o nó nulo
select is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, null, %L, null, null, null, null)',
  pg_temp.id('a_macro'), 'Classe antiga')), 'ok', 'a edição antiga continua funcionando');
select is((select concat_ws('|', coalesce(a.taxonomia_id::text, 'nulo'), c.nome) from public.ativos a
  join public.classes_ativo c on c.user_id = a.user_id and c.id = a.classe_id where a.id = pg_temp.id('a_macro')),
  'nulo|Classe antiga', 'a edição antiga grava o legado e torna o ativo "Sem classe"');
select is(public.ler_versao_classificacao(), '7', 'a edição antiga que zera o nó incrementa a marca');
select is(pg_temp.erro(format('select public.editar_detalhes_ativo(%L, null, null, null, %L, null, null, null, null)',
  pg_temp.id('a_macro'), 'Classe antiga')), 'ok', 'repetir a edição antiga é aceito');
select is(public.ler_versao_classificacao(), '7', 'a edição antiga sobre ativo já sem nó não incrementa a marca');
select is(pg_temp.erro($$ select public.criar_classe('Outra classe antiga') $$), 'ok', 'o CRUD antigo de classes continua na janela');
select pg_temp.guarda('a_basico', public.criar_ativo('Ativo A básico', 'rendimento'));
select is((select taxonomia_id from public.ativos where id = pg_temp.id('a_basico')), null::uuid,
  'criar_ativo continua criando o ativo sem nó');
reset role;

-- 9. Isolamento das funções novas (B e o admin, cada um com a própria sessão)
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d2');
select pg_temp.guarda('ib', public.criar_instituicao('Banco do B'));
select pg_temp.guarda('b1', public.criar_ativo('Ativo fictício B1', 'rendimento'));
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select pg_temp.guarda('iadm', public.criar_instituicao('Banco do Admin'));
select pg_temp.guarda('adm1', public.criar_ativo('Ativo fictício do admin', 'rendimento'));
reset role;
select set_config('teste.retrato_a', (select md5(string_agg(to_jsonb(a)::text, ';' order by a.id)) from public.ativos a
  where a.user_id = '00000000-0000-4000-8000-0000000000d1'), true);
select set_config('teste.versao_a', pg_temp.versao('00000000-0000-4000-8000-0000000000d1')::text, true);
create function pg_temp.tentativas(p_ator text, p_inst uuid, p_ativo uuid) returns setof text language plpgsql as $$
begin
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, null, null, %L, null, null, null, null)',
    pg_temp.id('a_macro'), pg_temp.no('2'))), 'recusado_ativo_inexistente', p_ator || ' não edita ativo de A');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, null, %L, null, null, null, null, null)',
    pg_temp.id('a_macro'), 'Instituição da tentativa')), 'recusado_ativo_inexistente',
    p_ator || ' não edita ativo de A com instituição nova');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, %L, null, %L, null, null, null, null)',
    pg_temp.id('a_macro'), p_inst, pg_temp.no('1'))), 'recusado_ativo_inexistente', p_ator || ' não edita ativo de A com as próprias referências');
  return next is(pg_temp.erro(format('select public.cadastrar_ativo_taxonomia(%L, %L, %L, null, null, null, null, null, null)',
    'Ativo da tentativa', 'rendimento', pg_temp.id('ia'))), 'recusado_instituicao_inexistente',
    p_ator || ' não cadastra ativo com instituição de A');
  return next is(pg_temp.erro(format('select public.editar_detalhes_ativo_taxonomia(%L, %L, null, null, null, null, null, null)',
    p_ativo, pg_temp.id('ia'))), 'recusado_instituicao_inexistente', p_ator || ' não usa instituição de A no próprio ativo');
  return next is(public.ler_versao_classificacao(), (select p.versao_classificacao::text from public.profiles p
    where p.user_id = (select auth.uid())), p_ator || ' lê só a própria marca');
  return next isnt(public.ler_versao_classificacao(), current_setting('teste.versao_a'),
    p_ator || ' não lê a marca de A');
end $$;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d2');
select * from pg_temp.tentativas('B', pg_temp.id('ib'), pg_temp.id('b1'));
reset role;
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select * from pg_temp.tentativas('o admin', pg_temp.id('iadm'), pg_temp.id('adm1'));
reset role;
select is((select md5(string_agg(to_jsonb(a)::text, ';' order by a.id)) from public.ativos a
  where a.user_id = '00000000-0000-4000-8000-0000000000d1'), current_setting('teste.retrato_a'),
  'depois das tentativas, os ativos de A continuam iguais');
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d1'), current_setting('teste.versao_a')::bigint,
  'depois das tentativas, a marca de A continua igual');
select is_empty($$ select 1 from public.instituicoes where nome = 'Instituição da tentativa' $$, 'nenhuma instituição foi criada pelas tentativas');
select is_empty($$ select 1 from public.ativos where nome = 'Ativo da tentativa' $$, 'nenhum ativo foi criado pelas tentativas');

-- 10. Marca de coerência: monotônica, transacional e detectável (usuário B, que começa em zero)
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d2');
select pg_temp.guarda('b2', public.criar_ativo('Ativo fictício B2', 'marcacao'));
select is(public.ler_versao_classificacao(), '0', 'ativos criados sem nó não mexem na marca');
select pg_temp.guarda('b3', public.cadastrar_ativo_taxonomia('Ativo fictício B3', 'rendimento', null, null, pg_temp.no('3'),
  null, null, null, null));
select is(public.ler_versao_classificacao(), '1', 'um ativo novo já com nó incrementa a marca');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('b1'), null, null, pg_temp.no('2.2'), null, null, null, null);
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('b2'), null, null, pg_temp.no('3.2'), null, null, null, null);
select is(public.ler_versao_classificacao(), '3', 'duas mudanças em ativos distintos contam duas vezes');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('b1'), null, null, pg_temp.no('2.3'), null, null, null, null);
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('b1'), null, null, pg_temp.no('2.2'), null, null, null, null);
select is((select a.taxonomia_id from public.ativos a where a.id = pg_temp.id('b1')), pg_temp.no('2.2'),
  'a classe volta ao valor anterior (A → B → A)');
select is(public.ler_versao_classificacao(), '5', 'a volta ao valor anterior também é detectada, e a marca só cresce');
select pg_temp.tenta_e_desfaz(pg_temp.id('b2'), pg_temp.no('4'));
select is(public.ler_versao_classificacao(), '5', 'uma mudança desfeita (rollback) não deixa incremento');
select is((select a.taxonomia_id from public.ativos a where a.id = pg_temp.id('b2')), pg_temp.no('3.2'),
  'e o ativo volta ao nó anterior');
select is(pg_typeof(public.ler_versao_classificacao())::text, 'text', 'a leitura devolve texto');
reset role;
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d2'), 5::bigint, 'a marca gravada é a mesma que a leitura devolveu');

-- Estouro: o contador nunca reinicia (usuário admin; a leitura devolve o valor exato acima de 2^53)
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('adm1'), null, null, pg_temp.no('3'), null, null, null, null);
reset role;
update public.profiles set versao_classificacao = 9223372036854775807 where user_id = '00000000-0000-4000-8000-0000000000d0';
select pg_temp.act_as('00000000-0000-4000-8000-0000000000d0');
select is(public.ler_versao_classificacao(), '9223372036854775807', 'a leitura devolve o texto exato do maior valor');
select throws_ok(format('select public.editar_detalhes_ativo_taxonomia(%L, null, null, %L, null, null, null, null)',
  pg_temp.id('adm1'), pg_temp.no('1')), '22003', null, 'o estouro aborta a mudança');
select is((select a.taxonomia_id from public.ativos a where a.id = pg_temp.id('adm1')), pg_temp.no('3'),
  'e o ativo continua com o nó anterior');
select is(public.ler_versao_classificacao(), '9223372036854775807', 'o contador não reinicia no estouro');
reset role;

-- Sem sessão, sem perfil e anônimo
select pg_temp.act_as_anon();
select throws_ok($$ select public.ler_versao_classificacao() $$, '42501', null, 'anon não lê a marca');
select throws_ok($$ select public.cadastrar_ativo_taxonomia('x', 'rendimento', null, null, null, null, null, null, null) $$,
  '42501', null, 'anon não executa cadastrar_ativo_taxonomia');
select throws_ok($$ select public.editar_detalhes_ativo_taxonomia(gen_random_uuid(), null, null, null, null, null, null, null) $$,
  '42501', null, 'anon não executa editar_detalhes_ativo_taxonomia');
reset role;
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$ select public.ler_versao_classificacao() $$, '42501', null, 'sem sessão a leitura da marca é recusada');
select pg_temp.act_as(gen_random_uuid());
select is(pg_temp.erro('select public.ler_versao_classificacao()'), 'recusado_perfil_inexistente',
  'sem perfil a leitura da marca é recusada');
reset role;

-- 11. Sem sementes: perfil novo nasce sem classes, e as funções das classes iniciais saíram
select is((select count(*) from public.classes_ativo where user_id = '00000000-0000-4000-8000-0000000000d2'), 0::bigint,
  'um perfil novo não recebe classes');
select hasnt_function('private', 'classes_iniciais_do_perfil', 'a função do gatilho das classes iniciais foi retirada');
select is(pg_temp.versao('00000000-0000-4000-8000-0000000000d1'), current_setting('teste.versao_a')::bigint,
  'a marca de A continua a mesma ao fim das sessões dos outros usuários');

-- 12. Exclusão do usuário e catálogo
select lives_ok($$ delete from auth.users where id = '00000000-0000-4000-8000-0000000000d1' $$,
  'o usuário com ativos classificados pode ser excluído');
select is((select count(*) from public.ativos where user_id = '00000000-0000-4000-8000-0000000000d1'), 0::bigint,
  'a exclusão leva os ativos do usuário');
select is((select count(*) from public.taxonomia_ativos), 39::bigint, 'e o catálogo global não muda');
select throws_ok(format($f$ delete from public.taxonomia_ativos where id = %L $f$, pg_temp.no('2')), '23503', null,
  'um nó referenciado por ativo não é excluído');
select throws_ok(format($f$ delete from public.taxonomia_ativos where id = %L $f$, pg_temp.no('2.4')), '23503', null,
  'um nó com filhos não é excluído, mesmo sem ativo ligado');
select throws_ok(format($f$ delete from public.taxonomia_ativos where id = %L $f$, pg_temp.no('3.2')), '23503', null,
  'um nó referenciado por ativo de outro usuário também não é excluído');

select * from finish();
rollback;
