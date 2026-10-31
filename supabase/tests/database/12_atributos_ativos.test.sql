-- Ciclo 017, issue #172: atributos complementares dos ativos. Constraints, funções novas, isolamento,
-- atomicidade e compatibilidade das funções anteriores. Somente dados fictícios.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
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
-- Edita só os atributos do ativo 'a' com nome e vínculos fixos (os indicadores ficam nulos).
create function pg_temp.atributos(p_veiculos text, p_indexadores text, p_regime text, p_tipo text, p_dias text,
  p_unidade text, p_fgc text) returns text language sql as $$
  select format('select public.editar_ativo_com_atributos(pg_temp.id(''a''), ''Ativo A'', null, null, null, null, null, null, null, %s, %s, %s, %s, %s, %s, %s)',
    coalesce(quote_literal(p_veiculos) || '::text[]', 'null'), coalesce(quote_literal(p_indexadores) || '::text[]', 'null'),
    coalesce(quote_literal(p_regime), 'null'), coalesce(quote_literal(p_tipo), 'null'),
    coalesce(quote_literal(p_dias) || '::integer', 'null'), coalesce(quote_literal(p_unidade), 'null'),
    coalesce(quote_literal(p_fgc), 'null'));
$$;
create function pg_temp.linha() returns jsonb language sql as $$
  select jsonb_build_object('veiculos', veiculos_acesso, 'indexadores', indexadores_remuneracao,
    'regime', regime_tributario, 'tipo', prazo_resgate_tipo, 'dias', prazo_resgate_dias,
    'unidade', prazo_resgate_unidade, 'fgc', cobertura_fgc)
  from public.ativos where id = pg_temp.id('a');
$$;

insert into public.authorized_emails(email,role) values ('atributos1@example.com','user');
insert into auth.users(id,email) values ('17200000-0000-4000-8000-000000000001','atributos1@example.com');
insert into public.authorized_emails(email,role) values ('atributos2@example.com','user');
insert into auth.users(id,email) values ('17200000-0000-4000-8000-000000000002','atributos2@example.com');
insert into public.authorized_emails(email,role) values ('atributos3@example.com','admin');
insert into auth.users(id,email) values ('17200000-0000-4000-8000-000000000003','atributos3@example.com');

-- Estrutura e permissões.
select col_type_is('public','ativos','veiculos_acesso','text[]','veículos é text[]');
select col_not_null('public','ativos','veiculos_acesso','veículos não aceita nulo');
select col_default_is('public','ativos','veiculos_acesso','{}'::text,'veículos começa vazio');
select col_type_is('public','ativos','indexadores_remuneracao','text[]','indexadores é text[]');
select col_not_null('public','ativos','indexadores_remuneracao','indexadores não aceita nulo');
select col_type_is('public','ativos','prazo_resgate_dias','integer','dias é integer');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('cadastrar_ativo_com_atributos','editar_ativo_com_atributos')),
  2::bigint,'funções novas sem sobrecarga');
select ok(has_function_privilege('authenticated','public.cadastrar_ativo_com_atributos(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)','execute'),'authenticated cadastra com atributos');
select ok(has_function_privilege('authenticated','public.editar_ativo_com_atributos(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)','execute'),'authenticated edita com atributos');
select ok(not has_function_privilege('anon','public.cadastrar_ativo_com_atributos(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)','execute'),'anon não cadastra');
select ok(not has_function_privilege('anon','public.editar_ativo_com_atributos(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean,text[],text[],text,text,integer,text,text)','execute'),'anon não edita');
select ok(has_function_privilege('authenticated','public.cadastrar_ativo_taxonomia(text,public.tipo_ajuste,uuid,text,uuid,boolean,boolean,boolean,boolean)','execute')
  and has_function_privilege('authenticated','public.editar_ativo_com_nome(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean)','execute')
  and has_function_privilege('authenticated','public.editar_detalhes_ativo_taxonomia(uuid,uuid,text,uuid,boolean,boolean,boolean,boolean)','execute'),
  'funções anteriores continuam executáveis por authenticated');
select table_privs_are('public','ativos','authenticated',array['SELECT'],'escrita direta continua vedada');
select is_empty($$select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('cadastrar_ativo_com_atributos','editar_ativo_com_atributos')
    and (not p.prosecdef or p.prosrc !~ 'v_uid uuid := private\.travar_carteira\(\);')$$,
  'funções novas são security definer e travam a carteira antes de tudo');

-- Cadastro com atributos.
select pg_temp.act_as('17200000-0000-4000-8000-000000000001');
select set_config('teste.metadados', public.ler_versao_metadados(), true);
select pg_temp.guarda('a', public.cadastrar_ativo_com_atributos('Ativo A','rendimento',null,'Instituição A',
  'a5000000-0000-4000-8000-000000020000',null,false,null,null,
  '{etf,fundo,fundo}','{inpc,cdi,variacao_cambial}','fundos_longo_prazo','prazo',0,'uteis','sim'));
select is(pg_temp.linha(), '{"veiculos":["fundo","etf"],"indexadores":["cdi","variacao_cambial","inpc"],"regime":"fundos_longo_prazo","tipo":"prazo","dias":0,"unidade":"uteis","fgc":"sim"}'::jsonb,
  'cadastro grava conjuntos canônicos, sem duplicatas, na ordem do catálogo, e prazo zero');
select is((select row(nome, previdencia, liquidez_imediata, exposicao_cambial, isento_ir, taxonomia_id)::text from public.ativos where id = pg_temp.id('a')),
  row('Ativo A', null::boolean, false, null::boolean, null::boolean, 'a5000000-0000-4000-8000-000000020000'::uuid)::text,
  'cadastro grava nome, classe e indicadores; variação cambial não preenche exposição cambial');
select isnt((select instituicao_id from public.ativos where id = pg_temp.id('a')), null, 'cadastro cria a instituição nova');
select is(public.ler_versao_metadados()::bigint, current_setting('teste.metadados')::bigint + 3,
  'cadastro conta só trânsito, instituição e ativo na marca, como a função anterior');
select is((select count(*) from public.ativos where sistema = 'transito'), 1::bigint, 'cadastro cria o trânsito');
select is((select row(veiculos_acesso, indexadores_remuneracao, regime_tributario, prazo_resgate_tipo, cobertura_fgc)::text
  from public.ativos where sistema = 'transito'), row('{}'::text[], '{}'::text[], null::text, null::text, null::text)::text,
  'trânsito nasce sem atributos');

-- A edição substitui vínculos e indicadores pelos enviados (aqui nulos) e limpa os atributos.
select lives_ok(pg_temp.atributos('{}','{}',null,null,null,null,null),'limpar atributos explicitamente');
select is(pg_temp.linha(), '{"veiculos":[],"indexadores":[],"regime":null,"tipo":null,"dias":null,"unidade":null,"fgc":null}'::jsonb,
  'vazio e nulo representam Não informado');
select is((select liquidez_imediata from public.ativos where id = pg_temp.id('a')), null::boolean, 'edição substitui os indicadores pelos enviados');
select is((select instituicao_id from public.ativos where id = pg_temp.id('a')), null::uuid, 'edição substitui a instituição pela enviada');

-- Com nome e vínculos iguais, mudar só atributos não mexe nas marcas de metadados e de classificação.
select set_config('teste.metadados', public.ler_versao_metadados(), true);
select set_config('teste.classificacao', public.ler_versao_classificacao(), true);
select lives_ok(pg_temp.atributos('{fundo}','{selic}','outro','prazo','2','uteis','sim'),'muda só atributos');
select is(public.ler_versao_metadados(), current_setting('teste.metadados'), 'atributos não incrementam a marca de metadados');
select is(public.ler_versao_classificacao(), current_setting('teste.classificacao'), 'atributos não incrementam a marca de classificação');

-- Catálogos e conjuntos.
select lives_ok(pg_temp.atributos('{direto,fundo,etf,plano_contrato,certificado_representativo,outro}','{cdi,selic,ipca,igpm,tr,variacao_cambial,inpc,outro}',
  'renda_fixa_por_prazo','no_vencimento',null,null,'nao'),'aceita todas as opções não exclusivas juntas');
select is(pg_temp.linha()->'veiculos', '["direto","fundo","etf","plano_contrato","certificado_representativo","outro"]'::jsonb, 'veículos completos em ordem');
select is(pg_temp.linha()->'indexadores', '["cdi","selic","ipca","igpm","tr","variacao_cambial","inpc","outro"]'::jsonb, 'indexadores completos em ordem');
select lives_ok(pg_temp.atributos('{nao_aplicavel}','{sem_indexador}','nao_aplicavel','nao_aplicavel',null,null,'nao_aplicavel'),'aceita os estados exclusivos sozinhos');
select lives_ok(pg_temp.atributos('{nao_aplicavel,nao_aplicavel}','{nao_aplicavel}',null,'sem_prazo_estimavel',null,null,null),'repetição de exclusivo é normalizada');
select is(pg_temp.linha()->'veiculos', '["nao_aplicavel"]'::jsonb, 'exclusivo repetido vira um');
select is(pg_temp.erro(pg_temp.atributos('{nao_aplicavel,fundo}','{}',null,null,null,null,null)),'recusado_veiculos_acesso','Não se aplica é exclusivo em veículos');
select is(pg_temp.erro(pg_temp.atributos('{}','{sem_indexador,cdi}',null,null,null,null,null)),'recusado_indexadores_remuneracao','Prefixado é exclusivo em indexadores');
select is(pg_temp.erro(pg_temp.atributos('{}','{sem_indexador,nao_aplicavel}',null,null,null,null,null)),'recusado_indexadores_remuneracao','dois exclusivos juntos são recusados');
select is(pg_temp.erro(pg_temp.atributos('{}','{nao_aplicavel,ipca}',null,null,null,null,null)),'recusado_indexadores_remuneracao','Não se aplica é exclusivo em indexadores');
select is(pg_temp.erro(pg_temp.atributos('{Fundo}','{}',null,null,null,null,null)),'recusado_veiculos_acesso','código fora do catálogo (caixa diferente) recusado');
select is(pg_temp.erro(pg_temp.atributos('{}','{cambio}',null,null,null,null,null)),'recusado_indexadores_remuneracao','indexador desconhecido recusado');
select is(pg_temp.erro(pg_temp.atributos('{fundo,NULL}','{}',null,null,null,null,null)),'recusado_veiculos_acesso','nulo interno recusado');
select is(pg_temp.erro(pg_temp.atributos('{{fundo},{etf}}','{}',null,null,null,null,null)),'recusado_veiculos_acesso','conjunto multidimensional recusado');
select is(pg_temp.erro(pg_temp.atributos('[0:1]={fundo,etf}','{}',null,null,null,null,null)),'recusado_veiculos_acesso','limite inferior fora do padrão recusado');
select is(pg_temp.erro(pg_temp.atributos(null,'{}',null,null,null,null,null)),'recusado_veiculos_acesso','conjunto nulo não é omissão aceita');
select is(pg_temp.erro(pg_temp.atributos('{}',null,null,null,null,null,null)),'recusado_indexadores_remuneracao','indexadores nulos recusados');
select is(pg_temp.erro(pg_temp.atributos('{}','{}','regressivo',null,null,null,null)),'recusado_regime_tributario','regime ambíguo fora do catálogo recusado');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,null,null,null,'talvez')),'recusado_cobertura_fgc','FGC fora do catálogo recusado');
select lives_ok(pg_temp.atributos('{}','{}','fundos_curto_prazo',null,null,null,'sim'),'regime e FGC válidos');
select lives_ok(pg_temp.atributos('{}','{}','previdencia_progressivo',null,null,null,null),'previdência progressiva');
select lives_ok(pg_temp.atributos('{}','{}','previdencia_regressivo',null,null,null,null),'previdência regressiva');
select lives_ok(pg_temp.atributos('{}','{}','renda_variavel',null,null,null,null),'renda variável');
select lives_ok(pg_temp.atributos('{}','{}','outro',null,null,null,null),'regime outro');

-- Prazo informado para resgate ou venda.
select lives_ok(pg_temp.atributos('{}','{}',null,'prazo','2147483647','corridos',null),'máximo de integer aceito');
select is(pg_temp.linha()->'dias', '2147483647'::jsonb, 'máximo gravado exatamente');
select lives_ok(pg_temp.atributos('{}','{}',null,'prazo','1','uteis',null),'um dia útil');
select is(pg_temp.estado(pg_temp.atributos('{}','{}',null,'prazo','2147483648','corridos',null)),'22003','acima de integer recusado');
select is(pg_temp.estado(pg_temp.atributos('{}','{}',null,'prazo','2.2','corridos',null)),'22P02','fracionário recusado, sem arredondar');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'prazo','-1','uteis',null)),'recusado_prazo_resgate','negativo recusado');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'prazo','3',null,null)),'recusado_prazo_resgate','dias sem unidade recusado');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'prazo',null,'uteis',null)),'recusado_prazo_resgate','unidade sem dias recusada');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,null,'3','uteis',null)),'recusado_prazo_resgate','dias sem situação recusados');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'no_vencimento','3','corridos',null)),'recusado_prazo_resgate','situação sem número não aceita dias');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'sem_prazo_estimavel',null,'uteis',null)),'recusado_prazo_resgate','situação sem número não aceita unidade');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'prazo','3','semanas',null)),'recusado_prazo_resgate','unidade desconhecida recusada');
select is(pg_temp.erro(pg_temp.atributos('{}','{}',null,'nao_informado',null,null,null)),'recusado_prazo_resgate','Não informado não é código persistido');
select is(pg_temp.linha()->'dias', '1'::jsonb, 'recusas preservam o último valor válido');

-- Atomicidade: recusa nos atributos desfaz nome, classe, instituição nova e indicadores.
select set_config('teste.antes', (select to_jsonb(a)::text from public.ativos a where id = pg_temp.id('a')), true);
select is(pg_temp.erro($$select public.editar_ativo_com_atributos(pg_temp.id('a'),'Nome desfeito',null,'Instituição desfeita',
  'a5000000-0000-4000-8000-000000030000',null,true,true,true,'{fundo}','{cdi}','outro','prazo',5,'dias','sim')$$),
  'recusado_prazo_resgate','recusa depois de resolver instituição');
select is((select to_jsonb(a)::text from public.ativos a where id = pg_temp.id('a')), current_setting('teste.antes'), 'ativo inteiro preservado');
select is_empty($$select 1 from public.instituicoes where nome = 'Instituição desfeita'$$, 'instituição nova desfeita');
select is(pg_temp.erro($$select public.cadastrar_ativo_com_atributos('Cadastro desfeito','rendimento',null,'Instituição do cadastro desfeito',
  null,null,null,null,null,'{fundo,nao_aplicavel}','{}',null,null,null,null,null)$$),'recusado_veiculos_acesso','cadastro com conjunto inválido recusado');
select is_empty($$select 1 from public.ativos where nome = 'Cadastro desfeito'$$, 'cadastro recusado não cria ativo');
select is_empty($$select 1 from public.instituicoes where nome = 'Instituição do cadastro desfeito'$$, 'cadastro recusado não cria instituição');
select is(pg_temp.erro($$select public.cadastrar_ativo_com_atributos('Cadastro sem tipo',null,null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),
  'recusado_tipo_ajuste','validações do cadastro anterior continuam');
select is(pg_temp.erro($$select public.editar_ativo_com_atributos(pg_temp.id('a'),' ',null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),
  'recusado_nome','validações da edição anterior continuam');

-- Edição atômica de nome e atributos juntos.
select lives_ok($$select public.editar_ativo_com_atributos(pg_temp.id('a'),'Ativo A renomeado',null,null,null,null,true,null,null,
  '{plano_contrato}','{ipca}','previdencia_regressivo','prazo',30,'corridos','nao')$$,'nome e atributos juntos');
select is((select row(nome, liquidez_imediata, veiculos_acesso, prazo_resgate_dias)::text from public.ativos where id = pg_temp.id('a')),
  row('Ativo A renomeado', true, '{plano_contrato}'::text[], 30)::text, 'nome e atributos salvos juntos');

-- Funções anteriores preservam os atributos (aplicação anterior durante o deploy).
select set_config('teste.antes', pg_temp.linha()::text, true);
select public.editar_ativo_com_nome(pg_temp.id('a'),'Ativo A pela função anterior',null,null,null,null,null,null,null);
select is(pg_temp.linha()::text, current_setting('teste.antes'), 'editar_ativo_com_nome preserva os atributos');
select public.editar_detalhes_ativo_taxonomia(pg_temp.id('a'),null,'Instituição anterior','a5000000-0000-4000-8000-000000020000',null,null,null,null);
select is(pg_temp.linha()::text, current_setting('teste.antes'), 'editar_detalhes_ativo_taxonomia preserva os atributos');
select pg_temp.guarda('antigo', public.cadastrar_ativo_taxonomia('Ativo pela função anterior','rendimento',null,null,null,null,null,null,null));
select is((select row(veiculos_acesso, indexadores_remuneracao, regime_tributario, prazo_resgate_tipo, prazo_resgate_dias,
  prazo_resgate_unidade, cobertura_fgc)::text from public.ativos where id = pg_temp.id('antigo')),
  row('{}'::text[], '{}'::text[], null::text, null::text, null::integer, null::text, null::text)::text,
  'cadastro pela função anterior nasce sem atributos');

-- Trânsito e desativado.
select is(pg_temp.erro($$select public.editar_ativo_com_atributos((select id from public.ativos where sistema='transito'),'Trânsito',null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),
  'recusado_ativo_invalido','trânsito recusado');
select public.desativar_ativo(pg_temp.id('antigo'));
select lives_ok($$select public.editar_ativo_com_atributos(pg_temp.id('antigo'),'Desativado',null,null,null,null,null,null,null,'{direto}','{tr}',null,'nao_aplicavel',null,null,'nao')$$,
  'edita atributos de ativo desativado');
select is((select row(ativo, veiculos_acesso)::text from public.ativos where id = pg_temp.id('antigo')), row(false, '{direto}'::text[])::text, 'desativado continua desativado');
reset role;

-- Isolamento: outro usuário e administrador não leem nem editam; tentativa cruzada não cria instituição.
select pg_temp.act_as('17200000-0000-4000-8000-000000000002');
select is(pg_temp.erro($$select public.editar_ativo_com_atributos(pg_temp.id('a'),'Invasão',null,'Instituição invasora',null,null,null,null,null,'{fundo}','{}',null,null,null,null,null)$$),
  'recusado_ativo_inexistente','outro usuário não edita');
select is_empty($$select 1 from public.ativos where id = pg_temp.id('a')$$,'outro usuário não lê');
select pg_temp.guarda('instituicao_b', public.criar_instituicao('Instituição de outro dono'));
reset role;
select is_empty($$select 1 from public.instituicoes where nome = 'Instituição invasora'$$,'tentativa cruzada não cria instituição');
select pg_temp.act_as('17200000-0000-4000-8000-000000000003');
select is(pg_temp.erro($$select public.editar_ativo_com_atributos(pg_temp.id('a'),'Invasão',null,null,null,null,null,null,null,'{fundo}','{}',null,null,null,null,null)$$),
  'recusado_ativo_inexistente','administrador não edita');
select is_empty($$select 1 from public.ativos where id = pg_temp.id('a')$$,'administrador não lê');
reset role;
select pg_temp.act_as('17200000-0000-4000-8000-000000000001');
select is(pg_temp.erro($$select public.editar_ativo_com_atributos(pg_temp.id('a'),'Cruzada',pg_temp.id('instituicao_b'),null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),
  'recusado_instituicao_inexistente','não aceita instituição de outro dono');
select is((select veiculos_acesso from public.ativos where id = pg_temp.id('a')), '{plano_contrato}'::text[], 'dono lê os próprios atributos');
reset role;
select pg_temp.act_as_anon();
select is(pg_temp.estado($$select public.editar_ativo_com_atributos(gen_random_uuid(),'Anon',null,null,null,null,null,null,null,'{}','{}',null,null,null,null,null)$$),
  '42501','anon recusado');
reset role;
select pg_temp.act_as('17200000-0000-4000-8000-000000000001');
select is(pg_temp.estado($$update public.ativos set veiculos_acesso = '{fundo}' where id = pg_temp.id('a')$$),'42501','escrita direta recusada');
reset role;

-- Constraints garantem a forma no banco, mesmo fora das funções.
select is(pg_temp.estado($$update public.ativos set veiculos_acesso = '{etf,fundo}' where id = pg_temp.id('a')$$),'23514','ordem fora do catálogo violada');
select is(pg_temp.estado($$update public.ativos set veiculos_acesso = '{fundo,fundo}' where id = pg_temp.id('a')$$),'23514','duplicata violada');
select is(pg_temp.estado($$update public.ativos set indexadores_remuneracao = '{cdi,sem_indexador}' where id = pg_temp.id('a')$$),'23514','exclusividade violada');
select is(pg_temp.estado($$update public.ativos set indexadores_remuneracao = array['cdi',null] where id = pg_temp.id('a')$$),'23514','nulo interno violado');
select is(pg_temp.estado($$update public.ativos set veiculos_acesso = null where id = pg_temp.id('a')$$),'23502','conjunto nulo violado');
select is(pg_temp.estado($$update public.ativos set regime_tributario = 'isento' where id = pg_temp.id('a')$$),'23514','regime violado');
select is(pg_temp.estado($$update public.ativos set cobertura_fgc = 'nao_informado' where id = pg_temp.id('a')$$),'23514','FGC violado');
select is(pg_temp.estado($$update public.ativos set prazo_resgate_unidade = null where id = pg_temp.id('a')$$),'23514','tupla parcial violada');
select is(pg_temp.estado($$update public.ativos set prazo_resgate_tipo = null, prazo_resgate_dias = null, prazo_resgate_unidade = null where id = pg_temp.id('a')$$),'ok','tupla toda nula aceita');
select is(pg_temp.estado($$update public.ativos set cobertura_fgc = 'sim' where sistema = 'transito' and user_id = '17200000-0000-4000-8000-000000000001'$$),'23514','trânsito sem FGC');
select is(pg_temp.estado($$update public.ativos set indexadores_remuneracao = '{cdi}' where sistema = 'transito' and user_id = '17200000-0000-4000-8000-000000000001'$$),'23514','trânsito sem indexadores');
select is(pg_temp.estado($$update public.ativos set prazo_resgate_tipo = 'nao_aplicavel' where sistema = 'transito' and user_id = '17200000-0000-4000-8000-000000000001'$$),'23514','trânsito sem prazo');

-- Auxiliares fora da Data API e exclusão do usuário em cascata.
select is_empty($$select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private' and p.proname in ('canonizar_conjunto','canonizar_veiculos_acesso','canonizar_indexadores_remuneracao',
    'regime_tributario_valido','cobertura_fgc_valida','prazo_resgate_valido','gravar_atributos_ativo')
    and (has_function_privilege('authenticated', p.oid, 'EXECUTE') or has_function_privilege('anon', p.oid, 'EXECUTE'))$$,
  'auxiliares dos atributos não são executáveis pela Data API');
select lives_ok($$delete from auth.users where id = '17200000-0000-4000-8000-000000000001'$$,'cascata do usuário com atributos');
select is((select count(*) from public.ativos where user_id = '17200000-0000-4000-8000-000000000001'), 0::bigint, 'cascata remove ativos com atributos');
select * from finish();
rollback;
