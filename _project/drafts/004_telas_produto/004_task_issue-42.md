# Task — Issue #42: Administração da lista de acessos

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#42`
> **Plano:** `_project/drafts/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-42`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #42" em 2026-10-15
> **Modo contínuo:** `—`
> **Início:** 2026-10-15
> **Última atualização:** 2026-10-15
> **handoff_schema_version:** `2`

Instanciada de `.agent/templates/task.md`; autoridades: `.agent/ai_behavior.md`, `_project/README.md`, plano v4 aprovado, KB-002/003, ADR-003 e `design-system/DESIGN.md`. Workflow `.agent/workflows/implementar_issue.md` e auditoria `.agent/skills/governance-check/governance-check.md`. Base `origin/main` em `be006cd`; PR #48 integrada e issue #42 aberta conferidas com `gh`. Nenhuma PR existente para `feature/issue-42` antes da execução. A reconciliação local preexistente da task #41 foi preservada integralmente.

## Objetivo

Entregar o item F do plano: administração da lista de e-mails autorizados, sem migração.

## Escopo autorizado

`/admin/acessos`: listar e-mails e papéis iniciais, autorizar e-mail normalizado e remover com confirmação. Avisos junto das ações sobre o Google em Testando e sobre a permanência da conta existente após remoção. Proteção de página e ações por sessão admin; testes fictícios e roteiro de verificação em produção.

Fora: trocar papel de conta existente, revogar conta, migrações, dependências, escrita ou leitura autenticada em produção.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Sem cálculo ou apresentação de valores financeiros |
| G2 — isolamento por RLS | Sim | Página e ações exigem admin e usam sua sessão; políticas existentes de `authorized_emails`, sem chave secreta no produto. E2E: 404 para conta comum na página e nos dois POSTs reais das ações; sem sessão, página e ações encaminham a `/entrar`, sem efeito no banco. 239 asserções pgTAP passaram |
| G3 — privacidade de dados | Sim | Somente e-mails fictícios em `example.com` nos testes; nenhum acesso autenticado à produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Conferir autorização, plano, issue, base e dependência integrada; criar branch e task.
- [x] Implementar página, ações, normalização, confirmação e avisos.
- [x] Provar fluxo admin, recusas, permanência da conta e acessibilidade com dados fictícios.
- [x] Executar gates e revisar diff e governança; staging seletivo na publicação.
- [ ] Publicar PR revisável e registrar checks e próximo passo.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Dependências | `npm ci --cache local/npm-cache --prefer-offline` concluiu sem mudança de pacote ou lockfile |
| Lint e tipos | `npm run lint`: sem erro, três avisos preexistentes em `local/validacao-ciclo-003/`; `npm run typecheck` passou |
| Unitários | `npm test`: 18 arquivos, 201 testes passaram |
| Banco | `npx supabase start` e `npx supabase test db`: 6 arquivos, 239 asserções passaram |
| Build e E2E com backend | Build de produção pelo webServer do Playwright; suíte completa: 78 passaram e 5 pulados (4 de preview e medição opcional já atendida na issue #40) |
| Acessos, revisão final | 6/6 E2E passaram após o acabamento: normalização, papel inicial, duplicidade sem alteração, Cancelar/Esc, exclusão, conta existente preservada mesmo reautorizada com outro papel inicial, entrada ausente/inválida, recusas dos POSTs e página |
| Acessibilidade e visual | axe WCAG A/AA sem violação na lista e no diálogo em 360/1280 px; sem rolagem horizontal. Quatro capturas fictícias conferidas em `local/issue-42/` (não versionadas) |
| Preview sem backend | Build de produção e 13 testes passaram; 70 pulados por exigirem backend/medição opcional. A rota nova mostra o aviso sem chamadas a outra origem |
| Validador | 39/39 testes; 0 erros/avisos; quatro itens manuais conferidos: referências, privacidade, semântica das barreiras e autorização literal |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- Nenhum desvio de escopo, migração ou dependência nova. A reconciliação da task #41 já estava localmente presente ao iniciar e foi preservada integralmente.
- O formulário começa com papel Usuário, permite escolher o papel inicial e explica que ele só vale no primeiro cadastro. Duplicidade não faz `upsert` nem muda o papel inicial já gravado. A exclusão alcança somente `authorized_emails`, sem alterar `profiles` ou `auth.users`.
- A lista usa paginação por e-mail (chave primária), contagem exata e o leitor completo existente. Falha de leitura usa o estado recuperável da aplicação, sem resultado parcial.
- A página de Administração recebe o link para Acessos no lugar do aviso da entrega futura. É a ligação mínima de navegação para o item F.
- A primeira execução de lint encontrou uma fixture transitória do teste de governança rodando simultaneamente em `local/`; o lint repetido depois da limpeza passou. Os primeiros E2E exigiram delimitar os alertas do formulário para não capturar o anunciador de rotas do Next e aceitar o redirecionamento das ações pelo cabeçalho `x-action-redirect`. As execuções finais passaram, sem contorno no produto.
- Fora do escopo: `npm ci` informou cinco vulnerabilidades de severidade alta no lockfile existente. Nenhuma dependência foi alterada. O alerta preexistente já registrado na task #41 permanece trabalho separado.

## Verificação em produção — roteiro

Somente depois do merge F, da ação externa da issue #41 e de "autorizo a verificação em produção do ciclo 004". Não executado nesta implementação.

Pelo agente, somente leituras sem sessão: conferir redirecionamento das páginas protegidas para `/entrar`, recusa de `POST /api/benchmarks/sincronizar` sem autenticação e resposta dos ativos públicos (logo, ícone e manifesto).

Pelo responsável, com a própria conta, conferir:

- Login Google, navegação no celular e no desktop, Conta e saída.
- Ativos, lançamentos, transferências e seus detalhes, confirmação de estorno/correção e fechamento/reabertura conforme os procedimentos aprovados, sem registrar conteúdo da carteira.
- Início, períodos, gráficos/tabelas e estados `N/D`; preferência Ocultar valores antes e depois de recarregar e navegar, inclusive nos formulários.
- Catálogo e cobertura de CDI/IPCA após a ação externa, comparação e aviso de mês parcial.
- Administração de acessos: papéis iniciais, avisos, autorização normalizada e confirmação de remoção, lembrando que a conta existente permanece.
- Com conta comum, a administração não aparece na navegação e as páginas admin respondem 404.

Registrar cada item somente como "conferido" ou com descrição do defeito, sem valores, nomes, e-mails reais nem capturas. Nenhuma verificação autenticada pelo agente ou escrita em produção está autorizada.

## Encerramento

Não se aplica. Ciclo completo: verificação, release e encerramento permanecem separados.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 004 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 004"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 42 + be006cd`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: issue #42 aberta, plano em execução e autorização recebida; branch `feature/issue-42` e task criadas, implementação em andamento.
- `result`: `executed`
- `evidence`: autorização humana de 2026-10-15; issue #42 e merge da PR #48 conferidos por `gh`; branch baseada em `origin/main` @ `be006cd`.
- `blockers`: nenhum para implementar; merge exige aprovação própria após checks verdes.
