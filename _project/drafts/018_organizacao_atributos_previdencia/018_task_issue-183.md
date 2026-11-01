# Task — Issue #183: Reorganizar o filtro de Ativos em grupos com listas suspensas

> **Ciclo:** `018`
> **Trilha:** `normal`
> **Estado:** `Aguardando integração`
> **Tipo:** `feature`
> **Issue:** `#183`
> **Plano:** `_project/drafts/018_organizacao_atributos_previdencia/018_plan.md`
> **Branch:** `feature/issue-183`
> **PR:** https://github.com/EuThiagoAndrade/saldo-futuro/pull/186
> **Integração:** `Pendente`
> **Autorização inicial:** "Autorizo a #183" em 2026-10-31, em resposta à pergunta "Autoriza a implementação da issue #183?"
> **Modo contínuo:** `—`
> **Início:** 2026-10-31
> **Última atualização:** 2026-10-31
> **handoff_schema_version:** `2`

## Objetivo

Entregar o Item 2 do plano aprovado: o "Filtrar" da página Ativos nos quatro grupos, com listas suspensas só com as opções em uso, painel que fecha ao aplicar e mostra a lista, contador de campos com filtro e "Limpar filtros" ao lado (P4, D13 a D16).

## Escopo autorizado

Grupos no painel; `ListaSuspensaFiltro` e `opcoesEmUso`; exclusividade só de "Não informado" em `lerFiltros`; campos do prazo condicionais por CSS; envio à âncora da lista, painel fechado ao aplicar e aberto só com erro, erro no topo da lista; contador (`camposComFiltro`) e "Limpar filtros" ao lado; fim da linha de filtros aplicados e de `descreverFiltros`; DESIGN.md 6.7 e 6.12, KB-003, roteiro VB1 a VB7 da verificação em produção na KB-002 e nota da 0.14.0 em `/novidades`. Fora: banco, preservar filtros depois de editar, faixa de prazo com dois limites.

## Origem no backlog

Não se aplica (herdado do plano).

## Elegibilidade da trilha curta

Não se aplica — trilha normal, Item 2 do ciclo completo.

## Barreiras de domínio

Toda linha é obrigatória. "Não se aplica" exige justificativa. Com G1 ou G2 marcados com "Sim", o modo contínuo não pode estar `ativo`.

| Barreira | Aplica-se? | Evidência ou justificativa |
| :-- | :-- | :-- |
| G1 — exatidão financeira | Não | Só interseção de conjuntos e comparação de inteiros declarados na mesma unidade, como no ciclo 017; nenhum cálculo novo |
| G2 — isolamento por RLS | Não se aplica | Sem tabela, função ou política nova; a página continua lendo pela sessão do usuário, e opções e filtros derivam das mesmas linhas |
| G3 — privacidade de dados | Sim | Somente dados fictícios nos testes; a URL guarda só códigos; o roteiro VB pede relato só de passou ou falhou |
| G4 — migrações só acrescentam | Não se aplica | Nenhuma migração nesta entrega |

## Execução

- [x] Issue #183 aberta; issue #182 integrada (PR #184), com a ação externa relatada; base `origin/main` `c31081d`; registros da #182 reconciliados.
- [x] `opcoesEmUso`, `camposComFiltro` e exclusividade só de "Não informado" (`filtros-ativos.ts`).
- [x] Painel em grupos, `ListaSuspensaFiltro`, prazo condicional por CSS, envio à âncora, contador e "Limpar filtros" ao lado; erro no topo da lista.
- [x] Testes unitários e e2e; documentação e nota da 0.14.0.
- [x] Gates locais completos e staging revisado.
- [x] PR #186 publicada com `Refs #183`; merge só depois do teste local do responsável.

## Evidências

| Validação | Resultado |
| :-- | :-- |
| Testes | Unitários 512/512; lint sem erros; typecheck e build passaram; banco 671/671 (sem migração nova); as três especificações de Ativos juntas: 33 passed e 1 flaky (`ativos.spec.ts`, acessibilidade a 1280 px, falha em 0 ms na primeira tentativa e aprovado na repetição). E2e completo sobre o build com dois workers: 230 passed, 12 skipped (preview sem backend), 1 flaky e 3 failed, todos fora de Ativos: em `migracao.spec.ts`, o processo do CLI e um worker saíram com o código do Windows 3221226505 (o mesmo do ciclo 015), e em `periodo-intervalo.spec.ts` o servidor de teste parou de responder (`ERR_CONNECTION_REFUSED`). Repetidos só esses dois arquivos: 42 passed e 1 flaky (o de mais de 1.000 eventos, mesmo código de saída, aprovado na repetição), saída 0. Nenhum teste ou código foi alterado para contornar. Depois da correção de Limpar: as três especificações de Ativos 34/34, unitários 512/512 e lint sem erros |
| Validador | 48/48 testes de governança; validador sem erros depois do registro do número da PR |
| `git diff --check` | Passou |
| Checks remotos | Em execução na PR #186 (depois da correção de Limpar, novo commit) |

## Revisão da correção

Não se aplica — trilha normal.

## Decisões incidentais e desvios

- **Campos do prazo por CSS:** `group-has-[option[value=prazo]:checked]` esconde Comparação, Dias e Unidade fora de "Prazo em dias", sem JavaScript; navegador sem suporte a `:has()` mostra os campos. Conferido no navegador: escondidos, visíveis com "Prazo em dias" e escondidos de novo com "No vencimento". Valores digitados num campo escondido continuam sendo enviados e, fora de "Prazo em dias", o servidor mostra o erro já existente, como pede a P5.
- **"Limpar filtros" fora do resumo:** fica ao lado do `<details>` "Filtrar", não dentro do `summary`, para não pôr um link dentro de um controle de abrir e fechar.
- **URL com campos vazios:** o envio pelo formulário continua levando os campos vazios, que valem como Todos; os links das abas seguem sem eles.
- **E2e:** a linha de status sumiu, então os testes passaram a conferir o contador e o painel fechado; o seletor do prazo é pelo id, porque o rótulo também nomeia o grupo do prazo.
- **Defeito achado no teste local do responsável e corrigido nesta PR:** depois de "Limpar filtros", o painel ainda mostrava as escolhas anteriores marcadas, embora a lista e o contador já estivessem sem filtro. "Limpar filtros", voltar e avançar trocam a página sem recarregá-la (navegação do Next), e as listas e os campos do painel só liam a URL na primeira montagem. O painel agora tem a chave dos filtros da URL e é recriado sempre que eles mudam; trocar de aba não muda os filtros e mantém o painel. Conferido no navegador (filtro aplicado → Limpar: nada marcado e FGC em Todos → Voltar: escolhas de volta) e coberto pelo e2e "Filtrar: OU…" (Limpar desmarca tudo; Voltar restaura). Os outros blocos do teste local passaram, conforme o relato do responsável.
- **Servidor de teste local parado antes do build**, porque o build e o servidor de desenvolvimento usam a mesma pasta `.next`.

## Roteiro de teste local — antes de aprovar o merge

No navegador do app, com a PR rodando na pasta do 018 e o mesmo usuário local de teste:

1. Em **Ativos**, abra **Filtrar**: quatro grupos com título; não há seletor "Previdência".
2. **Veículo de acesso:** a lista mostra só as opções que os seus ativos de teste usam, mais "Não informado". Marque duas e veja o campo fechado listar as duas.
3. **Prazo:** com "Todos", não aparecem Comparação, Dias e Unidade; escolha "Prazo em dias" e eles aparecem.
4. **Aplique:** o painel fecha e a página mostra a lista; o "Filtrar" mostra um número (campos com filtro) e "Limpar filtros" aparece ao lado.
5. **Abas:** troque para Desativados e volte; o filtro continua. Use "Limpar filtros".
6. **Erro:** abra a URL `/ativos?fgc=talvez`; o painel abre e a mensagem aparece no lugar da lista.
7. **Celular:** simule 360 px e repita 1 a 4; nada cortado nem rolagem para o lado.

## Encerramento

Não se aplica — ciclo completo; encerramento em PR própria, depois da verificação em produção.

## Próximo passo

```text
PRÓXIMO PASSO
Situação: Aguardando merge — ciclo 018 (completo)
Quem: Responsável
Conferir: Checks e diff da [PR #186](https://github.com/EuThiagoAndrade/saldo-futuro/pull/186); roteiro de teste local desta task
Diga: "aprovo o merge da PR #186"
```

## Handoff de saída

- `handoff_schema_version: 2`
- `logical_key`: `EuThiagoAndrade/saldo-futuro + 018 + implementar_issue + 183 + c31081d56d7ce0d0ff2f51de3db655f90db6b36b`
- `effect_class`: `remote_mutation`
- `state_before`: PR #184 integrada e ação externa da #182 relatada; #183 aberta; "Autorizo a #183" recebida em 2026-10-31.
- `state_after`: Item 2 implementado e validado localmente; PR #186 publicada na branch `feature/issue-183`, sem fechar a #183.
- `result`: `executed`
- `evidence`: tabela de evidências acima.
- `blockers`: teste local do responsável e aprovação do merge.
