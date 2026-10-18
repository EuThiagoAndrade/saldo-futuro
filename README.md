# Saldo Futuro

Sistema web de gestão de investimentos pessoais: registro de lançamentos por ativo, fechamento mensal, consolidação da carteira, retorno mensal e comparação com benchmarks como CDI e IPCA. É pensado primeiro para o celular e atende vários usuários, cada um com acesso só à própria carteira.

O Saldo Futuro substitui o [Meus-Investimentos](https://github.com/EuThiagoAndrade/Meus-Investimentos), uma aplicação local, como especificação funcional e fonte dos dados.

## Comece por aqui

- **Entender o produto:** [KB-003, visão do produto e da arquitetura](_project/knowledge/KB-003_visao_produto_arquitetura.md). Diz o que existe, onde está e por quê, sem exigir a leitura dos planos antigos.
- **Entender o processo:** [`_project/README.md`](_project/README.md), com os níveis, os pontos de aprovação, as situações e o glossário.
- **Saber em que pé está:** [`_project/cycles.md`](_project/cycles.md) e o bloco "Próximo passo" do ciclo ativo. Em qualquer ferramenta de IA, peça "continue o ciclo NNN".

## Estado atual

O ciclo `004` entregou as telas do produto: Início, ativos, lançamentos, transferências, fechamento mensal, benchmarks e comparação, sincronização com o SGS e administração de acessos. A versão `0.3.0` reúne essas telas sobre as regras financeiras do ciclo `003`, especificadas na [KB-004](_project/knowledge/KB-004_regras_financeiras.md). A fundação inclui login Google restrito a e-mails autorizados, perfis `admin` e `user`, RLS por usuário e PWA instalável.

O ciclo `005` resolveu as pendências deixadas pelo `004`: o logo aparece à esquerda no cabeçalho mobile, e a volta ao Início ficou cerca de 40% mais rápida na simulação local com atraso por chamada, porque as consultas da conferência de coerência passaram a ser feitas em paralelo. No caminho, o ciclo corrigiu pela trilha curta (#57) uma falha em que o Next reaproveitava a leitura da marca final e anulava essa conferência. A conferência autenticada em produção passou nos seis itens do roteiro. O [registro de encerramento](_project/executed/005_logo_mobile_desempenho_navegacao/005_task_closure.md) traz as evidências e os limites.

O ciclo `006` migrou a carteira do `Meus-Investimentos` para o Saldo Futuro por uma migração única, simulada, gravada e conferida sem diferença mês a mês. A **virada ocorreu em 2026-10-18**: desde então, o Saldo Futuro é a fonte de verdade. Os meses importados da planilha da origem ficam com rentabilidade `N/D`. O [registro de encerramento](_project/executed/006_migracao_dados_virada/006_task_closure.md) traz o relato só com contagens.

## Mapa de ciclos

| Ciclo | Entrega | Estado |
| :-- | :-- | :-- |
| `000` | Governança e design system | Concluído |
| `001` | Fundação: aplicação Next.js, Supabase, autenticação, perfis, RLS, deploy e release-please | Concluído |
| `002` | Reforma da governança: níveis por risco, próximo passo predefinido, modo contínuo e documentação viva | Concluído |
| `003` | Regras financeiras: eventos, fechamento, consolidação, Modified Dietz e benchmarks, com casos de referência | Concluído |
| `004` | Telas pensadas primeiro para o celular | Concluído com pendências registradas |
| `005` | Logo no cabeçalho mobile e desempenho de navegação | Concluído |
| `006` | Migração única dos dados e virada | Concluído |

O registro oficial dos ciclos é [`_project/cycles.md`](_project/cycles.md). Os planos do `004` ao `006` estão em `executed/`. Até o ciclo `001`, os documentos numeravam os ciclos de regras, telas e migração como `002` a `004`; o glossário de `_project/README.md` registra o mapeamento histórico.

## Stack decidida

Next.js (App Router) com React, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL com RLS), Zod, Vitest e Playwright, hospedados na Vercel. A decisão está na [ADR-002](_project/decisions/ADR-002_stack_infraestrutura.md) e é implantada a partir do ciclo `001`.

## Desenvolvimento local

Pré-requisitos: Node.js 24 e npm.

```sh
npm ci
npm run dev        # servidor de desenvolvimento em http://localhost:3000
npm run lint
npm run typecheck
npm test           # testes unitários (Vitest)
npm run build
npm run test:e2e   # ponta a ponta (Playwright); executa o build antes
```

### Supabase local (autenticação e banco)

Exige Docker. O Supabase local usa dados fictícios (`supabase/seed.sql`) e nunca o projeto de produção.

```sh
npx supabase start        # sobe o banco e o Auth locais
npx supabase db reset     # aplica as migrações e o seed
npx supabase test db      # testes de banco (pgTAP), incluindo o isolamento por RLS
npx supabase status -o env
```

Para rodar a aplicação e os testes ponta a ponta com o Supabase local, exporte as variáveis a partir de `API_URL`, `PUBLISHABLE_KEY` e `SECRET_KEY` da saída de `status -o env`:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, também em `.env.local`;
- `NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN=true`, que mostra o login por senha, só neste ambiente;
- `SUPABASE_SECRET_KEY`, só no ambiente dos testes ponta a ponta (não vai para `.env.example`, `.env.local` nem para a Vercel).
- `CRON_SECRET`, um texto qualquer de teste, só para o teste ponta a ponta de `/api/keepalive` (sem ele, esse teste é ignorado).

Sem essas variáveis, a aplicação mostra "Preview sem backend" e os testes de autenticação são ignorados.

O Playwright usa o Chromium dele; `npx playwright install chromium` o instala. Para usar o Chrome já instalado, defina `PLAYWRIGHT_CHANNEL=chrome`. Copie `.env.example` para `.env.local` se precisar de variáveis de ambiente; sem elas, a aplicação roda sem backend.

## Governança

O processo é agnóstico de ferramenta de IA (Claude Code, Codex, Gemini CLI, Antigravity). Os adapters [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) e [`GEMINI.md`](GEMINI.md) apontam para o mesmo núcleo, e o repositório é a única memória do projeto.

O rigor é proporcional ao risco (ADR-004):

- **Trilha curta:** corrige um defeito de algo já especificado.
- **Ciclo leve:** novidade sem risco financeiro, de isolamento ou de processo, num documento só.
- **Ciclo completo:** tudo o que toca cálculo financeiro, RLS ou autenticação, o significado do schema ou a própria governança.

Cada aprovação é dada com uma frase fixa, e toda saída de agente termina com um bloco "Próximo passo" que diz o que conferir e o que dizer. Na trilha curta e no ciclo leve, o modo contínuo permite autorizar o trabalho até a PR de uma vez; cada merge continua com o responsável.

- [`.agent/ai_behavior.md`](.agent/ai_behavior.md): comportamento, autorizações, handoff, segurança e privacidade.
- [`_project/README.md`](_project/README.md): níveis, pontos de aprovação, situações e próximo passo, modo contínuo, trilha curta, barreiras de domínio (exatidão financeira, isolamento por RLS, privacidade e migrações só aditivas) e glossário.
- [`_project/decisions/`](_project/decisions/): decisões duradouras (ADRs).
- [`_project/knowledge/`](_project/knowledge/): conhecimento de referência (KBs).
- [`design-system/DESIGN.md`](design-system/DESIGN.md): identidade visual e contrato de interface. A [página de referência](design-system/referencia.html) mostra o contrato com dados fictícios e abre localmente, sem rede.

Validação da governança, com Node.js 24 e sem dependências:

```sh
node --test scripts/validate-governance.test.mjs
node scripts/validate-governance.mjs
```

## Privacidade

Dados reais de carteira nunca entram no repositório, em issues ou em PRs. Exemplos e testes usam somente dados fictícios. Veja a [ADR-003](_project/decisions/ADR-003_acesso_privacidade_publicacao.md).

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE).
