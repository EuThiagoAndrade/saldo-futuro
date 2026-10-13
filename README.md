# Saldo Futuro

Sistema web de gestão de investimentos pessoais: registro de lançamentos por ativo, fechamento mensal, consolidação da carteira, retorno mensal e comparação com benchmarks como CDI e IPCA. É pensado primeiro para o celular e atende vários usuários, cada um com acesso só à própria carteira.

O Saldo Futuro substitui o [Meus-Investimentos](https://github.com/EuThiagoAndrade/Meus-Investimentos), uma aplicação local, como especificação funcional e fonte dos dados.

## Estado atual

O ciclo `000` implantou a governança do projeto e o design system. O ciclo `001`, de fundação da aplicação, está em execução: já existe o scaffold Next.js com uma página inicial provisória. **Nenhuma funcionalidade de produto está disponível.**

## Mapa de ciclos

| Ciclo | Entrega | Estado |
| :-- | :-- | :-- |
| `000` | Governança e design system | Concluído |
| `001` | Fundação: aplicação Next.js, Supabase, autenticação, perfis, RLS, deploy e release-please | Em execução |
| `002` | Regras financeiras: eventos, fechamento, consolidação, Modified Dietz e benchmarks, com casos de referência | Planejado |
| `003` | Telas pensadas primeiro para o celular | Planejado |
| `004` | Migração única dos dados e virada | Planejado |

O registro oficial dos ciclos é [`_project/cycles.md`](_project/cycles.md). Os ciclos `002` a `004` ainda não têm plano.

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

O Playwright usa o Chromium dele; `npx playwright install chromium` o instala. Para usar o Chrome já instalado, defina `PLAYWRIGHT_CHANNEL=chrome`. Copie `.env.example` para `.env.local` se precisar de variáveis de ambiente; sem elas, a aplicação roda sem backend.

## Governança

O processo é agnóstico de ferramenta de IA. Os adapters [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) e [`GEMINI.md`](GEMINI.md) apontam para o mesmo núcleo.

- [`.agent/ai_behavior.md`](.agent/ai_behavior.md): comportamento, autorizações, segurança e privacidade.
- [`_project/README.md`](_project/README.md): ciclo de vida, trilha curta para correções e barreiras de domínio (exatidão financeira, isolamento por RLS, privacidade e migrações só aditivas).
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
