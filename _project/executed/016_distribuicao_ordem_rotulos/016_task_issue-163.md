# Task — Issue #163: Ajustar ordem e rótulos da distribuição (BL-016 e BL-017)

> **Ciclo:** `016` (trilha curta: `—`)
> **Trilha:** `normal`
> **Estado:** `Concluída`
> **Tipo:** `feature`
> **Issue:** `#163`
> **Plano:** `_project/executed/016_distribuicao_ordem_rotulos/016_plan.md`
> **Branch:** `feature/issue-163`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/164
> **Integração:** `Pendente` — a PR traz o encerramento prospectivo; o estado `Concluída` só vale depois do merge
> **Autorização inicial:** "autorizo a implementação da issue #163" em 2026-10-30
> **Modo contínuo:** `—`
> **Início:** 2026-10-30
> **Última atualização:** 2026-10-30
> **handoff_schema_version:** `2`

## Objetivo

Tornar a ordem, a visão inicial e os rótulos do detalhe da distribuição do Início coerentes com a preferência do responsável: alternador Por instituição → Por classe → Por ativo, com Por instituição como padrão, e participações do detalhe de classe chamadas "% na carteira" e "% na classe", sem mudar cálculo, base, dados ou navegação.

## Escopo autorizado

Item 1 do plano (BL-016 e BL-017 integrais): parser e lista de visões em `src/app/(app)/page.tsx`; rótulos e texto explicativo em `src/components/detalhe-do-ramo.tsx`; nota de novidades para a próxima versão em `src/lib/novidades.ts`, com `publicadaEm: null`; testes afetados; DESIGN.md (6.12 e 6.13) e KB-003; encerramento prospectivo do ciclo leve. Sem alteração de cálculo, bases, dados, schema, autenticação, RLS, leitores financeiros ou `src/lib/financeiro/niveis.ts`.

## Origem no backlog

Snapshot herdado do plano, sem nova seleção nem alteração dos itens:

- **BL-016 — Ordem das visões da distribuição do patrimônio:** integral.
- **BL-017 — Rótulos claros das participações no detalhe por classe:** integral.
- Snapshot: `_project/backlog.md` no commit da fila canônica `89e0666a219df1ee136d53055518f31884c31c9b`, presente em `main`; destino ciclo 016 em preparação, itens inalterados. O retorno à fila, só depois da integração comprovada, usa a referência `ciclo 016`; sua publicação exige autorização separada. BL-009 é apenas contexto informado e não é origem selecionada.

## Elegibilidade da trilha curta

Não se aplica — trilha normal, ciclo leve.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só seleção de visão e rótulos; nenhum cálculo, base ou módulo financeiro foi alterado (`niveis.ts`, `alocacao.ts`, `instituicao.ts` e `rateio.ts` intocados). Os e2e de regressão continuam conferindo as participações de referência (instituição 27,78 / 22,22 / 16,67 / 13,89 / 11,11 / 6,67 / 1,66; macro e subclasse nas duas bases) sem alterar os esperados |
| G2 — isolamento por RLS | Não | Sem tabela, política, função, autenticação ou leitor novo; o padrão usa o leitor institucional já existente, sob a sessão do usuário |
| G3 — privacidade de dados | Sim | Somente usuários, ativos, instituições e valores fictícios nos testes; nota de novidades, comentários e documentação sem dado do usuário; nenhum arquivo de `local/` foi lido |
| G4 — migrações só acrescentam | Não | Nenhuma migração criada, editada ou removida |

## Execução

- [x] Issue #163, plano `v2` aprovado e autorização conferidos; `main` igual a `origin/main` (`89e0666`); branch `feature/issue-163` criada.
- [x] `page.tsx`: `visaoDe` devolve Por instituição para parâmetro ausente ou inválido e preserva `ativo` e `classe`; alternador na ordem Por instituição, Por classe, Por ativo; comentários ajustados. Leitores, composição, formulário e `hrefDaDistribuicao` não mudaram.
- [x] `detalhe-do-ramo.tsx`: "% na carteira" e "% na classe" na tabela, nos cartões e no texto explicativo, que passa a dizer que a segunda base é a classe aberta (macro ou subclasse).
- [x] `novidades.ts`: nota da `0.12.0` com `publicadaEm: null`, sem identificadores técnicos; comentário do arquivo ajustado para o registro posterior da data.
- [x] Testes: `novidades.test.ts` (nota futura com versões literais); e2e `analises-inicio` (ordem, padrão ausente/inválido/vazio, três valores explícitos, rótulos e explicação), `distribuicao-classe` (padrão institucional e Por ativo explícito), `distribuicao` e `inicio` (pedem Por ativo), `navegacao-desempenho` (só a prova D13 pede Por ativo; as medições seguem em `/`).
- [x] DESIGN.md (6.12 e 6.13) e KB-003 atualizados; `niveis.ts` mantido, com os nomes antigos nos comentários como nomes internos das bases (KB-004).
- [x] Gates locais executados e staging revisado (evidências abaixo).
- [x] PR #164 publicada com `Closes #163`; checks remotos e aprovação específica do merge pendentes.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários: 476/476 (1 novo da nota futura); governança: 48/48; lint sem erros (3 avisos preexistentes em `local/`), typecheck e build passaram; e2e autenticado com Supabase local e dois workers sobre `analises-inicio`, `distribuicao-classe`, `distribuicao`, `inicio`, `novidades`, `cartoes-inicio` e `eixo-patrimonio`: 44 passed, nenhum falho nem flaky, saída 0. Banco: não executado, sem alteração de banco. A suíte e2e completa roda no CI |
| Validador | 0 erros, 0 avisos; itens manuais conferidos (G3: só dados fictícios; nenhum arquivo de `local/` lido) |
| `git diff --check` | Passou |
| Checks remotos | Pendente — dependem da PR |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Texto explicativo.** Além de trocar os nomes, acrescentei "dentro da classe aberta" à segunda base, para esclarecer que ela segue o grupo aberto (macro ou subclasse), como pede o plano; as bases e os cálculos não mudaram.
- **Teste de "Início" geral.** O cenário de ocultação e acessibilidade de `inicio.spec.ts` abre `/` e passa a exercitar a visão institucional por padrão; mantive seu objetivo, sem pedir Por ativo, porque ele não depende dessa visão. O cenário CR-17, que inspeciona o detalhe por ativo, pede `?distribuicao=ativo`.
- **Nota da versão futura.** `0.12.0` é a expectativa a partir da `0.11.0` (não há PR de release aberta na entrega); a versão efetiva será conferida na PR do release-please depois do merge, sem presumir publicação. A data fica `null` até a release ser publicada e comprovada, em demanda própria.
- **Não alterado.** `niveis.ts`, módulos financeiros, leitores, banco, demais telas, backlog e BL-009.

## Encerramento

Encerramento prospectivo autorizado pela aprovação do plano `v2` e preparado nesta única entrega do ciclo leve:

- [x] Item 1 implementado e critérios de aceite comprovados nas evidências acima.
- [x] DESIGN.md (6.12 e 6.13) e KB-003 consolidam a ordem, o padrão e os rótulos; nenhuma regra financeira, política ou ADR.
- [x] Plano Concluído, task Concluída, pasta em `executed/` e `cycles.md` Concluído, como estado prospectivo depois do merge desta PR.
- [x] Histórico de aprovação, revisão, origem e evidências preservado; nenhum SHA do próprio merge na task.
- [ ] Conferir checks remotos verdes e obter "aprovo o merge da PR #164".

Antes da integração, a situação efetiva é Aguardando merge. Release, registro da data da nota em `/novidades` e o retorno de BL-016 e BL-017 à fila ocorrem depois da integração, cada um por seu procedimento e com suas autorizações; nenhum deles é parte desta entrega.

## Próximo passo

Encerramento prospectivo: antes do merge da [PR #164](https://github.com/EuThiagoAndrade/saldo-futuro/pull/164), a situação efetiva é Aguardando merge. Checks e diff devem estar conferidos antes da frase "aprovo o merge da PR #164".

```text
PRÓXIMO PASSO
Situação: Concluído — ciclo 016 (leve)
Quem: —
Conferir: —
Diga: —
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 016 + implementar_issue + 163 + 89e0666a219df1ee136d53055518f31884c31c9b`
- `effect_class`: `remote_mutation`
- `state_before`: plano `v2` aprovado, issue #163 aberta, implementação autorizada em 2026-10-30; `main` e `origin/main` em `89e0666`.
- `state_after`: item 1 implementado e validado localmente; PR #164 publicada na branch `feature/issue-163`; plano Concluído, task Concluída, `executed/` e `cycles.md` Concluído como estado prospectivo; aguardando checks e aprovação do merge.
- `result`: `executed`
- `evidence`: 476 testes unitários, 48 de governança, lint, typecheck, build e 44 e2e dos arquivos afetados (todos passaram); validador sem erros; evidências acima.
- `blockers`: nenhum para publicar; o merge depende de checks verdes e "aprovo o merge da PR #164". Release, data da nota e retorno do backlog seguem depois, cada um por seu procedimento.
