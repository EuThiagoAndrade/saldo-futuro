# Task — Issue #42: Administração da lista de acessos

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#42`
> **Plano:** `_project/executed/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-42`
> **PR:** [#49](https://github.com/EuThiagoAndrade/saldo-futuro/pull/49)
> **Integração:** PR #49 integrada por squash, conferida no GitHub
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
- [x] Executar gates e revisar diff, staging seletivo e governança; oito arquivos da entrega, sem segredo ou dado real.
- [x] Publicar PR revisável [#49](https://github.com/EuThiagoAndrade/saldo-futuro/pull/49), registrar checks e próximo passo.
- [x] Integrar por squash após "aprovo o merge da PR #49", recebido em 2026-10-15; checks da revisão aprovada verdes, PR integrada e issue #42 fechada conferidas no GitHub.

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
| Checks remotos | [PR #49](https://github.com/EuThiagoAndrade/saldo-futuro/pull/49): os cinco checks estavam verdes na revisão aprovada `55c332a`, conferidos novamente antes do merge; [CI](https://github.com/EuThiagoAndrade/saldo-futuro/actions/runs/38782464942), [governança](https://github.com/EuThiagoAndrade/saldo-futuro/actions/runs/38782464939) e Vercel aprovados |

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

Somente depois do merge F, da ação externa da issue #41 e de "autorizo a verificação em produção do ciclo 004". A implementação e a integração estão concluídas; a verificação abaixo tem autorização própria.

Pelo agente, somente leituras sem sessão: conferir redirecionamento das páginas protegidas para `/entrar`, recusa de `POST /api/benchmarks/sincronizar` sem autenticação e resposta dos ativos públicos (logo, ícone e manifesto).

Pelo responsável, com a própria conta, conferir:

- Login Google, navegação no celular e no desktop, Conta e saída.
- Ativos, lançamentos, transferências e seus detalhes, confirmação de estorno/correção e fechamento/reabertura conforme os procedimentos aprovados, sem registrar conteúdo da carteira.
- Início, períodos, gráficos/tabelas e estados `N/D`; preferência Ocultar valores antes e depois de recarregar e navegar, inclusive nos formulários.
- Catálogo e cobertura de CDI/IPCA após a ação externa, comparação e aviso de mês parcial.
- Administração de acessos: papéis iniciais, avisos, autorização normalizada e confirmação de remoção, lembrando que a conta existente permanece.
- Com conta comum, a administração não aparece na navegação e as páginas admin respondem 404.

Registrar cada item somente como "conferido" ou com descrição do defeito, sem valores, nomes, e-mails reais nem capturas. Nenhuma verificação autenticada pelo agente ou escrita em produção está autorizada.

### Autorização e verificação pública — 2026-10-15

**Autorização recebida:** "autorizo a verificação em produção do ciclo 004", em 2026-10-15, nesta conversa. Precondições conferidas: PRs #48 e #49 integradas; issue #42 fechada; ação externa da issue #41 declarada pelo responsável e registrada na task anterior; status Vercel da entrega integrada em `success` no GitHub.

Verificação sem sessão feita em `https://investimentos.euthiagoandrade.com.br`, em 2026-10-15, às 14:22 de America/Cuiaba (18:22 UTC). Cliente HTTP independente, sem navegador, cookies ou credenciais; redirecionamentos observados sem seguir automaticamente; nenhum corpo das páginas protegidas foi lido. O POST vazio só verificou a recusa antes de qualquer sincronização.

| Item público | Resultado |
| :-- | :-- |
| 13 páginas protegidas: Início, lançamentos/lista/novo/detalhe/fechamento, ativos, transferências, benchmarks/comparação, Conta e três páginas de administração | Conferido: todas responderam HTTP 307 para `/entrar`; identificador de detalhe fictício, sem consulta de carteira |
| `POST /api/benchmarks/sincronizar`, sem sessão e com corpo vazio | Conferido: HTTP 401, sem redirecionamento ou sincronização |
| `/entrar` | Conferido: HTTP 200, botão Google presente, sem formulário de senha e sem aviso de preview |
| `/manifest.webmanifest` | Conferido: HTTP 200, nome do produto, início em `/`, modo `standalone` e três ícones da própria origem |
| Logo, favicon, ícone Apple e três ícones do manifesto | Conferido: seis recursos com HTTP 200 e tipo de imagem correspondente |

Resultado: 22/22 verificações públicas passaram. Evidência auxiliar somente com status e propriedades públicas em `local/issue-42/verificacao-producao.json`, sem conteúdo de carteira, segredo ou captura. Script HTTP auxiliar em `local/issue-42/verificar-producao.mjs`; ambos ignorados pelo Git. Resumo verificável preservado nesta task.

### Conferência autenticada pelo responsável

Retorno parcial recebido em 2026-10-15: o responsável relatou ausência do logo no celular e lentidão do site. Ao detalhar o segundo item, informou "A cada troca de tela". Não declarou os seis grupos do roteiro como conferidos; nenhum grupo foi aprovado por inferência.

### Diagnóstico dos pontos relatados — 2026-10-15

- **Logo no celular:** ausência confirmada no código. O logo está dentro do menu lateral `hidden ... lg:flex` em `src/components/navegacao.tsx`; o header em `src/app/(app)/layout.tsx` contém apenas Ocultar valores. `DESIGN.md` seções 6.1 e 8.1 especificam o logo no menu lateral e no login, sem exigir o logo no header mobile. A proposta de posicioná-lo à esquerda desse header é um ajuste visual adicional; não foi tratada como defeito do arquivo da imagem, que respondeu HTTP 200 na verificação pública.
- **Lentidão em toda navegação:** relato do responsável, ainda sem medição autenticada em produção. O caminho mais simples do Início usa 14 consultas de carteira, em sequência, na composição atual: duas marcas com cinco consultas cada e quatro consultas de insumos; autenticação e perfil vêm antes. `src/lib/sessao.ts` usa `getUser()` e depois lê o perfil. O cache React evita duplicar essa função dentro do pedido, sem eliminar as consultas em um pedido novo. Não há `loading.tsx` em `src/app/`.
- **Medição pública:** três rodadas, sem sessão, em `/entrar`, `/ativos`, `/benchmarks` e `/icon.svg`. Respostas dinâmicas/redirecionamentos entre 350 e 596 ms; ícone em cache entre 189 e 202 ms. Tempos incluem a rede do cliente de diagnóstico e medem até os cabeçalhos. Esses números não reproduzem a navegação autenticada nem permitem atribuir a causa à Vercel.
- **Simulação local:** leitor real `src/lib/leitura.ts`, transpilado em memória, com respostas vazias fictícias e atraso artificial de 100 ms por consulta, na mesma sequência de insumos do Início: 14 chamadas em 1.550 ms, sem autenticação ou leitura do perfil. Demonstra o efeito acumulado das consultas em série; não é medida de produção. Nenhum dado de carteira ou conta de produção foi acessado.
- **Limite do teste anterior:** os 175 ms da task #40 foram medidos com o Supabase local. Não comprovam a latência da implantação Vercel–Supabase em produção. Região efetiva do banco e das funções e custos reais por consulta ainda não foram confirmados.
- **Encaminhamento proposto, sem implementação:** logo à esquerda no header mobile, feedback de navegação e investigação/otimização das consultas, conservando sessão por ponto de entrada, RLS, paginação completa e as marcas de coerência D13. Por envolver investigação em autenticação e composição financeira e ainda haver dúvida de alcance G1/G2, a triagem propõe nível completo para o próximo ciclo `005`, sem reservá-lo. Não é elegível à trilha curta como pacote: o logo mobile não restaura requisito anteriormente especificado e a causa de produção da lentidão permanece em diagnóstico.

Fontes técnicas primárias consultadas: [navegação e loading do Next.js](https://nextjs.org/docs/app/getting-started/linking-and-navigating), [getClaims/getUser do Supabase](https://supabase.com/docs/reference/javascript/auth-getclaims) e [regiões da Vercel](https://vercel.com/docs/regions). São referências para o diagnóstico; não autorizam mudar autenticação, cache ou regiões.

**Pergunta da triagem anterior, superada pela decisão abaixo:** confirma o nível completo e autoriza a ideação do ciclo 005 para tratar o header mobile e a lentidão de navegação, preservando as garantias financeiras e de isolamento? A triagem não criou artefato, issue, branch ou reserva de ciclo.

Naquele ponto, a autorização da verificação já havia sido recebida e a parte pública havia terminado; a verificação integral permanecia incompleta com os pontos relatados acima. A release e o encerramento ainda não tinham sido iniciados; a decisão seguinte muda o encaminhamento, sem transformar os itens pendentes em conferidos.

### Decisão de encaminhar o encerramento com pendências — 2026-10-15

Depois de informado de que o ciclo `004` ainda precisava tratar ou decidir o encaminhamento dos pontos de produção, concluir a verificação, publicar a release e integrar o encerramento documental, o responsável determinou: "Não seria interessante fechar o ciclo 004 e depois ir para o 005? Se sim vamos fazer isso."

A instrução humana mais recente é aplicada como decisão de prosseguir com a preparação da release `0.3.0` e do encerramento do `004`, mantendo o logo mobile e a lentidão como pendências para o próximo ciclo. É aceite administrativo para encaminhar o encerramento com limitações conhecidas; não é declaração de que todos os grupos autenticados foram conferidos, de que os pontos foram corrigidos ou de que o desempenho de produção passou no teste local.

Para este encerramento específico, a condição de verificação integral do ponto de release é substituída por esse aceite com pendências, pela precedência da instrução humana explícita em `.agent/ai_behavior.md`. A divergência em relação à sequência original do plano fica registrada aqui e em `004_task_closure.md`; a regra geral de verificação e as barreiras não mudam. Os merges da release e do encerramento continuam sujeitos a aprovação própria e checks verdes. O ciclo só fica concluído em `main` após o merge da PR de encerramento.

O ciclo `005` continua sem reserva ou artefato. O próximo trabalho proposto conserva os dois pontos e a investigação com dados fictícios; migração dos dados da origem permanece trabalho futuro, sem nova numeração atribuída.

## Encerramento

Não se aplica. Ciclo completo: verificação, release e encerramento permanecem separados.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 004 (completo)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 42 + be006cd`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: issue #42 aberta, plano em execução e autorização recebida sobre `main` @ `be006cd`; branch `feature/issue-42` publicada, PR #49 aberta e task aguardando integração.
- `result`: `executed`
- `evidence`: autorização humana de 2026-10-15; issue #42 e merge da PR #48 conferidos por `gh`; gates na tabela acima; `gh pr list --head feature/issue-42 --state all` vazio antes da publicação e `gh pr create` devolveu #49; nenhuma duplicação.
- `blockers`: aprovação própria do merge, condicionada aos checks verdes da revisão corrente no GitHub. A verificação em produção vem depois da integração e exige autorização própria; roteiro nesta task.

### Reconciliação após integração

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 42 + be006cd`; reconciliação do resultado existente.
- `effect_class`: `remote_mutation`
- `state_before`: PR #49 aberta em `55c332a`, cinco checks verdes; task aguardando integração; aprovação humana "aprovo o merge da PR #49" recebida em 2026-10-15.
- `state_after`: PR #49 integrada por squash e issue #42 fechada, conferidas no GitHub; `main` local atualizada por fast-forward; task concluída, aguardando autorização da verificação em produção. Ciclo permanece em execução.
- `result`: `executed`
- `evidence`: aprovação literal nesta conversa; checks e precondições conferidos com `gh pr view`; merge limitado ao commit aprovado por `gh pr merge 49 --squash --match-head-commit`; PR em `MERGED` e issue em `CLOSED`; ação externa da issue #41 já declarada pelo responsável e registrada na task anterior.
- `blockers`: autorização própria da verificação em produção ainda pendente. Nenhum acesso à produção foi realizado nesta reconciliação. Registro local para versionamento pelo próximo workflow mutante.

### Handoff da verificação pública em produção

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue/verificacao_producao + issue-42/publica-pos-PR-49 + 55c332a`
- `effect_class`: `local_mutation`
- `state_before`: entregas integradas, ciclo em execução e task da issue #42 concluída; verificação aguardando autorização própria.
- `state_after`: autorização registrada; 22 verificações públicas passaram; situação `Parado`, aguardando relato da conferência autenticada pelo responsável; ciclo continua em execução e issue #42 concluída.
- `result`: `executed`
- `evidence`: autorização humana literal em 2026-10-15; precondições conferidas com `gh`; respostas HTTP sem sessão em 2026-10-15 às 18:22 UTC e tabela acima. Registro local, sem publicação ou mudança no produto.
- `blockers`: resposta à pergunta registrada sobre a conferência autenticada. Nenhuma leitura de carteira, autenticação ou sincronização foi executada pelo agente; a conclusão do ciclo não foi inferida dos checks públicos.

### Handoff do retorno autenticado e diagnóstico

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue/verificacao_producao + issue-42/retorno-mobile-desempenho + 55c332a`
- `effect_class`: `local_mutation`
- `state_before`: verificação pública aprovada; situação `Parado`, aguardando retorno autenticado.
- `state_after`: retorno parcial e diagnóstico registrados; situação `Parado`, com logo mobile em avaliação e lentidão relatada em cada troca de tela; ciclo 004 permanece em execução. Triagem do próximo ciclo proposta somente em leitura, sem confirmação ou reserva.
- `result`: `executed`
- `evidence`: duas mensagens do responsável nesta conversa; inspeção do contrato e código; 12 medições HTTP sem sessão e simulação local do leitor, resumidas acima. Registro restrito a esta task, sem dados do usuário.
- `blockers`: confirmação do encaminhamento proposto e investigação da latência autenticada com dados fictícios; nenhuma causa de produção confirmada, mudança no produto ou aprovação dos demais itens foi inferida.
