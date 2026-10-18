# Payloads efetivos — Issues do ciclo 006

> **Ciclo:** `006`
> **Plano:** `006_plan.md`, v3 aprovada em 2026-10-17, integrada pela PR #62
> **Revisão de origem:** `9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f`
> **Preparado em:** 2026-10-17
> **Situação:** issues A a C criadas e conferidas; implementação de A (#63) autorizada e em execução na branch `feature/issue-63`; B e C aguardam a integração de A
> **Confirmação humana:** "confirmo a criação das issues A, B e C com os payloads de 006_handoff_issues.md" em 2026-10-17

Payloads derivados dos itens 1 a 3 (A, B e C) do plano integrado. Os corpos seguem a ordem de campos de `.github/ISSUE_TEMPLATE/feature_request.yml` (A e B) e `.github/ISSUE_TEMPLATE/chore.yml` (C), lidos no ponto de uso. A busca por issues do ciclo com títulos equivalentes, em todos os estados, não encontrou correspondência. Depois da criação, as dependências usam os números observados no GitHub.

| Unidade | Issue | SHA-256 do corpo publicado |
| :-- | :-- | :-- |
| A | [#63](https://github.com/EuThiagoAndrade/saldo-futuro/issues/63) | `b7ea2b25328f3908cbb37c497d277f39c315f151bbf1f1446903b7d3a98732e8` |
| B | [#64](https://github.com/EuThiagoAndrade/saldo-futuro/issues/64) | `afb315d97e6f10c668b379e321196e1937c1a80f5e39f9a210f6a9111cc7286c` |
| C | [#65](https://github.com/EuThiagoAndrade/saldo-futuro/issues/65) | `fabedb23d5e5172930ae2f2788356b45e8be2bbb0e7e33ae088d26cafdb6cc7a` |

O hash é do corpo sem espaços nas pontas, igual ao lido de volta no GitHub.

## Unidade A

**Título:** `[FEATURE] Simular a migração da origem sem gravar`

### Contexto

A carteira do responsável continua no `Meus-Investimentos` (SQLite, instância de um único usuário). O ciclo 006 aprovou uma migração única pela alternativa D (híbrida), com as regras de mapeamento M1 a M10. Esta unidade determina o histórico que o destino terá e não grava em lugar nenhum.

### Escopo

Dentro:

- em `src/lib/migracao/`, leitor somente leitura do SQLite (`node:sqlite`, `readOnly`);
- regras M1 a M10 e a precedência das recusas, como aprovadas no plano;
- replay em memória mês a mês com `src/lib/financeiro`;
- plano de operações determinístico com hashes (SQLite, plano e usuário de destino);
- relatório detalhado só em `local/`, com resumo de contagens na saída;
- ponto de entrada local com o modo `simular`, sem dependência nova;
- seção de migração da origem na KB-004, com os casos `CR-M*` no JSON de casos de referência e conferência independente.

Fora: gravação ou qualquer conexão com o Supabase; leitura do SQLite real pelo agente; benchmarks da origem; mudança de schema.

### Critérios de aceite

- [ ] Regras M1 a M10 na KB-004, com casos de referência fictícios, paridade com `tests/fixtures/financeiro/casos_referencia.json` e conferência independente registrada na task.
- [ ] `simular` sobre um SQLite fictício criado em memória a partir do DDL da origem reproduz exatamente os saldos esperados e lista os ativos e meses em M7.
- [ ] O modo `simular` não abre conexão com o Supabase.
- [ ] Cada condição da precedência das recusas (M2, M5, M6, M7 zero, M10, nome longo e indício de mais de um usuário) tem teste e não produz plano de operações.
- [ ] Testes unitários da estratégia de testes do plano passam; gates mínimos e da aplicação verdes.
- [ ] Nenhum `.sqlite` versionado e nenhum dado real em código, fixtures ou textos.

### Ciclo e plano relacionados

Ciclo 006 — `_project/drafts/006_migracao_dados_virada/006_plan.md`, v3, item 1 (A); PR #62 integrada.

### Dependências, riscos e autorizações

Depende do plano integrado (PR #62). A criação desta issue não inicia a execução: exige "autorizo a implementação da issue #N". Branch `feature/issue-N`, task persistente, uma PR e merge próprio. Sem modo contínuo. G1 e G3 aplicam-se; sem migração (G4). Caso não coberto por M1 a M10 leva a "Parado".

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 006 + criar_issues + feature/A_simular_migracao + v3@9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f -->

## Unidade B

**Título:** `[FEATURE] Gravar a migração pela sessão do responsável, com retomada`

### Contexto

A única escrita em produção do ciclo. Ela aplica o plano de operações da unidade A pelas funções autenticadas já existentes, sem chave de serviço, e precisa ser segura contra gravação parcial ou duplicada.

### Escopo

Dentro:

- modos `gravar` e `conferir` sobre o plano da unidade A, conforme o "Mecanismo de execução" do plano;
- uso só de `criar_ativo`, `lancar_evento`, `estornar_evento`, `transferir`, `fechar_mes` e `desativar_ativo`, com a sessão do responsável fora do Git;
- destino vazio na primeira execução, com exceção só para retomada comprovada;
- trava de gravador único em `local/`;
- diário por operação;
- resposta perdida sem reenvio: a operação fica `desconhecida` e a carga para;
- comparação por efeitos completos (estado do ativo, transferências como unidade, posições e consolidado);
- leitura completa pelo contrato de `src/lib/leitura.ts`.

Fora: `service_role`; `corrigir_transferencia`; reenvio automático; mudança de schema; execução contra produção.

### Critérios de aceite

- [ ] Todos os cenários de integração da estratégia de testes passam no Supabase local com usuários fictícios, inclusive:
  - a chamada ainda em execução durante a releitura;
  - os casos pós-commit de todas as funções usadas;
  - a operação desconhecida sem efeito;
  - a carteira com mais de 1.000 eventos;
  - o isolamento A/B.
- [ ] Nenhuma escrita acontece com destino não vazio fora da retomada comprovada, com estado divergente ou com a trava presente.
- [ ] `simular` e `gravar` + `conferir` produzem os mesmos consolidados na carteira fictícia.
- [ ] Nenhuma referência a `service_role`; `npx supabase test db` e demais gates verdes.

### Ciclo e plano relacionados

Ciclo 006 — `_project/drafts/006_migracao_dados_virada/006_plan.md`, v3, item 2 (B); PR #62 integrada.

### Dependências, riscos e autorizações

Depende da issue A (#63) integrada. Exige "autorizo a implementação da issue #N". Branch `feature/issue-N`, task persistente, uma PR e merge próprio. Sem modo contínuo. G1, G2 e G3 aplicam-se. Se as funções existentes não sustentarem as garantias, "Parado" por mudança de escopo.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 006 + criar_issues + feature/B_gravar_migracao + v3@9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f -->

## Unidade C

**Título:** `[CHORE] Roteiro da virada`

### Contexto

A execução real da migração é uma ação humana externa. Esta unidade entrega só o roteiro; a execução acontece depois do merge.

### Mudanças previstas

Roteiro na KB-002, numa seção de migração e virada, com:

- pré-requisitos e o regime de gravador único (uma máquina, um processo, aplicação sem uso);
- congelamento da origem logo depois de fechar um mês nela, e cópia do SQLite para `local/`;
- `simular` e conferência do relatório local pelo responsável;
- `gravar` e `conferir`;
- o que informar ao agente: só contagens e diferenças;
- o tratamento de operação desconhecida;
- o caminho de volta (origem intacta; exclusão do usuário de destino).

A KB-003 e a KB-004 não são alteradas nesta PR.

### Critérios de aceite

- [ ] Roteiro completo, revisado e coerente com o mecanismo da unidade B.
- [ ] A task registra a execução como pendente, sem resultado presumido.
- [ ] Gates documentais verdes.

Acompanhamento depois do merge, fora do aceite da PR:

1. ação externa ("concluí a ação externa da issue #N"), com registro só de contagens e diferenças;
2. verificação em produção ("autorizo a verificação em produção do ciclo 006");
3. relato sanitizado, data de virada e KB-003 na PR de encerramento.

### Dependências e autorizações

Depende da issue B (#64) integrada. Exige "autorizo a implementação da issue #N". Branch `chore/issue-N`, task persistente, uma PR e merge próprio. Sem modo contínuo. G3 aplica-se.

### Ciclo e plano relacionados

Ciclo 006 — `_project/drafts/006_migracao_dados_virada/006_plan.md`, v3, item 3 (C); PR #62 integrada.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 006 + criar_issues + chore/C_roteiro_virada + v3@9cfb2efdde5efa2ebf9dbd054abb21f4b77e1c9f -->
