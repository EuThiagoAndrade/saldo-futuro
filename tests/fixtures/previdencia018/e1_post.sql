-- Inspeção de estrutura e contagem agregada; nenhum dado de carteira. Depois da migração do ciclo 018, os quatro
-- indicadores devem ser verdadeiros. A contagem só diz se sobrou indicador não nulo, sem identificar ativo ou usuário.
select (select count(*) from pg_constraint where conrelid = 'public.ativos'::regclass and conname = 'ativos_previdencia_legado_check') = 1 as restricao_legado,
  private.canonizar_veiculos_acesso('{previdencia}') is not null as catalogo_com_previdencia,
  not has_function_privilege('authenticated', 'private.converter_previdencia_em_veiculo()', 'execute') as conversao_fora_da_api,
  (select count(*) from public.ativos where previdencia is not null) = 0 as nenhum_indicador_restante;
