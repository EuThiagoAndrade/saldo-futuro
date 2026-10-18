-- Exceção à K12 para a migração da origem (ciclo 006, plano v4, issue #73): o único meio de
-- lançar um evento `migracao` no ativo "Em trânsito". A variação do trânsito sem contrapartida na
-- origem (M6, caso b) vira migração no próprio trânsito, sem inventar aporte, resgate ou ativo.
-- lancar_evento, transferir, fechar_mes e as políticas não mudam: no fechamento, o saldo do
-- trânsito continua sendo o calculado e a migração entra no componente `migracao`.

create function public.lancar_migracao_transito(p_data date, p_valor bigint)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_transito uuid;
  v_id uuid;
begin
  -- Mesma ordem de recusas de lancar_evento: sinal, faixa e ativo. Com valor zero, a chamada é
  -- uma sonda sem efeito, que responde recusado_sinal mesmo antes de o trânsito existir.
  if p_valor is null or p_valor = 0 then
    raise exception 'recusado_sinal';
  end if;
  if not private.na_faixa(p_valor) then
    raise exception 'recusado_faixa';
  end if;
  select a.id into v_transito from public.ativos a where a.user_id = v_uid and a.sistema = 'transito';
  if not found then
    raise exception 'recusado_ativo_invalido';
  end if;
  perform private.conferir_data_lancamento(v_uid, p_data);
  insert into public.eventos (user_id, ativo_id, data, tipo, valor)
  values (v_uid, v_transito, p_data, 'migracao', p_valor)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.lancar_migracao_transito(date, bigint) from public, anon, authenticated;
grant execute on function public.lancar_migracao_transito(date, bigint) to authenticated;
