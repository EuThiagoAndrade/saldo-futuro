# Task — Issue #41: Benchmarks, comparação e sincronização com o SGS

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#41`
> **Plano:** `_project/drafts/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-41`
> **PR:** [#48](https://github.com/EuThiagoAndrade/saldo-futuro/pull/48)
> **Integração:** `Pendente`
> **Autorização inicial:** "Autorizado a implementação da issue #41" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada de `.agent/templates/task.md`; autoridades: `.agent/ai_behavior.md`, `_project/README.md`, plano v4 aprovado, KB-004, ADR-002/003/005 e `design-system/DESIGN.md`. Base `main` e `origin/main` em `1cccf9e`; PR #47 integrada e issue #40 fechada, conferidas no GitHub.

## Objetivo

Entregar o item E: catálogo e cobertura, comparação da carteira com benchmark e sincronização sob demanda restrita ao admin.

## Escopo autorizado

`/benchmarks`, `/benchmarks/comparacao`, `/admin/benchmarks`, `POST /api/benchmarks/sincronizar`, composição pura e leitura coerente, testes fictícios (CR-44/45/47 e fonte SGS falsa), roteiro da ação externa e rastreabilidade. Sem migração, dependência, cadastro de benchmark, importação manual ou cron.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | KB-004 seção 9 atualizada com a apresentação e a composição; CR-44/45/47 na suíte unitária e na interface; CR-46 no unitário. Nenhuma fórmula nova. Leitura completa com marcas dos dois lados; dois testes do leitor real substituem insumos entre tabelas ou entre cobertura/valores, sem mudar chaves/contagens |
| G2 — isolamento por RLS | Sim | Sessão por ponto de entrada; só admin sincroniza pelo cliente da própria sessão; sem chave secreta na aplicação. E2E: 401 sem sessão, 403 para usuário comum e origem diferente, 404 na página admin, recusa sem confirmação; carteira vazia de outro usuário não herda os retornos. 239 asserções pgTAP passaram |
| G3 — privacidade de dados | Sim | Somente dados fictícios e séries públicas em testes; nenhum acesso a carteira real ou escrita em produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Conferir plano, autorização, dependência integrada e base; criar branch e task.
- [x] Catálogo e cobertura; comparação com cinco períodos, intervalo até M, medidas e gráfico base 100/tabela; retornos mensais em cartões no celular e tabela no desktop; N/D e mês parcial rotulados.
- [x] Composição pura só pelas regras existentes; leitura completa/coerente da carteira e do benchmark no mesmo conjunto.
- [x] Rota admin com sessão, origem e confirmação conferidas; código SGS vem do catálogo, não da entrada; prazo total de 45 s em todas as janelas/corpos; uma chamada atômica à função existente e releitura da cobertura.
- [x] Tela admin com diálogo de confirmação, cancelamento, pendência, mensagens recuperáveis e "Tentar novamente"; atualização da cobertura também após perda da resposta.
- [x] Fonte SGS falsa local por preload exclusivo do servidor Playwright; nenhuma opção de trocar a fonte na aplicação. Falha na segunda janela, JSON inválido, sem valores, buraco, prazo real e resposta perdida depois de gravar provados no E2E. Repetição conserva valores e limites da cobertura.
- [x] 201 testes unitários, 239 asserções de banco, suíte completa com 72 E2E passando; axe em 360/1280 px e conferência visual com dados fictícios.
- [x] Build e preview sem backend: 12 E2E passaram; 64 pulados por exigirem backend/medição opcional. Teste de confirmação repetido após o acabamento do diálogo: passou, incluindo Esc antes da busca.
- [x] PR revisável [#48](https://github.com/EuThiagoAndrade/saldo-futuro/pull/48) publicada; staging restrito aos 19 arquivos autorizados, sem segredo ou dado real.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Dependências | `npm ci` concluiu com o lockfile existente, sem mudança de pacote |
| Lint e tipos | `npm run lint` sem erro (três avisos preexistentes apenas em `local/`); `npm run typecheck` passou |
| Unitários | `npm test`: 18 arquivos, 201 testes passaram |
| Banco | `npx supabase start` e `npx supabase test db`: 6 arquivos, 239 asserções passaram |
| Build e E2E com backend | Build de produção pelo webServer do Playwright; 72 testes passaram, 4 pulados (preview e medição opcional já atendida na issue #40) |
| Sincronização | 11/11 testes específicos passaram; prazo real abortou após 45 s, sem gravação; falhas preservaram valores e marca de cobertura; resposta perdida depois de gravar mostrou cobertura real |
| Preview sem backend | Build de produção e 12 E2E passaram; 64 pulados por exigirem backend ou medição opcional |
| Governança | 39/39 testes; validador com 0 erros/avisos e 4 itens manuais conferidos |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- Nenhum desvio de escopo, migração ou dependência nova.
- O servidor falso do SGS fica no arquivo serial de benchmarks (D9). O preload de testes redireciona somente `api.bcb.gov.br` para loopback e não é usado pelo produto. A demora é testada com os 45 s reais, sem reduzir o prazo em produção.
- O campo inicial padrão usa o fim da cobertura (P11); na primeira carga é obrigatório escolher a data. Datas futuras e intervalos invertidos são recusados no servidor.
- Cancelar é permitido antes de executar. Durante a carga os botões ficam desabilitados com explicação de pendência; após erro é possível cancelar ou repetir.
- O Next reconstruiu a URL interna com hostname diferente do acessado pelo navegador local. A origem do POST é conferida pelo protocolo e pelo `Host` recebido; o E2E prova tanto o pedido válido quanto a recusa de origem diferente.
- A primeira tentativa de `npm ci` não tinha DNS no sandbox, e o build do Next precisava criar processos locais. Os gates concluíram com a execução liberada; nenhum contorno foi adicionado ao código do produto.
- Conferência manual: referências internas existentes, autorização humana literal, barreiras aplicáveis, ausência de dados reais/segredos, migrações intactas e diff restrito ao item E e à reconciliação de #40.

## Ação externa — primeira sincronização em produção

Depois do merge desta entrega, o responsável entra com a própria conta admin em `/admin/benchmarks`, escolhe CDI e a data inicial desejada, confere o período e confirma a sincronização; repete com IPCA. Confere a cobertura em `/benchmarks` e eventuais meses parciais na comparação. Registra somente conclusão ou motivo de falha, sem valores da carteira, nomes de ativos ou capturas. Frase: "concluí a ação externa da issue #41". Nenhuma escrita em produção pelo agente está autorizada.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 004 (completo)
Quem: Responsável
Conferir: [PR #48](https://github.com/EuThiagoAndrade/saldo-futuro/pull/48): checks e diff
Diga: "aprovo o merge da PR #48"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 41 + 1cccf9e`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #41 aberta e autorizada sobre `main` @ `1cccf9e`, sem branch/task/PR; branch `feature/issue-41` publicada, PR #48 aberta, task `Aguardando integração`.
- `result`: `executed`
- `evidence`: autorização humana de 2026-10-14; issue #41 e merge #47 conferidos com `gh`; tabela de validações acima; `gh pr list --head feature/issue-41 --state all` vazio antes da publicação e `gh pr create` devolveu #48; nenhuma duplicação.
- `blockers`: checks remotos e aprovação própria do merge; ação externa somente depois da integração.
