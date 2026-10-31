import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CamposDetalhes } from "./detalhes-ativo";

// "Mais detalhes" em grupos e Previdência como veículo (ciclo 018, issue #182, D13 e D18). O campo
// oculto da edição devolve o indicador antigo sem alterá-lo, para nenhuma edição apagar um "Sim"
// antes da migração que o converte. Dados fictícios.

type Inicial = NonNullable<Parameters<typeof CamposDetalhes>[0]["inicial"]>;

const vazio: Inicial = {
  classe: null,
  instituicao: null,
  previdencia: null,
  liquidez_imediata: null,
  exposicao_cambial: null,
  isento_ir: null,
  veiculos_acesso: [],
  indexadores_remuneracao: [],
  regime_tributario: null,
  prazo_resgate_tipo: null,
  prazo_resgate_dias: null,
  prazo_resgate_unidade: null,
  cobertura_fgc: null,
};
const html = (inicial?: Inicial) =>
  renderToStaticMarkup(<CamposDetalhes prefixo="teste" classes={[]} instituicoes={[]} inicial={inicial} />);

describe("CamposDetalhes", () => {
  it("na edição, o campo oculto devolve o valor gravado do indicador antigo", () => {
    expect(html({ ...vazio, previdencia: true })).toContain('<input type="hidden" name="previdencia" value="sim"/>');
    expect(html({ ...vazio, previdencia: false })).toContain('<input type="hidden" name="previdencia" value="nao"/>');
    expect(html(vazio)).toContain('<input type="hidden" name="previdencia" value=""/>');
  });

  it("no cadastro, não há campo da Previdência: o indicador fica nulo", () => {
    expect(html()).not.toContain('name="previdencia"');
  });

  it("não mostra o indicador Previdência, mostra a opção do veículo e os quatro grupos na ordem", () => {
    const saida = html();
    expect(saida).not.toContain(">Previdência</legend>");
    expect(saida).toContain("Previdência (PGBL ou VGBL)");
    const grupos = ["Produto", "Tributação", "Resgate", "Proteção e exposição"].map((g) => saida.indexOf(`>${g}</h2>`));
    expect(grupos.every((p) => p > 0)).toBe(true);
    expect([...grupos].sort((a, b) => a - b)).toEqual(grupos);
  });

  it("um ativo só com o indicador antigo não abre Mais detalhes, porque ele não aparece", () => {
    expect(html({ ...vazio, previdencia: true })).not.toContain("<details open");
    expect(html({ ...vazio, isento_ir: false })).toContain('<details open=""');
  });
});
