import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { textoDinheiro } from "../../lib/apresentacao/valores";
import { comporDistribuicao, type PosicaoDaDistribuicao } from "../../lib/financeiro/distribuicao";
import { ValorOculto } from "../valores";
import { GraficoRosca } from "./rosca";

// Rosca da distribuição renderizada no servidor (#107, BL-005; DESIGN.md 6.13). Dados fictícios.

const posicao = (n: number, nome: string, saldo: number): PosicaoDaDistribuicao => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  nome,
  saldo,
});

function html(posicoes: PosicaoDaDistribuicao[], oculto = false) {
  return renderToStaticMarkup(
    <GraficoRosca
      id="teste"
      titulo="Distribuição por ativo em abril de 2026"
      descricao="Participação na soma dos saldos positivos; saldos negativos ficam fora da rosca."
      distribuicao={comporDistribuicao(posicoes)}
      dinheiro={(c) => (oculto ? <ValorOculto /> : textoDinheiro(c))}
    />,
  );
}

/** Trecho entre a legenda de uma tabela e o fim dela. */
const tabela = (saida: string, legenda: string) => saida.slice(saida.indexOf(`<caption`, saida.indexOf(legenda) - 80)).split("</table>")[0];

const NBSP = " ";
/** Setores das fatias (a seta de Outros também é um path). */
const fatias = (saida: string) => saida.match(/<path d="M[^"]*" fill="var\(--color-chart-/g) ?? [];

const sete = ["Ativo A", "Ativo B", "Ativo C", "Ativo D", "Ativo E", "Ativo F", "Ativo G"].map((nome, i) => posicao(i + 1, nome, 100));

describe("GraficoRosca", () => {
  it("cinco fatias e Outros: legenda, Outros retrátil e tabelas com as mesmas participações, sem contar Outros duas vezes", () => {
    const saida = html([...sete, posicao(9, "Negativo fictício", -500)]);
    expect(fatias(saida)).toHaveLength(6);
    expect(saida).toContain("var(--color-chart-5)");
    // Legenda: 14,29% para A a D, 14,28% para E; Outros (F e G) com 28,56% e os componentes abertos no details.
    expect(saida.match(/14,29%/g)!.length).toBeGreaterThanOrEqual(4);
    expect(saida).toContain("28,56%");
    expect(saida).toMatch(/<details class="group">.*Outros.*2 ativos.*Ativo F.*Ativo G.*<\/details>/s);

    const resumo = tabela(saida, "Resumo");
    const detalhe = tabela(saida, "Detalhe por ativo");
    expect(resumo).toContain("Outros");
    expect(resumo).not.toContain("Ativo F");
    expect(detalhe).not.toContain("Outros");
    for (const nome of ["Ativo A", "Ativo F", "Ativo G", "Negativo fictício"]) expect(detalhe).toContain(nome);
    expect(resumo).toContain(`R$${NBSP}2,00`);
    expect(detalhe).toContain(`R$${NBSP}1,00`);
  });

  it("negativos ficam listados fora da rosca, sem participação nem fatia", () => {
    const saida = html([posicao(1, "Ativo A", 100000), posicao(2, "Ativo B", -20000), posicao(3, "Ativo Z", 0)]);
    expect(saida).toContain("Saldos negativos, fora da rosca");
    expect(saida).toContain(`−R$${NBSP}200,00`);
    expect(saida).toContain("fora da rosca</td>");
    expect(saida).not.toContain("Ativo Z");
    // Um único positivo é um anel completo: círculo, sem setores.
    expect(saida.match(/<circle /g)).toHaveLength(1);
    expect(fatias(saida)).toHaveLength(0);
    expect(saida).toContain("100,00%");
  });

  it("sem positivos: mensagem, sem rosca e sem total de 100%; negativos continuam", () => {
    const saida = html([posicao(1, "Ativo A", 0), posicao(2, "Ativo B", -200)]);
    expect(saida).toContain("Não há saldos positivos para exibir.");
    expect(saida).not.toContain("<svg");
    expect(saida).not.toContain("100,00%");
    expect(saida).toContain("Ativo B");
  });

  it("geometria proporcional: 75% e 25% terminam no ponto esperado da circunferência", () => {
    const saida = html([posicao(1, "Ativo A", 300), posicao(2, "Em trânsito", 100)]);
    const caminhos = [...saida.matchAll(/<path d="(M[^"]+)" fill="var\(--color-chart-/g)].map((m) => m[1]);
    expect(caminhos).toHaveLength(2);
    // A primeira fatia vai do topo (100, 4) até três quartos de volta (4, 100), com arco grande.
    expect(caminhos[0]).toMatch(/^M100 4A96 96 0 1 1 4 100L40 100A60 60 0 1 0 100 40Z$/);
    expect(caminhos[1]).toMatch(/^M4 100A96 96 0 0 1 100 4L/);
  });

  it("fatia de 0,00% continua na legenda e na geometria; nome longo não é truncado", () => {
    const longo = "Fundo fictício de renda fixa com um nome bem comprido para conferir a quebra de linha na legenda";
    const saida = html([posicao(1, longo, 9007199254740991), posicao(2, "Ativo pequeno", 1)]);
    expect(saida).toContain(longo);
    expect(saida).not.toContain("…");
    expect(saida).toContain("0,00%");
    expect(fatias(saida)).toHaveLength(2);
  });

  it("com Ocultar valores, nenhuma quantia aparece, nem em atributos; participações e nomes continuam", () => {
    const saida = html([...sete, posicao(9, "Negativo fictício", -500)], true);
    expect(saida).not.toContain("R$");
    expect(saida).not.toMatch(/\d,\d{2}(?!%)/);
    expect(saida).toContain("Valor oculto");
    expect(saida).toContain("14,29%");
    expect(saida).toContain("Ativo G");
    for (const atributo of saida.matchAll(/(?:aria-label|title|aria-labelledby)="([^"]*)"/g)) expect(atributo[1]).not.toMatch(/R\$|\d+,\d{2}(?!%)/);
  });

  it("não usa JavaScript: sem script nem manipuladores de evento", () => {
    const saida = html(sete);
    expect(saida).not.toContain("<script");
    expect(saida).not.toMatch(/\son[a-z]+=/);
  });
});
