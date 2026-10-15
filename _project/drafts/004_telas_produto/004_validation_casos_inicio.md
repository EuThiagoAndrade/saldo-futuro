# Validação dos casos de referência do Início — ciclo 004

> **Ciclo:** `004`
> **Issue:** `#40`
> **Data:** 2026-10-14
> **Objeto:** casos `CR-51` e `CR-52` da KB-004 (`_project/knowledge/KB-004_regras_financeiras.md`, seção 14, e regras da seção 15) e `tests/fixtures/financeiro/casos_referencia.json`

Registro exigido pelo ponto de aprovação "Aprovar merge da PR D" do plano do ciclo `004`. Ele contém o recálculo por outro modelo, feito sem ver os valores esperados, e a conferência do responsável. Toda divergência é resolvida e registrada aqui antes do merge da PR da issue #40. O método segue o do ciclo `003` (`_project/executed/003_regras_financeiras/003_validation_casos_referencia.md`).

## 1. Recálculo independente

### Quem e como

- **Autor dos esperados:** Claude (Claude Code, Opus 5.5), com o passo a passo na KB-004.
- **Recalculador:** Claude Sonnet, outro modelo, executado em 2026-10-14 como subagente com a instrução de não abrir, listar nem buscar arquivos do repositório. Ele declarou ter cumprido a instrução.
- **O que recebeu:**
  - só as regras: seções 1 (convenções), 4.2 e 4.3 (tipos, sinais e estorno), 8 (acumulado, K1 e K8) e 15 (apresentação do Início), sem a seção 14 (casos) e sem as decisões com exemplos;
  - as entradas do JSON dos dois casos, com a lista das chaves pedidas e sem os valores esperados.
- **Método declarado:** cálculo em Node.js, com `float64` só no encadeamento geométrico e inteiros nos centavos. O Python não estava disponível no ambiente do recalculador.
- **Comparação:** pelo autor, com igualdade exata para centavos, limites, meses e textos, e erro de até 10⁻⁹ × max(1, |esperado|) para razões.

### Resultado

| Caso | Valores comparados | Iguais | Divergências |
| :-- | :-- | :-- | :-- |
| CR-51 | 15 | 15 | 0 |
| CR-52 | 2 | 2 | 0 |

Duas razões vieram com a representação do `float64` do recalculador, diferente da escrita decimal da KB só depois da 15ª casa: `sugestao_ano` (0.00495000000000001 contra 0.00495) e `intervalo_2025_12_a_2026_01` (0.030200000000000005 contra 0.0302). A diferença está muito abaixo da tolerância, e não é divergência.

### Suposições relatadas pelo recalculador

- "N/D" como valor da chave `mes_referencia_sem_fechamento`, já que não há M. É a notação da KB.
- O período "ano" usa [janeiro de 2026, abril de 2026], e o início da carteira (novembro de 2025) fica fora dele. É a regra da seção 15.
- A ordem do encadeamento é da esquerda para a direita, depois −1. É a regra da seção 8.

Nenhuma suposição revelou lacuna na especificação.

## 2. Conferência do responsável

Pendente: o responsável confere os valores esperados do CR-51 e do CR-52 (por exemplo, numa planilha) antes da aprovação do merge da PR da issue #40, e o resultado é registrado aqui.

## 3. Conclusão

O recálculo independente concordou em todos os valores. Falta a conferência do responsável.
