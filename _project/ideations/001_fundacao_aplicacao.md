# Ideação — 001: fundação da aplicação

> **Ciclo:** `001`
> **Estado:** `Ideação`
> **Criado em:** 2026-10-12
> **Última atualização:** 2026-10-12

## Problema

O repositório tem governança e design system (ciclo `000`), mas nenhuma aplicação. Os ciclos `002` a `004` (regras financeiras, telas e migração) precisam de uma base já em produção que:

- autentique somente e-mails autorizados e diferencie `admin` de `user`;
- garanta no próprio banco que um usuário nunca leia nem altere dados de outro;
- tenha testes, CI e deploy confiáveis antes da primeira regra financeira;
- implemente o contrato visual do `DESIGN.md` como tokens, sem telas de produto.

Sem essa base, cada ciclo seguinte misturaria infraestrutura e regra de negócio, e a barreira G2 continuaria só heurística.

## Contexto e evidências

Fatos verificados em `main` @ `aa5fa81`:

- `_project/cycles.md` declara o próximo ciclo `001`, sem reserva; não há branch, issue ou PR do ciclo.
- `README.md` descreve o `001` como "Fundação: aplicação Next.js, Supabase, autenticação, perfis, RLS, deploy e release-please".
- ADR-002 fixa a stack (Next.js App Router, React, TypeScript, Tailwind CSS 4, `@supabase/ssr`, Zod, Vitest, Playwright, Vercel e Supabase), o projeto Supabase novo no plano gratuito com consulta agendada contra pausa, o domínio `investimentos.euthiagoandrade.com.br`, o desenvolvimento contra Supabase local e previews sem dados reais. As versões exatas são fixadas neste ciclo.
- ADR-003 fixa Google OAuth com lista de e-mails autorizados no banco ("um e-mail fora da lista não cria conta nem sessão"), os perfis `admin` e `user`, RLS por `user_id`, o administrador sem acesso a carteiras alheias e o primeiro administrador configurado só no banco.
- `_project/README.md`: G2 prevê teste de banco de isolamento a partir do `001`; G4 já está no CI; G3 aceita `*.sql` somente em `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` e `tests/fixtures/`; commits compatíveis com release-please a partir do `001`.
- `design-system/DESIGN.md`, seção 5, traz o bloco `@theme` canônico para o Tailwind 4; `design-system/assets/logo-simbolo.svg` é a base dos ícones do PWA e do favicon no `001`; os `woff2` da IBM Plex Sans estão versionados em `design-system/assets/fonts/`.
- KB-001 registra que o DNS do domínio é gerenciado no Cloudflare e aponta o `mae-no-controle` @ `2f4a304` como referência da stack.

Evidências ausentes, a confirmar no rascunho do plano:

- versões estáveis atuais de Next.js, React, Tailwind, `@supabase/ssr`, Supabase CLI, Vitest e Playwright;
- disponibilidade, no plano gratuito do Supabase, do hook de autenticação executado antes da criação do usuário e o comportamento exato dele com Google OAuth;
- prazo atual de pausa por inatividade do plano gratuito e limites de cron do plano Hobby da Vercel;
- requisitos atuais de instalabilidade de PWA sem service worker com modo offline.

## Resultado desejado

Ao fim do ciclo, em `investimentos.euthiagoandrade.com.br`:

- um e-mail autorizado entra com Google, vê uma área autenticada mínima e sai;
- um e-mail fora da lista não obtém conta nem sessão;
- o perfil `admin` gerencia a lista de acessos; o perfil `user` não;
- toda tabela de `public` tem RLS e teste de banco que prova o isolamento entre dois usuários fictícios e a ausência de bypass do `admin`;
- o CI roda lint, tipos, testes unitários, testes de banco e um teste ponta a ponta mínimo, além dos gates de governança;
- a aplicação usa os tokens e a fonte do `DESIGN.md` e é instalável como PWA;
- o release-please publica versão e notas a partir dos commits;
- previews nunca usam dados reais e o projeto Supabase de produção não pausa por inatividade.

## Hipóteses

- **H1 — Lista de acessos no hook de autenticação.** Um hook "before user created" do Supabase Auth, consultando a tabela de e-mails autorizados, recusa a criação do usuário e, portanto, a sessão. Precisa ser verificado no plano gratuito; o fallback está nas alternativas.
- **H2 — Modelo mínimo de acesso.** Duas tabelas bastam: e-mails autorizados (com perfil pretendido) e perfis (`user_id`, `role`). O perfil é criado a partir da lista no primeiro login.
- **H3 — Testes de RLS com pgTAP.** `supabase test db` com arquivos em `supabase/tests/` prova o isolamento no próprio banco e roda no CI com o Supabase CLI e Docker do runner Linux.
- **H4 — Função de papel sem vazamento.** Uma função `security definer` estável (por exemplo, `is_admin()`) evita recursão de RLS na tabela de perfis; ela não pode conceder leitura de dados de carteira.
- **H5 — Ciclo divisível em três issues revisáveis:** (A) scaffold, tokens, qualidade e release-please; (B) Supabase local, acesso, perfis, RLS e testes de banco; (C) produção (Supabase, Vercel, domínio, OAuth), PWA e consulta agendada.
- **H6 — Nenhuma tabela de carteira neste ciclo.** O schema de ativos, eventos e consolidado nasce no `002`, junto das regras que o justificam e dos casos de referência de G1.

## Alternativas

### Bloqueio de e-mails não autorizados

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Hook "before user created" (H1) | Cumpre a ADR-003 literalmente: sem conta e sem sessão | Depende de recurso do Supabase a verificar |
| Gatilho em `auth.users` que lança exceção | Só SQL, sem configuração de hook | Escrever em schema gerenciado pelo Supabase; comportamento do erro no fluxo OAuth a verificar |
| Verificação no middleware e no callback | Simples | Conta e sessão chegam a existir; viola a ADR-003 |

### Banco dos previews da Vercel

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Segundo projeto Supabase só com dados fictícios | Preview funcional completo | Ocupa a segunda vaga gratuita e também pode pausar |
| Previews sem backend (só build e páginas públicas) | Zero risco de dado real | Preview não exercita login |
| Desabilitar previews | Mais simples | Perde a revisão visual por PR |

### Aplicação de migrações em produção

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| `supabase db push` manual pelo responsável após o merge | Controle humano explícito | Passo esquecível; drift entre `main` e produção |
| Job de CI em `main` com segredo de acesso ao banco | Automático e auditável | Segredo poderoso no GitHub; erro de migração vai direto à produção |
| Integração GitHub do Supabase | Pouca configuração | Disponibilidade e controle no plano gratuito a verificar |

### Consulta agendada contra pausa

| Alternativa | Vantagem | Custo ou risco |
| :-- | :-- | :-- |
| Cron da Vercel chamando rota que consulta o banco | Junto da aplicação | Limites do plano Hobby a verificar |
| Workflow agendado do GitHub Actions | Independente da Vercel | Agendamentos do GitHub podem atrasar ou ser desativados em repositório sem atividade |

### Fatiamento

- **Um ciclo com três issues (H5).** Mantém o mapa de ciclos de `README.md`.
- **Dividir em dois ciclos** (aplicação local e testes; depois produção). Reduz o tamanho, mas altera o mapa de ciclos e adia a validação do deploy real.

## Riscos e restrições

- **Isolamento (G2):** política RLS permissiva, função `security definer` sem `search_path` fixo ou papel `admin` com bypass expõem carteiras. Mitigação: testes pgTAP com dois usuários e um administrador, e revisão manual das políticas.
- **Segredos:** chaves do Supabase (especialmente `service_role`), credenciais do Google OAuth e tokens da Vercel nunca entram no repositório; só `.env.example` com nomes. Configurar credenciais em painéis externos é ação do responsável, não do agente.
- **Privacidade (G3):** o e-mail do primeiro administrador não entra em seed, migração, teste ou documento; `supabase/seed.sql` usa somente e-mails fictícios.
- **Migrações (G4):** a primeira migração define o padrão; erro de modelagem só se corrige com nova migração.
- **Dependência de ações humanas externas:** Google Cloud, Supabase, Vercel e Cloudflare exigem login e aceite de termos pelo responsável; o plano precisa de gates humanos explícitos para cada uma.
- **Plano gratuito:** pausa por inatividade, limites de conexões e de cron; previews podem esgotar a segunda vaga de projeto.
- **Escopo:** a tentação de antecipar telas (`003`) ou tabelas de carteira (`002`) dentro da fundação.
- **Versões:** fixar versões recentes sem verificação pode gerar incompatibilidade entre Next.js, `@supabase/ssr` e Tailwind 4.
- **release-please:** precisa de permissão do GitHub Actions para abrir PRs, que é configuração do repositório feita pelo responsável.

## Perguntas em aberto

### Decisões do responsável

As oito perguntas da primeira versão desta ideação foram respondidas em 2026-10-12: o responsável acatou integralmente as sugestões apresentadas pelo agente. Elas orientam o rascunho do plano, não autorizam implementação e dependem das verificações técnicas indicadas.

1. **Bloqueio de acesso:** hook "before user created" do Supabase Auth (H1). Se ele não estiver disponível no plano gratuito, o fallback é um gatilho em `auth.users` que recusa o cadastro. A verificação só no middleware fica rejeitada por violar a ADR-003. O hook vale para todos os provedores, o que permite provar o bloqueio no teste da decisão 8.
2. **Previews:** sem backend. Servem para revisão visual e build; sem as variáveis do Supabase, a página exibe aviso de "preview sem backend". Login, perfis e RLS são provados no CI contra o Supabase local. Motivo adicional, a verificar: o plano gratuito limita projetos ativos por organização, e o `mae-no-controle` pode ocupar uma das vagas.
3. **Migrações em produção:** aplicadas manualmente pelo responsável com `supabase db push` logo após o merge, como gate explícito da task, com a saída de `supabase migration list` como evidência. Nenhum segredo com escrita no banco de produção fica no GitHub. O `health_check` pode comparar as migrações do repositório com as de produção. A automação será reavaliada quando as migrações se tornarem frequentes.
4. **Gestão da lista de acessos:** somente SQL executado pelo responsável neste ciclo; a tela de administração fica para o ciclo `003`. As políticas RLS que permitem ao `admin` gerenciar a lista entram no `001`, com teste.
5. **Área autenticada:** página mínima com logo, tokens e fonte do `DESIGN.md`, aviso "em construção", perfil do próprio usuário e ação de sair. Sem barra inferior, que depende do ciclo `003`.
6. **Consulta agendada:** cron diário da Vercel chamando rota protegida por segredo que faz consulta leve ao banco. GitHub Actions fica rejeitado porque, com o repositório público, workflows agendados são desativados após 60 dias sem atividade.
7. **Fatiamento:** um ciclo com três issues sequenciais, conforme H5: (A) scaffold, tokens, qualidade e release-please; (B) Supabase local, acesso, perfis, RLS e testes de banco; (C) produção, PWA e cron. O plano pode dividir a issue C se ela ficar grande, sem mudar o ciclo.
8. **Teste ponta a ponta:** Playwright contra o Supabase local com usuário fictício por e-mail e senha, nas condições:
   - provedor de senha habilitado somente no `supabase/config.toml` local e desabilitado no projeto de produção;
   - usuário de teste fictício em `supabase/seed.sql`;
   - teste de rejeição em que um e-mail fora da lista tenta cadastro por senha e é recusado pelo hook;
   - teste manual de login com Google em produção como gate da issue C, com evidência sem dados reais.

### Verificações técnicas pendentes

A resolver por pesquisa no rascunho do plano:

- versões estáveis a fixar;
- disponibilidade do hook "before user created" no plano gratuito (decisão 1);
- limite de projetos ativos do plano gratuito e organização do `mae-no-controle` (decisão 2);
- prazo de pausa por inatividade do Supabase e limite de cron do plano Hobby da Vercel (decisão 6);
- requisitos atuais de instalabilidade do PWA sem modo offline.

Se alguma verificação invalidar uma decisão, o rascunho registra a divergência e a leva de volta ao responsável.

## Fora do escopo

- Tabelas de carteira (ativos, eventos, posições, consolidado e séries de benchmark) e qualquer cálculo financeiro (ciclo `002`).
- Fuso `America/Cuiaba` aplicado a regras de período (ciclo `002`); o ciclo pode apenas fixar a configuração.
- Telas de produto, fluxos e biblioteca de gráficos (ciclo `003`).
- Migração de dados e acesso ao SQLite de origem (ciclo `004`).
- Tema escuro e modo offline.
- Sincronização com o SGS.
- Auditoria do histórico e abertura do repositório (ADR-003).

## Critérios para iniciar o planejamento

- Perguntas 1 a 8 respondidas pelo responsável: atendido em 2026-10-12 (seção "Decisões do responsável").
- Autorização explícita para executar `rascunhar_plano` no ciclo `001`.
- Ideação versionada (ou, por decisão do responsável, mantida local até o plano) sem divergência com `_project/cycles.md`.

## Handoff de saída

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro + 001 + idear + fundacao_aplicacao + aa5fa81`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision`; timestamp e UUID não definem a identidade.
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: antes, `cycles.md` com próximo ciclo `001` sem reserva e sem ideação; depois, ciclo `001` em `Ideação` com este arquivo e próximo ciclo `002`.
- `next_transition`: `ideia -> rascunho de plano`, somente após decisão humana.
- `preconditions`: decisões 1 a 8 registradas (atendido); autorização para `rascunhar_plano`.
- `authority`: o responsável (Thiago Andrade).
- `evidence`: este arquivo, `_project/cycles.md`, ADR-002, ADR-003, KB-001, `design-system/DESIGN.md` e `_project/README.md` em `aa5fa81`; validador de governança verde.
- `acceptance`: fatos, hipóteses, alternativas, riscos e perguntas separados; nenhum plano, issue ou código criado.
- `blockers`: autorização para `rascunhar_plano`; as verificações técnicas pendentes não bloqueiam o rascunho, mas podem reabrir as decisões 1, 2 e 6.
- `result`: `executed`
- `next_workflow_recommended` / `next_workflow_authorized`: `rascunhar_plano` / nenhum.
- `actions_prohibited`: rascunhar ou aprovar plano, criar issue, criar código, configurar serviços externos, publicar PR ou integrar PR sem autorização própria.
- `rejection_rule`: o receptor recusa handoff ausente, incompatível, contraditório ou sem evidência material.
- `logical_key`: `saldo-futuro + 001 + idear + fundacao_aplicacao + aa5fa81`.
- `check_before_mutation`: verificar artefato e reserva de ciclo existentes antes de criar.
- `reconcile_existing`: atualizar a ideação compatível sem duplicar ciclo ou arquivo.
- `ambiguous_state`: parar quando identidade, ciclo ou revisão estiverem em conflito.
