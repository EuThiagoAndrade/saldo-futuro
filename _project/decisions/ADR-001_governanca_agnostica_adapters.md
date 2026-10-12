---
title: "Governança agnóstica com adapters de descoberta"
tags:
  - governança
  - agentes
  - arquitetura
author: "Thiago Andrade e Claude"
module: "Governança"
last_updated: "2026-10-12"
origin_cycle: "000"
---

# ADR-001: Governança agnóstica com adapters de descoberta

## Status

Aceito

## Contexto

O Saldo Futuro será desenvolvido com mais de uma ferramenta agêntica (Claude Code, Codex e Gemini CLI). Cada ferramenta descobre instruções por um arquivo próprio. Duplicar políticas em cada entrypoint criaria fontes concorrentes que divergem com o tempo; adotar a estrutura de um único fornecedor tornaria o processo dependente dele.

O padrão já foi validado nos repositórios `euthiagoandrade-site` e `euthiagoandrade-api`. Este repositório o adota com aprimoramentos próprios de um sistema financeiro multiusuário: barreiras de domínio, trilha curta para correções e validador dirigido por manifesto (plano do ciclo `000`, aprimoramentos G1 a G8).

## Decisão

Manter `.agent/` e `_project/` como núcleo canônico independente de ferramenta, com `design-system/DESIGN.md` como contrato visual. `AGENTS.md`, `CLAUDE.md` e `GEMINI.md` são adapters mínimos: apontam para `.agent/ai_behavior.md` e não definem políticas substantivas. Workflows, templates, skills, validador, CI e templates do GitHub consomem as autoridades canônicas; não são fontes normativas.

| Ferramenta | Adapter | Mecanismo |
| :-- | :-- | :-- |
| Codex | `AGENTS.md` | Instrução textual para leitura integral de `.agent/ai_behavior.md` |
| Claude Code | `CLAUDE.md` | Import `@./.agent/ai_behavior.md`, resolvido relativo ao próprio arquivo |
| Gemini CLI | `GEMINI.md` | Import `@./.agent/ai_behavior.md`, resolvido relativo ao próprio arquivo |

O Claude Code também pode ler `AGENTS.md` além do `CLAUDE.md`. Como o `AGENTS.md` só contém a instrução de descoberta, a leitura dupla não cria política concorrente.

A matriz de autoridade está em `.agent/ai_behavior.md`. O validador e o CI verificam regras canônicas, nunca criam política nova; suas regras estruturais ficam em `scripts/governance-manifest.json`, para que um novo arquivo obrigatório exija editar só o manifesto. Ao alterar um adapter, a sintaxe deve ser revalidada na documentação oficial da ferramenta. Node.js 24 é adotado somente como runtime, sem dependências, do tooling de governança.

## Consequências

### Positivas

- Núcleo portável e uma fonte substantiva por responsabilidade.
- Adapters pequenos, substituíveis e verificáveis pelo validador.
- Automação separada da política normativa.

### Trade-offs

- Cada ferramenta ainda exige um entrypoint.
- Descoberta equivalente não garante execução idêntica entre ferramentas.
- Atualizações das ferramentas exigem revalidação dos adapters.

## Alternativas consideradas

- **Eleger um adapter como fonte universal:** acoplaria a governança a um fornecedor.
- **Copiar as políticas para cada entrypoint:** criaria três fontes que divergem.
- **Migrar o núcleo para um diretório de fornecedor (por exemplo, `.claude/`):** mesma objeção da primeira alternativa.
- **Depender de instruções conversacionais:** não é versionado nem verificável.

## Referências

- ADR-001 e validador do `euthiagoandrade-api`; proveniência em `_project/knowledge/KB-001_proveniencia_ecossistema.md`.
- Claude Code: <https://code.claude.com/docs/en/memory> (revalidado em 2026-10-12: imports `@caminho` relativos ao arquivo, leitura de `AGENTS.md`).
- Gemini CLI: <https://google-gemini.github.io/gemini-cli/docs/cli/gemini-md.html> (revalidado em 2026-10-12: imports `@./caminho`).
- Codex: <https://learn.chatgpt.com/docs/agent-configuration/agents-md.md>.
