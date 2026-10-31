-- Ciclo 017, issue #172: atributos complementares dos ativos (P1 a P4 do plano). Migração aditiva:
-- sete colunas descritivas em public.ativos, preenchidas manualmente, com constraints completas, e
-- duas funções novas de cadastro e edição. Nenhuma coluna, função ou gatilho existente muda de
-- contrato: a marca de metadados (ativos_versao_metadados) e a de classificação não observam os
-- campos novos, e as funções anteriores continuam gravando só os campos que conhecem.
--
-- Os códigos são anotações do usuário: o sistema não calcula imposto, prazo, garantia nem
-- disponibilidade com eles. variacao_cambial e inpc não criam benchmark nem tocam exposicao_cambial.

-- Forma canônica de um conjunto de códigos: unidimensional, sem nulos, só códigos do catálogo, sem
-- repetições e na ordem do catálogo; um código exclusivo não convive com outro. Devolve a forma
-- canônica, ou nulo quando a entrada é nula ou inválida (as constraints comparam com o valor gravado;
-- as funções de escrita recusam o nulo).
create function private.canonizar_conjunto(p_valores text[], p_catalogo text[], p_exclusivos text[])
returns text[]
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_canonico text[];
begin
  if p_valores is null then
    return null;
  end if;
  if cardinality(p_valores) = 0 then
    return '{}';
  end if;
  if array_ndims(p_valores) <> 1 or array_lower(p_valores, 1) <> 1 then
    return null;
  end if;
  if array_position(p_valores, null) is not null or not (p_valores <@ p_catalogo) then
    return null;
  end if;
  select array_agg(c.codigo order by c.ordem) into v_canonico
  from unnest(p_catalogo) with ordinality c (codigo, ordem)
  where c.codigo = any (p_valores);
  if cardinality(v_canonico) > 1 and v_canonico && p_exclusivos then
    return null;
  end if;
  return v_canonico;
end;
$$;

-- Catálogos fixos (P1, com os rótulos de D10 na aplicação). Cada auxiliar é a única definição do
-- catálogo no banco, usada pelas constraints e pelas funções de escrita.
create function private.canonizar_veiculos_acesso(p_valores text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select private.canonizar_conjunto(p_valores,
    array['direto', 'fundo', 'etf', 'plano_contrato', 'certificado_representativo', 'outro', 'nao_aplicavel'],
    array['nao_aplicavel']);
$$;

create function private.canonizar_indexadores_remuneracao(p_valores text[])
returns text[]
language sql
immutable
set search_path = ''
as $$
  select private.canonizar_conjunto(p_valores,
    array['cdi', 'selic', 'ipca', 'igpm', 'tr', 'variacao_cambial', 'inpc', 'sem_indexador', 'outro', 'nao_aplicavel'],
    array['sem_indexador', 'nao_aplicavel']);
$$;

-- Nulo é "Não informado" e é válido nos três campos escalares abaixo.
create function private.regime_tributario_valido(p_regime text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_regime is null or p_regime = any (array['renda_fixa_por_prazo', 'fundos_longo_prazo', 'fundos_curto_prazo',
    'previdencia_progressivo', 'previdencia_regressivo', 'renda_variavel', 'outro', 'nao_aplicavel']);
$$;

create function private.cobertura_fgc_valida(p_cobertura text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_cobertura is null or p_cobertura = any (array['sim', 'nao', 'nao_aplicavel']);
$$;

-- Prazo informado para resgate ou venda (P2): a situação "prazo" exige dias >= 0 e unidade; as
-- situações sem número e "Não informado" (tudo nulo) não aceitam dias nem unidade. Tupla parcial é
-- recusada. O sistema não converte unidades nem calcula datas.
create function private.prazo_resgate_valido(p_tipo text, p_dias integer, p_unidade text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (p_tipo is null and p_dias is null and p_unidade is null)
    or (p_tipo = 'prazo' and p_dias is not null and p_dias >= 0 and p_unidade is not null
      and p_unidade = any (array['uteis', 'corridos']))
    or (p_tipo = any (array['no_vencimento', 'sem_prazo_estimavel', 'nao_aplicavel'])
      and p_dias is null and p_unidade is null),
    false);
$$;

-- Colunas novas: conjuntos vazios e escalares nulos significam "Não informado", inclusive nos ativos
-- existentes, que não recebem preenchimento por equivalência (P3). O trânsito continua sem detalhes.
alter table public.ativos
  drop constraint ativos_transito_sem_detalhes_check,
  add column veiculos_acesso text[] not null default '{}',
  add column indexadores_remuneracao text[] not null default '{}',
  add column regime_tributario text,
  add column prazo_resgate_tipo text,
  add column prazo_resgate_dias integer,
  add column prazo_resgate_unidade text,
  add column cobertura_fgc text,
  add constraint ativos_veiculos_acesso_check
    check (private.canonizar_veiculos_acesso(veiculos_acesso) is not distinct from veiculos_acesso),
  add constraint ativos_indexadores_remuneracao_check
    check (private.canonizar_indexadores_remuneracao(indexadores_remuneracao) is not distinct from indexadores_remuneracao),
  add constraint ativos_regime_tributario_check check (private.regime_tributario_valido(regime_tributario)),
  add constraint ativos_cobertura_fgc_check check (private.cobertura_fgc_valida(cobertura_fgc)),
  add constraint ativos_prazo_resgate_check
    check (private.prazo_resgate_valido(prazo_resgate_tipo, prazo_resgate_dias, prazo_resgate_unidade)),
  add constraint ativos_transito_sem_detalhes_check check (
    sistema is null or (instituicao_id is null and classe_id is null and taxonomia_id is null
      and previdencia is null and liquidez_imediata is null and exposicao_cambial is null and isento_ir is null
      and veiculos_acesso = '{}' and indexadores_remuneracao = '{}' and regime_tributario is null
      and prazo_resgate_tipo is null and prazo_resgate_dias is null and prazo_resgate_unidade is null
      and cobertura_fgc is null));

-- Grava os sete campos de um ativo comum já conferido pela função chamadora (dono, trânsito e trava).
-- Todos são explícitos: limpar envia conjunto vazio ou nulo; um conjunto nulo é recusado. A UPDATE só
-- cita colunas novas, então não dispara os gatilhos de metadados nem de classificação.
create function private.gravar_atributos_ativo(
  p_uid uuid, p_ativo uuid, p_veiculos_acesso text[], p_indexadores_remuneracao text[], p_regime_tributario text,
  p_prazo_resgate_tipo text, p_prazo_resgate_dias integer, p_prazo_resgate_unidade text, p_cobertura_fgc text)
returns void
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_veiculos text[] := private.canonizar_veiculos_acesso(p_veiculos_acesso);
  v_indexadores text[] := private.canonizar_indexadores_remuneracao(p_indexadores_remuneracao);
begin
  if v_veiculos is null then
    raise exception 'recusado_veiculos_acesso';
  end if;
  if v_indexadores is null then
    raise exception 'recusado_indexadores_remuneracao';
  end if;
  if not private.regime_tributario_valido(p_regime_tributario) then
    raise exception 'recusado_regime_tributario';
  end if;
  if not private.prazo_resgate_valido(p_prazo_resgate_tipo, p_prazo_resgate_dias, p_prazo_resgate_unidade) then
    raise exception 'recusado_prazo_resgate';
  end if;
  if not private.cobertura_fgc_valida(p_cobertura_fgc) then
    raise exception 'recusado_cobertura_fgc';
  end if;
  update public.ativos
  set veiculos_acesso = v_veiculos, indexadores_remuneracao = v_indexadores, regime_tributario = p_regime_tributario,
    prazo_resgate_tipo = p_prazo_resgate_tipo, prazo_resgate_dias = p_prazo_resgate_dias,
    prazo_resgate_unidade = p_prazo_resgate_unidade, cobertura_fgc = p_cobertura_fgc
  where id = p_ativo and user_id = p_uid and sistema is null;
  if not found then
    raise exception 'recusado_ativo_inexistente';
  end if;
end;
$$;

-- Funções da Data API com nomes novos, sem sobrecarga ambígua no PostgREST. Mesmo protocolo das
-- anteriores: security definer, trava da carteira primeiro, filtro por auth.uid(), sem parâmetro de
-- dono e sem desvio do administrador. Reutilizam a função vigente correspondente na mesma transação:
-- qualquer recusa desfaz nome, instituição nova, classe, indicadores e atributos.

create function public.cadastrar_ativo_com_atributos(
  p_nome text, p_tipo_ajuste public.tipo_ajuste, p_instituicao uuid, p_instituicao_nova text, p_taxonomia uuid,
  p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean, p_isento_ir boolean,
  p_veiculos_acesso text[], p_indexadores_remuneracao text[], p_regime_tributario text,
  p_prazo_resgate_tipo text, p_prazo_resgate_dias integer, p_prazo_resgate_unidade text, p_cobertura_fgc text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_id uuid;
begin
  v_id := public.cadastrar_ativo_taxonomia(p_nome, p_tipo_ajuste, p_instituicao, p_instituicao_nova, p_taxonomia,
    p_previdencia, p_liquidez_imediata, p_exposicao_cambial, p_isento_ir);
  perform private.gravar_atributos_ativo(v_uid, v_id, p_veiculos_acesso, p_indexadores_remuneracao,
    p_regime_tributario, p_prazo_resgate_tipo, p_prazo_resgate_dias, p_prazo_resgate_unidade, p_cobertura_fgc);
  return v_id;
end;
$$;

-- Edição atômica de nome, vínculos, indicadores e atributos. Aceita ativo desativado; recusa o
-- trânsito e o ativo alheio antes de resolver a instituição (pela função reutilizada).
create function public.editar_ativo_com_atributos(
  p_ativo uuid, p_nome text, p_instituicao uuid, p_instituicao_nova text, p_taxonomia uuid,
  p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean, p_isento_ir boolean,
  p_veiculos_acesso text[], p_indexadores_remuneracao text[], p_regime_tributario text,
  p_prazo_resgate_tipo text, p_prazo_resgate_dias integer, p_prazo_resgate_unidade text, p_cobertura_fgc text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
begin
  perform public.editar_ativo_com_nome(p_ativo, p_nome, p_instituicao, p_instituicao_nova, p_taxonomia,
    p_previdencia, p_liquidez_imediata, p_exposicao_cambial, p_isento_ir);
  perform private.gravar_atributos_ativo(v_uid, p_ativo, p_veiculos_acesso, p_indexadores_remuneracao,
    p_regime_tributario, p_prazo_resgate_tipo, p_prazo_resgate_dias, p_prazo_resgate_unidade, p_cobertura_fgc);
end;
$$;

revoke execute on function private.canonizar_conjunto(text[], text[], text[]),
  private.canonizar_veiculos_acesso(text[]), private.canonizar_indexadores_remuneracao(text[]),
  private.regime_tributario_valido(text), private.cobertura_fgc_valida(text),
  private.prazo_resgate_valido(text, integer, text),
  private.gravar_atributos_ativo(uuid, uuid, text[], text[], text, text, integer, text, text)
  from public, anon, authenticated;
revoke execute on function public.cadastrar_ativo_com_atributos(
    text, public.tipo_ajuste, uuid, text, uuid, boolean, boolean, boolean, boolean,
    text[], text[], text, text, integer, text, text),
  public.editar_ativo_com_atributos(
    uuid, text, uuid, text, uuid, boolean, boolean, boolean, boolean,
    text[], text[], text, text, integer, text, text)
  from public, anon;
grant execute on function public.cadastrar_ativo_com_atributos(
    text, public.tipo_ajuste, uuid, text, uuid, boolean, boolean, boolean, boolean,
    text[], text[], text, text, integer, text, text),
  public.editar_ativo_com_atributos(
    uuid, text, uuid, text, uuid, boolean, boolean, boolean, boolean,
    text[], text[], text, text, integer, text, text)
  to authenticated;
