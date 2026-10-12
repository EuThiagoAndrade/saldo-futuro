---
name: design-system-check
description: "Audita, em modo somente leitura, se uma interface ou artefato visual cumpre o contrato de design-system/DESIGN.md."
---

# Design System Check

Pode ser usado diretamente para uma auditoria visual ou chamado por um workflow antes de publicar uma PR que altere interface. Recebe o escopo auditado (arquivos, rotas ou capturas com dados fictícios); não pressupõe permissão de escrita e não altera arquivos.

Se `design-system/DESIGN.md` não existir, emita `[MANUAL] contrato visual ainda inexistente` e pare.

1. Leia `design-system/DESIGN.md` por inteiro e `.agent/ai_behavior.md`, seção de privacidade.
2. Confira **tokens**: cores, tipografia, espaçamento e raios vêm de tokens semânticos, sem valores literais fora do contrato.
3. Confira **contratos financeiros** (G8):
   - valores monetários com `R$` e separadores pt-BR;
   - algarismos tabulares em todo valor numérico;
   - variação com sinal e ícone, nunca só com cor;
   - estado `N/D` quando o dado não existir, em vez de zero.
4. Confira **componentes**: navegação, tabela que vira lista de cartões no celular, formulários com `inputmode="decimal"`, confirmação de ação destrutiva e estados vazio, carregando e erro.
5. Confira **acessibilidade**: contraste dos pares usados contra os mínimos registrados, alvo de toque de pelo menos 44 px, foco visível e respeito a `prefers-reduced-motion`.
6. Confira **celular primeiro**: a composição funciona na menor largura do contrato, sem rolagem horizontal da página.
7. Confira **privacidade**: capturas, exemplos e fixtures usam somente dados fictícios (G3).

## Handoff estruturado

Retorne: escopo auditado, versão do `DESIGN.md` lida, achados classificados como `[ERRO]` (viola o contrato), `[AVISO]` (risco ou desvio não normativo) e `[MANUAL]` (exige julgamento humano), e conclusão `passou | falhou | bloqueado`. Mutação: nenhuma.
