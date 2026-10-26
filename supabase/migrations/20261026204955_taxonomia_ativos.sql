-- Taxonomia global de classes de ativos, fase 1 de 2 (ciclo 013, issue #137, BL-014 e parcela de
-- BL-009). Expansão compatível com a janela de transição (D19): o catálogo, o vínculo opcional do
-- ativo, a marca de coerência da classificação (R1-2) e as RPCs novas entram agora; as RPCs e a
-- tabela de classes do usuário (ciclo 012) continuam funcionando até a migração da fase 2, que as
-- retira. Nada aqui altera saldo, evento, posição, consolidado, indicador ou instituição.
--
-- A árvore é global (sem user_id), de até três níveis, mantida só por migração: o usuário e o
-- administrador, pelo papel da aplicação, só leem. Os UUIDs são fixos e derivam do código da
-- árvore aprovada (a5000000-0000-4000-8000-000000NNMMKK, em que NN, MM e KK são o nó de nível 1,
-- 2 e 3); a ordem é a de apresentação, explícita. Mudar o catálogo em uso exige migração nova.

-- Identidade de nome do catálogo: sem caixa, sem acento e sem espaços nas pontas. Sem extensão
-- (unaccent): a transliteração dos caracteres do português é explícita. É a mesma regra da
-- consulta prévia do roteiro E1 e do preenchimento abaixo.
create function private.normalizar_nome(p_nome text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(translate(btrim(p_nome),
    'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
    'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'));
$$;

-- O nível do pai é sempre o nível do filho menos um: a chave (parent_id, parent_nivel) para
-- (id, nivel) impõe o encadeamento 1 → 2 → 3, impede ciclo e recusa mudar o pai ou o nível de um
-- nó de modo que invalide os filhos. A chave usa NO ACTION: nó com filhos não é excluído.
create table public.taxonomia_ativos (
  id uuid primary key,
  parent_id uuid,
  nivel smallint not null,
  nome text not null,
  ordem integer not null,
  parent_nivel smallint generated always as ((nivel - 1)::smallint) stored,
  constraint taxonomia_ativos_id_nivel_key unique (id, nivel),
  constraint taxonomia_ativos_parent_fkey foreign key (parent_id, parent_nivel)
    references public.taxonomia_ativos (id, nivel),
  constraint taxonomia_ativos_nivel_check check (nivel between 1 and 3),
  constraint taxonomia_ativos_raiz_check check ((nivel = 1) = (parent_id is null)),
  constraint taxonomia_ativos_nome_check check (char_length(btrim(nome)) between 1 and 100),
  constraint taxonomia_ativos_ordem_check check (ordem > 0),
  constraint taxonomia_ativos_ordem_irmaos_key unique (parent_id, ordem)
);
-- Nome e ordem únicos entre irmãos. Nas raízes, parent_id é nulo e a restrição acima não as
-- distingue; por isso os índices parciais.
create unique index taxonomia_ativos_nome_irmaos on public.taxonomia_ativos
  (parent_id, (private.normalizar_nome(nome))) where parent_id is not null;
create unique index taxonomia_ativos_nome_raizes on public.taxonomia_ativos
  ((private.normalizar_nome(nome))) where parent_id is null;
create unique index taxonomia_ativos_ordem_raizes on public.taxonomia_ativos (ordem) where parent_id is null;
alter table public.taxonomia_ativos enable row level security;

-- Só leitura, só para quem está autenticado; nenhuma escrita pela Data API, nem pelo administrador.
revoke all on table public.taxonomia_ativos from public, anon, authenticated, service_role;
grant select on table public.taxonomia_ativos to authenticated;
create policy taxonomia_ativos_select_auth on public.taxonomia_ativos for select to authenticated
  using (true);

-- Carga da árvore aprovada (D16). Nomes genéricos: nenhum emissor, gestora, ticker, taxa ou
-- indexador.

-- Nível 1
insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem) values
  ('a5000000-0000-4000-8000-000000010000', null, 1, 'Caixa e disponibilidades', 1),
  ('a5000000-0000-4000-8000-000000020000', null, 1, 'Renda fixa', 2),
  ('a5000000-0000-4000-8000-000000030000', null, 1, 'Renda variável', 3),
  ('a5000000-0000-4000-8000-000000040000', null, 1, 'Investimentos no exterior', 4),
  ('a5000000-0000-4000-8000-000000050000', null, 1, 'Criptoativos e ativos digitais', 5),
  ('a5000000-0000-4000-8000-000000060000', null, 1, 'Alternativos, moedas, outros', 6);

-- Nível 2
insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem) values
  ('a5000000-0000-4000-8000-000000010100', 'a5000000-0000-4000-8000-000000010000', 2, 'Saldos em conta', 1),
  ('a5000000-0000-4000-8000-000000010200', 'a5000000-0000-4000-8000-000000010000', 2, 'Dinheiro em espécie', 2),
  ('a5000000-0000-4000-8000-000000020100', 'a5000000-0000-4000-8000-000000020000', 2, 'Dívida soberana', 1),
  ('a5000000-0000-4000-8000-000000020200', 'a5000000-0000-4000-8000-000000020000', 2, 'Crédito bancário', 2),
  ('a5000000-0000-4000-8000-000000020300', 'a5000000-0000-4000-8000-000000020000', 2, 'Crédito corporativo', 3),
  ('a5000000-0000-4000-8000-000000020400', 'a5000000-0000-4000-8000-000000020000', 2, 'Crédito estruturado', 4),
  ('a5000000-0000-4000-8000-000000030100', 'a5000000-0000-4000-8000-000000030000', 2, 'Participações em empresas', 1),
  ('a5000000-0000-4000-8000-000000030200', 'a5000000-0000-4000-8000-000000030000', 2, 'Imóveis de renda', 2),
  ('a5000000-0000-4000-8000-000000030300', 'a5000000-0000-4000-8000-000000030000', 2, 'Desenvolvimento imobiliário', 3),
  ('a5000000-0000-4000-8000-000000040100', 'a5000000-0000-4000-8000-000000040000', 2, 'Dívida soberana no exterior', 1),
  ('a5000000-0000-4000-8000-000000040200', 'a5000000-0000-4000-8000-000000040000', 2, 'Crédito privado no exterior', 2),
  ('a5000000-0000-4000-8000-000000040300', 'a5000000-0000-4000-8000-000000040000', 2, 'Participações em empresas no exterior', 3),
  ('a5000000-0000-4000-8000-000000040400', 'a5000000-0000-4000-8000-000000040000', 2, 'Imóveis no exterior', 4),
  ('a5000000-0000-4000-8000-000000050100', 'a5000000-0000-4000-8000-000000050000', 2, 'Criptoativos sem lastro', 1),
  ('a5000000-0000-4000-8000-000000050200', 'a5000000-0000-4000-8000-000000050000', 2, 'Stablecoins', 2),
  ('a5000000-0000-4000-8000-000000050300', 'a5000000-0000-4000-8000-000000050000', 2, 'Outros ativos digitais', 3),
  ('a5000000-0000-4000-8000-000000060100', 'a5000000-0000-4000-8000-000000060000', 2, 'Ouro', 1),
  ('a5000000-0000-4000-8000-000000060200', 'a5000000-0000-4000-8000-000000060000', 2, 'Outras commodities', 2),
  ('a5000000-0000-4000-8000-000000060300', 'a5000000-0000-4000-8000-000000060000', 2, 'Exposição a moedas', 3),
  ('a5000000-0000-4000-8000-000000060400', 'a5000000-0000-4000-8000-000000060000', 2, 'Estratégias multiexposição', 4),
  ('a5000000-0000-4000-8000-000000060500', 'a5000000-0000-4000-8000-000000060000', 2, 'Outros alternativos', 5);

-- Nível 3
insert into public.taxonomia_ativos (id, parent_id, nivel, nome, ordem) values
  ('a5000000-0000-4000-8000-000000020201', 'a5000000-0000-4000-8000-000000020200', 3, 'CDB', 1),
  ('a5000000-0000-4000-8000-000000020202', 'a5000000-0000-4000-8000-000000020200', 3, 'RDB', 2),
  ('a5000000-0000-4000-8000-000000020203', 'a5000000-0000-4000-8000-000000020200', 3, 'Letras bancárias', 3),
  ('a5000000-0000-4000-8000-000000020301', 'a5000000-0000-4000-8000-000000020300', 3, 'Debêntures', 1),
  ('a5000000-0000-4000-8000-000000020302', 'a5000000-0000-4000-8000-000000020300', 3, 'Notas comerciais', 2),
  ('a5000000-0000-4000-8000-000000020401', 'a5000000-0000-4000-8000-000000020400', 3, 'Recebíveis imobiliários', 1),
  ('a5000000-0000-4000-8000-000000020402', 'a5000000-0000-4000-8000-000000020400', 3, 'Recebíveis do agronegócio', 2),
  ('a5000000-0000-4000-8000-000000020403', 'a5000000-0000-4000-8000-000000020400', 3, 'Outros recebíveis', 3),
  ('a5000000-0000-4000-8000-000000030101', 'a5000000-0000-4000-8000-000000030100', 3, 'Ações ordinárias', 1),
  ('a5000000-0000-4000-8000-000000030102', 'a5000000-0000-4000-8000-000000030100', 3, 'Ações preferenciais', 2),
  ('a5000000-0000-4000-8000-000000050201', 'a5000000-0000-4000-8000-000000050200', 3, 'Com reservas', 1),
  ('a5000000-0000-4000-8000-000000050202', 'a5000000-0000-4000-8000-000000050200', 3, 'Algorítmicas', 2);

-- Vínculo opcional do ativo com um nó (P1: qualquer nível). Nulo é "Sem classe". Nó referenciado
-- não é excluído (NO ACTION; o nó não pertence a nenhum usuário, então não há cascata a considerar).
-- O trânsito não recebe classe: a restrição do ciclo 012 passa a cobrir também o nó. classe_id
-- (legado) continua, para a dica "antes: X" e para a janela de transição.
alter table public.ativos
  drop constraint ativos_transito_sem_detalhes_check,
  add column taxonomia_id uuid,
  add constraint ativos_taxonomia_fkey foreign key (taxonomia_id) references public.taxonomia_ativos (id),
  add constraint ativos_transito_sem_detalhes_check check (
    sistema is null or (instituicao_id is null and classe_id is null and taxonomia_id is null
      and previdencia is null and liquidez_imediata is null and exposicao_cambial is null and isento_ir is null));

-- Marca de coerência da classificação (R1-2): um contador por carteira, que só cresce. O gatilho
-- roda na mesma transação da mudança e incrementa a linha do perfil dono sempre que taxonomia_id
-- muda (A → B → A conta duas), inclusive ao zerar pela edição antiga e no preenchimento abaixo.
-- Inserção sem nó não conta: a contagem de ativos já a detecta. O estouro de bigint aborta a
-- transação; o contador nunca reinicia, e a API não o escreve.
alter table public.profiles
  add column versao_classificacao bigint not null default 0,
  add constraint profiles_versao_classificacao_check check (versao_classificacao >= 0);

create function private.versao_classificacao_ativo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.taxonomia_id is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.taxonomia_id is not distinct from old.taxonomia_id then
    return new;
  end if;
  update public.profiles p set versao_classificacao = p.versao_classificacao + 1 where p.user_id = new.user_id;
  if not found then
    raise exception 'recusado_perfil_inexistente';
  end if;
  return new;
end;
$$;

create trigger ativos_versao_classificacao
  after insert or update of taxonomia_id on public.ativos
  for each row execute function private.versao_classificacao_ativo();

-- Leitura da marca: texto decimal (nunca número JSON, que perde precisão acima de 2^53), só do
-- próprio usuário, sob a RLS de profiles. Sem parâmetro de dono e sem desvio do administrador.
create function public.ler_versao_classificacao()
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
  select p.versao_classificacao into v_versao from public.profiles p where p.user_id = v_uid;
  if not found then
    raise exception 'recusado_perfil_inexistente';
  end if;
  return v_versao::text;
end;
$$;

-- Equivalência mínima do legado (D17): os seis nomes da classe macro, mais os aliases "Cripto" e
-- "Outros", sem caixa, acento nem espaços nas pontas. Qualquer outro nome (como "Fundos"), busca
-- parcial ou ausência de legado resulta em nulo. Usada uma única vez, no preenchimento abaixo;
-- mantida para o teste do mapeamento. Os destinos são nós fixos, não nomes do catálogo.
create function private.taxonomia_equivalente(p_nome text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select m.id
  from (values
    ('caixa e disponibilidades', 'a5000000-0000-4000-8000-000000010000'::uuid),
    ('renda fixa', 'a5000000-0000-4000-8000-000000020000'::uuid),
    ('renda variavel', 'a5000000-0000-4000-8000-000000030000'::uuid),
    ('investimentos no exterior', 'a5000000-0000-4000-8000-000000040000'::uuid),
    ('criptoativos e ativos digitais', 'a5000000-0000-4000-8000-000000050000'::uuid),
    ('cripto', 'a5000000-0000-4000-8000-000000050000'::uuid),
    ('alternativos, moedas, outros', 'a5000000-0000-4000-8000-000000060000'::uuid),
    ('outros', 'a5000000-0000-4000-8000-000000060000'::uuid)) m (chave, id)
  where m.chave = private.normalizar_nome(p_nome);
$$;

-- Preenchimento, uma única vez e só dos ativos comuns (inclusive desativados). O legado
-- (classe_id) fica intacto. Os que não casam continuam nulos, "Sem classe", e o gatilho acima já
-- registra cada mudança na marca do dono. Não será repetido: uma escolha consciente de "Sem classe"
-- depois da janela não pode ser sobrescrita.
update public.ativos a
set taxonomia_id = private.taxonomia_equivalente(c.nome)
from public.classes_ativo c
where c.user_id = a.user_id and c.id = a.classe_id and a.sistema is null
  and private.taxonomia_equivalente(c.nome) is not null;

-- Funções da Data API, com nomes novos para não haver sobrecarga ambígua no PostgREST (as
-- assinaturas do ciclo 012 continuam). Mesmo protocolo: security definer, trava da carteira
-- primeiro, filtro por auth.uid(). p_taxonomia (qualquer nível, ou nulo) substitui a classe; o
-- legado classe_id não é escrito por elas (nulo no cadastro, preservado na edição).

create function public.cadastrar_ativo_taxonomia(
  p_nome text, p_tipo_ajuste public.tipo_ajuste, p_instituicao uuid, p_instituicao_nova text, p_taxonomia uuid,
  p_previdencia boolean, p_liquidez_imediata boolean, p_exposicao_cambial boolean, p_isento_ir boolean)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.travar_carteira();
  v_instituicao uuid;
  v_id uuid;
begin
  if p_tipo_ajuste is null then
    raise exception 'recusado_tipo_ajuste';
  end if;
  v_instituicao := private.resolver_instituicao(v_uid, p_instituicao, p_instituicao_nova);
  if p_taxonomia is not null and not exists (select 1 from public.taxonomia_ativos t where t.id = p_taxonomia) then
    raise exception 'recusado_taxonomia_inexistente';
  end if;
  insert into public.ativos (user_id, nome, tipo_ajuste, sistema)
  values (v_uid, 'Em trânsito', null, 'transito')
  on conflict (user_id) where sistema = 'transito' do nothing;
  insert into public.ativos (user_id, nome, tipo_ajuste, instituicao_id, taxonomia_id, previdencia, liquidez_imediata,
    exposicao_cambial, isento_ir)
  values (v_uid, btrim(p_nome), p_tipo_ajuste, v_instituicao, p_taxonomia, p_previdencia, p_liquidez_imediata,
    p_exposicao_cambial, p_isento_ir)
  returning id into v_id;
  return v_id;
end;
$$;

-- Edição só dos campos descritivos, que substitui todos (menos o legado classe_id, preservado).
-- Aceita ativo desativado; recusa o trânsito. O ativo é conferido antes de resolver a instituição,
-- para que uma tentativa sobre ativo alheio não crie nenhuma entrada.
create function public.editar_detalhes_ativo_taxonomia(
  p_ativo uuid, p_instituicao uuid, p_instituicao_nova text, p_taxonomia uuid,
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
  v_instituicao := private.resolver_instituicao(v_uid, p_instituicao, p_instituicao_nova);
  if p_taxonomia is not null and not exists (select 1 from public.taxonomia_ativos t where t.id = p_taxonomia) then
    raise exception 'recusado_taxonomia_inexistente';
  end if;
  update public.ativos
  set instituicao_id = v_instituicao, taxonomia_id = p_taxonomia, previdencia = p_previdencia,
    liquidez_imediata = p_liquidez_imediata, exposicao_cambial = p_exposicao_cambial, isento_ir = p_isento_ir
  where id = p_ativo and user_id = v_uid;
end;
$$;

-- Janela de transição (D19): a edição antiga continua gravando a classe do usuário e passa a
-- zerar taxonomia_id, mesmo que o ativo tivesse sido mapeado no preenchimento: o ativo fica "Sem
-- classe" e o gatilho incrementa a marca. O cadastro antigo (cadastrar_ativo) já deixa o nó nulo,
-- porque não o escreve. Mesma assinatura, então os privilégios existentes continuam.
create or replace function public.editar_detalhes_ativo(
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
  set instituicao_id = v_instituicao, classe_id = v_classe, taxonomia_id = null, previdencia = p_previdencia,
    liquidez_imediata = p_liquidez_imediata, exposicao_cambial = p_exposicao_cambial, isento_ir = p_isento_ir
  where id = p_ativo and user_id = v_uid;
end;
$$;

-- Fim das classes iniciais por usuário: o gatilho de perfil e seus auxiliares saem. As classes que
-- os usuários já têm ficam (legado, até a fase 2); perfis novos nascem sem classes.
drop trigger on_profile_created_classes on public.profiles;
drop function private.classes_iniciais_do_perfil();
drop function private.criar_classes_iniciais(uuid);

revoke execute on function private.normalizar_nome(text), private.taxonomia_equivalente(text),
  private.versao_classificacao_ativo()
  from public, anon, authenticated;
revoke execute on function public.cadastrar_ativo_taxonomia(
    text, public.tipo_ajuste, uuid, text, uuid, boolean, boolean, boolean, boolean),
  public.editar_detalhes_ativo_taxonomia(uuid, uuid, text, uuid, boolean, boolean, boolean, boolean),
  public.ler_versao_classificacao()
  from public, anon, authenticated;
grant execute on function public.cadastrar_ativo_taxonomia(
    text, public.tipo_ajuste, uuid, text, uuid, boolean, boolean, boolean, boolean),
  public.editar_detalhes_ativo_taxonomia(uuid, uuid, text, uuid, boolean, boolean, boolean, boolean),
  public.ler_versao_classificacao()
  to authenticated;
