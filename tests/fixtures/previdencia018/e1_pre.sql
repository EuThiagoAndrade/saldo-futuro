-- Inspeção de estrutura; nenhum dado de carteira. Antes da migração do ciclo 018, os três indicadores devem ser falsos.
select (select count(*) from pg_constraint where conrelid = 'public.ativos'::regclass and conname = 'ativos_previdencia_legado_check') = 1 as restricao_legado,
  to_regprocedure('private.converter_previdencia_em_veiculo()') is not null as funcao_conversao,
  private.canonizar_veiculos_acesso('{previdencia}') is not null as catalogo_com_previdencia;
