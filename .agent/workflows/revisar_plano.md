---
description: "Revisar formalmente um plano ou uma correção da trilha curta e emitir veredito, sem aprovar, promover ou implementar."
---

# Workflow: Revisar plano

## Entradas

- Plano em `Rascunho` ou `Em Revisão`, com "revise o plano do ciclo NNN" ou o modo contínuo ativo.
- Ou correção da trilha curta pronta para PR, com "revise a correção da issue #N" ou o modo contínuo ativo.
- Autoridades `.agent/ai_behavior.md`, `_project/README.md` (seção "Revisão formal") e `_project/cycles.md`.
- Template `.agent/templates/plano_implementacao.md` ou `.agent/templates/task.md`.

## Barreira

- Confirmar que o alvo existe, está no ciclo ou na issue correta e ainda não foi aprovado.
- Template ausente ou alvo incompatível é achado bloqueador, não estrutura a improvisar.
- **Limites do revisor:** escrever somente na seção de revisão e nos campos de status e veredito. Não aprovar, não promover e não reescrever o plano ou a correção.
- Separar veredito de aprovação: `APTO PARA APROVAÇÃO` não equivale a `Aprovado`.

## Execução

1. **Plano:** ao revisar um `Rascunho`, mudar o status para `Em Revisão` antes do parecer.
2. **Escopo da revisão:**
   - plano: objetivo, escopo, não-escopo, sequência, dependências, riscos, pontos de aprovação (cobre e não cobre), critérios de aceite e G1 a G4;
   - correção: diff, teste de reprodução, elegibilidade e barreiras.
3. Verificar compatibilidade com as autoridades e a ausência de dados do usuário.
4. Verificar por inspeção somente leitura os fatos citados (arquivos, commits, versões, comportamento de ferramentas).
5. Registrar a rodada como `### Rodada N`, em "Revisão crítica" do plano ou em `## Revisão da correção` da task:
   - `Autor:` e `Revisor:` (ferramenta e modelo);
   - achados `RN-k`, classificados como bloqueador ou ressalva;
   - itens atendidos e veredito.
6. Aplicar a regra de progresso de `_project/README.md`. Sem progresso, com oscilação ou com discordância persistente, a situação é "Parado". O teto é de 5 rodadas.
7. Gravar o bloco e parar.
   - `REQUER NOVA RODADA` → "Aguardando correções (rodada N)", ou "Pronto para continuar" no modo contínuo ativo.
   - **Plano apto** → "Aguardando aprovação do plano". No modo contínuo ativo com `APTO PARA APROVAÇÃO`, "Pronto para continuar"; a promoção é feita por `criar_issues`.
   - **Plano com `APTO COM RESSALVAS` no modo contínuo** → "Parado", e o modo passa a `suspenso`.
   - **Correção apta** → "Pronto para continuar", e a PR é aberta por `corrigir_trilha_curta`.

## Saída

- Mutação: `local_mutation` na seção de revisão e nos campos de veredito.
- Nenhuma issue, implementação, PR ou integração.

## Situações de saída

- Aguardando correções (rodada N)
- Aguardando aprovação do plano
- Pronto para continuar
- Parado

## Handoff

Contrato versão 2 de `.agent/ai_behavior.md`.

- `handoff_schema_version: 2`
- `logical_key`: `repository + cycle + revisar_plano + alvo/rodada-N + versão revisada`
- `effect_class`: `local_mutation`
