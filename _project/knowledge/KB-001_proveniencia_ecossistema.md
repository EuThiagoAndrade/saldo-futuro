---
title: "Proveniência e ecossistema"
tags:
  - governança
  - proveniência
  - ecossistema
author: "Thiago Andrade e Claude"
module: "Governança"
last_updated: "2026-10-12"
origin_cycle: "000"
---

# KB-001: Proveniência e ecossistema

## Finalidade

Registrar as fontes externas usadas no bootstrap do Saldo Futuro, a posição do produto no ecossistema de domínios do responsável e o inventário funcional que define a paridade com o `Meus-Investimentos`. É consultada ao planejar os ciclos `001` a `004` e ao auditar de onde veio cada regra da governança.

## Limite de autoridade

Conhecimento de referência. Nenhuma fonte externa é plano executável nem autoriza mudança neste repositório; decisões locais vivem nas ADRs e nos planos. Este repositório não depende de caminho local, worktree ou checkout irmão: toda fonte é auditável pelas URLs, commits e blob SHAs abaixo, verificados em 2026-10-12.

## Fontes

### `euthiagoandrade-api` @ `9f79071bc619e826da4554f0f85e4ffe7f135f8b`

- Função: origem do núcleo de autoridades, estados, contrato de handoff, workflows, templates, skills, lições e validador.
- Limite: não transporta regras de API editorial, Docker, Oracle VPS ou snapshot.
- `main`: <https://github.com/EuThiagoAndrade/euthiagoandrade-api>
- Versão fixada: <https://github.com/EuThiagoAndrade/euthiagoandrade-api/tree/9f79071bc619e826da4554f0f85e4ffe7f135f8b>

| Arquivo | Git blob SHA |
| :-- | :-- |
| `.agent/ai_behavior.md` | `78e9e427c21ef0f99bb31139d1be776e4ae28d31` |
| `.agent/lessons_learned.md` | `e3628f2c32f325961d4de011bbf2261c57eeb7d8` |
| `.agent/workflows/revisar_plano.md` | `0a264aa30df338e829cfc6552c68420ac298fcac` |
| `.agent/templates/plano_implementacao.md` | `b32efca4ffa25daff9867bb6c164888fdbf1116f` |
| `_project/README.md` | `4dd68bf945a8fc76a25a239ef2ce099803ae1e4c` |
| `_project/executed/000_bootstrap_governanca/000_plan.md` | `8e35806bf639f74e8ab5429c16a535954cb0e38d` |
| `scripts/validate-governance.mjs` | `a32065558fcf9f92dd2f2779381ed9eb88156488` |

### `euthiagoandrade-site` @ `b5ec34c1ced5acb8669bb0d2426edfdf9167fd62`

- Função: estrutura do `design-system/DESIGN.md`, adapter `GEMINI.md` e contexto de infraestrutura do ecossistema.
- Limite: não transporta regras de Astro, conteúdo editorial ou Cloudflare Pages.
- `main`: <https://github.com/EuThiagoAndrade/euthiagoandrade-site>
- Versão fixada: <https://github.com/EuThiagoAndrade/euthiagoandrade-site/tree/b5ec34c1ced5acb8669bb0d2426edfdf9167fd62>

| Arquivo | Git blob SHA |
| :-- | :-- |
| `design-system/DESIGN.md` | `279dfde218c48ed04c310f4b36bf067b85b042cd` |
| `GEMINI.md` | `f6d4559149e76ef1153702537239837de96ec337` |
| `_project/knowledge/KB-001_infra_ecosystem_context.md` | `19a7f5d3422bf4ba3252fa66b39f47a6a54ed10a` |

### `mae-no-controle` @ `2f4a304f7ad62b1166e47ded26582d176f6311f3`

- Função: referência da stack aprovada na ADR-002 (Next.js, Tailwind 4, `@supabase/ssr`, Zod, Vitest, Playwright, Vercel e Supabase).
- Limite: não transporta o modelo de estado agregado em JSONB nem suas versões de dependências, que são fixadas no ciclo `001`.
- `main`: <https://github.com/EuThiagoAndrade/mae-no-controle>
- Versão fixada: <https://github.com/EuThiagoAndrade/mae-no-controle/tree/2f4a304f7ad62b1166e47ded26582d176f6311f3>

| Arquivo | Git blob SHA |
| :-- | :-- |
| `package.json` | `f101ff1637b488e537c524962e30216984484b75` |
| `docs/ARQUITETURA.md` | `f0c697d5a8477401fc67d1d8c231484c9c8ed55a` |
| `docs/CONFIGURACAO.md` | `45d2c714460ad8a4d519dc70b5ee567fa53f7c07` |

### `Meus-Investimentos` @ `1b13b033ce4335c09df80237c8c31b96b37e3797`

- Função: especificação funcional e fonte dos dados do Saldo Futuro.
- Limite: não é base de código; código, layout, design system e governança `.agent` não são reaproveitados. Regras de cálculo são portadas no ciclo `002`, com casos de referência.
- `main`: <https://github.com/EuThiagoAndrade/Meus-Investimentos>
- Versão fixada: <https://github.com/EuThiagoAndrade/Meus-Investimentos/tree/1b13b033ce4335c09df80237c8c31b96b37e3797>

| Arquivo | Git blob SHA |
| :-- | :-- |
| `docs/architecture/README.md` | `4230a29e2334ec8774cc13c8abca2397cb2bbe70` |
| `docs/architecture/decisions/0002-benchmarks-diarios-sgs.md` | `a15237dd1fd08632c1d7555f8a1dddd0c87b626f` |
| `docs/architecture/decisions/0003-retorno-modified-dietz.md` | `b7cf8dca628b8f70b5f4e756693e7803780c6989` |

### Fonte tipográfica IBM Plex Sans 1.1.0

- Função: única família tipográfica do produto (`design-system/DESIGN.md`, seção 3), servida localmente.
- Limite: arquivos de terceiros sob a SIL Open Font License 1.1; o nome reservado "Plex" não pode ser usado em versões modificadas. Os arquivos são versionados sem modificação e sem subset.
- Release oficial: <https://github.com/IBM/plex/releases/tag/%40ibm%2Fplex-sans%401.1.0> (tag `@ibm/plex-sans@1.1.0`, publicada em 2024-11-13).
- Pacote baixado em 2026-10-12: `ibm-plex-sans.zip`, 9.921.777 bytes, SHA-256 `fb365d910566e6d199cc2c15579a7dd9a267128e18431a394ed81f1970c69200`.
- Arquivos versionados, copiados de `ibm-plex-sans/fonts/complete/woff2/`:

| Arquivo em `design-system/assets/fonts/` | SHA-256 |
| :-- | :-- |
| `IBMPlexSans-Regular.woff2` | `ba711a3085ff9f27440b6b9c4550cfc47c97bf36591d5da958b975bb3add8c1a` |
| `IBMPlexSans-Medium.woff2` | `5660f8a658f8bb50dbc005232f885eadffd2bc1c235c4f6fbb63469d1f9cde6d` |
| `IBMPlexSans-SemiBold.woff2` | `f78048030eab62e860efa39a0df79e2e5581bf122eb95b9bc42c0b8a4988d205` |
| `OFL.txt` (cópia de `license.txt` do mesmo diretório) | `91c25c350d3cac39da2736d74f7ba37ef648f5237a4e330a240615bc8d8c4360` |

- Algarismos: a fonte não tem a feature `tnum`, mas os algarismos padrão são tabulares (medição na task da issue #3).
- Os contornos do logotipo (`design-system/assets/logo-saldo-futuro.svg`) foram extraídos dos TTF SemiBold e Regular do mesmo pacote.

## Ecossistema de domínios

Fonte: KB-001 do `euthiagoandrade-site`, tabela acima. Estado conhecido em 2026-10-12:

| Endereço | Hospedagem | Função |
| :-- | :-- | :-- |
| `euthiagoandrade.com.br` e `www` | Cloudflare Pages | Site público |
| `api.euthiagoandrade.com.br` | Cloudflare Tunnel até a Oracle VPS | API editorial |
| `admin.euthiagoandrade.com.br` | Cloudflare Tunnel até a Oracle VPS | Painel administrativo (planejado) |
| `investimentos.euthiagoandrade.com.br` | Vercel | Saldo Futuro (planejado, ciclo `001`) |

O DNS do domínio é gerenciado no Cloudflare. O Saldo Futuro é o único serviço do ecossistema hospedado na Vercel e não depende da Oracle VPS nem do Tunnel. A configuração do registro DNS fica para o ciclo `001`.

## Inventário funcional do Meus-Investimentos

Inventário de alto nível no commit fixado, que define o escopo de paridade. O detalhamento das regras é do ciclo `002`, e o das telas, do ciclo `003`.

### Modelo de dados

- **Ativos:** cadastro de ativos, com desativação lógica.
- **Eventos:** fatos financeiros imutáveis por ativo (lançamentos manuais e ajustes calculados), incluindo valores em trânsito sem ativo.
- **Posições mensais:** saldo de início e fim por ativo e mês, materializado a partir dos eventos.
- **Consolidado mensal:** total, variação absoluta e percentual, totais de aportes, resgates e rendimento, e situação do período (aberto ou fechado).
- **Benchmarks:** catálogo com periodicidade e código SGS opcional.
- **Séries de benchmark:** valores mensais ou diários, únicos por benchmark e data.
- Fora da paridade: a tabela `investimentos_legacy` e o migrador histórico de CSV.

### Fluxos

- **Lançamentos:** registrar eventos por ativo e mês.
- **Fechamento mensal em três etapas:** calcular pendências (saldo esperado por ativo), ajustar saldos com eventos calculados para a diferença entre o saldo esperado e o real, e fechar o período, materializando posições e consolidado. Inclui reabrir um período fechado e validar o fechamento.
- **Consolidação:** consolidação mensal e evolução anual.
- **Retorno mensal:** método Modified Dietz (ADR 0003 da origem).
- **Benchmarks:** cadastro, edição, remoção, séries importadas manualmente ou por JSON, sincronização com o SGS sob demanda (ADR 0002 da origem) e comparação da carteira com o benchmark.
- **Painel:** resumo, distribuição por ativo e gráficos de evolução.

### Telas

Painel, transações (lançamentos), ativos, benchmark, comparação e ajuda.

## Histórico

| Data | Ciclo | Alteração |
| :-- | :-- | :-- |
| 2026-10-12 | `000` | Criação (issue #2) |
| 2026-10-12 | `000` | Proveniência da IBM Plex Sans 1.1.0 (issue #3) |
