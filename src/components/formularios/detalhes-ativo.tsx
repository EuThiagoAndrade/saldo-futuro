"use client";

import { type ReactNode, useRef, useState } from "react";
import { ComboboxAtivo } from "@/components/combobox-ativo";
import { Campo, classeCampo } from "@/components/campos";
import { useManterAposReset } from "@/components/formularios/manter-apos-reset";
import { ListaSuspensa } from "@/components/lista-suspensa";
import type { Opcao } from "@/lib/telas/combobox";
import {
  AJUDA_HIBRIDOS,
  AJUDA_PRAZO,
  AJUDA_VEICULO,
  algumAtributoInformado,
  alternarNoConjunto,
  type AtributosAtivo,
  AVISO_ATRIBUTOS,
  COBERTURAS_FGC,
  type ColunaIndicador,
  EXCLUSIVOS_INDEXADOR,
  EXCLUSIVOS_VEICULO,
  INDEXADORES_REMUNERACAO,
  INDICADORES,
  INDICADORES_VISIVEIS,
  type OpcaoAtributo,
  OPCOES_INDICADOR,
  REGIMES_TRIBUTARIOS,
  SITUACOES_PRAZO,
  UNIDADES_PRAZO,
  valorDoIndicador,
  VEICULOS_ACESSO,
} from "@/lib/telas/detalhes-ativo";

type ValorIndicador = "sim" | "nao" | "";
type ColunaVisivel = (typeof INDICADORES_VISIVEIS)[number]["coluna"];

// Campos descritivos do ativo (ciclo 012, issue #128, BL-009), comuns ao cadastro e à edição:
// classe e instituição como campos principais, com busca (DESIGN.md 6.8), e o resto dentro de "Mais
// detalhes", fechado por padrão. A classe é um nó da taxonomia global (ciclo 013, issue #138):
// seletor único, opcional, com o caminho completo, sem criação. A instituição segue oferecendo
// "Cadastrar «texto»". Nada aqui entra em cálculo.
//
// Atributos complementares (ciclo 017, issue #173) organizados em quatro grupos com título (ciclo
// 018, issue #182, D13): Produto, Tributação, Resgate e Proteção e exposição. Veículo e indexador
// são listas suspensas de múltipla escolha (D14); regime, prazo e FGC, selects nativos. Previdência
// é opção do veículo (D18): o indicador antigo não aparece, e a edição devolve o valor gravado num
// campo oculto, sem alterá-lo. Os campos são controlados: uma recusa do servidor mantém o que foi
// escolhido.
export function CamposDetalhes({
  prefixo,
  classes,
  instituicoes,
  inicial,
}: {
  /** Prefixo dos ids, para não repetir entre formulários. */
  prefixo: string;
  /** Nós da taxonomia em ordem hierárquica, com o caminho completo como nome. */
  classes: readonly Opcao[];
  instituicoes: readonly Opcao[];
  inicial?: { classe: string | null; instituicao: string | null } & Record<ColunaIndicador, boolean | null> & AtributosAtivo;
}) {
  const algumInformado = inicial ? INDICADORES_VISIVEIS.some((i) => inicial[i.coluna] !== null) || algumAtributoInformado(inicial) : false;
  const [indicadores, setIndicadores] = useState(
    () =>
      Object.fromEntries(INDICADORES_VISIVEIS.map((i) => [i.coluna, valorDoIndicador(inicial?.[i.coluna] ?? null)])) as Record<ColunaVisivel, ValorIndicador>,
  );
  const [veiculos, setVeiculos] = useState<string[]>(inicial?.veiculos_acesso ?? []);
  const [indexadores, setIndexadores] = useState<string[]>(inicial?.indexadores_remuneracao ?? []);
  const [regime, setRegime] = useState(inicial?.regime_tributario ?? "");
  const [prazoTipo, setPrazoTipo] = useState(inicial?.prazo_resgate_tipo ?? "");
  // Zero é valor: vira "0", nunca vazio.
  const [prazoDias, setPrazoDias] = useState(inicial?.prazo_resgate_dias?.toString() ?? "");
  const [prazoUnidade, setPrazoUnidade] = useState(inicial?.prazo_resgate_unidade ?? "");
  const [fgc, setFgc] = useState(inicial?.cobertura_fgc ?? "");
  const secao = useRef<HTMLDetailsElement>(null);
  useManterAposReset(secao);

  const indicador = (coluna: ColunaVisivel, dica?: string) => {
    const definicao = INDICADORES.find((i) => i.coluna === coluna)!;
    const idDica = `${prefixo}-${definicao.campo}-dica`;
    return (
      <fieldset className="flex flex-col gap-1" aria-describedby={dica ? idDica : undefined}>
        <legend className="mb-1 text-sm/5 font-medium text-text">{definicao.rotulo}</legend>
        {dica && (
          <p id={idDica} className="text-sm/5 text-text-secondary">
            {dica}
          </p>
        )}
        <div className="flex flex-wrap gap-x-5">
          {OPCOES_INDICADOR.map((opcao) => (
            <label key={opcao.valor} className="flex min-h-11 items-center gap-2 text-base/6">
              <input
                type="radio"
                name={definicao.campo}
                value={opcao.valor}
                checked={indicadores[coluna] === opcao.valor}
                onChange={() => setIndicadores((atual) => ({ ...atual, [coluna]: opcao.valor }))}
                className="size-5"
              />
              {opcao.rotulo}
            </label>
          ))}
        </div>
      </fieldset>
    );
  };

  return (
    <>
      <Campo id={`${prefixo}-classe`} rotulo="Classe">
        <ComboboxAtivo
          id={`${prefixo}-classe`}
          nome="taxonomia"
          opcoes={classes}
          valorInicial={inicial?.classe ?? undefined}
          placeholder="Opcional: busque pela classe"
          foraDaLista="Escolha uma classe da lista."
          semResultado="Nenhuma classe encontrada."
        />
      </Campo>
      <Campo id={`${prefixo}-instituicao`} rotulo="Instituição">
        <ComboboxAtivo
          id={`${prefixo}-instituicao`}
          nome="instituicao"
          nomeNovo="instituicaoNova"
          opcoes={instituicoes}
          valorInicial={inicial?.instituicao ?? undefined}
          placeholder="Opcional: busque ou cadastre"
          foraDaLista="Escolha uma instituição da lista ou cadastre uma nova."
          semResultado="Nenhuma instituição cadastrada. Digite um nome para cadastrar."
        />
      </Campo>
      {/* Legado do indicador Previdência (D18): só na edição, com o valor gravado, para a migração convertê-lo. */}
      {inicial ? <input type="hidden" name="previdencia" value={valorDoIndicador(inicial.previdencia)} /> : null}
      <details ref={secao} open={algumInformado} className="rounded-md border border-border">
        <summary className="flex min-h-11 cursor-pointer items-center px-4 text-sm/5 font-medium text-primary hover:bg-surface-subtle">
          Mais detalhes
        </summary>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <p className="text-sm/5 text-text-secondary">{AVISO_ATRIBUTOS}</p>
          <div className="flex flex-col divide-y divide-border">
            <Grupo titulo="Produto">
              <ListaSuspensa
                id={`${prefixo}-veiculos`}
                legenda="Veículo de acesso"
                dica={`${AJUDA_VEICULO} Não se aplica não combina com as outras opções.`}
                nome="veiculo"
                opcoes={VEICULOS_ACESSO}
                marcados={veiculos}
                aoAlternar={(codigo, marcado) => setVeiculos((atual) => alternarNoConjunto(atual, codigo, marcado, VEICULOS_ACESSO, EXCLUSIVOS_VEICULO))}
                vazio="Não informado"
              />
              <ListaSuspensa
                id={`${prefixo}-indexadores`}
                legenda="Indexador da remuneração"
                dica={`${AJUDA_HIBRIDOS} Prefixado (sem indexador) e Não se aplica não combinam com as outras opções.`}
                nome="indexador"
                opcoes={INDEXADORES_REMUNERACAO}
                marcados={indexadores}
                aoAlternar={(codigo, marcado) =>
                  setIndexadores((atual) => alternarNoConjunto(atual, codigo, marcado, INDEXADORES_REMUNERACAO, EXCLUSIVOS_INDEXADOR))
                }
                vazio="Não informado"
              />
            </Grupo>
            <Grupo titulo="Tributação">
              <Campo id={`${prefixo}-regime`} rotulo="Regime tributário">
                <Escolha id={`${prefixo}-regime`} nome="regime" catalogo={REGIMES_TRIBUTARIOS} valor={regime} aoMudar={setRegime} vazio="Não informado" />
              </Campo>
              {indicador("isento_ir")}
            </Grupo>
            <Grupo titulo="Resgate">
              <div className="flex flex-col gap-1">
                <label htmlFor={`${prefixo}-prazo`} className="text-sm/5 font-medium text-text">
                  Prazo para resgate ou venda
                </label>
                <Escolha
                  id={`${prefixo}-prazo`}
                  nome="prazoTipo"
                  catalogo={SITUACOES_PRAZO}
                  valor={prazoTipo}
                  aoMudar={setPrazoTipo}
                  vazio="Não informado"
                  descricao={`${prefixo}-prazo-ajuda`}
                />
                <p id={`${prefixo}-prazo-ajuda`} className="text-sm/5 text-text-secondary">
                  {AJUDA_PRAZO}
                </p>
              </div>
              {/* Dias e unidade só existem com "Prazo em dias": fora dele, não são enviados. */}
              {prazoTipo === "prazo" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id={`${prefixo}-prazo-dias`} rotulo="Dias">
                    <input
                      id={`${prefixo}-prazo-dias`}
                      name="prazoDias"
                      inputMode="numeric"
                      autoComplete="off"
                      value={prazoDias}
                      onChange={(e) => setPrazoDias(e.target.value)}
                      className={classeCampo}
                    />
                  </Campo>
                  <Campo id={`${prefixo}-prazo-unidade`} rotulo="Unidade">
                    <Escolha
                      id={`${prefixo}-prazo-unidade`}
                      nome="prazoUnidade"
                      catalogo={UNIDADES_PRAZO}
                      valor={prazoUnidade}
                      aoMudar={setPrazoUnidade}
                      vazio="Escolha a unidade"
                    />
                  </Campo>
                </div>
              )}
              {indicador("liquidez_imediata", "Indica se você usa o ativo como reserva. É diferente do prazo informado acima.")}
            </Grupo>
            <Grupo titulo="Proteção e exposição">
              <Campo id={`${prefixo}-fgc`} rotulo="Cobertura do FGC">
                <Escolha id={`${prefixo}-fgc`} nome="fgc" catalogo={COBERTURAS_FGC} valor={fgc} aoMudar={setFgc} vazio="Não informado" />
              </Campo>
              {indicador("exposicao_cambial")}
            </Grupo>
          </div>
        </div>
      </details>
    </>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0" aria-label={titulo}>
      <h2 className="text-base/6 font-semibold text-text">{titulo}</h2>
      {children}
    </section>
  );
}

/** Select nativo de escolha única; a primeira opção, de valor vazio, é "Não informado" (ou o pedido de escolha). */
function Escolha({
  id,
  nome,
  catalogo,
  valor,
  aoMudar,
  vazio,
  descricao,
}: {
  id: string;
  nome: string;
  catalogo: readonly OpcaoAtributo[];
  valor: string;
  aoMudar: (valor: string) => void;
  vazio: string;
  descricao?: string;
}) {
  return (
    <select id={id} name={nome} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-describedby={descricao} className={classeCampo}>
      <option value="">{vazio}</option>
      {catalogo.map((o) => (
        <option key={o.codigo} value={o.codigo}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}
