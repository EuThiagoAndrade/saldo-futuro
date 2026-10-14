---
title: "Governança agnóstica com adapters de descoberta"
tags:
  - governança
  - agentes
  - arquitetura
author: "Thiago Andrade e Claude"
module: "Governança"
last_updated: "2026-10-13"
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
| Gemini CLI | `GEMINI.md` | Import `@./.agent/ai_behavior.md`, resolvido relativo ao próprio arquivo, e instrução textual de leitura integral |
| Antigravity | `AGENTS.md` (e `GEMINI.md`, quando lido) | Instrução textual de leitura integral; o import `@arquivo` não insere conteúdo nessa ferramenta |

Com `CLAUDE.md` presente, o Claude Code não lê `AGENTS.md` por padrão; ele só o leria por import ou por configuração do usuário. Como o `AGENTS.md` só contém a instrução de descoberta, uma eventual leitura dupla não cria política concorrente.

O Antigravity mantém compatibilidade com os diretórios legados `.agent/skills/` e `<dir>/.agent/rules/*.md`. Para não colidir com o núcleo canônico, o repositório não cria `.agent/rules/` nem arquivos `SKILL.md`. Os workflows de `.agent/workflows/` são lidos como texto, e não como recurso nativo da ferramenta.

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
- Antigravity: <https://antigravity.google/docs/rules> e <https://antigravity.google/docs/skills> (verificados em 2026-10-13, ciclo `002`: leitura nativa de `AGENTS.md` ou `GEMINI.md`; import `@[rótulo](caminho)`; compatibilidade com `.agent/skills/` e `.agent/rules/`).
- Revalidação de 2026-10-13 (ciclo `002`): Claude Code, sem leitura padrão de `AGENTS.md` quando há `CLAUDE.md`; Gemini CLI e Codex sem mudança material.
