-- Metadados descritivos dos ativos (ciclo 012, issue #126, BL-009): instituições e classes de
-- ativo por usuário, e instituição, classe e quatro indicadores em cada ativo. Os campos são só
-- descritivos: nenhum cálculo (fechamento, consolidação, Dietz, benchmarks, distribuição) os lê.
--
-- Mesmo protocolo da carteira (D13): o usuário só tem SELECT nas próprias linhas; toda escrita
-- passa por funções security definer que tomam primeiro a trava por usuário. As referências do
-- ativo são chaves compostas (user_id, id), então o banco impede apontar para entrada de outro
-- usuário (P-6).
--
-- Identidade do nome (P-2): lower(btrim(nome)), que ignora caixa e espaços nas pontas e preserva
-- acentos. É a única regra que decide se dois nomes são a mesma entrada; a busca sem acento do
-- seletor só filtra a lista.
--
-- As chaves dos ativos para instituições e classes usam NO ACTION, e não RESTRICT: a exclusão de
-- uma entrada em uso continua recusada (as funções conferem antes, com recusado_em_uso), e a
-- exclusão do usuário em cascata a partir de auth.users continua possível, porque NO ACTION só é
-- conferida no fim do comando.

create table public.instituicoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  constraint instituicoes_user_id_id_key unique (user_id, id),
  constraint instituicoes_nome_check check (char_length(btrim(nome)) between 1 and 100)
);
create unique index instituicoes_nome_unico on public.instituicoes (user_id, lower(btrim(nome)));
alter table public.instituicoes enable row level security;

create table public.classes_ativo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  constraint classes_ativo_user_id_id_key unique (user_id, id),
  constraint classes_ativo_nome_check check (char_length(btrim(nome)) between 1 and 100)
);
create unique index classes_ativo_nome_unico on public.classes_ativo (user_id, lower(btrim(nome)));
alter table public.classes_ativo enable row level security;

-- Campos descritivos do ativo, todos nulos ("não informado"). O trânsito não os recebe.
alter table public.ativos
  add column instituicao_id uuid,
  add column classe_id uuid,
  add column previdencia boolean,
  add column liquidez_imediata boolean,
  add column exposicao_cambial boolean,
  add column isento_ir boolean,
  add constraint ativos_instituicao_fkey foreign key (user_id, instituicao_id)
    references public.instituicoes (user_id, id),
  add constraint ativos_classe_fkey foreign key (user_id, classe_id)
    references public.classes_ativo (user_id, id),
  add constraint ativos_transito_sem_detalhes_check check (
    sistema is null or (instituicao_id is null and classe_id is null and previdencia is null
      and liquidez_imediata is null and exposicao_cambial is null and isento_ir is null));
create index ativos_instituicao_idx on public.ativos (user_id, instituicao_id) where instituicao_id is not null;
create index ativos_classe_idx on public.ativos (user_id, classe_id) where classe_id is not null;

-- Grants: só SELECT, só nas próprias linhas; nenhuma escrita pela Data API (D13).
revoke all on table public.instituicoes, public.classes_ativo from public, anon, authenticated, service_role;
grant select on table public.instituicoes, public.classes_ativo to authenticated;

create policy instituicoes_select_own on public.instituicoes for select to authenticated
  using (user_id = (select auth.uid()));
create policy classes_ativo_select_own on public.classes_ativo for select to authenticated
  using (user_id = (select auth.uid()));

-- Auxiliares internos (sem EXECUTE para ninguém da Data API).

-- Nome de instituição ou classe: sem espaços nas pontas, de 1 a 100 caracteres.
create function private.conferir_nome(p_nome text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_nome is null or char_length(btrim(p_nome)) not between 1 and 100 then
    raise exception 'recusado_nome';
  end if;
  return btrim(p_nome);
end;
$$;

-- Referência do ativo à instituição: o id de uma entrada do usuário, ou o nome digitado como
-- novo, que reaproveita a entrada de mesma identidade ou a cria (P-4). Os dois juntos são recusados.
create function private.resolver_instituicao(p_uid uuid, p_instituicao uuid, p_nova text)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_id uuid;
  v_nome text;
begin
  if p_instituicao is not null and p_nova is not null then
    raise exception 'recusado_referencia_dupla';
  end if;
  if p_instituicao is not null then
    select i.id into v_id from public.instituicoes i where i.id = p_instituicao and i.user_id = p_uid;
    if not found then
      raise exception 'recusado_instituicao_inexistente';
    end if;
    return v_id;
  end if;
  if p_nova is null then
    return null;
  end if;
  v_nome := private.conferir_nome(p_nova);
  select i.id into v_id from public.instituicoes i where i.user_id = p_uid and lower(btrim(i.nome)) = lower(v_nome);
  if found then
    return v_id;
  end if;
  insert into public.instituicoes (user_id, nome) values (p_uid, v_nome) returning id into v_id;
  return v_id;
end;
$$;

-- O mesmo, para a classe.
create function private.resolver_classe(p_uid uuid, p_classe uuid, p_nova text)
returns uuid
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_id uuid;
  v_nome text;
begin
  if p_classe is not null and p_nova is not null then
    raise exception 'recusado_referencia_dupla';
  end if;
  if p_classe is not null then
    select c.id into v_id from public.classes_ativo c where c.id = p_classe and c.user_id = p_uid;
    if not found then
      raise exception 'recusado_classe_inexistente';
    end if;
    return v_id;
  end if;
  if p_nova is null then
    return null;
  end if;
  v_nome := private.conferir_nome(p_nova);
  select c.id into v_id from public.classes_ativo c where c.user_id = p_uid and lower(btrim(c.nome)) = lower(v_nome);
  if found then
    return v_id;
  end if;
  insert into public.classes_ativo (user_id, nome) values (p_uid, v_nome) returning id into v_id;
  return v_id;
end;
$$;

-- Classes iniciais de alocação macro (P-3). Idempotente; nomes genéricos, sem dado do usuário.
create function private.criar_classes_iniciais(p_uid uuid)
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.classes_ativo (user_id, nome)
  select p_uid, c.nome from (values ('Renda fixa'), ('Renda variável'), ('Fundos'), ('Cripto'), ('Outros')) c (nome)
  on conflict do nothing;
$$;

-- Gatilho: todo perfil novo recebe as classes iniciais. handle_new_user não muda.
create function private.classes_iniciais_do_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.criar_classes_iniciais(new.user_id);
  return new;
end;
$$;

create trigger on_profile_created_classes
  after insert on public.profiles
  for each row execute function private.classes_iniciais_do_perfil();

revoke execute on function private.conferir_nome(text), private.resolver_instituicao(uuid, uuid, text),
  private.resolver_classe(uuid, uuid, text), private.criar_classes_iniciais(uuid),
  private.classes_iniciais_do_perfil()
  from public, anon, authenticated;

-- Perfis que já existiam recebem as mesmas classes.
do $$
declare
  v_uid uuid;
begin
  for v_uid in select p.user_id from public.profiles p loop
    perform private.criar_classes_iniciais(v_uid);
  end loop;
end;
$$;

-- Funções da Data API (security definer, filtro por auth.uid(), trava primeiro).

create function public.criar_instituicao(p_nome text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_nome text := private.conferir_nome(p_nome);
  v_id uuid;
begin
  if exists (select 1 from public.instituicoes i where i.user_id = v_uid and lower(btrim(i.nome)) = lower(v_nome)) then
    raise exception 'recusado_nome_repetido';
  end if;
  insert into public.instituicoes (user_id, nome) values (v_uid, v_nome) returning id into v_id;
  return v_id;
end;
$$;

create function public.renomear_instituicao(p_instituicao uuid, p_nome text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_nome text := private.conferir_nome(p_nome);
begin
  if not exists (select 1 from public.instituicoes i where i.id = p_instituicao and i.user_id = v_uid) then
    raise exception 'recusado_instituicao_inexistente';
  end if;
  if exists (select 1 from public.instituicoes i
             where i.user_id = v_uid and i.id <> p_instituicao and lower(btrim(i.nome)) = lower(v_nome)) then
    raise exception 'recusado_nome_repetido';
  end if;
  update public.instituicoes set nome = v_nome where id = p_instituicao and user_id = v_uid;
end;
$$;

-- Só sem ativo vinculado, desativado ou não (P-1).
create function public.excluir_instituicao(p_instituicao uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
begin
  if not exists (select 1 from public.instituicoes i where i.id = p_instituicao and i.user_id = v_uid) then
    raise exception 'recusado_instituicao_inexistente';
  end if;
  if exists (select 1 from public.ativos a where a.user_id = v_uid and a.instituicao_id = p_instituicao) then
    raise exception 'recusado_em_uso';
  end if;
  delete from public.instituicoes where id = p_instituicao and user_id = v_uid;
end;
$$;

create function public.criar_classe(p_nome text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_nome text := private.conferir_nome(p_nome);
  v_id uuid;
begin
  if exists (select 1 from public.classes_ativo c where c.user_id = v_uid and lower(btrim(c.nome)) = lower(v_nome)) then
    raise exception 'recusado_nome_repetido';
  end if;
  insert into public.classes_ativo (user_id, nome) values (v_uid, v_nome) returning id into v_id;
  return v_id;
end;
$$;

create function public.renomear_classe(p_classe uuid, p_nome text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_nome text := private.conferir_nome(p_nome);
begin
  if not exists (select 1 from public.classes_ativo c where c.id = p_classe and c.user_id = v_uid) then
    raise exception 'recusado_classe_inexistente';
  end if;
  if exists (select 1 from public.classes_ativo c
             where c.user_id = v_uid and c.id <> p_classe and lower(btrim(c.nome)) = lower(v_nome)) then
    raise exception 'recusado_nome_repetido';
  end if;
  update public.classes_ativo set nome = v_nome where id = p_classe and user_id = v_uid;
end;
$$;

create function public.excluir_classe(p_classe uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
begin
  if not exists (select 1 from public.classes_ativo c where c.id = p_classe and c.user_id = v_uid) then
    raise exception 'recusado_classe_inexistente';
  end if;
  if exists (select 1 from public.ativos a where a.user_id = v_uid and a.classe_id = p_classe) then
    raise exception 'recusado_em_uso';
  end if;
  delete from public.classes_ativo where id = p_classe and user_id = v_uid;
end;
$$;

-- Cadastro do ativo com os campos descritivos (P-5). Mesmas regras de criar_ativo, que continua
-- disponível sem mudança; instituição e classe novas são criadas na mesma transação (P-4).
create function public.cadastrar_ativo(
  p_nome text, p_tipo_ajuste public.tipo_ajuste, p_instituicao uuid, p_instituicao_nova text, p_classe uuid,
  p_classe_nova text, p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean,
  p_isento_ir boolean)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_instituicao uuid;
  v_classe uuid;
  v_id uuid;
begin
  if p_tipo_ajuste is null then
    raise exception 'recusado_tipo_ajuste';
  end if;
  v_instituicao := private.resolver_instituicao(v_uid, p_instituicao, p_instituicao_nova);
  v_classe := private.resolver_classe(v_uid, p_classe, p_classe_nova);
  insert into public.ativos (user_id, nome, tipo_ajuste, sistema)
  values (v_uid, 'Em trânsito', null, 'transito')
  on conflict (user_id) where sistema = 'transito' do nothing;
  insert into public.ativos (user_id, nome, tipo_ajuste, instituicao_id, classe_id, previdencia, liquidez_imediata,
    exposicao_cambial, isento_ir)
  values (v_uid, btrim(p_nome), p_tipo_ajuste, v_instituicao, v_classe, p_previdencia, p_liquidez_imediata,
    p_exposicao_cambial, p_isento_ir)
  returning id into v_id;
  return v_id;
end;
$$;

-- Edição só dos campos descritivos, que substitui todos. Aceita ativo desativado; recusa o
-- trânsito. O ativo é conferido antes de resolver as referências, para que uma tentativa sobre
-- ativo alheio não crie nenhuma entrada.
create function public.editar_detalhes_ativo(
  p_ativo uuid, p_instituicao uuid, p_instituicao_nova text, p_classe uuid, p_classe_nova text,
  p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean, p_isento_ir boolean)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_ativo public.ativos;
  v_instituicao uuid;
  v_classe uuid;
begin
  select * into v_ativo from public.ativos a where a.id = p_ativo and a.user_id = v_uid;
  if not found then
    raise exception 'recusado_ativo_inexistente';
  end if;
  if v_ativo.sistema is not null then
    raise exception 'recusado_ativo_invalido';
  end if;
  v_instituicao := private.resolver_instituicao(v_uid, p_instituicao, p_instituicao_nova);
  v_classe := private.resolver_classe(v_uid, p_classe, p_classe_nova);
  update public.ativos
  set instituicao_id = v_instituicao, classe_id = v_classe, previdencia = p_previdencia,
    liquidez_imediata = p_liquidez_imediata, exposicao_cambial = p_exposicao_cambial, isento_ir = p_isento_ir
  where id = p_ativo and user_id = v_uid;
end;
$$;

revoke execute on function public.criar_instituicao(text), public.renomear_instituicao(uuid, text),
  public.excluir_instituicao(uuid), public.criar_classe(text), public.renomear_classe(uuid, text),
  public.excluir_classe(uuid),
  public.cadastrar_ativo(text, public.tipo_ajuste, uuid, text, uuid, text, boolean, boolean, boolean, boolean),
  public.editar_detalhes_ativo(uuid, uuid, text, uuid, text, boolean, boolean, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.criar_instituicao(text), public.renomear_instituicao(uuid, text),
  public.excluir_instituicao(uuid), public.criar_classe(text), public.renomear_classe(uuid, text),
  public.excluir_classe(uuid),
  public.cadastrar_ativo(text, public.tipo_ajuste, uuid, text, uuid, text, boolean, boolean, boolean, boolean),
  public.editar_detalhes_ativo(uuid, uuid, text, uuid, text, boolean, boolean, boolean, boolean)
  to authenticated;
