# Task — Issue #82: instituir backlog de possibilidades

> **Ciclo:** `007`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `chore`
> **Issue:** `#82`
> **Plano:** `_project/drafts/007_backlog_possibilidades/007_plan.md`
> **Branch:** `chore/issue-82`
> **PR:** [#83](https://github.com/EuThiagoAndrade/saldo-futuro/pull/83)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #82" em 2026-10-19
> **Modo contínuo:** `—`
> **Início:** 2026-10-19
> **Última atualização:** 2026-10-19
> **handoff_schema_version:** `2`

## Objetivo

Instituir o backlog de possibilidades, vazio, com captura local, publicação separada e entrada por IDs nos três níveis de governança.

## Escopo autorizado

Itens 1 a 3 do plano v3 aprovado, P1 a P6 e ressalvas R3-1 a R3-3; issue #82. Contrato, consumidores, templates e enforcement essencial em uma entrega. Sem aplicação, banco, dependências ou população do backlog.

## Origem no backlog

Não se aplica: este ciclo institui o próprio mecanismo.

## Elegibilidade da trilha curta

Não se aplica: ciclo completo de mudança de governança.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Nenhum cálculo ou contrato financeiro alterado. |
| G2 — isolamento por RLS | Não | Nenhuma política, consulta ou autenticação alterada. |
| G3 — privacidade de dados | Sim | Somente sínteses de governança e fixtures fictícias; conferir antes de gravação, commit e publicação. Não ler dados privados em local/. |
| G4 — migrações só acrescentam | Não | Nenhuma migração alterada ou criada. |

## Execução

- [x] Conferir autorização, issue aberta, plano v3 aprovado e main integrada em `687427e3fe21eddda0171e9e9c80a35a49a26303`.
- [x] Criar branch e task antes da implementação.
- [x] Instituir contrato, backlog vazio, template e workflow.
- [x] Integrar seleção, origens, retomada e auditoria.
- [x] Estender enforcement essencial e executar regressões e ensaios fictícios.
- [x] Conferir G3, diff e gates; publicar PR e iniciar observação dos checks.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | `node --test scripts/validate-governance.test.mjs`: 48/48 passaram (39 regressões + 9 cenários de backlog). |
| Validador | `node scripts/validate-governance.mjs`: 0 erros, 0 avisos, 5 itens manuais. |
| Ensaios fictícios e ressalvas | Resultados e limites abaixo. |
| `git diff --check` | Passou antes da publicação. |
| Checks remotos | Em andamento na publicação; [PR #83 / checks](https://github.com/EuThiagoAndrade/saldo-futuro/pull/83/checks). Conferir tip final no GitHub antes do merge; esta linha registra a abertura, não antecipa resultado. |

### Ensaios executados em 2026-10-19

Todos os dados/pedidos dos ensaios são fictícios. Não houve captura real nem criação de fila operacional neste repositório. São ensaios de Git e leitura/aplicação manual do contrato textual, sem executor de workflows, interpretação automática de linguagem ou aprovação humana simulada como fato real.

| Cenário | Resultado observado |
| :-- | :-- |
| Captura durante outro trabalho | Repositório temporário `saldo-backlog-82-zcxzPi`, worktree irmão registrado, mesmo git-common-dir resolvido e sem link interno. README principal com alterações staged e unstaged: branch, índice, diff binário e status preservados após capturas/rebase. |
| Trava e lote pendente | mkdir exclusivo recusou segunda aquisição com EEXIST; alocação incluiu BL-001 já publicado mas não integrado e gerou BL-002. Commit local antes de liberar a trava; repetição sem alteração preservou conteúdo/Registro/HEAD. |
| Publicação delimitada | Bare remoto fictício recebeu somente P para branch por SHA completo da base. Captura posterior permaneceu local; ls-remote confirmou tip remoto inalterado. Lotes seguintes usaram outras branches, sem force-push. Não foi criada PR fictícia no GitHub real. |
| Squash com posteriores | Clone de integração fictício fez squash de P; comparação de backlog P/M sem diferenças. Rebase --onto main P reaplicou exatamente um commit posterior, preservando IDs, conteúdo e autoria Fixture. |
| Squash sem posteriores | Segundo lote: rebase --onto deixou HEAD igual à main conferida. |
| Conflito real | Terceiro lote com edição local e divergência posterior na main fictícia: rebase retornou erro de conflito; rebase --abort preservou tip `05b4b3a`, conteúdo e IDs, fila limpa. |
| Seleção múltipla e recortes | Fixture `saldo-backlog-82-semantica-WeB8Uv`: BL-001 selecionado parcialmente para ciclo completo 008 e restante para leve 009; BL-002 integral para task curta #901. Destinos receberam snapshots com commit de origem. Backlog não mudou enquanto destinos estavam só em branch de preparação. |
| Retorno, estados e contexto | Após squash dos destinos fictícios, retorno parcial manteve Disponível/Restante (commit `56c852d`); integral usou Encaminhado e múltiplos destinos estáveis. Arquivamento com motivo, reabertura e combinação preservando BL-003 foram ensaiados por operações explícitas fictícias. Edição posterior não alterou snapshots; ciclo Cancelado/Concluído não mudou item automaticamente. |
| Idempotência e situação | Sem nova mudança, não houve novo Registro/commit; nenhum bloco/handoff no arquivo de backlog. Conferência de mesa das quatro regras: conflito/PR fechada/checks pendentes/falhos/acesso ausente → Parado; só falta integração → Aguardando merge, distinguindo posteriores locais; sem PR com pendências locais → Backlog atualizado; base conferida sem pendências → Concluído da operação. Isso não é teste automático do GitHub. |
| Gates isolados | ESLint.isPathIgnored para arquivo no worktree externo retornou true. parseJsonConfigFileContent do TypeScript resolveu 133 arquivos do projeto, nenhum externo. Inspeção de eslint ., tsconfig e build confirmou raízes relativas ao checkout; configurações da aplicação intactas. |

As primeiras comparações textuais após checkout/rebase detectaram CRLF de configuração global do Git no ambiente Windows. Repetidas com normalização UTF-8/LF, passaram; os diffs de índice/árvore foram comparados pelo próprio Git. Não houve perda de conteúdo nem alteração de configuração do projeto.

### Ressalvas R3-1 a R3-3

- **R3-1:** a execução atual permite escrita externa. Para exercitar a recusa, um subprocesso Node 24 com `--permission` e escrita permitida só no principal tentou escrever no worktree externo: retornou `ERR_ACCESS_DENIED`, sem gravar e sem diretório interno alternativo. Conferência manual do workflow: saída Parado, explicar/liberar diretório na ferramenta ou ajustar configuração; sem fallback interno. Atrito esperado: ferramentas confinadas à raiz exigirão essa liberação inicial; nada foi relaxado na aplicação ou no ambiente real.
- **R3-2:** o corpo atual é idêntico ao integrado em `687427e3fe21eddda0171e9e9c80a35a49a26303`. Cálculo novo: bytes UTF-8, CRLF convertido a LF, da linha `## Problema e contexto` inclusive até o início da linha `## Próximo passo` exclusive, preservando as duas quebras LF antes dela: SHA-256 `969ac2941f09fb081d9ab0a985e49c999b94295ebf3b7d6847847835cccbbb11` em ambas as versões. O hash `c5c5019e...` declarado no histórico da revisão/aprovação não se reproduz com esses limites exatos; não é reutilizado como evidência desta entrega. Preservados texto aprovado e registros históricos; não se atribui o hash novo a outro trecho. Conferência da igualdade por leitura direta e comparação das strings normalizadas, além do hash.
- **R3-3:** convenções explicitadas no README, na seção Branches, commits e migrações. Configuração local release-type node, sem changelog-sections customizadas. Action fixada em `45996ed1f6d02564a971a2fa1b5860e934307cf7`; package-lock dessa action resolve release-please 17.6.0. Conferidos [README](https://github.com/googleapis/release-please/blob/712fcf01effd08d7b0e7b1fd3861f2cb388bc8d1/README.md#step-1-ensure-releasable-units-are-merged) e [estratégia base](https://github.com/googleapis/release-please/blob/712fcf01effd08d7b0e7b1fd3861f2cb388bc8d1/src/strategies/base.ts): docs(backlog) sem breaking change não é unidade de release node; changelog vazio não abre release. A leitura prévia da estratégia genérica v17.1.3, sozinha, não provava isso e não foi usada para concluir. Nenhuma versão/dependência/configuração alterada.

### Auditoria manual

Aplicada a skill local `.agent/skills/governance-check/governance-check.md`: referências de origem/destino e limites de publicação revisados; autorizações confrontadas com manifestações humanas; G1/G2/G4 não aplicáveis pelas justificativas da tabela; G3 conferida nos arquivos novos/alterados e fixtures. O backlog real permanece vazio. O validador não executa Git/rede/escrita, nem exige seção de origem em históricos. Nenhum arquivo de aplicação, CI, dependência, migração, ADR, KB ou configuração de lint/tipos alterado. Estado GitHub/checks será reconferido após publicação e no merge.

## Revisão da correção

Não se aplica: trilha normal, plano revisado em três rodadas e aprovado.

## Decisões incidentais e desvios

Nenhum desvio autorizado. Alterações locais de metadados da integração documental e criação da issue acompanham esta entrega, como registrado no plano.

### Publicação

Commit inicial `e9871d77a19b9115f388e13295eef74823e03ef4`, branch chore/issue-82, PR #83 para main. Arquivos remotos conferidos: somente os 22 previstos de governança/templates/validação e registros do ciclo. Este registro de PR e próximo passo é o complemento documental da entrega; checks do tip atual são conferidos no GitHub. Nenhum merge autorizado ou realizado.

## Encerramento

Não se aplica: ciclo completo terá encerramento documental separado após integração da implementação.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 007 (completo)
Quem: Responsável
Conferir: Checks e diff da [PR #83](https://github.com/EuThiagoAndrade/saldo-futuro/pull/83); conferir o tip atual e aguardar checks verdes antes do merge
Diga: "aprovo o merge da PR #83"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 007 + implementar_issue + 82 + 687427e3fe21eddda0171e9e9c80a35a49a26303`
- `effect_class`: `remote_mutation`
- `state_before`: plano Aprovado; ciclo Planejamento; issue #82 aberta; sem implementação.
- `state_after`: implementação em chore/issue-82 publicada na PR #83; task Aguardando integração; plano Em Execução; ciclo Em execução; sem merge.
- `result`: `executed`
- `evidence`: autorização humana literal acima; base e issue conferidas; 48/48 testes e validador sem erros; ensaios acima; PR #83 e seu diff conferidos, checks observáveis no GitHub.
- `blockers`: merge exige checks verdes no tip final e "aprovo o merge da PR #83"; aprovação ainda não recebida.
