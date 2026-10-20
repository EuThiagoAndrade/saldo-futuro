// Gráficos em SVG próprio (ADR-005; DESIGN.md 2.3; D6 do ciclo 004). Renderizados no servidor,
// sem JavaScript no cliente. Cada gráfico tem título, descrição e uma tabela com os mesmos
// números. Um mês N/D é lacuna, nunca zero. A carteira usa linha contínua; benchmarks, linha
// tracejada com rótulo direto. Os textos já vêm formatados (e ocultos, quando for o caso) de quem
// chama: o gráfico só posiciona.

import type { ReactNode } from "react";
import { escalar, faixaDe, marcas } from "./escala";

// Largura lógica pequena: o SVG escala até a largura do cartão, e o texto de 12 unidades fica
// legível tanto no celular (cerca de 11 px) quanto no desktop (cerca de 15 px).
const LARGURA = 360;
const ALTURA = 200;
const MARGEM = { topo: 12, direita: 56, base: 26, esquerda: 70 };
const AREA = { x0: MARGEM.esquerda, x1: LARGURA - MARGEM.direita, y0: MARGEM.topo, y1: ALTURA - MARGEM.base };

export interface LinhaTabela {
  rotulo: string;
  valores: ReactNode[];
}

function Moldura({
  id,
  titulo,
  descricao,
  colunas,
  linhas,
  children,
  altura = ALTURA,
}: {
  id: string;
  titulo: string;
  descricao: string;
  colunas: string[];
  linhas: LinhaTabela[];
  children: ReactNode;
  altura?: number;
}) {
  return (
    <figure className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <figcaption className="flex flex-col gap-1">
        <span id={`${id}-titulo`} className="text-lg/7 font-semibold text-text">
          {titulo}
        </span>
        <span id={`${id}-descricao`} className="text-sm/5 text-text-secondary">
          {descricao}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${LARGURA} ${altura}`}
        role="img"
        aria-labelledby={`${id}-titulo ${id}-descricao`}
        className="h-auto w-full"
        fontFamily="inherit"
      >
        {children}
      </svg>
      <details className="text-sm/5">
        <summary className="min-h-11 cursor-pointer content-center font-medium text-primary">Ver os números</summary>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                {colunas.map((c, i) => (
                  <th key={c} scope="col" className={`p-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.rotulo} className="border-b border-border last:border-0">
                  <th scope="row" className="p-2 font-normal">
                    {l.rotulo}
                  </th>
                  {l.valores.map((v, i) => (
                    <td key={i} className="p-2 text-right">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function EixoY({ valores, rotular, esquerda = AREA.x0 }: { valores: number[]; rotular: (v: number, marcas: number[]) => string; esquerda?: number }) {
  const f = { min: valores[0], max: valores.at(-1)! };
  return (
    <g>
      {valores.map((v) => {
        const y = escalar(v, f.min, f.max, AREA.y1, AREA.y0);
        return (
          <g key={v}>
            <line x1={esquerda} x2={AREA.x1} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
            <text x={esquerda - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--color-text-secondary)">
              {rotular(v, valores)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function EixoX({ rotulos, esquerda = AREA.x0 }: { rotulos: string[]; esquerda?: number }) {
  // Reserva espaço para os meses também quando a margem monetária cresce.
  const quantidade = Math.min(rotulos.length, 5, Math.floor((AREA.x1 - esquerda - 24) / 48) + 1);
  const visiveis = new Set(Array.from({ length: quantidade }, (_, i) => quantidade === 1 ? 0 : Math.round(i * (rotulos.length - 1) / (quantidade - 1))));
  return (
    <g>
      {rotulos.map((r, i) =>
        visiveis.has(i) ? (
          <text
            key={r}
            x={posicaoX(i, rotulos.length, esquerda)}
            y={AREA.y1 + 17}
            textAnchor="middle"
            fontSize={11}
            fill="var(--color-text-secondary)"
          >
            {r}
          </text>
        ) : null,
      )}
    </g>
  );
}

function posicaoX(i: number, n: number, esquerda = AREA.x0): number {
  return n === 1 ? (esquerda + AREA.x1) / 2 : escalar(i, 0, n - 1, esquerda + 12, AREA.x1 - 12);
}

export interface Serie {
  nome: string;
  /** null é lacuna (N/D). */
  valores: (number | null)[];
  cor: string;
  tracejada?: boolean;
}

/** Linhas (patrimônio; base 100 da carteira e dos benchmarks), com rótulo direto no fim. */
export function GraficoLinha({
  id,
  titulo,
  descricao,
  rotulosX,
  series,
  rotularY,
  margemEsquerda = AREA.x0,
  colunasTabela,
  linhasTabela,
}: {
  id: string;
  titulo: string;
  descricao: string;
  rotulosX: string[];
  series: Serie[];
  rotularY: (v: number, marcas: number[]) => string;
  margemEsquerda?: number;
  colunasTabela: string[];
  linhasTabela: LinhaTabela[];
}) {
  const eixo = marcas(faixaDe(series.flatMap((s) => s.valores)));
  const f = { min: eixo[0], max: eixo.at(-1)! };
  const y = (v: number) => escalar(v, f.min, f.max, AREA.y1, AREA.y0);
  const n = rotulosX.length;

  return (
    <Moldura id={id} titulo={titulo} descricao={descricao} colunas={colunasTabela} linhas={linhasTabela}>
      <EixoY valores={eixo} rotular={rotularY} esquerda={margemEsquerda} />
      <EixoX rotulos={rotulosX} esquerda={margemEsquerda} />
      {series.map((s) => {
        // Trechos contínuos: a lacuna (N/D) interrompe a linha.
        const trechos: string[][] = [[]];
        s.valores.forEach((v, i) => {
          if (v === null) trechos.push([]);
          else trechos.at(-1)!.push(`${posicaoX(i, n, margemEsquerda)},${y(v)}`);
        });
        const ultimo = s.valores.findLastIndex((v) => v !== null);
        return (
          <g key={s.nome}>
            {trechos
              .filter((t) => t.length > 0)
              .map((t, i) =>
                t.length === 1 ? (
                  <circle key={i} cx={t[0].split(",")[0]} cy={t[0].split(",")[1]} r={3} fill={s.cor} />
                ) : (
                  <polyline
                    key={i}
                    points={t.join(" ")}
                    fill="none"
                    stroke={s.cor}
                    strokeWidth={2}
                    strokeDasharray={s.tracejada ? "6 4" : undefined}
                    strokeLinejoin="round"
                  />
                ),
              )}
            {ultimo >= 0 ? (
              <text x={posicaoX(ultimo, n, margemEsquerda) + 6} y={y(s.valores[ultimo]!)} dominantBaseline="middle" fontSize={11} fill={s.cor} fontWeight={600}>
                {s.nome}
              </text>
            ) : null}
          </g>
        );
      })}
    </Moldura>
  );
}

/** Barras de ganho e perda (rentabilidade mensal); a barra usa gain ou loss, nunca cor de categoria. */
export function GraficoBarras({
  id,
  titulo,
  descricao,
  rotulosX,
  valores,
  rotularY,
  colunasTabela,
  linhasTabela,
}: {
  id: string;
  titulo: string;
  descricao: string;
  rotulosX: string[];
  valores: (number | null)[];
  rotularY: (v: number) => string;
  colunasTabela: string[];
  linhasTabela: LinhaTabela[];
}) {
  const eixo = marcas(faixaDe(valores, true));
  const f = { min: eixo[0], max: eixo.at(-1)! };
  const y = (v: number) => escalar(v, f.min, f.max, AREA.y1, AREA.y0);
  const n = rotulosX.length;
  const largura = Math.max(3, Math.min(24, ((AREA.x1 - AREA.x0) / Math.max(n, 1)) * 0.6));

  return (
    <Moldura id={id} titulo={titulo} descricao={descricao} colunas={colunasTabela} linhas={linhasTabela}>
      <EixoY valores={eixo} rotular={rotularY} />
      <EixoX rotulos={rotulosX} />
      <line x1={AREA.x0} x2={AREA.x1} y1={y(0)} y2={y(0)} stroke="var(--color-border-strong)" strokeWidth={1} />
      {valores.map((v, i) =>
        v === null ? null : (
          <rect
            key={i}
            x={posicaoX(i, n) - largura / 2}
            y={Math.min(y(v), y(0))}
            width={largura}
            height={Math.max(1, Math.abs(y(v) - y(0)))}
            fill={v < 0 ? "var(--color-loss)" : "var(--color-gain)"}
          />
        ),
      )}
    </Moldura>
  );
}

/** Barras horizontais (distribuição por ativo), em ordem decrescente. */
export function GraficoDistribuicao({
  id,
  titulo,
  descricao,
  itens,
  colunasTabela,
  linhasTabela,
}: {
  id: string;
  titulo: string;
  descricao: string;
  itens: { nome: string; valor: number; cor: string }[];
  colunasTabela: string[];
  linhasTabela: LinhaTabela[];
}) {
  const maior = Math.max(1, ...itens.map((i) => i.valor));
  const altura = 18;
  const espaco = 10;
  const x0 = 120;
  const x1 = LARGURA - 8;
  const total = MARGEM.topo + itens.length * (altura + espaco);
  return (
    <Moldura id={id} titulo={titulo} descricao={descricao} colunas={colunasTabela} linhas={linhasTabela} altura={total}>
      {itens.map((item, i) => {
        const yy = MARGEM.topo + i * (altura + espaco);
        return (
          <g key={item.nome}>
            <text x={x0 - 6} y={yy + altura / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="var(--color-text)">
              {item.nome.length > 17 ? `${item.nome.slice(0, 16)}…` : item.nome}
            </text>
            <rect x={x0} y={yy} width={Math.max(2, escalar(Math.max(item.valor, 0), 0, maior, 0, x1 - x0))} height={altura} rx={3} fill={item.cor} />
          </g>
        );
      })}
    </Moldura>
  );
}
