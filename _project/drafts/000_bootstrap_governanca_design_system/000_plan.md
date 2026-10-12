# Plano de Implementação — Bootstrap da Governança e do Design System do Saldo Futuro

> **Ciclo:** `000`
> **Status:** `Aprovado`
> **Versão:** `v2`
> **Data de criação:** 2026-10-12
> **Última atualização:** 2026-10-12
> **Autor:** Thiago Andrade e Claude
> **Tipo:** `chore`
> **Prioridade:** `P1`
> **Prioridade de Execução:** Gate B → Etapa 0 → Gate C → Itens 1 a 6 (issue A) → Gate M-A → Item 7 (issue B) → Gate D → Gate M-B → Gate E
> **Revisão formal:** `Concluída`
> **Veredito da revisão:** `APTO COM RESSALVAS`
> **Aprovação humana pós-revisão:** `Aprovada em 2026-10-12`

> Este plano é a exceção autorreferencial de bootstrap: ele existe antes da governança que criará. Durante a execução, o estado do plano e do ciclo passa a obedecer às convenções implantadas pelo próprio ciclo `000`. Nenhuma ideação `000` será fabricada retroativamente.
>
> Enquanto um workflow não existir localmente, usa-se o workflow homônimo do `euthiagoandrade-api` (fixado nas Referências), aplicado como procedimento e não como autoridade local. A exceção cobre nominalmente:
>
> - `rascunhar_plano` e `revisar_plano`, para este plano;
> - `criar_issues`, na Etapa 0;
> - `implementar_issue`, na issue A.
>
> A issue B e o encerramento usam os workflows locais integrados pela PR A.

---

## Objetivo

Estabelecer no repositório `saldo-futuro` um núcleo de governança local, versionado, agnóstico de ferramenta de IA, verificável e autossuficiente, e um design system normativo com a nova identidade visual do produto **Saldo Futuro**. Juntos, eles devem conduzir os ciclos seguintes (fundação, regras financeiras, telas, migração de dados e virada) sem depender de checkouts irmãos.

O bootstrap adapta os padrões comprovados no `euthiagoandrade-api` e no `euthiagoandrade-site`. Também os **aprimora** para o caso de uso específico: um sistema web de gestão de investimentos pessoais, com dados financeiros privados, cálculos que precisam ser exatos, isolamento entre usuários por RLS e um repositório que será publicado após a estabilização.

> **Nota de Escopo Negativo:** este plano não cria aplicação, `package.json`, scaffold Next.js, projeto Supabase, migração SQL, autenticação, projeto Vercel, domínio, DNS nem cálculo financeiro. O Node.js deste ciclo limita-se ao tooling da governança. A stack já decidida é registrada como ADR, mas implantada somente a partir do ciclo `001`.

## Contexto e baseline

### Estado do repositório em 2026-10-12

- Repositório privado `EuThiagoAndrade/saldo-futuro`, clonado localmente.
- Repositório vazio: nenhum commit, `git ls-remote origin` sem referências, sem issues ou PRs.
- O único arquivo local é este plano, não rastreado.

### Sistema de origem

O `Meus-Investimentos` (FastAPI, SQLAlchemy e SQLite, com frontend em HTML/CSS/JS puro e Chart.js, de execução local e sem autenticação) é a **especificação funcional** e a **fonte dos dados** do Saldo Futuro. Ele não é base de código a ser copiada. Seu código, testes e ADRs serão referenciados por commit fixado nos ciclos `002` a `004`.

### Referências de governança e stack

| Repositório | Uso neste ciclo | Limite |
| :-- | :-- | :-- |
| `euthiagoandrade-api` | Núcleo de autoridades, estados, handoff, workflows, templates e validador | Não copiar regras de API, Docker, Oracle VPS ou snapshot editorial |
| `euthiagoandrade-site` | Estrutura de `design-system/DESIGN.md`, adapter `GEMINI.md` e matriz responsiva | Não copiar regras de Astro, conteúdo editorial ou Cloudflare Pages |
| `mae-no-controle` | Referência da stack aprovada (registrada em ADR) | Não copiar o modelo de estado agregado em JSONB |
| `Meus-Investimentos` | Inventário funcional e escopo de paridade | Não reaproveitar código, layout, design system ou governança `.agent` antiga |

### Drifts conhecidos que não devem ser reproduzidos

- O plano `000` do api nomeia branches documentais como `codex/plan-cycle-NNN`, enquanto o `_project/README.md` do api usa `chore/cycle-NNN-plan`. Aqui vale **uma única** convenção, nomeada pelo tipo semântico e sem prefixo de ferramenta.
- O validador do api tem 726 linhas, acopladas ao seu conjunto de arquivos. Aqui o validador deve ser dirigido por um manifesto, para que adicionar um arquivo obrigatório não exija editar a lógica.
- O api guarda o template de PR em `.github/PULL_REQUEST_TEMPLATE/`, caminho que o GitHub não aplica automaticamente. Aqui o template fica em `.github/pull_request_template.md`.
- O ciclo completo de ideação → plano → revisão → aprovação não tem caminho proporcional para correções pequenas e urgentes. Num sistema financeiro, isso atrasa a correção de um cálculo errado em produção.
- A governança `.agent` do Meus-Investimentos referencia Python, issues agrupadas por várias numerações e planos em `backup/`. Ela não é migrada.

## Decisões aprovadas antes da redação (Gate A)

Aprovadas explicitamente pelo responsável em 2026-10-11 e 2026-10-12, em diálogo de planejamento. A fidelidade desta lista é confirmada pelo responsável no Gate B.

1. **Produto e repositório:** o produto se chama Saldo Futuro e mora no repositório novo `saldo-futuro`. Ele fica privado até a estabilização e depois se torna público sob licença MIT.
2. **Stack:** a mesma linha do `mae-no-controle` (Next.js App Router, TypeScript, Tailwind 4, `@supabase/ssr`, Zod, Vitest e Playwright), hospedada na Vercel integrada ao GitHub, com banco Supabase. Os dados ficam em tabelas relacionais, não em agregado JSONB.
3. **Infraestrutura:** projeto Supabase novo e separado no plano gratuito, com consulta agendada contra pausa por inatividade. Domínio `investimentos.euthiagoandrade.com.br`. Desenvolvimento em Supabase local. Previews nunca usam dados reais.
4. **Acesso:**
   - login Google OAuth com lista de e-mails autorizados no banco;
   - perfis `admin` e `user`, sendo o primeiro administrador o e-mail do responsável;
   - tabelas com `user_id` e RLS por usuário;
   - o administrador gerencia acessos e o catálogo global de benchmarks e não vê carteiras de outros usuários.
5. **Escopo funcional:** paridade com o Meus-Investimentos, interface pensada primeiro para o celular (barra inferior com quatro itens e "Mais"), instalável como PWA sem modo offline, fuso `America/Cuiaba` e sincronização SGS sob demanda.
6. **Dados:** migração única a partir do SQLite. A tabela `investimentos_legacy` e o migrador histórico de CSV ficam de fora. Dinheiro é representado em centavos inteiros.
7. **Identidade visual:** nova, sóbria e associada a instituições financeiras.
   - Cores: azul-marinho profundo como cor principal, neutros frios, e verde e vermelho dessaturados reservados a ganho e perda.
   - Tipografia: IBM Plex Sans com algarismos tabulares.
   - Tema escuro fica para depois, com tokens preparados.
8. **Governança:**
   - núcleo `_project`, `.agent` e `design-system` no padrão do api e do site, aprimorado para o caso de uso;
   - adapters `AGENTS.md`, `CLAUDE.md` e `GEMINI.md`;
   - trilha curta para correções;
   - versão e novidades publicadas via release-please a partir do ciclo `001`.
9. **Ciclo 000:** sem ideação, como exceção de bootstrap. Entrega governança e design system juntos, antes de qualquer código de aplicação.

### Interpretações confirmadas

A revisão da `v1` levou a duas interpretações das decisões acima. Elas não as alteram, e o responsável confirmou as duas explicitamente em 2026-10-12, antes da rodada 2:

- **Decisão 6:** "centavos inteiros" vale para quantias monetárias (saldos, lançamentos, aportes, resgates, rendimentos e totais consolidados). Valores de índices, taxas e percentuais não são dinheiro. Na origem, eles usam `Numeric(15,6)` (valor de benchmark) e `Numeric(5,2)` (percentual consolidado), e sua precisão é definida no ciclo `002`.
- **Decisão 2:** a biblioteca de gráficos não faz parte da stack decidida. O design system define a paleta de gráficos em tokens agnósticos, e a escolha da biblioteca fica para o ciclo `003`, registrada em ADR.

## Escopo

### Dentro do escopo

- Criar o commit raiz do repositório com `README.md` mínimo, `LICENSE` (MIT), `.gitignore` e `.gitattributes`.
- Criar a fonte comportamental `.agent/ai_behavior.md` e sua matriz de autoridade.
- Criar `_project/README.md` com ciclo de vida, estados, transições, nomenclatura, **trilha curta** e **barreiras de domínio**.
- Criar `_project/cycles.md` com o ciclo `000` e a próxima numeração `001`.
- Criar ADRs locais: governança agnóstica e adapters; stack e infraestrutura; acesso, privacidade e publicação.
- Criar a KB de proveniência e ecossistema, com URLs e commits fixados das fontes.
- Criar adapters `AGENTS.md`, `CLAUDE.md` e `GEMINI.md`.
- Criar workflows, templates e skills genéricas, mais a skill `design-system-check`.
- Criar templates de issue e de PR com as barreiras de domínio como checklist.
- Criar o validador estrutural com testes e o workflow de CI de governança, incluindo a imutabilidade de migrações.
- Criar `design-system/DESIGN.md` normativo, o logo do Saldo Futuro em SVG, os arquivos da fonte IBM Plex Sans com sua licença e uma página estática de referência visual para aprovação humana da identidade.
- Registrar rastreabilidade, pós-mortem e encerramento do próprio ciclo.

### Fora do escopo

- Criar ideação `000` retroativa ou iniciar a ideação `001`.
- Criar `package.json`, dependências, scaffold Next.js, Tailwind instalado, componentes React ou rotas.
- Criar projeto Supabase, migrações, tabelas, RLS real, funções Postgres ou seed.
- Configurar Google OAuth, Vercel, domínio, DNS no Cloudflare, variáveis de ambiente ou deploy.
- Configurar release-please, Vitest, Playwright ou lint de aplicação (ciclo `001`).
- Portar regras financeiras, ADRs do Meus-Investimentos ou criar a KB de regras financeiras (ciclo `002`).
- Escolher a biblioteca de gráficos (ciclo `003`).
- Desenhar telas completas, fluxos ou protótipos de páginas (ciclo `003`).
- Migrar dados ou acessar o `database.sqlite` (ciclo `004`).
- Gerar ícones PWA, manifesto ou favicon a partir do logo (ciclo `001`).
- Implementar tema escuro.
- Alterar os repositórios `Meus-Investimentos`, `mae-no-controle`, `euthiagoandrade-api` ou `euthiagoandrade-site`, inclusive para corrigir neles os drifts listados acima.
- Criar skills funcionais (`nextjs-supabase-developer`, `financial-domain`) antes dos ciclos que as justificam.
- Configurar branch protection. O plano gratuito com repositório privado não oferece esse enforcement técnico, e a regra permanece normativa.

## Decisões e autoridades

### Matriz de autoridade a implantar

| Fonte | Responsabilidade canônica | Limite |
| :-- | :-- | :-- |
| Instrução explícita do responsável | Autorizar e limitar o trabalho corrente | Não pode ser ampliada por inferência |
| `.agent/ai_behavior.md` | Comportamento, precedência, autorizações, segurança e privacidade | Não substitui a organização de `_project/` |
| `_project/README.md` | Ciclo de vida, estados, transições, nomenclatura, trilha curta e barreiras de domínio | Não autoriza implementação por si só |
| `_project/cycles.md` | Numeração e estado corrente dos ciclos | Não redefine regras |
| ADR local aceito | Decisão duradoura | Não substitui plano executável |
| KB local | Conhecimento reutilizável e especificações de referência | Não autoriza mudança |
| `design-system/DESIGN.md` | Contrato visual e de interação | Não define regra de negócio |
| Plano aprovado | Escopo, entregas, riscos, sequência e validações | Não amplia autorização humana |
| Issue | Unidade planejada de entrega | Não amplia o plano |
| Task persistente | Registro local de execução de uma unidade | Não coordena branches concorrentes |
| Workflows, skills e templates | Sequência operacional, auditoria especializada e estrutura | Não criam política concorrente |
| Validador e CI | Enforcement determinístico e somente leitura | Não são fonte normativa |
| Adapters | Descoberta do núcleo canônico | Não replicam política |
| GitHub | Issues, PRs, checks e estado externo | Não substitui plano ou autorização |

### Gates humanos do bootstrap

Cada gate exige manifestação explícita do responsável, posterior à sua precondição. Silêncio, aprovação de um gate anterior ou recomendação de handoff não satisfazem o gate seguinte.

| Gate | Precondição | Autoriza | Não autoriza | Evidência |
| :-- | :-- | :-- | :-- | :-- |
| **A — decisões** | Diálogo de planejamento | Redigir e revisar este plano localmente | Commit, publicação, issue ou implementação | Seção "Decisões aprovadas", confirmada no Gate B |
| **B — plano** | Veredito `APTO PARA APROVAÇÃO` ou `APTO COM RESSALVAS`, confirmação da fidelidade da lista do Gate A (as interpretações já foram confirmadas), e conteúdo dos quatro arquivos do commit raiz apresentado ao responsável | Marcar `Aprovado`; criar e enviar o commit raiz direto em `main`; criar `chore/cycle-000-plan`, abrir a PR do plano e integrá-la após revisão do diff; criar as issues A e B | Qualquer outro arquivo em `main`; branch de issue; implementação | Diff do commit raiz, URL da PR do plano integrada e URLs das issues |
| **C — execução** | Gate B concluído, issues A e B abertas | Implementar a issue A em `chore/issue-N`, com task, commits e PR A. Após o Gate M-A, implementar a issue B em `chore/issue-M`, com task, commits e PR B. Baixar os arquivos da fonte IBM Plex Sans da origem oficial | Integrar qualquer PR; ampliar escopo; iniciar a issue B antes de M-A | Tasks com evidências e checks reais |
| **M-A — integração da PR A** | PR A com checks verdes e diff revisado | Merge da PR A | Merge da PR B | Merge da PR A verificável no GitHub |
| **D — identidade visual** | PR B aberta com `referencia.html`, logo e `DESIGN.md` | Aceitar a identidade visual como contrato normativo | Merge da PR B por si só | Manifestação do responsável na PR B |
| **M-B — integração da PR B** | Gate D registrado e checks verdes | Merge da PR B | Encerramento, salvo se a mesma manifestação o incluir expressamente | Merge da PR B verificável no GitHub |
| **E — encerramento** | PRs A e B integradas | Criar `chore/cycle-000-closure`, a task de closure, a PR de encerramento, integrá-la após checks verdes e fazer a reconciliação pós-merge | Qualquer mudança fora do encerramento documental | Task de closure e `cycles.md` reconciliados |

Toda cadeia autorizada para nessas situações: check falho, conflito, arquivo inesperado no diff, entrega pendente, divergência entre o conteúdo apresentado e o publicado, ou necessidade de ampliar escopo.

### Aprimoramentos sobre a governança de referência

| # | Aprimoramento | Motivo no Saldo Futuro | Enforcement |
| :-- | :-- | :-- | :-- |
| G1 | **Barreira de exatidão financeira:** mudança em regra de cálculo (eventos, fechamento, consolidação, Modified Dietz, benchmarks) exige casos de referência com valores esperados e atualização da KB de regras financeiras | Um erro silencioso de cálculo é o pior defeito possível do produto | Checklist da PR, seção obrigatória no template de task e revisão manual. Testes automatizados a partir do ciclo `002` |
| G2 | **Barreira de isolamento:** toda tabela em `public` precisa ter RLS ativo e teste que prove que um usuário não lê nem altera dados de outro | Multiusuário com carteiras privadas, e administrador sem acesso a carteiras alheias | Verificação estática do validador (regra abaixo). Teste de banco a partir do ciclo `001`, que é a prova definitiva |
| G3 | **Barreira de privacidade:** dados do usuário não aparecem em issues, PRs, tasks, commits, prints, logs ou fixtures. Fixtures são fictícias | Repositório será público e o histórico do Git é permanente | Validador (arquivos de dados e `.gitignore`), checklist da PR e revisão manual |
| G4 | **Migrações só acrescentam:** migração versionada nunca é editada, renomeada ou removida | O banco de produção é a fonte da verdade e não há homologação separada | Passo de CI contra a base (regra abaixo). O validador confere o padrão de nome |
| G5 | **Trilha curta:** correção (`fix`) sem mudança de escopo usa issue, task e PR, sem ideação nem plano. As barreiras G1 a G4 continuam obrigatórias | Corrigir rapidamente um erro em produção sem burlar o processo | O template de task tem o campo `Trilha: curta`. O validador exige issue, justificativa e barreiras declaradas |
| G6 | **Validador dirigido por manifesto:** arquivos, seções, padrões proibidos e exclusões declarados em `scripts/governance-manifest.json` | Evitar o acoplamento observado no validador do api | Testes do validador |
| G7 | **Uma única convenção de branches**, sem prefixo de ferramenta | Corrigir o drift do api | Documentada em `_project/README.md` e conferida na revisão |
| G8 | **Design system com contratos financeiros:** formato de moeda e percentual, algarismos tabulares, ganho e perda sem depender só de cor, estado `N/D` e alvos de toque | O produto é lido no celular e decide dinheiro | `design-system-check` e revisão manual. Testes de acessibilidade a partir do ciclo `001` |

#### Regras precisas das barreiras

- **G2 (verificação estática):**
  - O validador lê todos os arquivos de `supabase/migrations/` em ordem de nome e avalia o conjunto, não cada arquivo isolado.
  - Toda tabela criada no schema `public` precisa de um `alter table … enable row level security` correspondente, no mesmo arquivo ou em migração posterior. Contam como `public` a tabela sem schema, `public.x` e `"public"."x"`.
  - A comparação ignora maiúsculas e minúsculas, aceita `if not exists`, `if exists` e `only`, e normaliza identificadores entre aspas.
  - Tabelas em outros schemas ficam fora da regra.
  - A verificação é heurística e não substitui o teste de banco.
- **G3 (alcance):**
  - São dados do usuário: valores, saldos, quantidades, posições, nomes dos ativos que ele detém, instituições onde mantém contas, e-mails e prints de telas com dados reais.
  - São permitidos: índices e benchmarks públicos (CDI, Selic, IPCA, Ibovespa), códigos de séries do SGS, classes genéricas de ativo e nomes fictícios em exemplos e fixtures.
- **G3 (arquivos de dados):**
  - `*.sqlite`, `*.db`, `*.csv` e `*.xlsx` só são aceitos em `tests/fixtures/`.
  - `*.sql` só é aceito em `supabase/migrations/`, `supabase/tests/`, `supabase/seed.sql` (dados fictícios) e `tests/fixtures/`.
  - Dados reais de trabalho local, como o SQLite de origem no ciclo `004`, ficam em `local/`, que é ignorado pelo Git e excluído da varredura.
- **G4 (passo de CI):**
  - O checkout usa `fetch-depth: 0`.
  - Em `pull_request`, compara `origin/<base>...HEAD`. Em `push` para `main`, compara `github.event.before..github.sha`, e o passo é ignorado quando `before` é o SHA nulo do primeiro push.
  - Usa `git diff --name-status --find-renames -- supabase/migrations/` e falha em qualquer status diferente de `A`.
  - Sem a pasta, o passo passa.

### Convenções a implantar

- **Branches de implementação:** `feature/issue-N`, `fix/issue-N`, `chore/issue-N`.
- **Branches documentais:** `chore/cycle-NNN-plan`, `chore/cycle-NNN-closure`.
- **Commits:** `feat(issue-N):`, `fix(issue-N):`, `chore(issue-N):`, `docs(cycle-NNN):`, `chore(cycle-NNN):`. O formato segue Conventional Commits e fica compatível com o release-please do ciclo `001`.
- **Prefixos de issue:** `[FEATURE]`, `[FIX]`, `[CHORE]`, idênticos em templates e workflows.
- **Tasks:** `NNN_task_issue-N.md` e `NNN_task_closure.md`. Na trilha curta, `fix_task_issue-N.md` em `_project/fixes/`, fora da verificação de ciclo da pasta.
- **ADRs e KBs:** `ADR-NNN_assunto.md` e `KB-NNN_assunto.md`, com sequências independentes e ciclo de origem registrado.
- **Migrações:** `AAAAMMDDHHMMSS_assunto.sql`, o formato gerado por `supabase migration new`, com `assunto` em minúsculas e `_`.

## Estratégia de testes

| Campo | Definição |
| :-- | :-- |
| **Classificação da mudança** | Governança, documentação, tooling estrutural, configuração GitHub e artefatos visuais estáticos |
| **Riscos protegidos** | Autoridade concorrente, estado e path incoerentes, ciclo duplicado, adapter divergente, segredo ou dado real versionado, tabela sem RLS, migração editada, task órfã, trilha curta sem barreiras, dependência de checkout irmão, template de PR inativo |
| **TDD** | Aplicável ao validador: cada cenário tem fixture que falha antes da regra correspondente. Não aplicável a textos declarativos |
| **Código e contrato** | `node:test` com fixtures em diretório temporário e `--root` explícito; validação do repositório real |
| **Navegador** | Somente a abertura manual da página de referência visual, sem rede |
| **Acessibilidade** | Contraste de todos os pares de cor do `DESIGN.md` calculado e registrado (mínimo WCAG 2.2 AA: 4,5:1 para texto e 3:1 para elementos gráficos) |
| **Checks bloqueantes** | Testes do validador, validador no repositório, imutabilidade de migrações (passa vazio neste ciclo), `git diff --check` e staging seletivo |
| **Revisão manual** | Autoridades, autorizações, escopo negativo, semântica das barreiras, referências documentais em `_project/`, identidade visual (Gate D) |
| **Tooling** | Node.js 24 com APIs nativas, sem `package.json` neste ciclo |

### Cenários mínimos do validador

1. Fixture válida.
2. Arquivo obrigatório do manifesto ausente.
3. Adapter ausente ou sem referência a `.agent/ai_behavior.md`.
4. Frontmatter inválido em workflow ou skill.
5. Ciclo duplicado em `cycles.md`.
6. Próximo ciclo incorreto.
7. Estado inválido ou incompatível com o path do plano.
8. Pasta ou artefato com nome fora da convenção.
9. Arquivo solto em `drafts/`, `executed/` ou `archived/`.
10. Task com ciclo divergente da pasta.
11. Ciclo concluído com task de issue ainda ativa.
12. Referência operacional a checkout irmão. O escopo cobre:
    - **raízes:** os adapters, `.agent/`, `.github/` e `scripts/`, com extensões `.md`, `.yml`, `.yaml`, `.json` e `.mjs`;
    - **padrões:** caminho relativo de diretório pai ou caminho absoluto local que termine num dos repositórios de origem listados no manifesto.

    `_project/` fica fora, porque planos, KBs e tasks citam fontes documentalmente, e é coberto por revisão manual. Os testes montam as strings proibidas por composição, para que o próprio arquivo de teste não case com o padrão.
13. `.gitignore` sem as exclusões mínimas: `.env*` (exceto `.env.example`), `*.sqlite`, `*.db`, `local/` e `supabase/.temp/`.
14. Arquivo de dados fora dos locais permitidos pela regra G3, com as exclusões de varredura do manifesto respeitadas: `.git/`, `node_modules/`, `local/`, `supabase/.temp/`, `supabase/.branches/`, `.next/`, `coverage/`, `test-results/` e `playwright-report/`.
15. Tabela de `public` sem RLS segundo a regra G2. Inclui fixture positiva com RLS habilitado em migração posterior e fixtures com schema explícito, aspas e `if not exists`.
16. Migração com nome fora do padrão `AAAAMMDDHHMMSS_assunto.sql` (G4).
17. Task de trilha curta sem issue, justificativa ou barreiras declaradas (G5).
18. `design-system/DESIGN.md`, quando existir, sem as seções normativas obrigatórias. A regra é condicional, e o arquivo só passa a ser obrigatório no manifesto pela PR B.
19. Template de PR ausente de `.github/pull_request_template.md` ou sem a seção das barreiras G1 a G4.

Os cenários 15 e 16 ficam inativos enquanto `supabase/migrations/` não existir, mas são cobertos por fixtures desde já. O validador não executa Git, não acessa a rede e não escreve no workspace auditado. Ele retorna código `1` somente para erro bloqueante e distingue `[ERRO]`, `[AVISO]` e `[MANUAL]`.

## Itens de implementação

### Etapa 0 — Commit raiz, aprovação e publicação do plano (Gate B)

**Contexto:** o repositório não tem commits, e uma PR precisa de uma `main` existente como base.

**Ação técnica (após o Gate B):**

- Verificar que o GitHub CLI tem permissão de escrita e que o remoto continua sem commits.
- Criar diretamente em `main` o commit raiz contendo somente `README.md` mínimo, `LICENSE` (MIT, titular Thiago Andrade), `.gitignore` (já com as exclusões do cenário 13) e `.gitattributes` (`* text=auto eol=lf`). O conteúdo é o apresentado no Gate B. É a única escrita direta em `main` neste ciclo.
- Atualizar este plano para `Aprovado`, criar `chore/cycle-000-plan` e abrir PR contendo somente este plano.
- Integrar a PR documental após revisão do diff.
- Criar as issues `[CHORE] Implementar bootstrap da governança` (A) e `[CHORE] Criar design system e identidade visual` (B), referenciando o commit do plano integrado.

**Critérios de aceite:**

- [ ] O commit raiz contém somente os quatro arquivos previstos, idênticos aos apresentados, sem segredos nem dados.
- [ ] A PR do plano contém somente este arquivo.
- [ ] As issues A e B referenciam a versão integrada do plano.
- [ ] Nenhuma implementação foi iniciada antes do Gate C.

### Item 1 — Núcleo canônico e ciclo de vida (issue A)

**Contexto:** não existe autoridade versionada nem registro de ciclos.

**Ação técnica:**

- Criar `.agent/ai_behavior.md` com:
  - ordem de leitura e matriz de autoridade;
  - contrato canônico de handoff (`handoff_schema_version: 1`, herdado do api);
  - autorizações e gates;
  - simplicidade, mudanças cirúrgicas e gestão de incertezas;
  - segurança e uma seção própria de **privacidade de dados financeiros**, com o alcance de G3.
- Criar `.agent/lessons_learned.md` só com lições comprovadas e aplicáveis. São reescritas para este contexto, com origem citada, as três lições do api sobre gates, handoff e encerramento e a lição sobre o input `package-manager-cache` do `actions/setup-node`.
- Criar `.agent/task.md` neutro, como ponte local.
- Criar `_project/README.md` com:
  - estrutura (incluindo `_project/fixes/`), numeração, estados e transições;
  - fluxo normal;
  - trilha curta (G5), com critérios objetivos de elegibilidade: correção de comportamento já especificado, sem mudança de escopo, de schema que altere semântica ou de contrato visual. Fora disso, ciclo normal;
  - barreiras de domínio G1 a G4, com as regras precisas e o momento em que cada uma passa a ter enforcement automatizado;
  - convenções de branches, commits, tasks e migrações;
  - gates mínimos e comandos.
- Criar `_project/cycles.md` com o ciclo `000` `Em execução` e o próximo ciclo `001`.
- Atualizar este plano para `Em Execução` na mesma entrega.

**Critérios de aceite:**

- [ ] Cada responsabilidade tem uma única fonte canônica.
- [ ] Estados de ciclo e de plano são distintos, e as transições têm precondição e resultado.
- [ ] A trilha curta tem critérios de elegibilidade verificáveis e não dispensa G1 a G4.
- [ ] Cada barreira declara o que é automatizado agora, o que será depois (com ciclo) e o que é revisão manual.
- [ ] Não há regra de Astro, API editorial, Docker ou Oracle VPS.

### Item 2 — Decisões e conhecimento (issue A)

**Contexto:** as decisões do Gate A e as fontes do bootstrap precisam de registro duradouro e local.

**Ação técnica:**

- `_project/decisions/ADR-001_governanca_agnostica_adapters.md`: núcleo local agnóstico e adapters como consumidores, com alternativas e consequências próprias.
- `_project/decisions/ADR-002_stack_infraestrutura.md`:
  - registra as decisões 2, 3, 5 e 6 do Gate A, com as interpretações confirmadas em 2026-10-12 (alcance dos centavos inteiros e biblioteca de gráficos adiada);
  - inclui as alternativas avaliadas no diálogo (manter FastAPI na Vercel, híbrido) e o motivo da rejeição;
  - status `Aceito`, com implantação a partir do ciclo `001`.
- `_project/decisions/ADR-003_acesso_privacidade_publicacao.md`:
  - registra as decisões 1 e 4: allowlist, perfis, RLS por `user_id`, administrador sem acesso a carteiras alheias e benchmarks como catálogo global;
  - registra a política G3 com seu alcance;
  - registra a política de publicação: privado até a estabilização, MIT, e um ciclo próprio de auditoria do histórico antes de tornar o repositório público.
- `_project/knowledge/KB-001_proveniencia_ecossistema.md`:
  - fontes com função, URL, commit fixado e limite de autoridade;
  - origem e versão dos arquivos da fonte IBM Plex Sans;
  - topologia de domínios do ecossistema (Cloudflare Pages, Tunnel e Vercel);
  - inventário de alto nível das funções do Meus-Investimentos que definem a paridade.

**Critérios de aceite:**

- [ ] Toda fonte externa tem URL, commit ou versão fixada e limite de autoridade, sem caminho local de checkout.
- [ ] Nenhuma fonte externa é apresentada como plano local executável.
- [ ] As ADRs têm contexto, decisão, alternativas e consequências.
- [ ] Nenhum e-mail pessoal ou dado do usuário, no alcance de G3, aparece nos documentos. O e-mail do primeiro administrador é configurado só no banco, no ciclo `001`.

### Item 3 — Adapters, workflows, templates e skills (issue A)

**Contexto:** as ferramentas de IA precisam descobrir o núcleo, e as operações recorrentes precisam de sequência e estrutura locais.

**Ação técnica:**

- Adapters `AGENTS.md`, `CLAUDE.md` (`@./.agent/ai_behavior.md`) e `GEMINI.md`, com a sintaxe de descoberta de cada ferramenta revalidada na execução.
- Workflows:
  - herdados: `idear`, `rascunhar_plano`, `revisar_plano`, `criar_issues`, `implementar_issue`, `listar_issues`, `atualizar_docs`, `health_check`;
  - novo: `corrigir_trilha_curta` (G5).
- Templates: `ideacao`, `plano_implementacao`, `task` (com a seção "Barreiras de domínio" e o campo `Trilha`), `adr` e `kb` (novo).
- Skills:
  - `governance-check`;
  - `doc-updater`;
  - `design-system-check`, que audita a interface contra `DESIGN.md` em modo só leitura e emite `[MANUAL]` enquanto o arquivo não existir.
- O `health_check` chama diretamente `node scripts/validate-governance.mjs`.

**Critérios de aceite:**

- [ ] Os três adapters apontam para o núcleo sem replicar política.
- [ ] Workflows mutantes instanciam o handoff completo, e os somente leitura usam a saída reduzida.
- [ ] Nenhuma skill funcional de aplicação foi criada por antecipação.
- [ ] Prefixos, branches e commits seguem uma única taxonomia.

### Item 4 — Integração GitHub (issue A)

**Contexto:** issues, PRs e checks precisam carregar as barreiras de domínio desde a primeira entrega.

**Ação técnica:**

- `.github/ISSUE_TEMPLATE/feature_request.yml`, `bug_report.yml` (`[FIX]`, com a opção "trilha curta") e `chore.yml`, além de `config.yml` sem issues em branco.
- `.github/pull_request_template.md`, no caminho que o GitHub aplica automaticamente. Contém:
  - `Closes #N`, escopo e testes;
  - o checklist das barreiras G1 a G4, cada uma marcável como "não se aplica" com justificativa.
- `.github/workflows/governance.yml`:
  - roda os testes do validador e o validador em `pull_request` e em `push` para `main`;
  - usa actions fixadas por SHA e `permissions: contents: read`;
  - configura `actions/setup-node` com Node 24 e `package-manager-cache: false`.
- No mesmo workflow, o passo de **imutabilidade de migrações**, conforme a regra G4.

**Critérios de aceite:**

- [ ] Templates e workflows usam a mesma taxonomia.
- [ ] Uma PR aberta pela interface do GitHub recebe o template automaticamente.
- [ ] O CI passa no repositório real, e o passo de migrações passa com a pasta ainda inexistente.
- [ ] O passo de migrações tem demonstração registrada na task, provando que falha numa alteração, remoção e renomeação.

### Item 5 — Validador estrutural (issue A)

**Contexto:** as regras precisam de enforcement determinístico, desacoplado da lista de arquivos.

**Ação técnica:**

- `scripts/governance-manifest.json` contém:
  - arquivos obrigatórios e seções exigidas;
  - padrões proibidos e repositórios de origem do cenário 12;
  - locais permitidos para arquivos de dados e exclusões de varredura.

  Na PR A, ele não lista `design-system/DESIGN.md` como obrigatório.
- `scripts/validate-governance.mjs`, só com APIs nativas, aceitando `--root` e cobrindo os 19 cenários.
- `scripts/validate-governance.test.mjs` com `node:test` e fixtures temporárias.

**Comandos:**

```sh
node --test scripts/validate-governance.test.mjs
node scripts/validate-governance.mjs
git diff --check
```

**Critérios de aceite:**

- [ ] Cada cenário tem teste de sucesso ou falha correspondente.
- [ ] Adicionar um arquivo obrigatório exige editar só o manifesto, o que a PR B demonstra com o `DESIGN.md`.
- [ ] A execução não altera o workspace e não depende de `npm`.
- [ ] O validador passa no repositório real, inclusive sobre este plano e o parecer de revisão.

### Item 6 — Arquivos de base do produto (issue A)

**Contexto:** o README do commit raiz é mínimo e precisa orientar quem chega ao repositório.

**Ação técnica:**

- Expandir o `README.md` com o propósito do Saldo Futuro, o estado atual (governança, sem aplicação), o mapa de ciclos `000` a `004` e os links para as autoridades existentes. O link para o `DESIGN.md` é adicionado pela PR B.
- Revisar o `.gitignore` do commit raiz contra o cenário 13.

**Critérios de aceite:**

- [ ] O README não promete funcionalidade inexistente nem aponta para arquivo inexistente.
- [ ] O validador passa com o `.gitignore` final.

### Item 7 — Design system e identidade visual (issue B)

**Contexto:** a identidade é nova, deve transmitir sobriedade e confiança de instituição financeira, e o produto é pensado primeiro para o celular.

**Ação técnica:**

- `design-system/DESIGN.md` normativo, com as seções:
  1. princípios (sobriedade, clareza numérica, confiança, celular primeiro);
  2. cores normativas, com tokens semânticos (`surface`, `text`, `primary`, `gain`, `loss`, `neutral`, `focus`) já nomeados para o tema escuro futuro e contraste calculado de cada par;
  3. tipografia:
     - IBM Plex Sans servida pelo próprio site a partir dos arquivos versionados, sem CDN;
     - algarismos tabulares obrigatórios em valores;
     - escala tipográfica;
  4. espaçamento, grade e pontos de quebra, com o celular como base;
  5. integração com Tailwind 4 (`@theme`), a ser aplicada no ciclo `001`;
  6. contratos de componentes, com:
     - matriz de navegação (barra inferior com Início, Lançamentos, Ativos, Benchmarks e "Mais", e menu lateral a partir do desktop);
     - valor monetário (`R$` e separadores pt-BR);
     - variação (sinal, ícone e cor, nunca só a cor);
     - estado `N/D`;
     - cartão de lançamento;
     - tabela que vira lista de cartões no celular;
     - formulário com teclado numérico (`inputmode="decimal"`);
     - confirmação de ação destrutiva;
     - estados vazio, carregando e erro;
     - paleta de gráficos em tokens (`chart-1` a `chart-n`, além de `gain` e `loss`), independente de biblioteca;
  7. acessibilidade (WCAG 2.2 AA, alvo de toque mínimo de 44 px, foco visível, `prefers-reduced-motion`);
  8. diretrizes de logo e marca.
- `design-system/assets/logo-saldo-futuro.svg` (símbolo e logotipo) e `logo-simbolo.svg` (símbolo isolado, base para os ícones do ciclo `001`).
- `design-system/assets/fonts/`:
  - os arquivos `woff2` da IBM Plex Sans (400, 500 e 600, sem subset), baixados da distribuição oficial da IBM em versão fixada;
  - o `OFL.txt` correspondente.
- `design-system/referencia.html`: página estática e autocontida que mostra tokens, tipografia, componentes-contrato e uma composição de exemplo de "Início" no celular.
  - Carrega a fonte por caminho relativo.
  - Usa **somente dados fictícios**.
  - Serve exclusivamente à aprovação da identidade, sem compromisso de layout final de tela (ciclo `003`).
- Atualizar o manifesto para tornar `design-system/DESIGN.md` obrigatório, e o `README.md` com o link para ele.

**Critérios de aceite:**

- [ ] Todos os pares texto/fundo e gráfico/fundo atendem aos mínimos AA, com o cálculo registrado.
- [ ] Ganho e perda são distinguíveis sem cor.
- [ ] Os tokens semânticos permitem o tema escuro sem renomeação.
- [ ] A página de referência abre localmente sem nenhum acesso à rede, com a fonte carregada e `tnum` ativo nos valores.
- [ ] Os SVGs não usam `<text>` (o logotipo está convertido em contornos), têm `viewBox` e não dependem de recurso externo. O símbolo é legível a 32 px.
- [ ] A PR B altera o manifesto e não a lógica do validador.
- [ ] Gate D: o responsável aprova explicitamente a identidade visual na PR da issue B.

### Etapa final — Encerramento (Gate E)

- Task `000_task_closure.md` em `chore/cycle-000-closure`, consolidando rastreabilidade e pós-mortem, com o diretório movido para `_project/executed/000_bootstrap_governanca_design_system/`.
- `cycles.md` com `000` `Concluído` e próximo ciclo `001`.
- Reconciliação pós-merge conforme a lição do api sobre encerramentos.

## Arquivos afetados

| Ação | Arquivo |
| :-- | :-- |
| Criar (commit raiz) | `README.md`, `LICENSE`, `.gitignore`, `.gitattributes` |
| Criar | `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` |
| Criar | `.agent/ai_behavior.md`, `.agent/lessons_learned.md`, `.agent/task.md` |
| Criar | `.agent/workflows/{idear,rascunhar_plano,revisar_plano,criar_issues,implementar_issue,listar_issues,atualizar_docs,health_check,corrigir_trilha_curta}.md` |
| Criar | `.agent/templates/{ideacao,plano_implementacao,task,adr,kb}.md` |
| Criar | `.agent/skills/{governance-check,doc-updater,design-system-check}/*.md` |
| Criar | `_project/README.md`, `_project/cycles.md` |
| Criar | `_project/decisions/ADR-001_governanca_agnostica_adapters.md`, `ADR-002_stack_infraestrutura.md`, `ADR-003_acesso_privacidade_publicacao.md` |
| Criar | `_project/knowledge/KB-001_proveniencia_ecossistema.md` |
| Criar | `.github/ISSUE_TEMPLATE/{feature_request,bug_report,chore,config}.yml`, `.github/pull_request_template.md`, `.github/workflows/governance.yml` |
| Criar | `scripts/governance-manifest.json`, `scripts/validate-governance.mjs`, `scripts/validate-governance.test.mjs` |
| Criar | `design-system/DESIGN.md`, `design-system/assets/*.svg`, `design-system/assets/fonts/{*.woff2,OFL.txt}`, `design-system/referencia.html` |
| Atualizar (PR B) | `scripts/governance-manifest.json`, `README.md`, `_project/knowledge/KB-001_proveniencia_ecossistema.md` |
| Atualizar/mover | Este plano, para `_project/executed/…` no encerramento |

## Decomposição em issues e PRs

| Unidade | Branch | Conteúdo | Gate |
| :-- | :-- | :-- | :-- |
| Commit raiz | `main` (direto) | Quatro arquivos de base | B |
| PR do plano | `chore/cycle-000-plan` | Somente este plano | B |
| Issue A / PR A | `chore/issue-N` | Itens 1 a 6 | C e M-A |
| Issue B / PR B | `chore/issue-M` | Item 7 | C (após M-A), D e M-B |
| PR de encerramento | `chore/cycle-000-closure` | Closure, `cycles.md` e movimentação | E |

A PR B depende da PR A integrada, porque usa o template de task, a skill `design-system-check`, o manifesto e o validador.

## Dependências e blockers

- **Bloqueador atual:** segunda rodada da revisão formal, seguida da aprovação humana posterior (Gate B).
- O GitHub CLI precisa estar autenticado com permissão de escrita no repositório. Isso já foi verificado para clonagem, mas não para escrita. É verificado no início da Etapa 0.
- Os arquivos da fonte IBM Plex Sans (licença OFL 1.1) são baixados da distribuição oficial da IBM durante a issue B. A versão e a URL são registradas na KB-001.
- Nenhuma dependência de Supabase, Vercel ou DNS neste ciclo.

## Riscos, suposições e rollback

| Risco | Mitigação |
| :-- | :-- |
| Governança pesada demais para um projeto pessoal, atrasando entregas | Trilha curta (G5), validador dirigido por manifesto, skills funcionais só quando justificadas |
| Barreiras declaradas e não aplicadas (G1 e G2 sem código ainda) | Cada barreira declara quando ganha enforcement automatizado. Os ciclos `001` e `002` têm critérios de aceite que as ativam |
| Heurística de G2 com falso negativo (por exemplo, SQL dinâmico) | Declarada como heurística. O teste de banco do ciclo `001` é a prova definitiva |
| Push direto em `main` escapando da verificação de PR | O workflow também roda em `push` para `main`, e a norma proíbe escrita direta fora da Etapa 0 |
| Identidade visual reprovada após o trabalho de tokens | Gate D isolado na issue B. A página de referência permite iterar antes de qualquer código React |
| Escrita direta em `main` no commit raiz sem revisão | Conteúdo mínimo, apresentado e aprovado no Gate B, e verificado contra o publicado |
| Dado real vazar num documento enquanto o repositório for privado e depois virar histórico público | G3 desde o primeiro commit. Antes de tornar público, um ciclo próprio faz a auditoria do histórico (ADR-003) |

**Suposições:** o plano gratuito do GitHub não oferece branch protection em repositório privado, e os checks são bloqueantes por norma. O Node.js 24 está disponível localmente e no runner.

**Rollback:** artefatos puramente documentais e de tooling. Reverter a PR correspondente restaura o estado anterior. O commit raiz não é revertido, e sim corrigido por PR.

## Sequência recomendada

1. Segunda rodada da revisão formal (`revisar_plano`) → veredito.
2. Gate B: aprovação humana pós-revisão e confirmação do Gate A → Etapa 0 (commit raiz, PR do plano, issues A e B).
3. Gate C: implementação da issue A → PR A → checks → Gate M-A.
4. Implementação da issue B → PR B → Gate D (identidade) → checks → Gate M-B.
5. Gate E: encerramento documental e reconciliação pós-merge.

## Referências

- `euthiagoandrade-api` @ `9f79071bc619e826da4554f0f85e4ffe7f135f8b`: `.agent/`, `_project/README.md`, `_project/executed/000_bootstrap_governanca/000_plan.md` e `scripts/validate-governance*.mjs`.
- `euthiagoandrade-site` @ `b5ec34c1ced5acb8669bb0d2426edfdf9167fd62`: `design-system/DESIGN.md`, `GEMINI.md` e `_project/knowledge/KB-001_infra_ecosystem_context.md`.
- `mae-no-controle` @ `2f4a304f7ad62b1166e47ded26582d176f6311f3`: `package.json`, `docs/ARQUITETURA.md`, `docs/CONFIGURACAO.md` e `supabase/migrations/`.
- `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`: `docs/architecture/`, `backend/app/` (incluindo `models/` para as precisões numéricas) e `frontend/`.
- Documentação do GitHub sobre templates de pull request: `docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository`.

## Rastreabilidade

| Campo | Valor |
| :-- | :-- |
| Issue(s) | — |
| PR(s) | — |
| Branch(es) | — |
| `handoff_schema_version` | `1` |
| `handoff_id` | `saldo-futuro:000:revisar_plano:000_plan:v2-no-commit` (anteriores: `…:rascunhar_plano:000_plan:no-commit`, `…:revisar_plano:000_plan:v1-no-commit` e `…:rascunhar_plano:000_plan:v2-no-commit`, todos aceitos) |
| Destino após conclusão | `_project/executed/000_bootstrap_governanca_design_system/000_plan.md` |

## Handoff de saída

- `handoff_schema_version`: `1`
- `handoff_id`: `saldo-futuro:000:revisar_plano:000_plan:v2-no-commit`
- `identity_source`: `repository + cycle + workflow + logical_target + source_revision` (repositório sem commits; revisão de origem `v2`, não rastreada).
- `effect_class`: `local_mutation`
- `state_before`: plano `v2` em `Em Revisão`, aguardando a rodada 2; handoff `saldo-futuro:000:rascunhar_plano:000_plan:v2-no-commit` aceito.
- `state_after`: plano `v2` `Aprovado` em 2026-10-12 (Gate B), após veredito `APTO COM RESSALVAS`; commit raiz `6698169` em `main`.
- `next_transition`: integração da PR do plano e criação das issues A e B (Etapa 0); depois, Gate C.
- `preconditions`: Gate B concedido em 2026-10-12, com aprovação do plano `v2`, confirmação da lista do Gate A e aprovação dos quatro arquivos do commit raiz.
- `authority`: Thiago Andrade.
- `evidence`: seção Revisão crítica (rodadas 1 e 2); verificações somente leitura do remoto, dos commits fixados e da unicidade do plano.
- `acceptance`: veredito apto sem bloqueios, ressalvas S1 a S5 classificadas e decisão humana não inferida.
- `blockers`: nenhum.
- `result`: `executed`
- `next_workflow_recommended`: `criar_issues` (Etapa 0) e, após o Gate C, `implementar_issue` para a issue A.
- `next_workflow_authorized`: Etapa 0, conforme o Gate B (PR do plano, integração e criação das issues A e B).
- `actions_prohibited`: implementar, criar branch de issue ou escrever em `main` fora da PR do plano antes do Gate C.
- `rejection_rule`: o receptor recusa este handoff se o plano não estiver em `Em Revisão` na `v2`, se o parecer tiver sido alterado ou se a aptidão for tratada como aprovação.
- `logical_key`: `saldo-futuro:000:revisar_plano:000_plan:v2`
- `check_before_mutation`: verificar se já existe parecer para a `v2` e se a aprovação continua `Pendente`.
- `reconcile_existing`: em nova rodada, preservar os pareceres anteriores e registrar o novo abaixo deles.
- `ambiguous_state`: parar se houver mais de um plano `000`, se o remoto tiver commits não previstos ou se o plano mudar após este parecer sem nova rodada.

## Revisão crítica

### Rodada 1

- **Data:** 2026-10-12
- **Versão revisada:** `v1`
- **Procedimento:** `.agent/workflows/revisar_plano.md` e `.agent/templates/plano_implementacao.md` do `euthiagoandrade-api` @ `9f79071`, aplicados como procedimento (exceção de bootstrap).
- **Veredito:** `REQUER NOVA RODADA`
- **Bloqueios remanescentes:** B1, B2, B3 e B4.
- **Aprovação humana pós-revisão:** `Pendente`

#### Itens atendidos

- Todas as seções e campos de estado do template estão presentes.
- O escopo negativo é explícito e coerente com o mapa de ciclos `001` a `004`.
- Os commits fixados nas Referências conferem com o `HEAD` dos quatro repositórios de origem. O remoto `saldo-futuro` continua sem commits, e não existe outro plano `000`.
- Os drifts declarados conferem:
  - o plano `000` do api usa `codex/plan-cycle-000`, e o README do api usa `chore/cycle-NNN-plan`;
  - o validador do api tem 726 linhas.
- A stack citada confere com o `package.json` do `mae-no-controle`: `next` 16, `typescript`, `tailwindcss` 4, `@supabase/ssr`, `zod`, `vitest` e `@playwright/test`.
- Os arquivos citados do site e do Meus-Investimentos existem.
- A sequência respeita as regras do api: a PR do plano só é aberta após a revisão e a aprovação, aptidão não equivale a aprovação, e o encerramento não tem issue recursiva.
- O handoff do rascunho está completo.

#### Bloqueadores

- **B1 — O CI da PR A não pode passar com o cenário 18.** O manifesto é criado na issue A, e o Item 4 exige que "o CI passa no repositório real". Porém `design-system/DESIGN.md` só nasce na PR B. Se o manifesto exigir esse arquivo desde a A, o CI da A falha. O plano precisa declarar que `DESIGN.md` entra no manifesto na PR B, ou que o cenário 18 só valida as seções quando o arquivo existe. O mesmo vale para o link do README (Item 6) para o `DESIGN.md`.
- **B2 — O validador reprovaria o próprio plano.** O cenário 12 recusa referências a `../Meus-Investimentos` e `C:\Programas\...`. Este plano fica em `_project/drafts/` e contém essas strings literalmente, na linha de contexto do clone e no próprio enunciado do cenário 12. O plano precisa definir o alcance da verificação (quais raízes e extensões, como o api faz com `operationalRoots`) e reescrever os exemplos para que não casem com o padrão, ou declarar uma exceção para o texto normativo.
- **B3 — Gates sem definição.** O plano usa os Gates 0, A, B, C, D e final, mas não diz o que cada um autoriza e o que não autoriza. O plano de referência do api tinha essa tabela, em "Gates humanos do bootstrap", e ela não foi herdada. Hoje o Gate B agrega aprovação, escrita direta em `main`, publicação e merge da PR do plano e criação das issues. O Gate C não define se inclui o merge da PR A. E a "autorização de merge" das PRs A e B não tem gate nomeado. Dada a lição do api sobre aprovação mal interpretada, a `v2` precisa da tabela "Gate | Autoriza | Não autoriza | Evidência", com os merges de A, B e do encerramento explícitos.
- **B4 — O template de PR não seria aplicado.** `.github/PULL_REQUEST_TEMPLATE/pull_request_template.md` só é usado via parâmetro `?template=`. O GitHub preenche automaticamente apenas `pull_request_template.md` na raiz, em `docs/` ou em `.github/`. G1 e G3 dependem desse checklist como enforcement. O caminho correto é `.github/pull_request_template.md`. O api tem o mesmo defeito, que não deve ser herdado.

#### Ressalvas

- **R1 — Padrão de nome das migrações.** O cenário 16 fixa `AAAAMMDDHHMM`. O `mae-no-controle` usa data seguida de sequência (`202610040001`), e o `supabase migration new` gera 14 dígitos (`AAAAMMDDHHMMSS`). Escolher uma convenção e alinhar o validador a ela. A recomendação é aceitar o formato do CLI.
- **R2 — Semântica da regra G2.** Como as migrações são imutáveis (G4), o RLS pode ser habilitado numa migração posterior. A regra deve avaliar o conjunto de `supabase/migrations/` e não cada arquivo isolado. Também deve tratar `if not exists`, `public.` explícito ou implícito, identificadores entre aspas e maiúsculas e minúsculas, e ignorar schemas fora de `public`.
- **R3 — Alcance da regra G3.** "Nomes de ativos e instituições reais", tomado ao pé da letra, proíbe CDI, IPCA, Ibovespa e códigos SGS, que são indispensáveis à KB e aos testes do ciclo `002`. A regra deve se limitar às posições, saldos e instituições do usuário. Índices públicos e o catálogo de benchmarks são permitidos.
- **R4 — O validador sem Git vê arquivos ignorados.** Ele lê a árvore de trabalho e reprovaria arquivos locais legítimos, como o SQLite do ciclo `004`, `node_modules/` e `supabase/.temp/`. Declarar exclusões no manifesto, alinhadas ao `.gitignore`. Definir também que `*.sql` só é permitido em `supabase/migrations/` e em `supabase/seed.sql` (com dados fictícios).
- **R5 — Passo de imutabilidade no CI.** Exige `fetch-depth: 0` ou a busca explícita da base. Também falta definir o comportamento em `push` para `main` (comparar com `github.event.before`), já que, sem branch protection, um push direto escapa à verificação de PR.
- **R6 — Fonte.** O Google Fonts não fixa versão. A "fixada em versão" do critério do Item 7 contradiz "abre sem rede". Recomenda-se versionar os `woff2` da IBM Plex Sans com `OFL.txt` em `design-system/assets/fonts/`, preservando o recurso `tnum` em qualquer subset, e incluí-los em "Arquivos afetados". A página passa a abrir totalmente offline, e o ciclo `001` reaproveita os arquivos.
- **R7 — Chart.js não é decisão do Gate A.** A paleta de gráficos "para Chart.js" compromete uma biblioteca não registrada na stack. Tornar a paleta agnóstica, em tokens, ou registrar a escolha na ADR-002.
- **R8 — Alcance de "centavos inteiros".** A origem usa `Numeric(15,2)` para valores, `Numeric(15,6)` para o valor dos benchmarks e `Numeric(5,2)` para percentuais. A ADR-002 deve limitar "centavos inteiros" a quantias monetárias e deixar para o ciclo `002` a precisão de índices, taxas e percentuais.
- **R9 — Exceção de bootstrap incompleta.** Ela cobre só `revisar_plano`. O Gate 0 e a issue A usam `criar_issues` e `implementar_issue` antes de esses workflows existirem localmente. Estender a exceção nominalmente.
- **R10 — A decisão 1 do Gate A não tem ADR.** Não há destino para "privado até a estabilização, depois público sob MIT", nem para a auditoria do histórico antes da abertura. Registrar na ADR-001 ou na ADR-003.
- **R11 — Lições do api.** Das quatro lições, uma trata de `actions/setup-node` (`package-manager-cache: false`), não de gates e handoff. Corrigir a redação e aplicar essa lição explicitamente no `governance.yml` do Item 4.
- **R12 — Logotipo em SVG.** O texto do logotipo deve ser convertido em contornos, para não depender da fonte instalada. Incluir isso como critério de aceite do Item 7.
- **[MANUAL] — Evidência do Gate A.** As decisões do Gate A estão registradas apenas neste plano, a partir do diálogo. No Gate B, o responsável deve confirmar que a lista reflete fielmente o que foi decidido.

#### Correções materiais

Nenhuma aplicada nesta rodada. O workflow emite parecer e não corrige o plano.

#### Resposta da v2

| Achado | Resolução na `v2` |
| :-- | :-- |
| B1 | O cenário 18 passa a ser condicional. O manifesto da PR A não exige o `DESIGN.md`, e a PR B o torna obrigatório editando só o manifesto (Itens 5 e 7). O link do README para o `DESIGN.md` entra pela PR B (Item 6) |
| B2 | O escopo do cenário 12 está definido (raízes, extensões e padrões vindos do manifesto), com `_project/` fora e coberto por revisão manual, e os testes montam as strings por composição. As strings literais foram retiradas do corpo do plano. O parecer da rodada 1 fica preservado sem alteração, e o critério do Item 5 exige que o validador passe sobre ele |
| B3 | Nova seção "Gates humanos do bootstrap", com os Gates A, B, C, M-A, D, M-B e E, as condições de parada e as Etapas 0 e final renomeadas para não se confundirem com gates |
| B4 | O template fica em `.github/pull_request_template.md`, com critério de aplicação automática e o cenário 19 no validador |
| R1 | Convenção `AAAAMMDDHHMMSS_assunto.sql`, o formato do Supabase CLI, nas convenções e no cenário 16 |
| R2 | Regra precisa da G2: avalia o conjunto das migrações, normaliza schema, aspas e caixa, e é declarada como heurística. Fixtures descritas no cenário 15 |
| R3 | Alcance da G3 definido: dados do usuário proibidos, índices públicos e nomes fictícios permitidos |
| R4 | Exclusões de varredura no manifesto, `local/` como lugar dos dados reais e locais permitidos para `*.sql`, incluindo `supabase/tests/` (cenário 14) |
| R5 | Regra precisa do passo de CI: `fetch-depth: 0`, comparação por evento, primeiro push e qualquer status diferente de `A` |
| R6 | Fonte versionada em `design-system/assets/fonts/`, sem subset, com `OFL.txt`, origem e versão na KB-001. Página de referência sem rede |
| R7 | Paleta de gráficos em tokens agnósticos. Biblioteca adiada para o ciclo `003`, como interpretação a confirmar no Gate B |
| R8 | Alcance dos centavos inteiros como interpretação a confirmar no Gate B e registrado na ADR-002 |
| R9 | A exceção de bootstrap cobre nominalmente `rascunhar_plano`, `revisar_plano`, `criar_issues` e `implementar_issue` |
| R10 | ADR-003 renomeada para `ADR-003_acesso_privacidade_publicacao.md`, registrando a decisão 1 e a auditoria do histórico antes da abertura |
| R11 | Redação corrigida no Item 1, e `package-manager-cache: false` explícito no Item 4 |
| R12 | Critério de SVG sem `<text>`, com `viewBox`, sem recurso externo e símbolo legível a 32 px |
| [MANUAL] | Precondição do Gate B: o responsável confirma a lista do Gate A e as interpretações |

### Rodada 2

- **Data:** 2026-10-12
- **Versão revisada:** `v2`, incluindo o registro da confirmação das interpretações feito antes da abertura da rodada, sem mudança material.
- **Procedimento:** o mesmo da rodada 1.
- **Veredito:** `APTO COM RESSALVAS`
- **Bloqueios remanescentes:** nenhum.
- **Aprovação humana pós-revisão:** `Aprovada em 2026-10-12` (Gate B: plano `v2`, fidelidade do Gate A e quatro arquivos do commit raiz)

#### Verificações

- O status é `Em Revisão`, existe um único plano `000`, o remoto continua sem referências e os quatro commits fixados conferem.
- Todas as seções do template estão presentes.
- Os quatro bloqueadores da rodada 1 estão resolvidos no corpo do plano:
  - **B1:** cenário 18 condicional e manifesto atualizado pela PR B;
  - **B2:** escopo do cenário 12 definido, sem caminhos literais fora do parecer histórico, que está fora do escopo;
  - **B3:** tabela de gates com precondição, autorização, vedação e evidência;
  - **B4:** template de PR no caminho padrão, com o cenário 19.
- As ressalvas R1 a R12 têm resolução rastreável na tabela "Resposta da v2".
- O responsável confirmou as interpretações das decisões 2 e 6 em 2026-10-12.
- A sequência é compatível com as regras de referência:
  - a PR do plano só é aberta após a aprovação;
  - a issue B só começa depois de M-A;
  - o encerramento não tem issue própria;
  - o merge de cada PR tem gate próprio.

#### Ressalvas

Nenhuma exige nova rodada. Elas são orientações vinculantes para a execução e devem constar das tasks correspondentes.

- **S1 — Verificar `tnum` antes de adotar a fonte.** No início da issue B, confirmar que a versão fixada da IBM Plex Sans expõe o recurso `tnum`, inspecionando os recursos OpenType ou comparando a largura de "111" e "888". Se não expuser, parar e consultar o responsável, porque a decisão 7 exige algarismos tabulares.
- **S2 — Proveniência da fonte só existe na PR B.** A KB-001 nasce na PR A, mas a versão e a URL da fonte só são conhecidas na issue B. A PR B também deve atualizar a KB-001, que passa a constar de "Atualizar (PR B)" ao marcar `Aprovado`.
- **S3 — Template da task da issue A.** A exceção de bootstrap cobre `implementar_issue`, mas não diz qual template a task da issue A instancia. O primeiro commit da PR A deve criar `.agent/templates/task.md`, e a task `000_task_issue-N.md` deve ser instanciada a partir dele, com a origem registrada.
- **S4 — Editorial.** O item "O plano `000` do api tinha uma tabela de gates humanos…" não descreve um drift das referências, e sim uma correção da `v1`. Remover ou reescrever ao marcar `Aprovado`, sem efeito material.
- **S5 — Push forçado em `main`.** Se `github.event.before` não for alcançável após um push forçado, o `git diff` falha e o passo G4 reprova. Esse comportamento é seguro (falha fechada) e deve ser registrado na demonstração do passo, na task da issue A.

#### Correções materiais
Nenhuma correção material. Na atualização para `Aprovado` foram aplicados os ajustes textuais de S2 (KB-001 incluída em "Atualizar (PR B)") e S4 (removido o item editorial da lista de drifts), sem alterar escopo, gates ou critérios. As ressalvas S1, S3 e S5 seguem como orientações para a execução.
Nenhuma aplicada nesta rodada. Os ajustes textuais de S2 e S4 podem ser aplicados na atualização para `Aprovado`, na Etapa 0, por não alterarem escopo, gates ou critérios.

## Pós-mortem

- **Data de conclusão:** —
- **Desvios:** —
- **Lições comprovadas:** —
