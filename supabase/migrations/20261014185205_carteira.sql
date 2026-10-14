-- Carteira (ciclo 003, issue #27): ativos, eventos imutáveis, transferências, consolidado e
-- posições mensais, conforme a KB-004 (_project/knowledge/KB-004_regras_financeiras.md).
--
-- Protocolo de escrita (D13): o usuário só tem SELECT nas próprias linhas. Toda escrita passa
-- pelas funções security definer abaixo, que tomam primeiro a mesma trava transacional por
-- usuário. Quantias em centavos (bigint), com faixa ±(2^53 − 1); toda acumulação em numeric,
-- convertida para bigint só ao gravar, depois de conferir a faixa (D11).
--
-- Um mês fechado é uma linha de consolidados_mensais; mês sem linha está aberto. Reabrir
-- remove o consolidado e, em cascata, as posições (D6).

create type public.tipo_ajuste as enum ('rendimento', 'marcacao');
create type public.tipo_evento as enum (
  'aporte', 'resgate', 'rendimento', 'marcacao', 'cambio', 'migracao', 'transferencia', 'estorno'
);

-- Ativos. O trânsito ("Em trânsito") é o ativo de sistema, único por usuário (D3).
create table public.ativos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo_ajuste public.tipo_ajuste,
  sistema text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  desativado_em timestamptz,
  constraint ativos_user_id_id_key unique (user_id, id),
  constraint ativos_nome_check check (char_length(btrim(nome)) between 1 and 100),
  constraint ativos_sistema_check check (
    (sistema is null and tipo_ajuste is not null) or (sistema = 'transito' and tipo_ajuste is null)),
  constraint ativos_desativacao_check check ((ativo and desativado_em is null) or (not ativo and desativado_em is not null)),
  constraint ativos_transito_ativo_check check (sistema is null or ativo)
);
create unique index ativos_transito_unico on public.ativos (user_id) where sistema = 'transito';
alter table public.ativos enable row level security;

-- Cabeçalho de transferência: agrupa as duas pernas (e as duas da correção, K6).
create table public.transferencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  data date not null,
  criado_em timestamptz not null default now(),
  constraint transferencias_user_id_id_key unique (user_id, id)
);
alter table public.transferencias enable row level security;

-- Eventos imutáveis (H4), com sinal no valor (D4). Toda referência exige o mesmo usuário. As
-- cascatas só servem à exclusão do usuário (revogação, ADR-003): nada mais exclui linhas.
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ativo_id uuid not null,
  data date not null,
  tipo public.tipo_evento not null,
  valor bigint not null,
  estorno_de uuid,
  transferencia_id uuid,
  criado_em timestamptz not null default now(),
  constraint eventos_user_id_id_key unique (user_id, id),
  constraint eventos_ativo_fkey foreign key (user_id, ativo_id) references public.ativos (user_id, id) on delete cascade,
  constraint eventos_estorno_fkey foreign key (user_id, estorno_de) references public.eventos (user_id, id) on delete cascade,
  constraint eventos_transferencia_fkey foreign key (user_id, transferencia_id)
    references public.transferencias (user_id, id) on delete cascade,
  constraint eventos_estorno_unico unique (estorno_de),
  constraint eventos_valor_faixa check (valor <> 0 and valor between -9007199254740991 and 9007199254740991),
  constraint eventos_sinal_check check (
    (tipo <> 'aporte' or valor > 0) and (tipo <> 'resgate' or valor < 0)),
  constraint eventos_estorno_check check ((tipo = 'estorno') = (estorno_de is not null)),
  constraint eventos_transferencia_check check (
    (tipo <> 'transferencia' or transferencia_id is not null)
    and (transferencia_id is null or tipo in ('transferencia', 'estorno')))
);
create index eventos_user_data on public.eventos (user_id, data);
alter table public.eventos enable row level security;

-- Consolidado mensal: existe só para mês fechado. Datas de mês sempre no dia 1.
create table public.consolidados_mensais (
  user_id uuid not null references auth.users (id) on delete cascade,
  mes date not null,
  vi bigint not null,
  vf bigint not null,
  aportes bigint not null,
  resgates bigint not null,
  rendimento bigint not null,
  marcacao bigint not null,
  cambio bigint not null,
  migracao bigint not null,
  fechado_em timestamptz not null default now(),
  primary key (user_id, mes),
  constraint consolidados_mes_dia_1 check (extract(day from mes) = 1),
  constraint consolidados_faixa check (
    vi between -9007199254740991 and 9007199254740991
    and vf between -9007199254740991 and 9007199254740991
    and aportes between -9007199254740991 and 9007199254740991
    and resgates between -9007199254740991 and 9007199254740991
    and rendimento between -9007199254740991 and 9007199254740991
    and marcacao between -9007199254740991 and 9007199254740991
    and cambio between -9007199254740991 and 9007199254740991
    and migracao between -9007199254740991 and 9007199254740991),
  constraint consolidados_identidade check (vf - vi = aportes + resgates + rendimento + marcacao + cambio + migracao)
);
alter table public.consolidados_mensais enable row level security;

-- Posição mensal por ativo: saldo inicial, saldo final e o ajuste com seu tipo (P9, D6).
create table public.posicoes_mensais (
  user_id uuid not null,
  mes date not null,
  ativo_id uuid not null,
  saldo_inicial bigint not null,
  saldo_final bigint not null,
  ajuste bigint not null,
  tipo_ajuste public.tipo_ajuste,
  primary key (user_id, mes, ativo_id),
  constraint posicoes_consolidado_fkey foreign key (user_id, mes)
    references public.consolidados_mensais (user_id, mes) on delete cascade,
  constraint posicoes_ativo_fkey foreign key (user_id, ativo_id) references public.ativos (user_id, id) on delete cascade,
  constraint posicoes_faixa check (
    saldo_inicial between -9007199254740991 and 9007199254740991
    and saldo_final between -9007199254740991 and 9007199254740991
    and ajuste between -9007199254740991 and 9007199254740991),
  constraint posicoes_tipo_ajuste_check check (ajuste = 0 or tipo_ajuste is not null)
);
alter table public.posicoes_mensais enable row level security;

-- Grants: só SELECT, só nas próprias linhas; nenhuma escrita pela Data API (D13).
revoke all on table public.ativos, public.transferencias, public.eventos, public.consolidados_mensais,
  public.posicoes_mensais from public, anon, authenticated, service_role;
grant select on table public.ativos, public.transferencias, public.eventos, public.consolidados_mensais,
  public.posicoes_mensais to authenticated;

create policy ativos_select_own on public.ativos for select to authenticated
  using (user_id = (select auth.uid()));
create policy transferencias_select_own on public.transferencias for select to authenticated
  using (user_id = (select auth.uid()));
create policy eventos_select_own on public.eventos for select to authenticated
  using (user_id = (select auth.uid()));
create policy consolidados_select_own on public.consolidados_mensais for select to authenticated
  using (user_id = (select auth.uid()));
create policy posicoes_select_own on public.posicoes_mensais for select to authenticated
  using (user_id = (select auth.uid()));

-- Auxiliares internos (sem EXECUTE para ninguém da Data API).

-- Usuário autenticado e a trava por usuário (D13), sempre o primeiro passo de uma escrita.
create function private.travar_carteira()
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'recusado_nao_autenticado' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('saldo-futuro:carteira:' || v_uid::text, 0));
  return v_uid;
end;
$$;

-- Data civil de hoje em America/Cuiaba (ADR-002).
create function private.hoje()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Cuiaba')::date;
$$;

-- Último mês fechado do usuário, ou null.
create function private.ultimo_mes_fechado(p_uid uuid)
returns date
language sql
stable
set search_path = ''
as $$
  select max(c.mes) from public.consolidados_mensais c where c.user_id = p_uid;
$$;

-- Datas aceitas para lançamento (KB-004, 4.6): nunca futura (K13) e, depois do primeiro
-- fechamento, no primeiro mês aberto ou depois.
create function private.conferir_data_lancamento(p_uid uuid, p_data date)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_ultimo date := private.ultimo_mes_fechado(p_uid);
begin
  if p_data is null then
    raise exception 'recusado_data' using detail = 'data ausente';
  end if;
  if p_data > private.hoje() then
    raise exception 'recusado_data_futura';
  end if;
  if v_ultimo is not null and p_data < (v_ultimo + interval '1 month')::date then
    raise exception 'recusado_mes_fechado';
  end if;
end;
$$;

-- Saldo calculado de um ativo agora: saldo final do último mês fechado mais os eventos
-- posteriores.
create function private.saldo_atual(p_uid uuid, p_ativo uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  with ultimo as (select private.ultimo_mes_fechado(p_uid) as mes)
  select coalesce((select p.saldo_final::numeric from public.posicoes_mensais p, ultimo u
                   where p.user_id = p_uid and p.ativo_id = p_ativo and p.mes = u.mes), 0)
       + coalesce((select sum(e.valor::numeric) from public.eventos e, ultimo u
                   where e.user_id = p_uid and e.ativo_id = p_ativo
                     and (u.mes is null or e.data >= (u.mes + interval '1 month')::date)), 0);
$$;

-- Apuração de um mês (KB-004, seção 5), em numeric: saldo inicial, saldo calculado, saldo real
-- (o informado; o calculado no trânsito e em ativo desativado) e ajuste de cada ativo com
-- histórico no mês (posição no mês anterior ou evento no mês). saldo_real nulo indica pendência.
create function private.apurar_mes(p_uid uuid, p_mes date, p_saldos jsonb)
returns table (
  ativo_id uuid,
  sistema text,
  ativo boolean,
  tipo_ajuste public.tipo_ajuste,
  saldo_inicial numeric,
  saldo_calculado numeric,
  saldo_real numeric,
  ajuste numeric
)
language sql
stable
set search_path = ''
as $$
  with base as (
    select a.id, a.sistema, a.ativo, a.tipo_ajuste,
      coalesce((select p.saldo_final::numeric from public.posicoes_mensais p
                where p.user_id = p_uid and p.ativo_id = a.id
                  and p.mes = (p_mes - interval '1 month')::date), 0) as saldo_inicial,
      coalesce((select sum(e.valor::numeric) from public.eventos e
                where e.user_id = p_uid and e.ativo_id = a.id
                  and e.data >= p_mes and e.data < (p_mes + interval '1 month')::date), 0) as movimento,
      exists (select 1 from public.eventos e
              where e.user_id = p_uid and e.ativo_id = a.id
                and e.data >= p_mes and e.data < (p_mes + interval '1 month')::date) as tem_evento,
      exists (select 1 from public.posicoes_mensais p
              where p.user_id = p_uid and p.ativo_id = a.id
                and p.mes = (p_mes - interval '1 month')::date) as tem_posicao_anterior
    from public.ativos a
    where a.user_id = p_uid
  ), escopo as (
    select b.*, b.saldo_inicial + b.movimento as calculado,
      case when b.sistema is null and b.ativo
        then (p_saldos ->> b.id::text)::numeric
        else b.saldo_inicial + b.movimento end as real
    from base b
    where (b.tem_posicao_anterior or b.tem_evento)
      and ((b.ativo and b.sistema is null) or b.saldo_inicial <> 0 or b.tem_evento)
  )
  select s.id, s.sistema, s.ativo, s.tipo_ajuste, s.saldo_inicial, s.calculado, s.real, s.real - s.calculado
  from escopo s;
$$;

create function private.na_faixa(p_valor numeric)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_valor between -9007199254740991 and 9007199254740991;
$$;

revoke execute on function private.travar_carteira(), private.hoje(), private.ultimo_mes_fechado(uuid),
  private.conferir_data_lancamento(uuid, date), private.saldo_atual(uuid, uuid),
  private.apurar_mes(uuid, date, jsonb), private.na_faixa(numeric)
  from public, anon, authenticated;

-- Funções da Data API (security definer, filtro por auth.uid(), trava primeiro).

-- Cria um ativo do usuário e, se ainda não existir, o trânsito.
create function public.criar_ativo(p_nome text, p_tipo_ajuste public.tipo_ajuste)
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
  if p_tipo_ajuste is null then
    raise exception 'recusado_tipo_ajuste';
  end if;
  insert into public.ativos (user_id, nome, tipo_ajuste, sistema)
  values (v_uid, 'Em trânsito', null, 'transito')
  on conflict (user_id) where sistema = 'transito' do nothing;
  insert into public.ativos (user_id, nome, tipo_ajuste) values (v_uid, btrim(p_nome), p_tipo_ajuste)
  returning id into v_id;
  return v_id;
end;
$$;

-- Desativa um ativo com saldo zero (KB-004, 4.1). O trânsito nunca é desativado.
create function public.desativar_ativo(p_ativo uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_ativo public.ativos;
begin
  select * into v_ativo from public.ativos a where a.id = p_ativo and a.user_id = v_uid;
  if not found then
    raise exception 'recusado_ativo_inexistente';
  end if;
  if v_ativo.sistema is not null or not v_ativo.ativo then
    raise exception 'recusado_ativo_invalido';
  end if;
  if private.saldo_atual(v_uid, p_ativo) <> 0 then
    raise exception 'recusado_saldo_nao_zero';
  end if;
  update public.ativos set ativo = false, desativado_em = now() where id = p_ativo;
end;
$$;

-- Lança um evento comum (D4). Transferência e estorno têm funções próprias.
create function public.lancar_evento(p_ativo uuid, p_data date, p_tipo public.tipo_evento, p_valor bigint)
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
  if p_tipo is null or p_tipo in ('transferencia', 'estorno') then
    raise exception 'recusado_tipo';
  end if;
  if p_valor is null or p_valor = 0 or (p_tipo = 'aporte' and p_valor < 0) or (p_tipo = 'resgate' and p_valor > 0) then
    raise exception 'recusado_sinal';
  end if;
  if not private.na_faixa(p_valor) then
    raise exception 'recusado_faixa';
  end if;
  if not exists (select 1 from public.ativos a
                 where a.id = p_ativo and a.user_id = v_uid and a.ativo and a.sistema is null) then
    raise exception 'recusado_ativo_invalido';
  end if;
  perform private.conferir_data_lancamento(v_uid, p_data);
  insert into public.eventos (user_id, ativo_id, data, tipo, valor)
  values (v_uid, p_ativo, p_data, p_tipo, p_valor)
  returning id into v_id;
  return v_id;
end;
$$;

-- Estorno total (P5): o oposto do evento referenciado, com data própria (K2).
create function public.estornar_evento(p_evento uuid, p_data date)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_ref public.eventos;
  v_id uuid;
begin
  select * into v_ref from public.eventos e where e.id = p_evento and e.user_id = v_uid;
  if not found then
    raise exception 'recusado_evento_inexistente';
  end if;
  if v_ref.tipo in ('estorno', 'transferencia') then
    raise exception 'recusado_estorno_invalido';
  end if;
  if exists (select 1 from public.eventos e where e.estorno_de = p_evento) then
    raise exception 'recusado_ja_estornado';
  end if;
  if not exists (select 1 from public.ativos a where a.id = v_ref.ativo_id and a.user_id = v_uid and a.ativo) then
    raise exception 'recusado_ativo_invalido';
  end if;
  if p_data < v_ref.data then
    raise exception 'recusado_data' using detail = 'estorno anterior ao evento';
  end if;
  perform private.conferir_data_lancamento(v_uid, p_data);
  insert into public.eventos (user_id, ativo_id, data, tipo, valor, estorno_de)
  values (v_uid, v_ref.ativo_id, p_data, 'estorno', -v_ref.valor, v_ref.id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Transferência (P6, D3): duas pernas de soma zero, na mesma data, entre ativos do usuário.
create function public.transferir(p_origem uuid, p_destino uuid, p_data date, p_valor bigint)
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
  if p_valor is null or p_valor <= 0 then
    raise exception 'recusado_valor';
  end if;
  if not private.na_faixa(p_valor) then
    raise exception 'recusado_faixa';
  end if;
  if p_origem is null or p_destino is null or p_origem = p_destino then
    raise exception 'recusado_mesmo_ativo';
  end if;
  if (select count(*) from public.ativos a
      where a.user_id = v_uid and a.ativo and a.id in (p_origem, p_destino)) <> 2 then
    raise exception 'recusado_ativo_invalido';
  end if;
  perform private.conferir_data_lancamento(v_uid, p_data);
  insert into public.transferencias (user_id, data) values (v_uid, p_data) returning id into v_id;
  insert into public.eventos (user_id, ativo_id, data, tipo, valor, transferencia_id) values
    (v_uid, p_origem, p_data, 'transferencia', -p_valor, v_id),
    (v_uid, p_destino, p_data, 'transferencia', p_valor, v_id);
  return v_id;
end;
$$;

-- Correção da transferência inteira (K6): estorna as duas pernas juntas, na mesma data.
create function public.corrigir_transferencia(p_transferencia uuid, p_data date)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_data date;
begin
  select t.data into v_data from public.transferencias t where t.id = p_transferencia and t.user_id = v_uid;
  if not found then
    raise exception 'recusado_transferencia_inexistente';
  end if;
  if exists (select 1 from public.eventos e
             where e.user_id = v_uid and e.transferencia_id = p_transferencia and e.tipo = 'estorno') then
    raise exception 'recusado_ja_corrigida';
  end if;
  if exists (select 1 from public.eventos e join public.ativos a on a.id = e.ativo_id
             where e.user_id = v_uid and e.transferencia_id = p_transferencia and not a.ativo) then
    raise exception 'recusado_ativo_invalido';
  end if;
  if p_data < v_data then
    raise exception 'recusado_data' using detail = 'correção anterior à transferência';
  end if;
  perform private.conferir_data_lancamento(v_uid, p_data);
  insert into public.eventos (user_id, ativo_id, data, tipo, valor, estorno_de, transferencia_id)
  select v_uid, e.ativo_id, p_data, 'estorno', -e.valor, e.id, p_transferencia
  from public.eventos e
  where e.user_id = v_uid and e.transferencia_id = p_transferencia and e.tipo = 'transferencia';
end;
$$;

-- Fechamento em três etapas (KB-004, seção 5; D5): confere sequência, mês terminado,
-- pendências, faixa e identidade, e grava consolidado e posições de uma vez.
-- p_saldos: objeto {"<id do ativo>": <saldo real em centavos>}.
create function public.fechar_mes(p_mes date, p_saldos jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_ultimo date;
  v_inicio date;
  v_pendentes jsonb;
  v_chave text;
  v_valor jsonb;
  v_vi numeric;
  v_vf numeric;
  v_aportes numeric;
  v_resgates numeric;
  v_rendimento numeric;
  v_marcacao numeric;
  v_cambio numeric;
  v_migracao numeric;
  v_transferencias numeric;
begin
  if p_mes is null or extract(day from p_mes) <> 1 then
    raise exception 'recusado_mes_invalido';
  end if;
  if (p_mes + interval '1 month')::date > private.hoje() then
    raise exception 'recusado_mes_nao_terminado';
  end if;
  v_ultimo := private.ultimo_mes_fechado(v_uid);
  if v_ultimo is null then
    select date_trunc('month', min(e.data))::date into v_inicio from public.eventos e where e.user_id = v_uid;
    if v_inicio is null or v_inicio <> p_mes then
      raise exception 'recusado_inicio';
    end if;
  elsif p_mes <> (v_ultimo + interval '1 month')::date then
    raise exception 'recusado_sequencia';
  end if;

  -- Saldos informados: só ativos do usuário que exigem saldo real, só inteiros.
  if p_saldos is null or jsonb_typeof(p_saldos) <> 'object' then
    raise exception 'recusado_saldos_invalidos';
  end if;
  for v_chave, v_valor in select * from jsonb_each(p_saldos) loop
    if not exists (select 1 from private.apurar_mes(v_uid, p_mes, '{}'::jsonb) m
                   where m.ativo_id::text = v_chave and m.ativo and m.sistema is null) then
      raise exception 'recusado_saldos_invalidos' using detail = 'ativo sem saldo real: ' || v_chave;
    end if;
    if jsonb_typeof(v_valor) <> 'number' or (v_valor::text)::numeric <> trunc((v_valor::text)::numeric) then
      raise exception 'recusado_saldos_invalidos' using detail = 'saldo não inteiro: ' || v_chave;
    end if;
  end loop;

  select coalesce(jsonb_agg(m.ativo_id order by m.ativo_id), '[]'::jsonb) into v_pendentes
  from private.apurar_mes(v_uid, p_mes, p_saldos) m where m.saldo_real is null;
  if jsonb_array_length(v_pendentes) > 0 then
    raise exception 'recusado_pendencia' using detail = v_pendentes::text;
  end if;

  if exists (select 1 from private.apurar_mes(v_uid, p_mes, p_saldos) m
             where not (private.na_faixa(m.saldo_inicial) and private.na_faixa(m.saldo_calculado)
                        and private.na_faixa(m.saldo_real) and private.na_faixa(m.ajuste))) then
    raise exception 'recusado_faixa';
  end if;

  select coalesce(sum(m.saldo_inicial), 0), coalesce(sum(m.saldo_real), 0),
         coalesce(sum(m.ajuste) filter (where m.tipo_ajuste = 'rendimento'), 0),
         coalesce(sum(m.ajuste) filter (where m.tipo_ajuste = 'marcacao'), 0)
    into v_vi, v_vf, v_rendimento, v_marcacao
  from private.apurar_mes(v_uid, p_mes, p_saldos) m;

  -- Componentes por tipo efetivo: o estorno conta pelo tipo do evento referenciado.
  select v_rendimento + coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'rendimento'), 0),
         v_marcacao + coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'marcacao'), 0),
         coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'aporte'), 0),
         coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'resgate'), 0),
         coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'cambio'), 0),
         coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'migracao'), 0),
         coalesce(sum(e.valor::numeric) filter (where coalesce(r.tipo, e.tipo) = 'transferencia'), 0)
    into v_rendimento, v_marcacao, v_aportes, v_resgates, v_cambio, v_migracao, v_transferencias
  from public.eventos e
  left join public.eventos r on r.user_id = e.user_id and r.id = e.estorno_de
  where e.user_id = v_uid and e.data >= p_mes and e.data < (p_mes + interval '1 month')::date;

  if not (private.na_faixa(v_vi) and private.na_faixa(v_vf) and private.na_faixa(v_aportes)
          and private.na_faixa(v_resgates) and private.na_faixa(v_rendimento) and private.na_faixa(v_marcacao)
          and private.na_faixa(v_cambio) and private.na_faixa(v_migracao)) then
    raise exception 'recusado_faixa';
  end if;
  if v_transferencias <> 0
     or v_vf - v_vi <> v_aportes + v_resgates + v_rendimento + v_marcacao + v_cambio + v_migracao then
    raise exception 'recusado_identidade';
  end if;

  insert into public.consolidados_mensais
    (user_id, mes, vi, vf, aportes, resgates, rendimento, marcacao, cambio, migracao)
  values (v_uid, p_mes, v_vi::bigint, v_vf::bigint, v_aportes::bigint, v_resgates::bigint,
          v_rendimento::bigint, v_marcacao::bigint, v_cambio::bigint, v_migracao::bigint);
  insert into public.posicoes_mensais (user_id, mes, ativo_id, saldo_inicial, saldo_final, ajuste, tipo_ajuste)
  select v_uid, p_mes, m.ativo_id, m.saldo_inicial::bigint, m.saldo_real::bigint, m.ajuste::bigint,
         case when m.ajuste <> 0 then m.tipo_ajuste end
  from private.apurar_mes(v_uid, p_mes, p_saldos) m;
end;
$$;

-- Reabertura do último mês fechado (P8, D6): remove consolidado e posições.
create function public.reabrir_mes(p_mes date)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
begin
  if p_mes is null or p_mes is distinct from private.ultimo_mes_fechado(v_uid) then
    raise exception 'recusado_reabertura';
  end if;
  delete from public.consolidados_mensais c where c.user_id = v_uid and c.mes = p_mes;
end;
$$;

revoke execute on function public.criar_ativo(text, public.tipo_ajuste), public.desativar_ativo(uuid),
  public.lancar_evento(uuid, date, public.tipo_evento, bigint), public.estornar_evento(uuid, date),
  public.transferir(uuid, uuid, date, bigint), public.corrigir_transferencia(uuid, date),
  public.fechar_mes(date, jsonb), public.reabrir_mes(date)
  from public, anon, authenticated;
grant execute on function public.criar_ativo(text, public.tipo_ajuste), public.desativar_ativo(uuid),
  public.lancar_evento(uuid, date, public.tipo_evento, bigint), public.estornar_evento(uuid, date),
  public.transferir(uuid, uuid, date, bigint), public.corrigir_transferencia(uuid, date),
  public.fechar_mes(date, jsonb), public.reabrir_mes(date)
  to authenticated;
