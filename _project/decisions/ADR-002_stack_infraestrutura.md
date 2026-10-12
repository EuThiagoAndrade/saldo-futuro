---
title: "Stack, infraestrutura, escopo funcional e dados"
tags:
  - arquitetura
  - infraestrutura
  - dados
author: "Thiago Andrade e Claude"
module: "Arquitetura"
last_updated: "2026-10-12"
origin_cycle: "000"
---

# ADR-002: Stack, infraestrutura, escopo funcional e dados

## Status

Aceito. Implantação a partir do ciclo `001`.

## Contexto

O Saldo Futuro substitui o `Meus-Investimentos`, uma aplicação FastAPI, SQLAlchemy e SQLite, com frontend em HTML/CSS/JS puro, executada localmente e sem autenticação. O novo produto precisa:

- rodar na web e ser usado principalmente no celular;
- autenticar e isolar vários usuários;
- preservar a exatidão dos cálculos financeiros;
- operar sem custo fixo relevante.

O responsável já mantém em produção o `mae-no-controle` com Next.js, Supabase e Vercel, e conhece a operação dessa linha.

As decisões abaixo foram aprovadas pelo responsável em 2026-10-11 e 2026-10-12 (decisões 2, 3, 5 e 6 do Gate A do plano `000`). As interpretações das decisões 2 e 6 foram confirmadas em 2026-10-12.

## Decisão

### Stack (decisão 2)

- Next.js com App Router, sobre React (no `mae-no-controle`, React 19), TypeScript, Tailwind CSS 4, `@supabase/ssr`, Zod, Vitest e Playwright, na mesma linha do `mae-no-controle`. As versões exatas são fixadas no ciclo `001`; a referência observada é o `package.json` do `mae-no-controle` @ `2f4a304`.
- Hospedagem na Vercel, integrada ao GitHub, e banco Supabase (PostgreSQL).
- Dados em tabelas relacionais, não no agregado JSONB usado pelo `mae-no-controle`.
- A biblioteca de gráficos **não** faz parte desta decisão. O design system define a paleta em tokens agnósticos, e a escolha fica para o ciclo `003`, registrada em ADR.

### Infraestrutura (decisão 3)

- Projeto Supabase novo e separado, no plano gratuito, com consulta agendada para evitar a pausa por inatividade.
- Domínio `investimentos.euthiagoandrade.com.br`.
- Desenvolvimento contra Supabase local.
- Previews da Vercel nunca usam dados reais.

### Escopo funcional (decisão 5)

- Paridade funcional com o `Meus-Investimentos`, cujo inventário está na KB-001.
- Interface pensada primeiro para o celular, com barra inferior de quatro itens e "Mais".
- Instalável como PWA, sem modo offline.
- Fuso horário `America/Cuiaba`.
- Sincronização com o SGS do Banco Central sob demanda.

### Dados (decisão 6)

- Migração única a partir do SQLite de origem (ciclo `004`). A tabela `investimentos_legacy` e o migrador histórico de CSV ficam de fora.
- Quantias monetárias (saldos, lançamentos, aportes, resgates, rendimentos e totais consolidados) são representadas em **centavos inteiros**.
- Valores de índices, taxas e percentuais não são dinheiro. Na origem eles usam `Numeric(15,6)` (valor de benchmark) e `Numeric(5,2)` (percentual consolidado). Sua precisão é definida no ciclo `002`, na KB de regras financeiras.

## Consequências

### Positivas

- Linha tecnológica já operada pelo responsável, com custo próximo de zero.
- RLS do PostgreSQL como mecanismo de isolamento entre usuários (ADR-003).
- Centavos inteiros eliminam erros de arredondamento de ponto flutuante nas quantias.
- Um único runtime (TypeScript) para interface, regras e testes.

### Trade-offs

- As regras financeiras escritas em Python precisam ser reescritas e validadas contra casos de referência (barreira G1, ciclo `002`).
- O plano gratuito do Supabase pausa projetos inativos e tem limites de armazenamento e conexões.
- Sem modo offline, o uso exige conexão.
- Duas precisões numéricas distintas (centavos e índices) exigem disciplina de tipos.

## Alternativas consideradas

Os motivos abaixo foram reconstruídos a partir das decisões registradas no plano `000`; o diálogo de avaliação não está versionado.

- **Manter o FastAPI e publicá-lo na Vercel:** o SQLite exige sistema de arquivos persistente, que funções serverless não oferecem, e o backend continuaria sem autenticação e sem isolamento entre usuários. Exigiria trocar o banco de qualquer forma.
- **Híbrido (frontend Next.js e backend FastAPI):** dois runtimes, dois deploys e validação duplicada entre Python e TypeScript, sem ganho sobre a linha já operada no `mae-no-controle`.
- **Agregado JSONB por usuário, como no `mae-no-controle`:** dificulta consultas por período e ativo, restrições de integridade e RLS por linha.

## Referências

- Plano do ciclo `000`, seção "Decisões aprovadas antes da redação (Gate A)".
- `mae-no-controle` e `Meus-Investimentos`: proveniência em `_project/knowledge/KB-001_proveniencia_ecossistema.md`.
- ADR-003: acesso, privacidade e publicação.
