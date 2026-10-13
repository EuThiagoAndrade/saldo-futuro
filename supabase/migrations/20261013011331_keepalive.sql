-- Keepalive: consulta trivial chamada pelo cron diário da Vercel para manter o projeto ativo.
-- Não lê nenhuma tabela. Executável só por anon, a chave publicável usada pela rota.
-- Declara os grants explicitamente (V6) e fixa o search_path.

create function public.keepalive()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select 1;
$$;

revoke execute on function public.keepalive() from public, anon, authenticated;
grant execute on function public.keepalive() to anon;
