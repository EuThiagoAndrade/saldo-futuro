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
| D (`v4`) | [#73](https://github.com/EuThiagoAndrade/saldo-futuro/issues/73) | `3d9e010b14621b5ad72c8c6b39b9cfedb3a6211c9fbac77ff7e8d310b3796edd` |
| E (`v5`) | [#76](https://github.com/EuThiagoAndrade/saldo-futuro/issues/76) | `54fdc871aadf2bed5e6820002d2a3271c1f3b184e8df617d2818661ab9515781` |

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

## Unidade D (`v4`)

> **Preparado em:** 2026-10-18, a partir do item 4 da `v4` aprovada e integrada pela PR #72 (squash `114da38`). **Situação:** criada como [#73](https://github.com/EuThiagoAndrade/saldo-futuro/issues/73), `OPEN`, depois da confirmação "confirmo a criação da issue D com o payload de 006_handoff_issues.md" em 2026-10-18; título e corpo relidos no GitHub, idênticos ao payload. A busca por issues com "trânsito" no título, em todos os estados, não encontrou correspondência.

**Título:** `[FEATURE] Migrar o trânsito sem contrapartida como migração no trânsito`

### Contexto

A primeira simulação real da migração recusou por `M6_TRANSITO_SEM_PAR_UNICO` (quantidade 2): variações do saldo de trânsito sem `RESGATE` ou `APORTE` correspondente, com origem e destino desconhecidos. A `v4` do plano decidiu tratar cada `TRANSFERENCIA_PENDENTE` como variação do saldo acumulado do trânsito e representar a variação sem par como `migracao` no próprio trânsito, o que o banco atual não permite (K12).

### Escopo

Dentro:

- migração nova `supabase/migrations/AAAAMMDDHHMMSS_migracao_transito.sql` com `public.lancar_migracao_transito(p_data date, p_valor bigint) returns uuid`, conforme o contrato da `v4`: `security definer`, `search_path` vazio, trava da carteira, só o trânsito do próprio usuário, só o tipo `migracao`, recusas na ordem sinal → faixa → trânsito inexistente, conferência de data de `lancar_evento`; execução só para `authenticated`;
- teste de banco novo da função (gravação, recusas, mês fechado, `anon`, isolamento A/B, `lancar_evento` ainda recusando o trânsito, `fechar_mes` com a migração no componente `migracao`);
- **R4-1:** incluir `lancar_migracao_transito(date, bigint)` nas listas fechadas de funções executáveis por `authenticated` e na conferência de `security definer` de `supabase/tests/database/03_funcoes.test.sql`, mantendo a detecção de função fora da lista e as recusas para `PUBLIC` e `anon`;
- `src/lib/migracao/simular.ts`: M6 revisado (par único → transferência; sem candidato → `migracao` no trânsito com a data da origem; ambíguo → `M6_TRANSITO_PAR_AMBIGUO`; saldo negativo no fim de um mês → `M6_TRANSITO_SALDO_NEGATIVO`), substituindo `M6_TRANSITO_SEM_PAR_UNICO`;
- `tipos.ts`, `gravar.ts` e a conferência: a operação `lancar_migracao_transito`, a sonda com valor zero antes da primeira escrita, a resposta perdida e a comparação por efeitos;
- **R4-2:** nova versão do formato do plano de operações; `gravar` recusa, antes de qualquer escrita e com teste, um plano de versão anterior, sem conversor;
- KB-004 (M6, seção 4.4, decisão K12 e casos `CR-M04` a `CR-M07`) e `tests/fixtures/financeiro/casos_referencia.json` com paridade;
- KB-002: `db push` da issue D antes de `gravar` no roteiro e os novos códigos de recusa.

Fora: mudança em `lancar_evento`, `transferir`, `fechar_mes` ou nas políticas; interface para lançar `migracao` no trânsito; simulação real, `db push` e `gravar`; outra mudança de schema.

### Critérios de aceite

- [ ] Exemplos A a D do plano e as duas recusas novas com teste de unidade, conferindo saldo do trânsito por mês, componentes, identidade, retorno do mês, acumulado e a consistência de M10.
- [ ] `CR-M04` a `CR-M07` na KB-004 e no JSON, com conferência independente registrada na task.
- [ ] Teste de banco da função nova verde, com isolamento A/B, e `03_funcoes.test.sql` atualizado (R4-1).
- [ ] Plano de operações de versão anterior recusado antes de qualquer escrita, com teste (R4-2).
- [ ] Integração `gravar` + `conferir` sem diferença na carteira fictícia com trânsito sem par e com par real; sonda que para sem escrita quando a função falta.
- [ ] Gates mínimos e da aplicação, inclusive `npx supabase test db`; nenhum dado real em código, fixtures ou textos.

### Ciclo e plano relacionados

Ciclo 006 — `_project/drafts/006_migracao_dados_virada/006_plan.md`, `v4`, item 4 (D); PR #72.

### Dependências, riscos e autorizações

Depende da `v4` integrada (PR #72) e das issues #63, #64 e #65, integradas. A criação não inicia a execução: exige "autorizo a implementação da issue #N". Branch `feature/issue-N`, task persistente, uma PR e merge próprio. Sem modo contínuo. G1, G2, G3 e G4 aplicam-se. Depois do merge: simulação local pelo agente só com códigos e contagens (autorizada em 2026-10-18) e `db push` do responsável como ação externa desta issue; `gravar` continua na ação externa da issue #65. Risco aceito: meses com `migracao` no trânsito ficam com rentabilidade `N/D` (P15/K1).

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 006 + criar_issues + feature/D_migracao_transito + v4@114da383c101211136a77b04b14b0823dc9e8adf -->

## Unidade E (`v5`)

> **Preparado em:** 2026-10-18, a partir do item 5 da `v5` aprovada e integrada pela PR #75. **Situação:** criada como [#76](https://github.com/EuThiagoAndrade/saldo-futuro/issues/76), `OPEN`, depois da confirmação "confirmo a criação da issue E com o payload de 006_handoff_issues.md" em 2026-10-18; título e corpo relidos no GitHub, idênticos ao payload. A busca por issues com "Posição implícita zero" no título, em todos os estados, não encontrou correspondência.

**Título:** `[FEATURE] Posição implícita zero na cobertura da migração`

### Contexto

Depois da issue #73, a simulação real da migração recusou por `M10_COBERTURA_OU_CONSISTENCIA` (quantidade 12): todas posições ausentes depois de um mês com saldo zero, sem nenhum evento do ativo no mês, porque a origem não grava posição de saldo zero. A `v5` do plano decidiu tratar só esse caso como posição implícita zero; qualquer outra ausência continua recusando.

### Escopo

Dentro:

- `src/lib/migracao/simular.ts`: antes de M10, criar posições implícitas zero (saldo inicial e final zero), mês a mês dentro do intervalo, para o ativo cuja posição anterior, real ou implícita, terminou em zero e que não tem nenhum evento no mês na origem — inclusive calculado ou de valor zero, que M4 descarta depois; as posições implícitas ficam disponíveis para M10, o replay, M9, o plano e o relatório;
- resumo com a contagem `posicoesImplicitasZero` (posições acrescentadas, não ativos);
- KB-004: M10 revisado e o caso `CR-M08`, com paridade em `tests/fixtures/financeiro/casos_referencia.json`;
- KB-002: a contagem nova no que conferir em M2;
- teste de integração `gravar` + `conferir` numa carteira fictícia com posição implícita zero.

Fora: mudança de banco, de `gravar`, de `conferir` ou de outra regra (M1 a M9, demais partes de M10); simulação real, `db push` e `gravar`.

### Critérios de aceite

- [ ] Testes de unidade do M10 revisado: ativo que fica ativo, ativo desativado por M9, meses consecutivos, contagem, saldos, patrimônio, componentes e retorno; recusa mantida para ausência com evento no mês (inclusive calculado e de valor zero) e para ausência depois de saldo diferente de zero.
- [ ] `CR-M08` na KB-004 e no JSON, com conferência independente registrada na task.
- [ ] Integração `gravar` + `conferir` sem diferença no Supabase local, com saldo real `"0"` no fechamento.
- [ ] Gates mínimos e da aplicação, inclusive `npx supabase test db`; nenhum dado real em código, fixtures ou textos.

### Ciclo e plano relacionados

Ciclo 006 — `_project/drafts/006_migracao_dados_virada/006_plan.md`, `v5`, item 5 (E); PR #75.

### Dependências, riscos e autorizações

Depende da `v5` integrada (PR #75) e da issue #73, integrada. A criação não inicia a execução: exige "autorizo a implementação da issue #N". Branch `feature/issue-N`, task persistente, uma PR e merge próprio. Sem modo contínuo. G1 e G3 aplicam-se; G2 e G4 não (sem mudança de banco nem migração). Depois do merge: simulação local pelo agente, coberta pela aprovação da `v5`, só com códigos e contagens; `db push` da issue #73 e `gravar` continuam nas ações externas. Risco aceito: posições 0 → 0 mensais desses ativos no destino, sem efeito em patrimônio, componentes ou retorno.

<!-- logical_key: EuThiagoAndrade/saldo-futuro + 006 + criar_issues + feature/E_posicao_implicita_zero + v5@3afd8907ca296a58b2d77a82dd841551f23c1646 -->
