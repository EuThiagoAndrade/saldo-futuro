-- Benchmarks globais (ciclo 003, issue #29): catálogo, valores e cobertura da carga, conforme a
-- KB-004 (seção 9; D1, D8, D9, D10, K4). Não contêm dado do usuário.
--
-- Qualquer usuário autenticado lê. Ninguém grava pela Data API, nem o admin: o único caminho de
-- escrita é public.carregar_benchmark, que exige o admin, trava o benchmark e grava valores e
-- cobertura numa só transação, ou nada.

create table public.benchmarks (
  id uuid primary key default gen_random_uuid(),
  codigo_sgs integer not null unique,
  nome text not null,
  periodicidade text not null,
  criado_em timestamptz not null default now(),
  constraint benchmarks_codigo_check check (codigo_sgs > 0),
  constraint benchmarks_nome_check check (char_length(btrim(nome)) between 1 and 100),
  constraint benchmarks_periodicidade_check check (periodicidade in ('diaria', 'mensal'))
);
alter table public.benchmarks enable row level security;

-- Valores exatamente como publicados (D1): numeric sem escala fixa. Série mensal no dia 1 (D8).
create table public.valores_benchmark (
  benchmark_id uuid not null references public.benchmarks (id) on delete cascade,
  data date not null,
  valor numeric not null,
  primary key (benchmark_id, data)
);
alter table public.valores_benchmark enable row level security;

-- Cobertura contínua já entregue pela fonte (K4): do início da primeira carga até o último valor.
create table public.coberturas_benchmark (
  benchmark_id uuid primary key references public.benchmarks (id) on delete cascade,
  inicio date not null,
  fim date not null,
  atualizado_em timestamptz not null default now(),
  constraint coberturas_intervalo_check check (fim >= inicio)
);
alter table public.coberturas_benchmark enable row level security;

revoke all on table public.benchmarks, public.valores_benchmark, public.coberturas_benchmark
  from public, anon, authenticated, service_role;
grant select on table public.benchmarks, public.valores_benchmark, public.coberturas_benchmark to authenticated;

create policy benchmarks_select_autenticado on public.benchmarks for select to authenticated using (true);
create policy valores_benchmark_select_autenticado on public.valores_benchmark for select to authenticated using (true);
create policy coberturas_benchmark_select_autenticado on public.coberturas_benchmark for select to authenticated using (true);

-- Código SGS e periodicidade são imutáveis (D8): uma série diferente é outro benchmark.
create function private.benchmark_imutavel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.codigo_sgs <> old.codigo_sgs or new.periodicidade <> old.periodicidade then
    raise exception 'recusado_benchmark_imutavel';
  end if;
  return new;
end;
$$;
revoke execute on function private.benchmark_imutavel() from public, anon, authenticated;

create trigger benchmarks_imutavel
  before update on public.benchmarks
  for each row execute function private.benchmark_imutavel();

-- Catálogo inicial (D9), conferido na documentação do Banco Central (V4).
insert into public.benchmarks (codigo_sgs, nome, periodicidade) values
  (12, 'CDI', 'diaria'),
  (433, 'IPCA', 'mensal');

-- Carga de uma sincronização (D10, K4). p_valores: lista [{"data": "AAAA-MM-DD", "valor": "<texto>"}]
-- com tudo o que a fonte devolveu para [p_data_inicial, p_data_final]. Substitui os valores dessa
-- janela, recalcula a cobertura e recusa sem gravar a carga que deixaria buraco ou que não traga
-- valor.
create function public.carregar_benchmark(p_benchmark uuid, p_data_inicial date, p_data_final date, p_valores jsonb)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_periodicidade text;
  v_cobertura public.coberturas_benchmark;
  v_item jsonb;
  v_data date;
  v_fim date;
begin
  if not private.is_admin() then
    raise exception 'recusado_nao_admin' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('saldo-futuro:benchmark:' || coalesce(p_benchmark::text, ''), 0));
  select b.periodicidade into v_periodicidade from public.benchmarks b where b.id = p_benchmark;
  if not found then
    raise exception 'recusado_benchmark_inexistente';
  end if;
  if p_data_inicial is null or p_data_final is null or p_data_final < p_data_inicial then
    raise exception 'recusado_janela_invalida';
  end if;
  if p_valores is null or jsonb_typeof(p_valores) <> 'array' then
    raise exception 'recusado_valores_invalidos';
  end if;
  if jsonb_array_length(p_valores) = 0 then
    raise exception 'recusado_sem_valores';
  end if;

  -- Valida tudo antes de gravar: data na janela, única, no dia 1 na série mensal; valor numérico em texto.
  for v_item in select * from jsonb_array_elements(p_valores) loop
    if jsonb_typeof(v_item) <> 'object' or jsonb_typeof(v_item -> 'data') <> 'string'
       or jsonb_typeof(v_item -> 'valor') <> 'string'
       or (v_item ->> 'data') !~ '^\d{4}-\d{2}-\d{2}$'
       or (v_item ->> 'valor') !~ '^-?\d+(\.\d+)?$' then
      raise exception 'recusado_valores_invalidos' using detail = v_item::text;
    end if;
    v_data := (v_item ->> 'data')::date;
    if v_data < p_data_inicial or v_data > p_data_final
       or (v_periodicidade = 'mensal' and extract(day from v_data) <> 1) then
      raise exception 'recusado_valores_invalidos' using detail = v_item::text;
    end if;
  end loop;
  if (select count(distinct e ->> 'data') from jsonb_array_elements(p_valores) e) <> jsonb_array_length(p_valores) then
    raise exception 'recusado_valores_invalidos' using detail = 'data repetida';
  end if;

  select * into v_cobertura from public.coberturas_benchmark c where c.benchmark_id = p_benchmark;
  if found and (p_data_inicial > v_cobertura.fim + 1 or p_data_final < v_cobertura.inicio - 1) then
    raise exception 'recusado_buraco';
  end if;

  delete from public.valores_benchmark v
  where v.benchmark_id = p_benchmark and v.data between p_data_inicial and p_data_final;
  insert into public.valores_benchmark (benchmark_id, data, valor)
  select p_benchmark, (e ->> 'data')::date, (e ->> 'valor')::numeric from jsonb_array_elements(p_valores) e;

  select max(v.data) into v_fim from public.valores_benchmark v where v.benchmark_id = p_benchmark;
  insert into public.coberturas_benchmark (benchmark_id, inicio, fim)
  values (p_benchmark, p_data_inicial, v_fim)
  on conflict (benchmark_id) do update
    set inicio = least(public.coberturas_benchmark.inicio, excluded.inicio),
        fim = excluded.fim,
        atualizado_em = now();
end;
$$;

revoke execute on function public.carregar_benchmark(uuid, date, date, jsonb) from public, anon, authenticated;
grant execute on function public.carregar_benchmark(uuid, date, date, jsonb) to authenticated;
