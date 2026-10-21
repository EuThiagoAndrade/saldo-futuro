# Task — Issue #104: Publicar páginas de privacidade e termos e preparar OAuth

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#104`
> **Plano:** `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-104`
> **PR:** [#108](https://github.com/EuThiagoAndrade/saldo-futuro/pull/108)
> **Integração:** `Conferida no GitHub — PR #108 MERGED em 2026-10-21; etapa externa pendente`
> **Autorização inicial:** "autorizo a implementação da issue #104" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Objetivo

Publicar `/privacidade` e `/termos` como páginas estáticas e públicas, levar a elas a partir de `/entrar` (com e sem backend) e de Conta, usar `/termos` como página inicial informada ao Google e preparar na KB-002 o roteiro da publicação OAuth que o responsável executará depois das quatro entregas do ciclo.

## Escopo autorizado

Item 1 (BL-012) do plano `v2` aprovado do ciclo 010 e issue #104. Não inclui as issues #105, #106 e #107, a ação no console do Google, a verificação em produção nem mudança de RLS, schema, autenticação ou escopos OAuth.

## Origem no backlog

Snapshot herdado do plano: BL-012, parcela integral (rotas públicas `/privacidade` e `/termos`, linkadas no login e nos menus, para publicar a tela de consentimento OAuth do Google). Fonte `_project/backlog.md` no commit `49a1332c8bc869d3b8dd148baf387de869288307`, já em main. Destino em preparação: ciclo 010; não altera a fila.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Páginas estáticas e textos; nenhum cálculo, leitura financeira ou regra da KB-004 alterada |
| G2 — isolamento por RLS | Não | Sem mudança de RLS, autenticação, sessão ou autorização; as páginas legais não leem dados e Conta mantém `exigirSessao`. Regressões de banco e autenticação executadas |
| G3 — privacidade de dados | Sim | Contato de Q8 somente no código das páginas públicas, conforme decisão Q8; nenhum outro e-mail, conta, valor ou print real; testes com usuários fictícios; sem leitura de `local/` ou produção |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Autorização, issue #104 aberta, plano `v2` Aprovado, PR documental #103 integrada e base `c0e906e` igual a `origin/main` conferidas; sem branch ou PR anteriores da #104.
- [x] Páginas `/privacidade` e `/termos` estáticas, fora de `(app)`, com metadata (título e descrição), data de atualização em `<time>`, seções semânticas, contato de Q8 em linha própria e links cruzados no rodapé (`src/components/pagina-legal.tsx` e `src/components/links-legais.tsx`). Nenhuma leitura de sessão, cookie ou banco nas páginas.
- [x] `/entrar` com os links, com e sem backend; sem backend, `PreviewNotice` recebe os links e o login continua indisponível (nenhum botão nem campo). A descrição do produto entregue na primeira versão foi retirada por decisão do responsável (item abaixo).
- [x] Conta com os dois links; menu lateral e barra inferior com os mesmos destinos de antes (o e2e conta os 7 links do menu do usuário comum).
- [x] E2e: `paginas-publicas.spec.ts` (novo, com e sem backend: 200 sem redirecionamento, título, descrição, data, contato em forma de link sem repetir o endereço, ausência de marcadores de rascunho, links cruzados, teclado e foco, axe e ausência de rolagem horizontal em 360, 375 e 1280 px, alvos de 44 px e nenhum pedido a outra origem); `preview.spec.ts` (links em `/entrar` sem login e axe); `navegacao.spec.ts` (páginas legais sem sessão, links em Conta, menu sem destino legal e axe autenticado nas duas rotas); `botoes.spec.ts` (varredura das rotas públicas).
- [x] KB-002: armadilha 7 separa Audience, Branding e a exceção de identidade básica, preservando o fato histórico do ciclo 001; GC2, GC4, P2 e a verificação "Recusa" condicionados ao status da Audience; nova seção O1 a O6 com os três domínios distintos, resultado mínimo e paradas. KB-003: capacidades da entrega, com consolidação no encerramento.
- [x] Gates de aplicação e de governança (tabela de evidências); auditoria visual pelo DESIGN.md em 375 px e desktop, com dados fictícios.
- [x] PR #108 publicada via `gh`, base `main`, referenciando a #104 sem fechamento automático; commit da entrega `4bc0f14`.
- [x] Decisão do responsável na revisão da PR (ver "Decisões incidentais"): `/entrar` sem os textos, só com logo e login centralizados e os links; `/termos` como página inicial informada ao Google. Título "Entrar" mantido só para leitores de tela (`sr-only`); e2e ajustados (ausência do texto, logo e botão no mesmo eixo, `/termos` com identificação, funcionalidade e link da política, sem botão nem campo); plano, KB-002 e KB-003 atualizados.
- [x] Revisão humana dos textos (R2-2): em 2026-10-21, sobre o HEAD `d48c6cf` da PR #108, o responsável declarou "Revisei os textos de /privacidade e /termos e o contato de Q8 no código: aprovados como estão.", na mesma mensagem de "aprovo o merge da PR #108". Síntese: redação de `/privacidade` e `/termos` aprovada sem alteração, inclusive o inventário factual e os pontos deixados de fora (retenção, residência de dados e conformidade), e o contato de Q8 aprovado para publicação no código das duas páginas. A decisão anterior sobre `/entrar` está em "Decisões incidentais". Registro feito por commit na branch antes do merge; o merge só ocorre com os checks verdes no HEAD que contém este registro.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm ci` | Passou |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 319/319 (26 arquivos); a entrega é de marcação e texto, sem teste unitário novo |
| Build | Passou, sem backend e com backend, pelo `webServer` do Playwright |
| E2e sem backend | 30 passaram e 143 pulados (suítes que exigem Supabase), inclusive `paginas-publicas.spec.ts` e `preview.spec.ts`. Depois da decisão sobre `/entrar`: 31 passaram e 143 pulados |
| `npx supabase test db` | 261/261 (7 arquivos) |
| E2e com backend | Rodada 1, antes do ajuste dos alvos de toque: 163 passaram e 10 pulados. Rodada 2, no código final: 162 passaram, 10 pulados e 1 falhou: `carteira.spec.ts` CR-04 por timeout esperando o campo "Origem" de Transferências, tela que esta entrega não altera, enquanto o mesmo servidor atendia a conferência visual manual. Reexecução isolada de `carteira.spec.ts`: 8/8. Os 25 testes das rotas novas e alteradas passaram na rodada 2. Rodada 3, depois da decisão sobre `/entrar`: 163 passaram, 10 pulados e 1 falhou em `public-assets.spec.ts` (ícones do manifesto) porque o processo do worker do Playwright caiu no Windows antes do teste (código 3221226505), sem asserção executada; reexecução isolada de `public-assets.spec.ts`: 6/6 |
| Auditoria visual (DESIGN.md) | Tokens, escala tipográfica (24/32, 20/28, 16/24 e 14/20), foco visível, alvo de 44 px em todo link (achado corrigido nesta entrega), 360/375/1280 px sem rolagem horizontal e axe WCAG 2.2 AA sem violações |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| G3 | `git grep` do e-mail de contato: só em `src/app/privacidade/page.tsx` e `src/app/termos/page.tsx`; nenhum outro endereço de e-mail no diff |
| `git diff --check` | Passou |
| Checks remotos | Todos verdes no head `372a520b913a96b84db3b234246554be066b7a97`: lint, tipos, testes, build e e2e de preview; Supabase local, testes de banco e e2e de autenticação; governança; Vercel |

## Revisão da correção

Não se aplica (trilha normal).

## Decisões incidentais e desvios

- **Fonte do contato de Q8:** os valores não estão no repositório, por decisão do plano. Foram lidos da conversa de revisão do plano de 2026-10-21, onde a `v1` registrava o contato fornecido pelo responsável; ficam somente no código de `/privacidade` e `/termos`. A conferência deles faz parte da revisão humana antes do merge.
- **Inventário factual usado nos textos:** login Google sem escopos extras no código (`signInWithOAuth` sem `scopes`); lista `authorized_emails` e perfil com e-mail e papel; carteira com nomes de ativos, eventos (data, tipo e valor, sem campo de texto livre), transferências, consolidados e posições, com exclusão em cascata a partir da conta; cookies de sessão do Supabase e `sf_ocultar_valores`; nenhuma dependência de análise ou publicidade; serviços Supabase, Vercel e Google; consulta ao SGS sem dado do usuário; RLS por usuário e admin sem acesso às carteiras pelo app.
- **Pontos deixados para a decisão do responsável (não afirmados nos textos):** prazo de retenção ou de atendimento de pedidos, região de armazenamento e transferência internacional, conformidade com a LGPD ou outra norma, cópias de segurança dos provedores e qualquer garantia de disponibilidade. Os textos dizem apenas que o app não apaga dados automaticamente e que a exclusão da conta remove a carteira.
- **Acesso técnico do administrador da infraestrutura:** a política declara que quem administra a infraestrutura tem acesso técnico ao banco; omitir isso tornaria "só você vê" uma garantia além do que a arquitetura assegura.
- **Alvo de toque:** a primeira versão tinha links dentro de frases (contato e referências cruzadas), abaixo dos 44 px do DESIGN.md 7. O contato passou a uma linha própria com `min-h-11`, e as referências cruzadas ficaram só no rodapé; o e2e confere 44 × 44 px em todo link da página.
- **Teste de marcadores de rascunho:** a primeira versão, sem distinção de caixa, acusou "todos" como `TODO`; passou a procurar `TODO`, `TBD` e `XXX` em maiúsculas, além de lorem ipsum e campos entre colchetes ou chaves.
- **Data de atualização das páginas:** 2026-10-21, data da redação; se a revisão humana alterar o texto em outra data, a data é ajustada no mesmo commit.
- **Proxy:** as páginas legais continuam no `matcher` do `src/proxy.ts`, que só renova a sessão quando há backend; sem sessão ele não altera a resposta. Mudar o matcher ficaria fora do escopo.
- **`/entrar` sem descrição (2026-10-21, decisão do responsável na revisão da PR #108):** "Não vejo necessidade destes textos estarem na página /entrar. Pode remove-los. Deixando apenas o ícone do programa centralizado e o botão abaixo centralizado. O restante permanece tudo como está." Avisado de que o Google não aceita como página inicial uma página só de login, escolheu "a (recomendada)": `/termos` como página inicial informada no console, mantendo `/entrar` como entrada do app. Substitui a decisão Q10 e o critério de `/entrar` do item 1 (registro no plano). Removidos o título visível "Entrar" e os dois parágrafos, inclusive no preview sem backend; mantidos os links, o formulário de senha local e a `description` da metadata, que não aparece na página. O `h1` continua só para leitores de tela, para a página não ficar sem título de seção. Esta manifestação trata só de `/entrar`; a revisão dos textos de `/privacidade` e `/termos` e do contato (R2-2) continua pendente.
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: o ciclo é completo e o encerramento tem PR própria.

## Reconciliação da integração

Em 2026-10-21, o responsável declarou "Revisei os textos de /privacidade e /termos e o contato de Q8 no código: aprovados como estão. aprovo o merge da PR #108". O agente registrou a revisão na task (`372a520`), esperou os checks desse HEAD (o CI ainda rodava na primeira consulta) e conferiu todos verdes e a PR `CLEAN` antes do squash, travado no mesmo HEAD, com o assunto `feat(issue-104): publicar páginas de privacidade e termos e preparar OAuth (#108)`, conferido em `main`. A PR não fechou a issue: #104 continua OPEN, como o plano define. Reconciliação feita na implementação autorizada da #105; não registra o SHA do próprio merge.

**Fatos distintos até o encerramento:** o código da entrega está integrado; a etapa externa (roteiro O1 a O6 da KB-002, com `/termos` como página inicial) ainda não começou e só começa depois de integrar as quatro entregas do ciclo. O resultado externo, a atualização factual da KB-002 e o fechamento da #104 entram na PR de encerramento; até lá, o próximo passo do ciclo fica no artefato ativo (task da issue em curso).

## Próximo passo

Etapa pendente desta issue, condicionada à integração das quatro entregas (#104 a #107); antes disso, vale o bloco da task da issue em curso.

```text
PRÓXIMO PASSO
Situação: Aguardando ação externa — ciclo 010 (completo)
Quem: Responsável
Conferir: Roteiro O1 a O6 da KB-002 (_project/knowledge/KB-002_operacao_producao_acessos.md), somente depois de integrar as quatro entregas do ciclo; issue #104 (https://github.com/EuThiagoAndrade/saldo-futuro/issues/104)
Diga: "concluí a ação externa da issue #104"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 104/Item-1-BL-012 + c0e906eb96f5030fce27db734a43938b41e6a783`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: PR #108 OPEN com a revisão R2-2 registrada / PR #108 MERGED por squash em main, issue #104 OPEN, task Concluída quanto ao código e etapa externa pendente
- `result`: `already_executed_and_reconciled`
- `evidence`: aprovação "aprovo o merge da PR #108" em 2026-10-21; checks verdes no head `372a520`; assunto conferido em main; `gh issue view 104` com estado OPEN
- `blockers`: nenhum para o código. Ação externa só depois das quatro entregas; fechamento da #104 pela PR de encerramento
