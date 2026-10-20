import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { GraficoLinha, GraficoBarras } from "./graficos";
import { textoEixoDinheiro, textoDinheiro } from "../../lib/apresentacao/valores";

const comum = { id: "teste", titulo: "Teste", descricao: "Dados fictícios", rotulosX: ["jan/26", "fev/26", "mar/26"], colunasTabela: ["Mês", "Valor"], linhasTabela: [{ rotulo: "fevereiro", valores: [textoDinheiro(121900001n)] }] };
it("curva abaixo da marca de 1,22 mi e tabela preservada em centavos", () => {
  const html = renderToStaticMarkup(<GraficoLinha {...comum} margemEsquerda={144} rotularY={textoEixoDinheiro} series={[{ nome: "Carteira", valores: [1200000, 1219000.01, 1260000], cor: "blue" }]} />);
  expect(html).toContain("R$ 1,22 mi");
  expect(html).toContain("R$ 1.219.000,01");
  const pontos = html.match(/points="([^"]+)"/)![1].split(" ").map((p) => p.split(",").map(Number));
  const marca = Number(html.match(/y="([^"]+)"[^>]*>R\$ 1,22 mi/)![1]);
  expect(pontos[1][1]).toBeGreaterThan(marca);
  expect(pontos[0][0]).toBeLessThan(pontos[1][0]);
  expect(pontos[1][0]).toBeLessThan(pontos[2][0]);
  expect(html).toContain('x1="144" x2="304"');
});
it("lacunas interrompem a linha; ponto único e ocultação no servidor", () => {
  const html = renderToStaticMarkup(<GraficoLinha {...comum} linhasTabela={[{ rotulo: "mês", valores: ["••••", "N/D"] }]} rotularY={() => "••••"} series={[{ nome: "Carteira", valores: [1200000, null, 1260000], cor: "blue" }]} />);
  expect(html.match(/<circle/g)).toHaveLength(2);
  expect(html).not.toContain("polyline");
  expect(html).not.toContain("R$");
  expect(html).toContain("N/D");
});
it("índices preservam callbacks de um argumento e distinção de séries", () => {
  const html = renderToStaticMarkup(<GraficoLinha {...comum} rotularY={(v) => v.toFixed(2).replace(".", ",")} series={[{ nome: "Carteira", valores: [100, 110, 120], cor: "blue" }, { nome: "CDI", valores: [100, 105, 110], cor: "teal", tracejada: true }]} />);
  expect(html).toContain("100,00");
  expect(html).toContain('stroke-dasharray="6 4"');
  expect(html).toContain('x1="70" x2="304"');
  expect(html).toContain("Carteira");
  expect(html).toContain("CDI");
});
it("barras percentuais preservam ganho, perda e lacuna", () => {
  const html = renderToStaticMarkup(<GraficoBarras {...comum} valores={[-0.1, null, 0.1]} rotularY={(v) => `${v * 100}%`} />);
  expect(html.match(/<rect/g)).toHaveLength(2);
  expect(html).toContain("var(--color-loss)");
  expect(html).toContain("var(--color-gain)");
  expect(html).toContain("-10%");
});

it("meses se distribuem no espaço disponível sem juntar o último par", () => {
  const rotulos = Array.from({ length: 12 }, (_, i) => `mes${i}`);
  const html = renderToStaticMarkup(<GraficoLinha {...comum} rotulosX={rotulos} margemEsquerda={144} rotularY={textoEixoDinheiro} series={[{ nome: "Carteira", valores: rotulos.map((_, i) => i * 10), cor: "blue" }]} />);
  const meses = [...html.matchAll(/x="([^"]+)" y="191"[^>]*>(mes\d+)</g)];
  expect(meses).toHaveLength(3);
  expect(meses.map((m) => m[2])).toEqual(["mes0", "mes6", "mes11"]);
  for (let i = 1; i < meses.length; i++) expect(Number(meses[i][1]) - Number(meses[i - 1][1])).toBeGreaterThanOrEqual(48);
});
