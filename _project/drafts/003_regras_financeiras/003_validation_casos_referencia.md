# Validação dos casos de referência — ciclo 003

> **Ciclo:** `003`
> **Issue:** `#26`
> **Data:** 2026-10-14
> **Objeto:** casos `CR-01` a `CR-50` da KB-004 (`_project/knowledge/KB-004_regras_financeiras.md`) e `tests/fixtures/financeiro/casos_referencia.json`

Registro exigido por D12 e P17: o recálculo por outra ferramenta ou modelo, feito sem ver os valores esperados, e a conferência do responsável numa planilha. Toda divergência é resolvida e registrada aqui antes do merge da PR da issue #26.

## 1. Recálculo independente

### Quem e como

- **Autor dos esperados:** Claude (Claude Code, Opus 5.5), com frações exatas em Python para os valores de máquina e o passo a passo na KB.
- **Recalculador:** Claude Sonnet, outro modelo, executado como subagente sem acesso ao repositório. Ele declarou não ter aberto, listado nem buscado nada no repositório.
- **O que recebeu:**
  - só as seções 1 a 10 da KB-004 (regras), sem as seções 11 a 14 (rastreabilidade, decisões K com exemplos e casos);
  - as entradas do JSON, com a lista das chaves pedidas e sem os valores esperados.
- **Limite da independência:** a seção 2 das regras cita dois exemplos de arredondamento (0,125 → 0,13 e 0,01005 → 1,01%), que também aparecem no CR-38; eles vêm dos critérios de aceite do plano.
- **Método:** script Python próprio, com `fractions.Fraction` e inteiros nos valores exatos e `float64` só nas divisões finais e nas composições de taxas.
- **Comparação:** pelo autor, com igualdade exata para centavos, textos e resultados de operação, e erro de até 10⁻⁹ × max(1, |esperado|) para razões.

### Resultado

| Rodada | Valores comparados | Iguais | Divergências |
| :-- | :-- | :-- | :-- |
| 1 | 250 | 246 | 4 |
| 2, depois das resoluções abaixo | 250 | 248 | 2, só de notação (CR-16) |

### Divergências e resoluções

| Caso | Divergência | Causa | Resolução |
| :-- | :-- | :-- | :-- |
| CR-02 `rendimento` | Esperado 12.345; recalculado −798.155 | Entrada ambígua: o caso não informava saldo real. O recalculador supôs saldo real 0 e somou o ajuste ao componente, como manda a seção 5 | Entrada corrigida: saldo real 810.500, igual ao calculado (ajuste zero). Na rodada 2, o recálculo deu 12.345. Valor esperado mantido |
| CR-50 `q15` | Esperado `recusado`; recalculado `recusado_faixa` | O esperado ignorava o motivo que a seção 3 nomeia para valor fora da faixa | Esperado corrigido para `recusado_faixa` na KB e no JSON. A regra não mudou |
| CR-16 `posicoes_apos_reabrir` | Esperado `0`; recalculado `[]` | Notação: contagem contra lista vazia | Mesmo significado (nenhuma posição). Mantido `0` |
| CR-16 `consolidado_apos_reabrir` | Esperado `inexistente`; recalculado `null` | Notação | Mesmo significado (consolidado removido). Mantido `inexistente` |

Nenhuma divergência de cálculo. As ambiguidades que o recalculador relatou foram:

- motivo das recusas de lançamento e do primeiro fechamento (CR-06), que a KB não nomeia e o caso espera como `recusado`;
- estado sem mês fechado depois de reabrir o primeiro mês (CR-06);
- composição em `float64` dos acumulados (CR-32 a CR-37, CR-44 a CR-47), com ruído de cerca de 10⁻¹⁶, dentro da tolerância.

Todas foram interpretadas como a KB especifica.

Divergências abertas: **nenhuma**.

## 2. Conferência do responsável

- **Pendente.** O responsável confere os valores esperados numa planilha, a partir das entradas e do passo a passo da KB-004, e registra aqui:
  - a data;
  - os casos conferidos;
  - cada divergência e sua resolução.
- Esta conferência é precondição do merge da PR da issue #26 (plano, "Pontos de aprovação").

| Data | Casos conferidos | Divergências | Resolução |
| :-- | :-- | :-- | :-- |
| — | — | — | — |
