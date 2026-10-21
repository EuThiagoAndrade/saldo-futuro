import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Novidade } from "../lib/novidades";
import { HistoricoNovidades } from "./novidades";

// Transição das novidades (#105, BL-011): oculta durante 0.6.0, visível na 0.7.0 com a data em
// confirmação e, depois do encerramento, com a data comprovada da release.

const html = (versaoAtual: string, historico: Novidade[]) =>
  renderToStaticMarkup(<HistoricoNovidades versaoAtual={versaoAtual} historico={historico} />);

const semData: Novidade[] = [{ versao: "0.7.0", publicadaEm: null, notas: ["Nota fictícia da versão."] }];
const comData: Novidade[] = [{ versao: "0.7.0", publicadaEm: "2026-10-30", notas: ["Nota fictícia da versão."] }];

describe("HistoricoNovidades", () => {
  it("em 0.6.0, a entrada 0.7.0 não aparece e o histórico fica indisponível", () => {
    const saida = html("0.6.0", semData);
    expect(saida).toContain("O histórico de novidades ainda não está disponível.");
    expect(saida).not.toContain("0.7.0");
    expect(saida).not.toContain("Nota fictícia");
  });

  it("em 0.7.0 com data null, mostra as notas e a data em confirmação", () => {
    const saida = html("0.7.0", semData);
    expect(saida).toContain("Versão 0.7.0");
    expect(saida).toContain("Nota fictícia da versão.");
    expect(saida).toContain("Data de publicação em confirmação");
    expect(saida).not.toContain("<time");
  });

  it("com a data comprovada, mostra a data por extenso", () => {
    const saida = html("0.7.0", comData);
    expect(saida).toContain('Publicada em <time dateTime="2026-10-30">30 de outubro de 2026</time>');
    expect(saida).not.toContain("em confirmação");
  });
});
