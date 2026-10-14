# Task — Issue #37: base da interface, parser de quantias e apoio dos testes

> **Ciclo:** `004`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#37`
> **Plano:** `_project/drafts/004_telas_produto/004_plan.md`
> **Branch:** `feature/issue-37`
> **PR:** [#43](https://github.com/EuThiagoAndrade/saldo-futuro/pull/43)
> **Integração:** `Pendente`
> **Autorização inicial:** "autorizo a implementação da issue #37" em 2026-10-14
> **Modo contínuo:** `—`
> **Início:** 2026-10-14
> **Última atualização:** 2026-10-14
> **handoff_schema_version:** `2`

Instanciada a partir de `.agent/templates/task.md`. Ponto de aprovação "Autorizar implementação" da issue A concedido pelo responsável em 2026-10-14, depois do merge da PR documental #36 e da criação das issues #37 a #42.

## Objetivo

Entregar o item A do plano: a área autenticada com a navegação do `DESIGN.md`, a proteção por ponto de entrada (D2), os componentes de número e `N/D` (D5), os ícones (D7), "Ocultar valores" (D8), o parser de quantias (D12), a leitura completa e coerente para cálculo (D13) e o apoio dos testes com cenários fictícios (D9).

## Escopo autorizado

- Grupo `src/app/(app)/` com layout, navegação, `/conta` e `/admin`, e as páginas dos demais destinos em estado "em breve" até as issues B a F.
- `src/lib/sessao.ts`, `src/lib/ocultar.ts`, `src/lib/leitura.ts`, `src/lib/financeiro/quantias.ts` e `src/lib/apresentacao/`.
- `src/components/` (valores, ícones, navegação, estados, confirmação e campo monetário).
- `tests/e2e/apoio/` e os testes ponta a ponta da entrega; o ajuste só das asserções de conteúdo de `tests/e2e/auth.spec.ts` (ver "Decisões incidentais").
- `eslint.config.mjs` (regra contra `dangerouslySetInnerHTML`).
- Esta task e a rastreabilidade do plano e de `cycles.md`.

Fora do escopo: telas de ativos, lançamentos, fechamento, Início, benchmarks e acessos (issues #38 a #42); migração, função de banco ou dependência nova.

## Elegibilidade da trilha curta

Não se aplica.

## Barreiras de domínio

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Sim | Parser contra o CR-50 e componentes de número contra o CR-38, lendo o JSON dos casos; dinheiro formatado a partir de centavos inteiros, sem ponto flutuante; `N/D` por componente único; leitura completa e coerente testada no Supabase local |
| G2 — isolamento por RLS | Sim | Sem tabela, política ou função nova; sessão conferida em cada página, ação e rota (D2); usuário comum recusado em `/admin`; cenários de teste com usuários exclusivos por arquivo |
| G3 — privacidade de dados | Sim | Testes só com e-mails `example.com`, ativos de nome genérico e valores dos casos de referência; nenhum dado do usuário |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada ou alterada |

## Execução

- [x] Registro das issues #37 a #42 no plano (rastreabilidade e handoff de `criar_issues`) e em `cycles.md`; plano `Em Execução` e ciclo `Em execução`.
- [x] Parser `src/lib/financeiro/quantias.ts` (KB-004, seção 10): recusa com o motivo `formato` ou `faixa`, sem arredondar; `quantias.test.ts` lê o CR-50 do JSON (16 entradas, inclusive `1234.56` recusado e o limite da faixa).
- [x] Textos de valor em `src/lib/apresentacao/valores.ts`: dinheiro a partir de centavos `bigint`, sem ponto flutuante, com U+00A0 depois de `R$` e U+2212 nos negativos; percentuais pelo arredondamento da KB-004; sinal explícito nas variações; pontos percentuais. `valores.test.ts` confere o CR-38 e o limite da faixa.
- [x] Componentes `src/components/valores.tsx` (`NaoDisponivel`, `ValorOculto`, `Percentual`, `PontosPercentuais`, `VariacaoPercentual` e os conteúdos de dinheiro) e `src/components/dinheiro.tsx` (`Dinheiro` e `VariacaoDinheiro`, que leem a ocultação no servidor). `valores.test.tsx` renderiza o HTML: `N/D` nunca vira zero, a quantia oculta não aparece no texto nem no nome acessível, a variação combina sinal, ícone e cor.
- [x] `src/lib/sessao.ts` com `exigirSessao()` e `exigirAdmin()` (D2), usados em cada página, na ação e no layout; falha ao ler o perfil vira o estado de erro.
- [x] Grupo `src/app/(app)/`: layout com o botão "Ocultar valores" e a navegação depois do conteúdo no DOM; páginas `/`, `/conta`, `/admin` e as dos demais destinos em estado "em breve"; `error.tsx` no grupo e na raiz; `not-found.tsx` em português.
- [x] Navegação (`src/components/navegacao.tsx`): barra inferior com cinco posições, folha "Mais" em diálogo nativo (Esc e toque fora fecham) e menu lateral com divisor a partir de `lg`; Administração só para o admin; `aria-current="page"`.
- [x] "Ocultar valores" (D8): cookie `sf_ocultar_valores` `httpOnly`, lido no servidor (`src/lib/ocultar.ts`), alternado por Server Action que exige sessão.
- [x] Ícones SVG próprios, estados vazio, carregando e erro, diálogo de confirmação destrutiva e campo monetário com o parser.
- [x] `src/lib/leitura.ts` (D13): `lerTudo` com contagem exata, `lerTabela` com a ordem total de cada tabela, marcas da carteira e do benchmark e `lerComposicao` com até 3 tentativas. `leitura.test.ts` (9 testes) com cliente falso.
- [x] Apoio dos testes (`tests/e2e/apoio/`): usuários exclusivos por arquivo, cliente com a sessão do usuário, cenários pelas funções do banco com a conferência de datas contra o hoje real, e SQL local para as séries globais.
- [x] Testes ponta a ponta novos: `navegacao.spec.ts` (proteção por ponto de entrada, navegação no celular e no desktop, 404 do admin para o usuário comum, Conta, ocultação com recarga e navegação, ação sem sessão, falha de perfil e axe em todas as rotas em 360 px e 1280 px), `cenarios.spec.ts`, `leitura.spec.ts` (cada tabela da carteira com páginas de 2 linhas, alteração entre coletas e entre páginas, lançamento retroativo, 3 tentativas) e `benchmarks.spec.ts` (série com 1.200 valores, substituição entre páginas e entre cobertura e valores).
- [x] `eslint.config.mjs`: `react/no-danger` como erro, conferido com um arquivo que usa `dangerouslySetInnerHTML`.
- [x] Conferência visual em 360 px e 1280 px com um usuário fictício; capturas fora do repositório.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes unitários | `npm test`: 13 arquivos, 153 testes passaram |
| Ponta a ponta com o Supabase local | `npx playwright test`: 40 passaram, 4 pulados (os de preview sem backend) |
| Ponta a ponta sem backend | 12 passaram, 32 pulados (os que exigem o Supabase local) |
| Tipos e lint | `npm run typecheck` sem erro; `npm run lint` sem erro (3 avisos só em `local/`, ignorado pelo Git) |
| Build | `npm run build` com e sem backend |
| Testes da governança | `node --test scripts/validate-governance.test.mjs`: 39 passaram |
| Validador | 0 erros, 0 avisos |
| `git diff --check` | Passou |
| Checks remotos | Pendente |


## Revisão da correção

Não se aplica.

## Decisões incidentais e desvios

- **`auth.spec.ts`:** o plano (D9) diz que o arquivo não muda, para preservar o preparo e a limpeza dos usuários. Mas ele confere em `/` o título "Em construção", o e-mail e o perfil, que a D1 move para `/conta`. Perguntado em 2026-10-14, o responsável escolheu ajustar só as asserções de conteúdo; preparo e limpeza ficam idênticos.
- **Destinos ainda sem tela:** cada merge publica em produção. Para a navegação não levar a páginas inexistentes entre as issues, `/lancamentos`, `/ativos`, `/benchmarks`, `/transferencias` e `/admin` existem já, protegidas, em estado "em breve"; as issues B a F as substituem.
- **Ocultação sem página com dinheiro:** nenhuma página desta entrega mostra quantia. A ocultação é provada nos componentes (HTML renderizado, `valores.test.tsx`) e no mecanismo de ponta a ponta (cookie antes da carga, recarga, navegação, alternância e ação sem sessão). A conferência de ponta a ponta sobre quantias reais da tela vai com a issue B, a primeira com dinheiro.
- **Componentes de dinheiro em dois arquivos:** `valores.tsx` (renderizável no Vitest) e `dinheiro.tsx` (lê a ocultação no servidor). Toda quantia passa por `Dinheiro` ou `VariacaoDinheiro`. O Vitest passou a incluir `*.test.tsx`.
- **Sem `loading.tsx` no grupo:** o limite de Suspense do grupo começava a resposta com status 200, e o `notFound()` do admin deixava de responder 404. Os esqueletos ficam como componente, para uso por página.
- **Contagem que muda dentro de uma composição:** a primeira execução mostrou que o erro de contagem de uma coleta escapava da composição. Ele agora conta como "os dados mudaram" e provoca nova tentativa; falha de página continua sendo erro direto.
- **SQL local de preparo:** as séries de benchmark são globais e nenhum papel da Data API, nem a chave secreta, pode apagá-las. O apoio usa o `psql` do contêiner do Supabase local (`supabase_db_saldo-futuro`, o mesmo no CI) só para limpar as séries no início e no fim do arquivo serial e para simular a falha de perfil. A função recusa qualquer URL que não seja local.

## Encerramento

Não se aplica.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 004 (completo)
Quem: Responsável
Conferir: [PR #43](https://github.com/EuThiagoAndrade/saldo-futuro/pull/43): checks, diff e as decisões incidentais desta task
Diga: "aprovo o merge da PR #43"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `saldo-futuro + 004 + implementar_issue + 37 + 0bf2b2e`
- `effect_class`: `remote_mutation`
- `state_before` / `state_after`: antes, issue #37 aberta, sem branch nem task; depois, branch `feature/issue-37` publicada, PR aberta e esta task `Aguardando integração`.
- `result`: `executed`
- `evidence`: autorização de 2026-10-14; base `main` @ `0bf2b2e`; a tabela "Evidências" acima.
- `blockers`: aprovação do merge e checks remotos.
