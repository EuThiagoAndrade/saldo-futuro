---
title: "Acesso, perfis, privacidade e publicação"
tags:
  - segurança
  - privacidade
  - acesso
author: "Thiago Andrade e Claude"
module: "Segurança"
last_updated: "2026-10-12"
origin_cycle: "000"
---

# ADR-003: Acesso, perfis, privacidade e publicação

## Status

Aceito. O modelo de acesso é implantado a partir do ciclo `001`; as políticas de privacidade e publicação valem desde o ciclo `000`.

## Contexto

O Saldo Futuro guarda carteiras de investimento de vários usuários. Um vazamento entre usuários ou a exposição de dados reais no repositório é um dano irreversível. O repositório é privado durante o desenvolvimento e será tornado público depois, e o histórico do Git é permanente.

As decisões abaixo foram aprovadas pelo responsável em 2026-10-11 e 2026-10-12 (decisões 1 e 4 do Gate A do plano `000`).

## Decisão

### Acesso e perfis (decisão 4)

- Login com Google OAuth, restrito a uma lista de e-mails autorizados mantida no banco. Um e-mail fora da lista não cria conta nem sessão.
- Dois perfis: `admin` e `user`. O primeiro administrador é o e-mail do responsável, configurado só no banco no ciclo `001`, nunca no repositório.
- Toda tabela de dados de carteira tem `user_id` e RLS por usuário: cada usuário lê e altera somente as próprias linhas.
- O administrador gerencia a lista de acessos e o catálogo global de benchmarks. Ele **não** lê nem altera carteiras de outros usuários; o perfil `admin` não concede bypass de RLS sobre dados de carteira.
- Benchmarks formam um catálogo global, legível por todos os usuários autenticados e alterável só pelo administrador.

Enforcement: barreira G2 em `_project/README.md`.

### Privacidade (barreira G3)

- Dados do usuário, conforme definidos em `.agent/ai_behavior.md`, nunca entram no repositório, em issues, PRs, tasks, commits, logs, prints, fixtures ou seeds.
- Índices públicos, códigos do SGS, classes genéricas de ativo e nomes fictícios são permitidos.
- Dados reais de trabalho local ficam em `local/`, ignorado pelo Git.
- Previews e ambientes de teste usam somente dados fictícios.

Enforcement: barreira G3 em `_project/README.md`.

### Publicação do repositório (decisão 1)

- O produto se chama Saldo Futuro e mora no repositório `saldo-futuro`.
- O repositório permanece privado até a estabilização do produto.
- Antes de torná-lo público, um ciclo próprio audita todo o histórico do Git em busca de dados do usuário e segredos. A abertura depende de autorização explícita do responsável após essa auditoria.
- Licença MIT, já registrada em `LICENSE` desde o commit raiz.

## Consequências

### Positivas

- O isolamento é garantido pelo banco, não só pela aplicação.
- O administrador não se torna ponto único de exposição das carteiras.
- A política de privacidade vale desde o primeiro commit, o que reduz o custo da auditoria antes da abertura.

### Trade-offs

- Suporte a usuários não pode inspecionar a carteira deles; diagnósticos dependem de dados fictícios ou de autorização do próprio usuário.
- RLS exige testes de banco dedicados (ciclo `001`) e cuidado com funções `security definer`.
- A política de fixtures fictícias exige gerar casos de teste em vez de reaproveitar dados reais.

## Alternativas consideradas

- **Cadastro aberto com confirmação de e-mail:** desnecessário para um grupo pequeno e conhecido, e amplia a superfície de abuso.
- **Administrador com acesso total para suporte:** contradiz a privacidade das carteiras decidida no Gate A.
- **Isolamento só na camada de aplicação:** um erro de consulta exporia dados de outro usuário; a RLS é defesa no próprio banco.
- **Repositório público desde o início:** aumenta o risco de expor dados reais durante a migração (ciclo `004`).

## Referências

- Plano do ciclo `000`, seção "Decisões aprovadas antes da redação (Gate A)".
- `.agent/ai_behavior.md`, seção "Privacidade de dados financeiros".
- `_project/README.md`, barreiras G2 e G3.
