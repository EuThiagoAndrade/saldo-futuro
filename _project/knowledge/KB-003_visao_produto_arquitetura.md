---
title: "Visão do produto e da arquitetura"
tags:
  - produto
  - arquitetura
  - referência
author: "Thiago Andrade e Claude"
module: "Produto"
last_updated: "2026-10-30"
origin_cycle: "002"
---

# KB-003: Visão do produto e da arquitetura

## Finalidade

Primeira leitura para entender o Saldo Futuro como ele está hoje, para humanos e para agentes. Resume o que existe, onde está e por quê, sem obrigar a leitura dos planos executados. É atualizada no encerramento de cada ciclo que mude o produto ou a arquitetura (`.agent/workflows/atualizar_docs.md`).

## Limite de autoridade

Conhecimento de referência. As decisões estão nas ADRs, o contrato visual no `design-system/DESIGN.md`, a operação de produção na KB-002 e o processo no `_project/README.md`. Em divergência entre esta KB e uma dessas fontes, vale a fonte, e esta KB deve ser corrigida. Ela não autoriza mudança.

## Conteúdo

### O produto hoje

O Saldo Futuro é um sistema web de gestão de investimentos pessoais, multiusuário e pensado primeiro para o celular (`README.md`). A versão `0.3.0` reúne as telas do ciclo `004`, em `investimentos.euthiagoandrade.com.br` (KB-002), sobre a fundação e as regras existentes:

- a fundação (ciclo `001`):
  - login com Google restrito a e-mails autorizados;
  - perfis `admin` e `user`;
  - isolamento por RLS provado por testes de banco;
  - PWA instalável;
- as regras financeiras (ciclo `003`):
  - o schema da carteira, com escrita só por funções do banco;
  - lançamentos, estorno, transferência e fechamento mensal;
  - consolidação, Modified Dietz, acumulado e drawdown;
  - benchmarks (CDI e IPCA; IGP-M desde o ciclo `011`) com a sincronização com o SGS e a comparação com a carteira;
  - tudo especificado na KB-004 e testado contra os mesmos casos de referência;
- as telas (ciclo `004`):
  - Início com patrimônio do último mês fechado, aportes líquidos do mês aberto, períodos, distribuição e gráficos em SVG próprio com tabelas equivalentes;
  - ativos, lançamentos, estorno, transferências/correção e fechamento/reabertura;
  - catálogo de benchmarks, cobertura, comparação e sincronização sob demanda com o SGS, restrita ao admin;
  - lista de acessos, normalização dos e-mails, papel inicial e remoção com confirmação;
  - Conta, navegação responsiva e Ocultar valores, lembrado por cookie e aplicado na renderização do servidor.
- identidade mobile e desempenho (ciclo `005`):
  - logo à esquerda no cabeçalho mobile, com link para o Início;
  - leitura coerente que vai ao banco em cada fase dentro do servidor Next e marcas lidas em paralelo, reduzindo a espera ao voltar ao Início.

- usabilidade e consistência visual (ciclo `009`):
  - margem esquerda comum a patrimônio, rentabilidade mensal e Base 100 no Início: o maior valor entre 70 e a largura estimada do rótulo mais longo dos três eixos mais 6, limitado a 144 para manter 160 unidades de curva; a estimativa roda no servidor, é conservadora e o e2e a confere contra a caixa medida com a fonte carregada; a comparação de benchmarks mantém a margem padrão;
  - botões com cursor de ponteiro, hover e estado pressionado em todas as variantes e nos controles com classes próprias (DESIGN.md 6.9); exceção declarada: no principal, com mouse e movimento reduzido, o pressionado coincide com o hover;
  - campos de intervalo dos filtros de período do Início e da comparação só aparecem com "Intervalo escolhido" (CSS `:has()`, sem JavaScript), com `novalidate` nos dois formulários e a validação do intervalo só no servidor;
  - seletor de ativo com busca (`ComboboxAtivo`) e ordem alfabética pelo nome exibido em Lançamentos (filtro), Novo lançamento e Nova transferência; política de seleção em `src/lib/telas/combobox.ts` e contrato no DESIGN.md 6.8; a busca depende de JavaScript.

- migração e virada (ciclo `006`):
  - a carteira do `Meus-Investimentos` foi reconstruída em produção por uma migração única (simular, gravar e conferir, em `src/lib/migracao/` e `npm run migracao`), com conferência sem diferença mês a mês;
  - **virada em 2026-10-18:** a partir dessa data, o Saldo Futuro é a fonte de verdade e a origem não recebe lançamentos; a cópia congelada da origem fica fora do repositório;
  - os meses importados da planilha da origem e os 2 meses do trânsito sem contrapartida têm rentabilidade `N/D` (P15); todo período que os inclui também é `N/D` (K1), e o Início mostra à parte o trecho calculável;
  - a função `lancar_migracao_transito` é a exceção à K12 que permite `migracao` no trânsito, só usada pelo migrador.

- legibilidade do Início (ciclo `008`):
  - eixo patrimonial com unidade única e precisão comum às marcas; a escala amplia somente o domínio de apresentação quando a resolução decimal exige, preservando a tabela em centavos;
  - margem esquerda dos gráficos do Início: ver o bullet do ciclo `009` (a margem fixa de 144 do ciclo `008` foi substituída por uma margem comum); área de curva de pelo menos 160 unidades no viewBox de 360;
  - cartões em uma coluna abaixo de `md` e duas a partir de `md`, inclusive com menu lateral; preenchimento local `px-1 py-4 md:px-3`, mantendo quantia integral em uma linha e fonte de 24/32 px, peso 600;
  - contenção do domínio integral de centavos seguros a partir de 360 px CSS úteis de layout (`document.documentElement.clientWidth`), descontada a barra vertical: janela de 375 px para barra clássica de 15 px; janela de 360 com essa barra deixa 345 úteis e fica abaixo do mínimo validado.

- páginas públicas (ciclo `010`):
  - `/privacidade` e `/termos`, estáticas e fora da área autenticada, respondem sem sessão e sem backend, com data de atualização, contato do responsável e links entre si (`src/app/privacidade/`, `src/app/termos/` e `src/components/pagina-legal.tsx`);
  - `/entrar` mostra só o logo e o login centralizados e leva às duas páginas, também no preview sem backend, onde o login continua indisponível; Conta oferece os mesmos links (`src/components/links-legais.tsx`), sem novo destino na navegação principal;
  - a página inicial informada ao Google é `/termos`, que identifica o app, descreve a funcionalidade e leva à política; para as pessoas, a entrada continua em `/entrar`;
  - a Audience da tela de consentimento do Google foi publicada em produção pelo responsável em 2026-10-22, pelo roteiro O1 a O6 da KB-002, com escopos só de identidade básica e login de conta autorizada fora da lista de teste comprovado; Branding não foi solicitado;
- versão e novidades (ciclo `010`):
  - `/novidades`, autenticada para `admin` e `user`, em Mais e no menu lateral, mostra a versão corrente lida do `package.json` e o histórico manual de `src/lib/novidades.ts`, a partir da `0.7.0`, em linguagem simples;
  - uma entrada só aparece depois que sua versão é lançada no build; a `0.7.0` foi publicada em 2026-10-22, a `0.8.0` em 2026-10-23 e a `0.9.0` em 2026-10-24, com as datas registradas em `src/lib/novidades.ts`; uma entrada sem data comprovada mostra "Data de publicação em confirmação". Versão sem entrada não tem notas, sem erro; nenhum teste exige nota por versão, e a página não leva ao changelog técnico.
- tela de ativos (ciclo `010`):
  - `/ativos` tem Novo ativo no topo e as abas "Em uso" e "Desativados" como links (`/ativos` e `/ativos?aba=desativados`), lidas no servidor, com contadores e só a lista selecionada; valor ausente ou desconhecido abre Em uso. No celular, Em uso é uma lista densa com o nome completo; no desktop, tabela (DESIGN.md 6.7 e 6.12);
  - o cadastro fica em `/ativos/novo`, com a mesma validação; o sucesso volta a `/ativos` sem mensagem extra, e a recusa aparece no próprio formulário. A desativação continua pela confirmação e pela RPC `desativar_ativo`, com as mesmas restrições (trânsito sem ação, saldo zero obrigatório).
- detalhes dos ativos (ciclo `012`, BL-009):
  - o cadastro usa a RPC `cadastrar_ativo_com_atributos` (desde o ciclo `017`; antes, `cadastrar_ativo_taxonomia`, e no ciclo `012`, `cadastrar_ativo`), com a classe num seletor único com busca pelo caminho completo, sem criação (um nó da taxonomia global, de qualquer nível, ou nenhum), a instituição num seletor que oferece "Cadastrar «texto»" (a entrada nova é criada no envio, na mesma transação) e os quatro indicadores em "Mais detalhes", retrátil e fechado por padrão (DESIGN.md 6.8); desde o ciclo `017` (issue #173), "Mais detalhes" também tem os atributos complementares, agrupados com os indicadores (ver "Atributos complementares dos ativos");
  - `/ativos/[id]/editar`, aberto por Editar nas duas abas, altera os campos descritivos, também de ativo desativado, pela RPC `editar_ativo_com_atributos` (desde o ciclo `017`; antes, `editar_ativo_com_nome`, do ciclo `015`, e `editar_detalhes_ativo`); o tipo de ajuste aparece só para leitura (o nome é editável desde o ciclo `015`), e o trânsito não tem edição;
  - as duas abas de `/ativos` mostram classe e instituição (colunas no desktop; segunda linha no celular, omitindo o que não foi informado) (DESIGN.md 6.7); a classe é o nome do nó, ou "Sem classe (antes: X)" para quem só tem a classe do legado (ciclo `013`);
  - `/cadastros`, em Mais e no menu lateral, mantém as instituições do usuário, com inclusão, renomear em linha e exclusão só sem ativo vinculado; a aba "Classes" saiu no ciclo `013`, e o endereço antigo `?aba=classes` abre Instituições;
  - os campos só descrevem os ativos; nenhum cálculo os lê (KB-004, 4.1).
- distribuição por ativo (ciclo `010`):
  - o Início desenha a distribuição de M em rosca SVG no servidor (`src/components/graficos/rosca.tsx`; ADR-005, emenda), no lugar das barras horizontais, que saíram do código;
  - a participação vem de `src/lib/financeiro/distribuicao.ts`: só saldos positivos formam a base, em `bigint`, com 10000 centésimos de p.p. repartidos pelo maior resto antes de agrupar Outros e desempate por saldo, nome e UUID (KB-004, seção 15, CR-53 a CR-61); negativos ficam listados fora da rosca e zeros não aparecem;
  - legenda com nome completo, participação e valor, Outros retrátil com os componentes, e "Ver os números" com Resumo e Detalhe por ativo separados; "Ocultar valores" esconde toda quantia no servidor e mantém as participações (DESIGN.md 2.3 e 6.13).
- distribuição por classe macro (ciclo `013`, issue #139, BL-014 e parcela de BL-009):
  - o Início alterna "Por ativo" e "Por classe" por links `?distribuicao=ativo` e `?distribuicao=classe`, que preservam o período; o formulário de período preserva a visão; desde o ciclo `016`, a ordem do alternador é Por instituição, Por classe e Por ativo, e parâmetro ausente ou inválido abre Por instituição; só a visão escolhida é lida e renderizada (DESIGN.md 6.12, variante sem contador);
  - a alocação vem de `src/lib/financeiro/alocacao.ts`, função irmã da distribuição por ativo: cada ativo com posição em M segue a classe macro do nó atual (subindo no máximo dois pais), o trânsito tem linha própria e só o vínculo nulo é Sem classe; negativos saem por ativo antes de agrupar; participação pelo maior resto entre as linhas, com empate pela ordem fixa das oito linhas, sem Outros (KB-004, seção 15, CR-C01 a CR-C12);
  - a leitura (`lerInsumosDoInicioPorClasse`, em `src/lib/telas/leituras.ts`) junta à marca da carteira a versão da classificação (`ler_versao_classificacao`, texto decimal): uma reclassificação durante a leitura descarta tudo e repete, até 3 tentativas, e depois a tela mostra o erro de dados que mudaram; nó inexistente torna só a visão por classe indisponível (desde o ciclo `015`, a marca é a versão dos metadados, ver abaixo);
  - rosca e tabela "Por classe" com cores fixas por linha (`chart-7` e `chart-8` novos; DESIGN.md 2.3 e 6.13) e a mesma ocultação de valores.
- análises por instituição e níveis de classe (ciclo `015`, issues #151 a #154, parcela de BL-009):
  - coerência (issues #151 e #153): o banco mantém `profiles.versao_metadados`, incrementada por gatilhos em toda mudança de nome, instituição ou classe do ativo e em toda criação, remoção ou renomeação de instituição, inclusive A → B → A; `ler_versao_metadados()` a devolve como texto decimal. Os três leitores do Início (por ativo, por classe e por instituição, em `src/lib/telas/leituras.ts`) usam a marca da carteira mais essa versão, lidas em paralelo antes e depois dos insumos, com signal novo por fase e até 3 tentativas; falha de RPC ou marca inválida é erro, sem fallback. A leitura por classe não chama mais a marca antiga da classificação (a coluna, o gatilho e a RPC antigos ficam no banco para a aplicação anterior). O fechamento e as telas descritivas não ganharam composição nova: leem nomes como rótulos de UUIDs, revalidados pelo banco;
  - edição do nome (issue #153): o formulário de `/ativos/[id]/editar` tem o campo Nome e salva nome e detalhes numa única chamada (`editar_ativo_com_nome`), com a validação do banco (`btrim` de espaço comum, 1 a 100 caracteres Unicode, nomes repetidos válidos); o tipo de ajuste e o trânsito continuam protegidos; o nome atual aparece também nos registros antigos (DESIGN.md 6.8);
  - o Início ganha a visão "Por instituição" (`?distribuicao=instituicao`) no alternador: rosca com até seis fatias (cinco maiores linhas e Outros derivado depois do rateio), Sem instituição e Em trânsito como grupos próprios, negativos por ativo à parte e tabela completa; os cálculos vêm de `src/lib/financeiro/instituicao.ts` e `rateio.ts` (KB-004, seção 15, CR-015-01 a CR-015-16);
  - na visão por classe, as macros da raiz têm "Ver subclasses" e o detalhe (`?distribuicao=classe&classe=<UUID>`) lista filhos imediatos e resíduo de uma macro ou subclasse com "% na carteira" e "% na classe", em tabela no desktop e cartões no celular, sem linha do pai, total ou resumo numérico; tipo é terminal, ramo inválido volta à raiz com aviso, e o ramo não sobrevive à troca de visão. Os cálculos vêm de `src/lib/financeiro/niveis.ts`; a composição com os insumos, de `src/lib/telas/analises-inicio.ts` (DESIGN.md 6.12 e 6.13).

Permanecem fora da entrega:

- troca do papel ou revogação de uma conta pela tela (continuam em P3/P4 da KB-002).

O encerramento do `004` foi determinado pelo responsável com essas pendências e com conferência autenticada parcial em produção. As 22 verificações públicas passaram; os testes locais/CI não equivalem à conferência autenticada completa, e a medição local de 175 ms não mede a latência Vercel–Supabase. Evidências, diagnóstico e decisão ficam em `_project/executed/004_telas_produto/004_task_issue-42.md` e `004_task_closure.md`. O ciclo `005` tratou o logo e a lentidão; a conferência autenticada do `005` passou nos seis itens do roteiro (`_project/executed/005_logo_mobile_desempenho_navegacao/005_task_closure.md`). Os ganhos de desempenho foram medidos localmente, com atraso artificial por chamada, e não são medida de produção (`005_validation_desempenho.md`).

### Onde está cada coisa

| Assunto | Local |
| :-- | :-- |
| Decisões duradouras (stack, acesso, governança, gráficos) | `_project/decisions/` (ADR-001 a ADR-005) |
| Operação de produção e de acessos | `_project/knowledge/KB-002_operacao_producao_acessos.md` |
| Origem das regras e inventário funcional | `_project/knowledge/KB-001_proveniencia_ecossistema.md` |
| Regras financeiras e casos de referência | `_project/knowledge/KB-004_regras_financeiras.md` e `tests/fixtures/financeiro/casos_referencia.json` |
| Regras de cálculo em TypeScript | `src/lib/financeiro/` |
| Sincronização com o SGS | `src/lib/benchmarks/` |
| Composição de telas e leitura completa/coerente | `src/lib/telas/` e `src/lib/leitura.ts` |
| Processo (níveis, situações, barreiras, glossário) | `_project/README.md` e `.agent/ai_behavior.md` |
| Contrato visual | `design-system/DESIGN.md` |
| Páginas e rotas | `src/app/` |
| Componentes | `src/components/` |
| Configuração, ambiente e clientes do Supabase | `src/lib/` |
| Renovação de sessão | `src/proxy.ts` |
| Schema, políticas e funções | `supabase/migrations/` |
| Testes de banco (pgTAP) | `supabase/tests/database/` |
| Testes ponta a ponta (Playwright) | `tests/e2e/` |
| Validador da governança | `scripts/` |
| CI, governança e release | `.github/workflows/` |

### Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL com RLS e Auth) via `@supabase/ssr`, Zod, Vitest e Playwright, hospedados na Vercel. As versões exatas estão fixadas em `package.json`; a decisão e as alternativas estão na ADR-002.

### Ambientes

| Ambiente | Backend | Uso |
| :-- | :-- | :-- |
| Produção | Projeto Supabase exclusivo e Vercel (plano Hobby) | Login com Google; único ambiente com usuários reais (KB-002) |
| Preview de PR (Vercel) | Nenhum | Revisão visual e build; mostra o aviso "Preview sem backend" (`src/components/preview-notice.tsx`) |
| Local e CI | Supabase local (Docker), com dados fictícios de `supabase/seed.sql` | Desenvolvimento e testes; login por senha habilitado só aqui (`NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN`, `src/lib/env.ts`) |

Sem as variáveis do Supabase, a aplicação roda sem backend e não chama o Supabase (`src/lib/env.ts`, função `backendConfig`).

### Acesso, autenticação e perfis

A decisão está na ADR-003: só entra quem está numa lista de e-mails no banco, e um e-mail fora da lista não cria conta nem sessão.

1. **Entrar:** a página `/entrar` mostra o logo, leva à política de privacidade e aos termos e oferece "Entrar com Google" (OAuth pelo Supabase Auth) e, só no ambiente local, login por senha (`src/components/login-panel.tsx`). O app não pede escopos além da identidade básica.
2. **Primeira barreira:** o hook "before user created" (`private.before_user_created`, configurado em `supabase/config.toml` e no painel de produção) recusa a criação do usuário quando o e-mail não está em `public.authorized_emails`.
3. **Segunda barreira:** o gatilho `on_auth_user_created` (`private.handle_new_user`) cria o perfil com o papel inicial da lista. Para um e-mail fora dela, ele aborta a criação do usuário, caso o hook esteja desligado ou mal configurado.
4. **Retorno:** `/auth/callback` troca o código pela sessão. Na falha, redireciona com uma mensagem neutra, que não revela se o e-mail está na lista (`src/app/auth/callback/route.ts`).
5. **Sessão:** `src/proxy.ts` só renova os cookies de sessão. Cada página, Server Action e rota protegida confere a sessão por `src/lib/sessao.ts`; sem sessão, as páginas redirecionam para `/entrar`. As páginas admin respondem 404 para conta comum, e ações/rotas recusam sem executar.
6. **Sair:** `POST /sair` encerra a sessão (`src/app/sair/route.ts`).

**Papéis:** `admin` e `user` (`public.app_role`). Depois do primeiro login, `profiles.role` é a autoridade do papel. O primeiro administrador foi inserido só no banco de produção, nunca no repositório (ADR-003, KB-002). `/admin/acessos` lista, autoriza e remove e-mails com a sessão do admin e as políticas existentes. O papel da lista só vale no primeiro cadastro; remover um e-mail não revoga conta existente. Mudança de papel e revogação continuam pelos procedimentos P3/P4 da KB-002.

### Modelo de dados e isolamento (G2)

Acesso e perfis em `supabase/migrations/20261013005133_acesso_autorizacao_perfis.sql`; carteira e benchmarks nas seções seguintes.

| Objeto | Função | Acesso |
| :-- | :-- | :-- |
| `public.authorized_emails` | E-mails autorizados e o papel inicial (e-mail sempre minúsculo e sem espaços) | `admin` lê, insere e exclui; ninguém altera; o Auth lê para o hook |
| `public.profiles` | Perfil de cada usuário (`user_id`, e-mail, papel) | Cada usuário lê só o próprio; ninguém altera pela API |
| `private.is_admin()` | Diz se o usuário corrente é `admin` | Usada nas políticas; `security definer` com `search_path` vazio |
| Schema `private` | Funções internas, fora da Data API | Sem acesso público |

Regras que valem para toda mudança futura (barreira G2, `_project/README.md`):

- toda tabela de `public` tem RLS;
- grants e revokes são explícitos;
- toda função tem `search_path` fixo e `execute` revogado de `public`;
- o `admin` gerencia acessos, mas não tem bypass sobre dados de outros usuários.

Os testes pgTAP em `supabase/tests/database/` provam isso com usuários fictícios e um administrador, em 498 asserções:

- isolamento do acesso (36), hook e gatilho (20) e funções (15, com a lista explícita do que `authenticated` executa);
- carteira (112), concorrência com duas sessões (13), benchmarks (45), migração no trânsito (22), metadados dos ativos (67) e taxonomia dos ativos (168).

### Carteira (ciclo `003`, G1 e G2)

Definida em `supabase/migrations/20261014185205_carteira.sql`; as regras estão na KB-004.

| Objeto | Função |
| :-- | :-- |
| `public.ativos` | Ativos do usuário, com o tipo de ajuste (`rendimento` ou `marcacao`) e o ativo de sistema "Em trânsito", único por usuário |
| `public.eventos` | Fatos imutáveis em centavos com sinal: aporte, resgate, rendimento, marcação, câmbio, migração, pernas de transferência e estornos |
| `public.transferencias` | Agrupa as duas pernas de cada transferência e de sua correção |
| `public.consolidados_mensais` | Uma linha por mês fechado: Vi, Vf e os componentes da identidade contábil |
| `public.posicoes_mensais` | Saldo inicial, saldo final e ajuste de cada ativo no mês fechado |

- O usuário só lê as próprias linhas. Toda escrita passa por funções `security definer` que tomam primeiro a mesma trava por usuário: `criar_ativo`, `desativar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `corrigir_transferencia`, `fechar_mes` e `reabrir_mes`; desde o ciclo `012`, também as funções dos metadados dos ativos (seção seguinte).
- Quantias são `bigint` com faixa ±(2⁵³ − 1); as somas no banco são feitas em `numeric`.
- Nenhum percentual é gravado: rentabilidade, acumulado e comparações são calculados na leitura, em `src/lib/financeiro/`.

### Metadados dos ativos (ciclo `012`, G2)

Definidos em `supabase/migrations/20261024000829_metadados_ativos.sql` (issue #126, BL-009). São só descritivos: nenhum cálculo os lê.

| Objeto | Função |
| :-- | :-- |
| `public.instituicoes` | Instituições do usuário, com nome único por identidade `lower(btrim(nome))` (caixa e espaços nas pontas ignorados, acentos preservados) |
| `public.classes_ativo` | Classes de alocação do usuário, com a mesma regra de nome; na migração do ciclo `012`, todo perfil novo passou a receber Renda fixa, Renda variável, Fundos, Cripto e Outros por gatilho em `public.profiles`, e os perfis existentes as receberam; o gatilho saiu no ciclo `013` e, desde a fase 2, a tabela é legado só de leitura (dica "antes: X"), sem nenhuma função que a escreva |
| `public.ativos` (colunas novas) | `instituicao_id` e `classe_id`, por chave composta `(user_id, id)`, e `previdencia`, `liquidez_imediata`, `exposicao_cambial` e `isento_ir` em três estados (nulo é não informado); o trânsito não recebe nenhum |

- Leitura só das próprias linhas; escrita só por `criar_instituicao`, `renomear_instituicao`, `excluir_instituicao`, `cadastrar_ativo_taxonomia` e `editar_detalhes_ativo_taxonomia`. As funções de classe do ciclo `012` (`criar_classe`, `renomear_classe`, `excluir_classe`) e as assinaturas antigas de `cadastrar_ativo` e `editar_detalhes_ativo` saíram na fase 2 do ciclo `013`.
- Exclusão de instituição só sem ativo vinculado (`recusado_em_uso`); renomear é livre, salvo nome repetido.
- `cadastrar_ativo_taxonomia` e `editar_detalhes_ativo_taxonomia` aceitam, para a instituição, o id de uma entrada ou um nome novo, que reaproveita a entrada de mesma identidade ou a cria na mesma transação; a classe é o id de um nó da taxonomia ou nada. A edição substitui todos os campos descritivos, aceita ativo desativado e recusa o trânsito. `criar_ativo` continua disponível, sem os campos.

### Taxonomia de classes de ativos (ciclo `013`, G2)

Definida em duas migrações. A fase 1, `supabase/migrations/20261026204955_taxonomia_ativos.sql` (issue #137, BL-014 e parcela de BL-009), criou o catálogo e as funções novas e deixou as do ciclo `012` coexistindo (janela de transição, D19); está em produção desde a ação externa E1. A fase 2, `supabase/migrations/20261026215542_taxonomia_ativos_fase2.sql` (issue #138), retira as funções antigas depois do deploy da aplicação nova (ação externa E2). A taxonomia global substitui as classes por usuário: o cadastro e a edição do ativo já a usam (seletor único, sem criação), e a alocação por classe macro está no Início desde a issue #139 (ver "Início").

| Objeto | Função |
| :-- | :-- |
| `public.taxonomia_ativos` | Árvore global de até três níveis (`id`, `parent_id`, `nivel`, `nome`, `ordem`, sem `user_id`), com 133 nós carregados por migração: 6 classes macro, 23 subclasses e 104 tipos (39 do ciclo `013` e 94 acrescentados no ciclo `014`). UUIDs fixos, derivados do código da árvore (`a5000000-0000-4000-8000-000000NNMMKK`). O nível do pai é sempre o do filho menos um (coluna derivada `parent_nivel` na chave composta), o que impede ciclo. Nome e ordem únicos entre irmãos, inclusive nas raízes; o nome ignora caixa, acento e espaços nas pontas (`private.normalizar_nome`, sem extensão) |
| `public.ativos.taxonomia_id` | Vínculo opcional com qualquer nó, de qualquer nível; nulo é "Sem classe". Chave sem exclusão em cascata: nó referenciado ou com filhos não é excluído. O trânsito não o recebe. `classe_id` (legado) continua, para a dica "antes: X" |
| `public.profiles.versao_classificacao` | Marca de coerência: contador por carteira, `bigint`, que só cresce. O gatilho `ativos_versao_classificacao` o incrementa na mesma transação sempre que `taxonomia_id` muda (inclusive A → B → A, a edição antiga que zera o nó e o preenchimento); inserção sem nó não conta, porque a contagem de ativos já a detecta. O estouro aborta a transação |
| `public.ler_versao_classificacao()` | Lê a marca do próprio usuário, como texto decimal (não perde precisão acima de 2⁵³), sob a RLS de `profiles`; sem parâmetro de dono, sem bypass do administrador |

- Leitura do catálogo por qualquer usuário autenticado; nenhuma escrita pela Data API, nem pelo administrador. A manutenção é por migração revisada; mudar o catálogo em uso exige migração nova, com a própria janela de coerência.
- Funções novas, com nomes distintos para não haver sobrecarga ambígua no PostgREST: `cadastrar_ativo_taxonomia` e `editar_detalhes_ativo_taxonomia` (recebem `p_taxonomia` no lugar de `p_classe` e `p_classe_nova`; validam o nó, com `recusado_taxonomia_inexistente`; o cadastro deixa `classe_id` nulo e a edição o preserva). Na janela da fase 1, as do ciclo `012` coexistiam: o cadastro antigo deixava o nó nulo e a edição antiga gravava o legado e zerava `taxonomia_id`, tornando o ativo "Sem classe". A fase 2 as retirou, junto com `private.resolver_classe`, sem `cascade`.
- Equivalência mínima do legado, aplicada uma única vez na migração e só nos ativos comuns, inclusive desativados: os seis nomes da classe macro, mais os aliases "Cripto" e "Outros", sem caixa, acento nem espaços nas pontas (`private.taxonomia_equivalente`). "Fundos", nomes personalizados e ausência de legado ficam nulos. Nenhum saldo, evento, posição ou indicador muda.
- O gatilho que criava as cinco classes iniciais de cada perfil novo e seus auxiliares saíram: perfil novo nasce sem classes.
- Legado depois da fase 2: `classes_ativo` e `ativos.classe_id` ficam só de leitura (o usuário só tem `SELECT`, nem o administrador escreve) e servem à dica "antes: X"; saem num ciclo futuro, por migração nova. Como o `supabase test db` roda sobre o schema final, a coexistência das duas gerações de funções é provada nos ensaios locais de upgrade (fixtures em `tests/fixtures/taxonomia/`), não no pgTAP.
- Ampliação (ciclo `014`, issue #144): `supabase/migrations/20261027002132_taxonomia_ativos_ampliacao.sql` só insere nós. Os 39 do ciclo `013` não mudam (nome, nível, pai, ordem e UUID), e os novos entram depois deles em cada pai, por isso "Outros alternativos" fica antes de "Imóveis físicos" e de "Participações em empresas fechadas". Nenhuma tabela, política, grant ou função mudou. Os nós seguem a exposição econômica: fundo e ETF vão à família da exposição, e a carteira diversificada vira um tipo "Carteiras de …", sem nó por veículo. Indexador, tributação, veículo, moeda, ticker, instituição e número de lei não são nós; a única exceção são Tesouro Selic e Tesouro IPCA+, cujo produto o indexador define. A árvore completa, com a finalidade de cada nó, está no plano do ciclo (`_project/executed/014_ampliacao_arvore_taxonomia/014_plan.md`).
- Orientações de enquadramento (ciclo `014`): o usuário escolhe; o sistema não classifica sozinho. A ordem de decisão é: (1) fronteiras fixas — saldo parado em conta, em qualquer moeda, é Caixa › Saldos em conta; ouro, inclusive tokenizado, é Alternativos › Ouro; criptoativo é Criptoativos, mesmo por veículo no exterior; moeda de cotação e domicílio do veículo, sozinhos, não decidem; (2) exposição a um único produto com tipo próprio: esse tipo, direto, por fundo ou por ETF; (3) vários instrumentos da mesma família: o tipo "Carteiras de …" dela; (4) a estratégia declarada (empresas menores, dividendos, setorial) prevalece sobre a carteira ampla e sobre a região; com dois focos sem principal, o pai; (5) sem predominância dentro de uma classe macro: o pai dela; (6) se a exposição se divide entre classes macro sem predominância, ou falta o dado que separa dois tipos, não forçar: usar o nível mais baixo sustentado e, se nem a classe macro se sustenta, deixar sem classe. Exemplos: fundo em dólar só de títulos do governo americano de até um ano → Dívida soberana no exterior › Títulos de curto prazo; o mesmo de papéis privados sem dado de qualidade de crédito → Crédito privado no exterior; fundo de duplicatas → Crédito estruturado › Outros recebíveis; fundo imobiliário dividido igualmente entre imóveis e recebíveis → sem classe; token de recebível → o tipo do recebível em Crédito estruturado; token de staking líquido → o criptoativo de base. Os casos completos estão no plano do ciclo.
- Interface (issue #138): a classe do ativo é um seletor único e opcional, com o caminho completo (" › ") em ordem hierárquica, busca por trecho do caminho sem acento nem caixa (o nome de um ancestral lista os descendentes) e sem criação; as listas mostram só o nome do nó (`src/lib/telas/taxonomia.ts`; DESIGN.md 6.7 e 6.8).

### Atributos complementares dos ativos (ciclo `017`, G2)

Definidos em `supabase/migrations/20261031000721_atributos_complementares_ativos.sql` (issue #172, BL-015). São anotações manuais e descritivas do usuário, independentes da classe: o sistema não calcula imposto, prazo, data de disponibilidade, elegibilidade ou valor garantido com elas, nem as preenche pela classe, pelo nome ou pela instituição. O cadastro e a edição os preenchem desde a issue #173; a consulta com resumo e filtros em `/ativos` vem na issue #174. Catálogos, significados e exemplos estão no plano do ciclo (P1 a P4, decisões D7 a D12).

| Coluna de `public.ativos` | Conteúdo |
| :-- | :-- |
| `veiculos_acesso` (`text[]`, vazio = não informado) | `direto`, `fundo`, `etf`, `plano_contrato`, `certificado_representativo` (rótulo "BDR ou certificado de depósito"), `outro`, `nao_aplicavel` (exclusivo) |
| `indexadores_remuneracao` (`text[]`, vazio = não informado) | `cdi`, `selic`, `ipca`, `igpm`, `tr`, `variacao_cambial`, `inpc`, `sem_indexador` (rótulo "Prefixado (sem indexador)", exclusivo), `outro`, `nao_aplicavel` (exclusivo). Variação cambial e INPC não são benchmarks e não preenchem `exposicao_cambial` |
| `regime_tributario` (nulo = não informado) | `renda_fixa_por_prazo`, `fundos_longo_prazo`, `fundos_curto_prazo`, `previdencia_progressivo`, `previdencia_regressivo`, `renda_variavel`, `outro`, `nao_aplicavel` |
| `prazo_resgate_tipo`, `prazo_resgate_dias`, `prazo_resgate_unidade` | Prazo total informado para resgate ou venda. `prazo` exige dias inteiros ≥ 0 (até o limite de `integer`) e `uteis` ou `corridos`; `no_vencimento`, `sem_prazo_estimavel` e `nao_aplicavel` não têm dias nem unidade; tudo nulo é não informado. Zero é valor, não ausência; sem conversão entre unidades |
| `cobertura_fgc` (nulo = não informado) | `sim`, `nao`, `nao_aplicavel`; anotação, não verificação de garantia |

- Constraints garantem a forma no banco: conjuntos unidimensionais, sem nulos internos, sem repetição, só com códigos do catálogo, na ordem do catálogo e com os exclusivos sozinhos; escalares no catálogo; tupla de prazo completa ou vazia; o trânsito continua sem nenhum detalhe. Os catálogos ficam em auxiliares imutáveis de `private` (`canonizar_veiculos_acesso`, `canonizar_indexadores_remuneracao`, `regime_tributario_valido`, `cobertura_fgc_valida`, `prazo_resgate_valido`), usados pelas constraints e pela escrita, sem `EXECUTE` pela Data API.
- Escrita só por duas funções novas, com nomes distintos (sem sobrecarga no PostgREST): `cadastrar_ativo_com_atributos` (devolve o UUID) e `editar_ativo_com_atributos`. Recebem os parâmetros de `cadastrar_ativo_taxonomia` e `editar_ativo_com_nome` mais os sete campos, todos explícitos: limpar é enviar conjunto vazio ou nulo, e conjunto nulo é recusado. Mesmo protocolo das anteriores (security definer, trava da carteira primeiro, `auth.uid()`, sem parâmetro de dono nem desvio do administrador); reutilizam a função anterior na mesma transação, então qualquer recusa desfaz nome, instituição nova, classe, indicadores e atributos. A RPC normaliza repetições e ordem dos conjuntos; recusas: `recusado_veiculos_acesso`, `recusado_indexadores_remuneracao`, `recusado_regime_tributario`, `recusado_prazo_resgate` e `recusado_cobertura_fgc`, além das das funções reutilizadas. Dias fracionários ou acima de `integer` falham na conversão do parâmetro, sem arredondamento.
- Compatibilidade: `cadastrar_ativo_taxonomia`, `editar_ativo_com_nome` e `editar_detalhes_ativo_taxonomia` continuam com as mesmas assinaturas e permissões, gravam só os campos que conhecem e preservam os atributos; o cadastro por elas deixa os atributos vazios. Os ativos existentes não recebem preenchimento por equivalência; os quatro indicadores continuam com seus três estados (D12).
- Marcas: a gravação dos atributos só cita colunas novas, então não incrementa `versao_metadados` nem `versao_classificacao`; a edição que muda nome, instituição ou classe continua contando como antes. Os leitores do Início não leem os atributos.
- Formulários (issue #173, DESIGN.md 6.8): em "Mais detalhes", cinco grupos, cada atributo junto do indicador próximo (veículo com Previdência, indexador com Exposição cambial, regime com Isento de IR, prazo com Liquidez imediata, FGC sozinho), com o aviso de D9. Veículos e indexadores em checkboxes (marcar um exclusivo desmarca os demais, só como orientação); regime, situação do prazo e FGC em `select` nativo, com "Não informado" vazio; Dias e Unidade só com "Prazo em dias", sem unidade implícita, e a ajuda da P2 (total manual em dias corridos, arredondado para cima pela pessoa quando as etapas usam unidades diferentes). O servidor (`lerAtributos`, em `src/lib/telas/detalhes-ativo.ts`) confere os catálogos, recusa exclusivos combinados e dias que não sejam inteiros de 0 ao limite de `integer`, sem arredondar, e chama `cadastrar_ativo_com_atributos` ou `editar_ativo_com_atributos` com todos os campos. `lerAtivos` lê as sete colunas, obrigatórias. Uma recusa mantém o preenchimento: os campos são controlados e um novo render depois do reset que o React faz após a ação os devolve ao estado (`useManterAposReset`).
- Ensaio de upgrade com fixtures fictícias em `tests/fixtures/atributos/` (retrato integral antes e depois, só as colunas novas desconsideradas e conferidas vazias); consultas estruturais da ação externa em `e1_pre.sql` e `e1_post.sql` (KB-002, "Atributos complementares dos ativos").

### Benchmarks (ciclo `003`)

Definidos em `supabase/migrations/20261014193630_benchmarks.sql`.

- `public.benchmarks`: catálogo global, semeado com CDI (SGS 12, diária) e IPCA (SGS 433, mensal); o IGP-M (SGS 189, mensal) entrou no ciclo `011` por `supabase/migrations/20261023160124_benchmark_igpm.sql`, com id fixo para ficar por último na ordem do catálogo.
- `public.valores_benchmark`: valores como publicados.
- `public.coberturas_benchmark`: a cobertura de cada carga.
- Qualquer usuário autenticado lê. Só a função `carregar_benchmark`, executada pelo admin, grava.
- A sincronização (`src/lib/benchmarks/sgs.ts`) busca o SGS em janelas de até 10 anos e grava numa única chamada. O admin usa `/admin/benchmarks`, que chama `POST /api/benchmarks/sincronizar`, exige confirmação e origem válida, limita a busca a 45 s e relê a cobertura. Não há cron de sincronização. A primeira carga em produção foi declarada concluída pelo responsável na task #41.

### Operação

- **Keepalive:** um cron diário da Vercel às 08:17 UTC (`vercel.json`) chama `/api/keepalive`, protegida pelo segredo `CRON_SECRET` (`src/lib/keepalive.ts`). A rota executa `public.keepalive()` (`supabase/migrations/20261013011331_keepalive.sql`), que não lê tabela alguma, para o projeto gratuito do Supabase não pausar.
- **Migrações:** chegam à produção por `supabase db push` feito pelo responsável depois do merge. Nenhum segredo de escrita no banco fica no GitHub. Os passos, as armadilhas e a verificação estão na KB-002.

### Interface e PWA

- A aplicação usa os tokens e a fonte IBM Plex Sans do `design-system/DESIGN.md` (`src/app/globals.css`).
- O grupo `src/app/(app)/` oferece Início, Lançamentos, Ativos, Benchmarks, Transferências, Cadastros (instituições; as classes saíram no ciclo `013`), Novidades, Conta e Administração (só para admin), com barra inferior no celular e menu lateral no desktop. O logo está no menu lateral, no login e, no celular, à esquerda do cabeçalho.
- As leituras usadas em cálculo são completas e paginadas; composições de carteira e benchmark conferem marcas antes/depois, repetindo no máximo três vezes. Dentro do servidor Next, cada fase passa um `AbortSignal` próprio às consultas, porque o Next devolve a mesma resposta para GET idênticos no mesmo pedido; os componentes de cada marca são lidos em paralelo, sem sobrepor as fases (`src/lib/leitura.ts`). Dado indisponível aparece como `N/D`, sem virar zero. As regras de apresentação do Início estão na seção 15 da KB-004, com CR-51/CR-52.
- É instalável como PWA pelo menu do navegador, sem service worker e sem modo offline (`src/app/manifest.ts`; ADR-002).

### Qualidade, CI e release

- **CI** (`.github/workflows/ci.yml`), em dois jobs:
  - lint, tipos, testes unitários, build sem backend e ponta a ponta sem backend;
  - Supabase local, testes de banco e ponta a ponta de autenticação e das telas com cenários fictícios, incluindo acessibilidade e coerência das leituras.
- **Governança** (`.github/workflows/governance.yml`): validador da governança, seus testes e a barreira G4.
- **Release:** o release-please gera versão e notas a partir de commits no padrão Conventional Commits (`release-please-config.json`; versão inicial `0.1.0`).
- **Integração:** PRs são integradas por squash, depois da aprovação do merge (`_project/README.md`).

## Fontes

Todas as fontes são internas e estão neste repositório, em `main`:

- ADR-002, ADR-003 e ADR-005;
- KB-002 e KB-004;
- `README.md` e `design-system/DESIGN.md`;
- os arquivos de código, configuração e teste citados em cada seção.

O plano executado do ciclo `001` (`_project/executed/001_fundacao_aplicacao/001_plan.md`) traz o histórico das decisões, mas não é leitura necessária para usar esta KB.

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-13 | `002` | Criação, a partir do estado entregue no ciclo `001` |
| 2026-10-14 | `003` | Regras financeiras: carteira, benchmarks, KB-004, módulos em `src/lib/` e versão `0.2.0` |
| 2026-10-15 | `004` | Telas do produto e versão `0.3.0`; acesso por ponto de entrada, leitura completa/coerente, gráficos e pendências conhecidas de mobile/desempenho e verificação autenticada parcial |
| 2026-10-17 | `005` | Logo no cabeçalho mobile; leitura coerente fresca no Next (#57) e marcas em paralelo (#54); conferência autenticada em produção aprovada |
| 2026-10-18 | `006` | Migração única dos dados e virada em 2026-10-18; migração no trânsito (exceção à K12) e posição implícita zero; pendência de migração retirada |
| 2026-10-20 | `008` | Eixo patrimonial coerente com as marcas e cartões do Início contidos em uma/duas colunas; apresentação sem mudança de regra financeira |
| 2026-10-20 | `009` | Margem comum dos gráficos do Início, estados dos botões, campos de intervalo condicionais e seletor de ativo com busca; apresentação e interação sem mudança de regra financeira |
| 2026-10-21 | `010` | Issue #104: páginas públicas `/privacidade` e `/termos`, links em `/entrar` e em Conta e `/termos` como página inicial informada ao Google; estado final no encerramento do ciclo |
| 2026-10-21 | `010` | Issue #105: `/novidades` com versão do `package.json` e histórico manual a partir da `0.7.0`, em Mais e no menu lateral |
| 2026-10-21 | `010` | Issue #106: cadastro em `/ativos/novo` e `/ativos` com abas por URL, contadores e lista densa no celular |
| 2026-10-21 | `010` | Issue #107: distribuição por ativo em rosca, com participação pelo maior resto sobre os saldos positivos (KB-004, seção 15) |
| 2026-10-22 | `010` | Encerramento: release `0.7.0` publicada, Audience do Google em produção, data da release registrada em `/novidades` e estado final das páginas públicas, das novidades, de Ativos e da rosca consolidado |
| 2026-10-23 | `011` | Issue #118 (BL-007): IGP-M (SGS 189, mensal) no catálogo de benchmarks, por último na ordem do catálogo, com a regra mensal existente da KB-004 |
| 2026-10-23 | `011` | Encerramento: release `0.8.0` publicada e data registrada em `/novidades`; IGP-M em produção com a cobertura iniciando junto com a do IPCA |
| 2026-10-23 | `012` | Issue #126 (BL-009): instituições e classes por usuário e campos descritivos dos ativos no banco, com funções e testes de isolamento; telas nas issues seguintes |
| 2026-10-23 | `012` | Issue #127: `/cadastros` em Mais e no menu lateral, com as abas Instituições e Classes (emenda E-1 do plano) |
| 2026-10-23 | `012` | Issue #128: classe, instituição e indicadores no cadastro e na edição do ativo e nas duas abas de Ativos |
| 2026-10-24 | `012` | Encerramento: release `0.9.0` publicada e data registrada em `/novidades`; migração dos metadados em produção e conferência autenticada de Cadastros, do cadastro e da edição do ativo |
| 2026-10-26 | `013` | Issue #137 (BL-014 e parcela de BL-009): taxonomia global de classes, vínculo opcional do ativo, marca de coerência da classificação e funções compatíveis com a janela de transição, no banco; telas nas issues seguintes |
| 2026-10-26 | `013` | Issue #137 integrada (PR #140) e ação externa E1 concluída: taxonomia global em produção, com 39 nós e o preenchimento do legado |
| 2026-10-26 | `013` | Issue #138 (BL-014 e parcela de BL-009): seletor único de classe da taxonomia no cadastro e na edição, aba Classes retirada de Cadastros e migração da fase 2, que fecha o legado para escrita; E2 depois do deploy |
| 2026-10-26 | `014` | Issue #144: árvore da taxonomia ampliada de 39 para 133 nós por migração só de inserção, com orientações de enquadramento; os 39 nós anteriores não mudam; `db push` pela ação externa E1 |
| 2026-10-26 | `014` | Encerramento: ação externa E1 concluída, com o catálogo de produção em 133 nós (6, 23 e 104); a release `0.10.0`, que inclui a ampliação, e a data da nota em `/novidades` ficam com o encerramento do ciclo `013` |
| 2026-10-26 | `013` | Issue #139 (BL-014 e parcela de BL-009): distribuição por classe macro no Início, com alternador Por ativo / Por classe, leitura coerente com a versão da classificação e cores `chart-7` e `chart-8` |
| 2026-10-27 | `013` | Encerramento: release `0.10.0` publicada (PR #141) com a data registrada em `/novidades`; taxonomia, seletor de classe e distribuição por classe macro conferidos em produção pelo responsável, em desktop e celular |
| 2026-10-27 | `015` | Issues #151 a #154 (parcela de BL-009): versão dos metadados e edição transacional do nome, regras e casos CR-015 (KB-004), leitores do Início protegidos pela marca nova, edição do nome no formulário e as análises por instituição e por nível de classe no Início |
| 2026-10-28 | `015` | Encerramento: release `0.11.0` publicada (PR #157) com a data registrada em `/novidades`; versão dos metadados, edição do nome e as análises por instituição e por nível de classe conferidas em produção pelo responsável (relato, sem detalhe por item) |
| 2026-10-30 | `016` | Issue #163 (BL-016 e BL-017): alternador do Início na ordem Por instituição, Por classe e Por ativo, com Por instituição como padrão, e as participações do detalhe de classe renomeadas para "% na carteira" e "% na classe"; nota em `/novidades` para a próxima versão, com data a registrar depois da release |
| 2026-10-30 | `017` | Issue #172 (BL-015): sete colunas de atributos complementares em `public.ativos`, com constraints de catálogo, forma canônica e prazo, e as funções `cadastrar_ativo_com_atributos` e `editar_ativo_com_atributos`, compatíveis com as anteriores e sem ampliar as marcas; telas nas issues seguintes |
| 2026-10-30 | `017` | Issue #173 (BL-015): atributos complementares no cadastro e na edição do ativo, em "Mais detalhes" agrupados com os quatro indicadores, pelas funções novas; recusa mantém o preenchimento |
