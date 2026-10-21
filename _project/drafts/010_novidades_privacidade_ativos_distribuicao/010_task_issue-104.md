# Task — Issue #104: Publicar páginas de privacidade e termos e preparar OAuth

> **Ciclo:** `010`
> **Trilha:** `normal`
> **Estado:** `Em andamento`
> **Tipo:** `feature`
> **Issue:** `#104`
> **Plano:** `_project/drafts/010_novidades_privacidade_ativos_distribuicao/010_plan.md`
> **Branch:** `feature/issue-104`
> **PR:** —
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #104" em 2026-10-21
> **Modo contínuo:** `—`
> **Início:** 2026-10-21
> **Última atualização:** 2026-10-21
> **handoff_schema_version:** `2`

## Objetivo

Publicar `/privacidade` e `/termos` como páginas estáticas e públicas, descrever o produto em `/entrar` com e sem backend, oferecer os dois links em Conta e preparar na KB-002 o roteiro da publicação OAuth que o responsável executará depois das quatro entregas do ciclo.

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
- [x] `/entrar` com descrição do produto (registro de ativos, lançamentos, transferências e fechamentos; patrimônio, rentabilidade e comparação com CDI e IPCA), restrição de acesso e links, com e sem backend. Sem backend, `PreviewNotice` recebe a apresentação e os links e o login continua indisponível (nenhum botão nem campo).
- [x] Conta com os dois links; menu lateral e barra inferior com os mesmos destinos de antes (o e2e conta os 7 links do menu do usuário comum).
- [x] E2e: `paginas-publicas.spec.ts` (novo, com e sem backend: 200 sem redirecionamento, título, descrição, data, contato em forma de link sem repetir o endereço, ausência de marcadores de rascunho, links cruzados, teclado e foco, axe e ausência de rolagem horizontal em 360, 375 e 1280 px, alvos de 44 px e nenhum pedido a outra origem); `preview.spec.ts` (apresentação e links em `/entrar` sem login e axe); `navegacao.spec.ts` (páginas legais sem sessão, links em Conta, menu sem destino legal e axe autenticado nas duas rotas); `botoes.spec.ts` (varredura das rotas públicas).
- [x] KB-002: armadilha 7 separa Audience, Branding e a exceção de identidade básica, preservando o fato histórico do ciclo 001; GC2, GC4, P2 e a verificação "Recusa" condicionados ao status da Audience; nova seção O1 a O6 com os três domínios distintos, resultado mínimo e paradas. KB-003: capacidades da entrega, com consolidação no encerramento.
- [x] Gates de aplicação e de governança (tabela de evidências); auditoria visual pelo DESIGN.md em 375 px e desktop, com dados fictícios.
- [ ] Revisão humana dos textos e do contato de Q8 registrada nesta task por commit na branch da PR, antes do merge (R2-2).

## Evidências

| Validação | Resultado |
| :-- | :-- |
| `npm ci` | Passou |
| `npm run lint` | 0 erros; três avisos preexistentes em script ignorado de validação local (`local/`) |
| `npm run typecheck` | Passou |
| `npm test` | 319/319 (26 arquivos); a entrega é de marcação e texto, sem teste unitário novo |
| Build | Passou, sem backend e com backend, pelo `webServer` do Playwright |
| E2e sem backend | 30 passaram e 143 pulados (suítes que exigem Supabase), inclusive `paginas-publicas.spec.ts` e `preview.spec.ts` |
| `npx supabase test db` | 261/261 (7 arquivos) |
| E2e com backend | Rodada 1, antes do ajuste dos alvos de toque: 163 passaram e 10 pulados. Rodada 2, no código final: 162 passaram, 10 pulados e 1 falhou: `carteira.spec.ts` CR-04 por timeout esperando o campo "Origem" de Transferências, tela que esta entrega não altera, enquanto o mesmo servidor atendia a conferência visual manual. Reexecução isolada de `carteira.spec.ts`: 8/8. Os 25 testes das rotas novas e alteradas passaram na rodada 2 |
| Auditoria visual (DESIGN.md) | Tokens, escala tipográfica (24/32, 20/28, 16/24 e 14/20), foco visível, alvo de 44 px em todo link (achado corrigido nesta entrega), 360/375/1280 px sem rolagem horizontal e axe WCAG 2.2 AA sem violações |
| Governança | `node --test scripts/validate-governance.test.mjs` 48/48; `node scripts/validate-governance.mjs` com 0 erros, 0 avisos e cinco itens manuais |
| G3 | `git grep` do e-mail de contato: só em `src/app/privacidade/page.tsx` e `src/app/termos/page.tsx`; nenhum outro endereço de e-mail no diff |
| `git diff --check` | Passou |
| Checks remotos | Pendente |

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
- Sem mudança de banco, autenticação, schema, cálculo ou dependências.

## Encerramento

Não se aplica: o ciclo é completo e o encerramento tem PR própria.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Pronto para continuar — ciclo 010 (completo)
Quem: Qualquer ferramenta, a pedido do responsável
Conferir: —
Diga: "continue o ciclo 010"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 010 + implementar_issue + 104/Item-1-BL-012 + c0e906eb96f5030fce27db734a43938b41e6a783`
- `effect_class`: `local_mutation`
- `state_before` / `state_after`: plano `v2` Aprovado, ciclo Planejamento, issue #104 aberta, sem branch nem PR / implementação em andamento na branch `feature/issue-104`
- `result`: `not_executed`
- `evidence`: autorização "autorizo a implementação da issue #104" em 2026-10-21; `git fetch` com `main` igual a `origin/main` em `c0e906e`; `gh pr list --state open` vazio
- `blockers`: implementação em curso, coberta pela autorização registrada no cabeçalho; este bloco é substituído ao publicar a PR
