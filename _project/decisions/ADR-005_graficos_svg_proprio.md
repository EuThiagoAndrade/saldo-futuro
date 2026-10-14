---
title: "Gráficos em SVG próprio"
tags:
  - arquitetura
  - interface
  - gráficos
author: "Thiago Andrade e Claude"
module: "Interface"
last_updated: "2026-10-14"
origin_cycle: "004"
---

# ADR-005: Gráficos em SVG próprio

## Status

Aceito

## Contexto

A ADR-002 deixou a biblioteca de gráficos para o ciclo `004`, com a exigência de registrar a escolha em ADR. O `design-system/DESIGN.md` (seção 2.3) define a paleta em tokens agnósticos de biblioteca e exige:

- carteira em linha contínua e benchmark em linha tracejada;
- cor nunca como única diferença entre séries, com rótulo direto ou legenda com o mesmo traço;
- barras de variação em `gain` e `loss`;
- no máximo seis séries.

O ciclo `004` precisa de poucos tipos de gráfico: evolução do patrimônio (linha), rentabilidade mensal (barras de ganho e perda), base 100 da carteira contra benchmarks (linhas) e distribuição por ativo (barras horizontais). Um mês sem dado é `N/D` e nunca pode ser desenhado como zero (`DESIGN.md`, 6.5). A preferência "Ocultar valores" precisa valer também nos gráficos, já na renderização do servidor. O produto é pensado primeiro para o celular.

A origem (`Meus-Investimentos`) usava Chart.js carregado de CDN sem versão fixa, com valores ausentes convertidos em zero (ideação do ciclo `004`, defeito U1).

## Decisão

- Os gráficos são componentes SVG próprios, renderizados no servidor, sem JavaScript no cliente e sem dependência de pacote.
- São quatro tipos: linha, linha com séries tracejadas, barras de ganho e perda e barras horizontais.
- Cada gráfico tem título, descrição e uma tabela com os mesmos números, que é a forma acessível da informação.
- Um mês `N/D` é lacuna na série, nunca zero.
- Rótulos monetários, título, descrição e tabela obedecem à preferência "Ocultar valores" lida no servidor.
- Cores, traços e tipografia vêm dos tokens do `DESIGN.md`.

## Consequências

### Positivas

- Nenhuma dependência nova nem JavaScript de gráficos no celular.
- Controle total do contrato visual (tracejado, rótulo direto, tokens) e do tratamento de `N/D`.
- A ocultação de valores e a acessibilidade ficam no mesmo componente que desenha.

### Trade-offs

- Escalas, eixos e rótulos são código próprio, a manter e testar.
- Não há interação rica (zoom, dica ao passar o dedo); a tabela equivalente supre a leitura dos valores.
- Um tipo de gráfico novo exige implementação própria; se a necessidade crescer, esta decisão pode ser substituída por outra ADR.

## Alternativas consideradas

- **Biblioteca pronta (por exemplo, Recharts):** eixos, escalas e interação prontos, mas é uma dependência nova e maior no celular. Ajustá-la ao tracejado, ao rótulo direto, às cores por token e à ocultação no servidor exigiria customização.
- **Chart.js, como na origem:** renderiza em canvas no cliente, o que dificulta a acessibilidade e a ocultação no servidor; a origem não é reaproveitada (KB-001).

## Referências

- ADR-002, seção "Stack".
- `design-system/DESIGN.md`, seções 2.3, 6.5 e 7.
- Ideação do ciclo `004` (P4, defeito U1) e plano do ciclo `004` (D6, D8 e D14).
