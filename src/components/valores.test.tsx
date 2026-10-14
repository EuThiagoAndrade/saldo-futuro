import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ND } from "../lib/financeiro/rentabilidade";
import {
  ConteudoDinheiro,
  ConteudoVariacaoDinheiro,
  NaoDisponivel,
  Percentual,
  PontosPercentuais,
  VariacaoPercentual,
} from "./valores";

// Componentes de valor renderizados como HTML (D5, D8; DESIGN.md 6.2 a 6.5).

const html = (elemento: React.ReactElement) => renderToStaticMarkup(elemento);
const NBSP = " ";

describe("N/D nunca vira zero (6.5)", () => {
  for (const [nome, elemento] of [
    ["dinheiro", <ConteudoDinheiro key="d" valor={ND} oculto={false} />],
    ["percentual", <Percentual key="p" valor={ND} />],
    ["pontos percentuais", <PontosPercentuais key="pp" valor={ND} />],
    ["variação percentual", <VariacaoPercentual key="vp" valor={ND} />],
    ["variação em dinheiro", <ConteudoVariacaoDinheiro key="vd" valor={ND} oculto={false} />],
  ] as const) {
    it(nome, () => {
      const saida = html(elemento);
      expect(saida).toBe(html(<NaoDisponivel />));
      expect(saida).toContain("Não disponível");
      expect(saida).not.toMatch(/0,00|R\$/);
    });
  }
});

describe("dinheiro", () => {
  it("mostra o valor a partir de centavos", () => {
    expect(html(<ConteudoDinheiro valor={123456} oculto={false} />)).toContain(`R$${NBSP}1.234,56`);
    expect(html(<ConteudoDinheiro valor={-123456n} oculto={false} />)).toContain(`−R$${NBSP}1.234,56`);
  });

  it("oculto, não revela a quantia no texto nem no nome acessível", () => {
    for (const elemento of [
      <ConteudoDinheiro key="d" valor={123456} oculto />,
      <ConteudoVariacaoDinheiro key="v" valor={-8000} oculto />,
    ]) {
      const saida = html(elemento);
      expect(saida).toContain("Valor oculto");
      expect(saida).not.toMatch(/\d/);
      expect(saida).not.toContain("<svg"); // nem a direção
    }
  });

  it("recusa centavos que não são inteiros seguros", () => {
    expect(() => html(<ConteudoDinheiro valor={1.5} oculto={false} />)).toThrow();
  });
});

describe("variação: sinal, ícone e cor juntos (6.4)", () => {
  it("positiva, negativa e zero", () => {
    const alta = html(<VariacaoPercentual valor={0.0123} />);
    expect(alta).toContain("+1,23%");
    expect(alta).toContain("text-gain");
    expect(alta).toContain('aria-hidden="true"');

    const baixa = html(<ConteudoVariacaoDinheiro valor={-8000} oculto={false} />);
    expect(baixa).toContain(`−R$${NBSP}80,00`);
    expect(baixa).toContain("text-loss");

    const zero = html(<VariacaoPercentual valor={-0.00004} />);
    expect(zero).toContain("0,00%");
    expect(zero).not.toContain("−");
    expect(zero).toContain("text-neutral");
  });
});
