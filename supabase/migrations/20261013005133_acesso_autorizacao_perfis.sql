-- Acesso restrito (ADR-003): lista de e-mails autorizados, perfis, funções de papel,
-- hook "before user created" e gatilho de perfil.
--
-- Nada aqui depende de privilégio padrão do Supabase (V6): cada tabela e função declara
-- seus grants e revokes. Toda função tem search_path fixo e vazio, nomes qualificados e
-- EXECUTE revogado de PUBLIC.

create type public.app_role as enum ('admin', 'user');

-- Schema fora de [api] schemas: a Data API não o expõe.
create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;

-- Lista de e-mails autorizados: define quem pode criar conta e com que papel inicial.
create table public.authorized_emails (
  email text primary key,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  constraint authorized_emails_email_normalized
    check (email <> '' and email = lower(btrim(email)))
);
alter table public.authorized_emails enable row level security;

-- Perfil: depois do primeiro login, profiles.role é a autoridade do papel.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role public.app_role not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

revoke all on table public.authorized_emails from public, anon, authenticated, supabase_auth_admin;
revoke all on table public.profiles from public, anon, authenticated, supabase_auth_admin;
grant select, insert, delete on table public.authorized_emails to authenticated;
grant select on table public.authorized_emails to supabase_auth_admin;
grant select on table public.profiles to authenticated;

-- Funções de papel
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke execute on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Políticas: o admin gerencia a lista (sem update) e não lê perfis alheios.
create policy authorized_emails_select_admin on public.authorized_emails
  for select to authenticated
  using ((select private.is_admin()));

create policy authorized_emails_insert_admin on public.authorized_emails
  for insert to authenticated
  with check ((select private.is_admin()));

create policy authorized_emails_delete_admin on public.authorized_emails
  for delete to authenticated
  using ((select private.is_admin()));

create policy authorized_emails_select_auth_admin on public.authorized_emails
  for select to supabase_auth_admin
  using (true);

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Hook "before user created": recusa e-mail nulo ou ausente da lista. Sem security definer,
-- por orientação da documentação do Supabase: roda como supabase_auth_admin.
create function private.before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_email text := lower(btrim(event -> 'user' ->> 'email'));
begin
  if v_email is null
     or not exists (select 1 from public.authorized_emails a where a.email = v_email) then
    return jsonb_build_object(
      'error', jsonb_build_object('http_code', 403, 'message', 'Acesso não autorizado.')
    );
  end if;
  return '{}'::jsonb;
end;
$$;
revoke execute on function private.before_user_created(jsonb) from public, anon, authenticated;
grant execute on function private.before_user_created(jsonb) to supabase_auth_admin;

-- Gatilho de perfil: cria o perfil com o papel inicial da lista. Para e-mail nulo ou ausente
-- da lista, lança exceção e aborta a criação do usuário: segunda barreira, caso o hook esteja
-- desligado ou mal configurado.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(new.email));
  v_role public.app_role;
begin
  select a.role into v_role from public.authorized_emails a where a.email = v_email;
  if v_role is null then
    raise exception 'Acesso não autorizado.';
  end if;
  insert into public.profiles (user_id, email, role) values (new.id, v_email, v_role);
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated, supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
