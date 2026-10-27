-- Ciclo 015, issue #151: versão transacional e edição atômica do nome.
alter table public.profiles add column versao_metadados bigint not null default 0
  check (versao_metadados >= 0);
create function private.incrementar_metadados() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid;
begin
  if tg_op = 'UPDATE' then
    if tg_table_name = 'ativos' then
      if row(new.nome, new.instituicao_id, new.taxonomia_id) is not distinct from
         row(old.nome, old.instituicao_id, old.taxonomia_id) then return new; end if;
    elsif new.nome is not distinct from old.nome then return new;
    end if;
  end if;
  if tg_op = 'DELETE' then v_uid := old.user_id; else v_uid := new.user_id; end if;
  update public.profiles set versao_metadados = versao_metadados + 1 where user_id = v_uid;
  -- Durante a cascata de exclusão do usuário, o perfil pode já ter sido removido.
  if not found and exists (select 1 from auth.users where id = v_uid) then
    raise exception 'recusado_perfil_inexistente';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
create trigger ativos_versao_metadados after insert or delete or update of nome, instituicao_id, taxonomia_id
on public.ativos for each row execute function private.incrementar_metadados();
create trigger instituicoes_versao_metadados after insert or delete or update of nome
on public.instituicoes for each row execute function private.incrementar_metadados();
create function public.ler_versao_metadados()
returns text
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_versao bigint;
begin
  if v_uid is null then
    raise exception 'recusado_nao_autenticado' using errcode = '42501';
  end if;
  select p.versao_metadados into v_versao from public.profiles p where p.user_id = v_uid;
  if not found then
    raise exception 'recusado_perfil_inexistente';
  end if;
  return v_versao::text;
end;
$$;

create function public.editar_ativo_com_nome(
  p_ativo uuid, p_nome text, p_instituicao uuid, p_instituicao_nova text, p_taxonomia uuid,
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
begin
  select * into v_ativo from public.ativos a where a.id = p_ativo and a.user_id = v_uid;
  if not found then
    raise exception 'recusado_ativo_inexistente';
  end if;
  if v_ativo.sistema is not null then
    raise exception 'recusado_ativo_invalido';
  end if;
  if p_nome is null or char_length(btrim(p_nome)) not between 1 and 100 then
    raise exception 'recusado_nome';
  end if;
  v_instituicao := private.resolver_instituicao(v_uid, p_instituicao, p_instituicao_nova);
  if p_taxonomia is not null and not exists (select 1 from public.taxonomia_ativos t where t.id = p_taxonomia) then
    raise exception 'recusado_taxonomia_inexistente';
  end if;
  update public.ativos
  set nome = btrim(p_nome), instituicao_id = v_instituicao, taxonomia_id = p_taxonomia, previdencia = p_previdencia,
    liquidez_imediata = p_liquidez_imediata, exposicao_cambial = p_exposicao_cambial, isento_ir = p_isento_ir
  where id = p_ativo and user_id = v_uid;
end;
$$;


revoke all on function private.incrementar_metadados() from public, anon, authenticated;
revoke all on function public.ler_versao_metadados(),
public.editar_ativo_com_nome(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean) from public, anon;
grant execute on function public.ler_versao_metadados(),
public.editar_ativo_com_nome(uuid,text,uuid,text,uuid,boolean,boolean,boolean,boolean) to authenticated;
