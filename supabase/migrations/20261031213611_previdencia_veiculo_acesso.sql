-- Ciclo 018, issue #182 (D18 e P1 do plano): Previdência deixa de ser indicador e vira opção do
-- veículo de acesso. Migração única, aplicada pela ação externa DEPOIS do deploy da tela nova, que já
-- conhece o código e devolve o indicador gravado sem alterá-lo: assim nenhuma tela grava por cima do
-- que não mostra (achado R5-1 do ciclo 017).
--
-- Na mesma transação: trava a tabela, amplia o catálogo, converte os dados de todos os usuários,
-- confere o resultado e congela a coluna antiga. Nenhuma função ou assinatura pública muda; as marcas
-- do Início não observam `veiculos_acesso` nem `previdencia`.

-- A CLI do Supabase executa cada comando da migração sem transação própria; a transação é declarada
-- aqui para a trava, a conversão, as conferências e a restrição entrarem juntas, ou nada entrar.
begin;

-- Sem gravações concorrentes entre a conversão e a restrição nova.
lock table public.ativos in share row exclusive mode;

-- Catálogo do veículo com `previdencia` entre `etf` e `plano_contrato`. A ordem relativa dos códigos
-- existentes não muda, então todo conjunto gravado continua canônico (conferido abaixo).
create or replace function private.canonizar_veiculos_acesso(p_valores text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select private.canonizar_conjunto(p_valores,
    array['direto', 'fundo', 'etf', 'previdencia', 'plano_contrato', 'certificado_representativo', 'outro', 'nao_aplicavel'],
    array['nao_aplicavel']);
$$;

-- Conversão de D18, idempotente, para ativos comuns em uso e desativados (o trânsito já tem o
-- indicador nulo pela restrição do ciclo 017): "Sim" acrescenta `previdencia` ao veículo e retira
-- `plano_contrato` e `nao_aplicavel`; "Não" e "Sim" deixam o indicador nulo. Fica disponível, sem
-- EXECUTE pela Data API, para o teste de banco provar cada caso.
create function private.converter_previdencia_em_veiculo()
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  update public.ativos a
  set veiculos_acesso = private.canonizar_veiculos_acesso(
        array_remove(array_remove(a.veiculos_acesso, 'plano_contrato'), 'nao_aplicavel') || array['previdencia']),
      previdencia = null
  where a.previdencia is true;
  update public.ativos a set previdencia = null where a.previdencia is false;
end;
$$;

revoke execute on function private.converter_previdencia_em_veiculo() from public, anon, authenticated;

select private.converter_previdencia_em_veiculo();

-- Conferências: a migração falha, e nada é gravado, se algo não estiver como esperado.
do $$
begin
  if exists (
    select 1 from public.ativos a
    where private.canonizar_veiculos_acesso(a.veiculos_acesso) is distinct from a.veiculos_acesso
  ) then
    raise exception 'conjunto de veículos fora da forma canônica depois da conversão';
  end if;
  if exists (select 1 from public.ativos a where a.previdencia is not null) then
    raise exception 'indicador Previdência não nulo depois da conversão';
  end if;
end;
$$;

-- O indicador fica nulo e congelado como legado, como `classe_id` desde o ciclo 013; a remoção física
-- da coluna e do parâmetro `p_previdencia` fica para um ciclo futuro (P5).
alter table public.ativos add constraint ativos_previdencia_legado_check check (previdencia is null);

commit;
