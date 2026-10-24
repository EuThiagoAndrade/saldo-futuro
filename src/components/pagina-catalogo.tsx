import { botaoSecundario } from "@/components/botoes";
import { Confirmacao } from "@/components/confirmacao";
import { EstadoVazio } from "@/components/estados";
import { FormIncluirEntrada, RenomearEntrada } from "@/components/formularios/catalogo";
import type { EstadoAcao } from "@/lib/telas/acao";
import { CATALOGOS, type LinhaCatalogo, textoDeUso, type TipoCatalogo } from "@/lib/telas/catalogos";

type Acao = (estado: EstadoAcao, dados: FormData) => Promise<EstadoAcao>;

// Conteúdo de cada aba de /cadastros (ciclo 012, issue #127, BL-009; emenda E-1): a descrição, a
// inclusão no topo e a lista densa (DESIGN.md 6.7) com o nome completo, o uso pelos ativos e as
// ações. Excluir só existe sem ativo vinculado; com vínculo, o botão fica desabilitado e a
// explicação aparece ao lado (6.9).
export function ConteudoCatalogo({
  tipo,
  linhas,
  acoes,
}: {
  tipo: TipoCatalogo;
  linhas: LinhaCatalogo[];
  acoes: { criar: Acao; renomear: Acao; excluir: Acao };
}) {
  const c = CATALOGOS[tipo];

  return (
    <>
      <p className="max-w-prose text-base/6 text-text-secondary">{c.descricao}</p>

      <FormIncluirEntrada key={tipo} acao={acoes.criar} rotuloCampo={c.rotuloCampo} rotuloIncluir={c.rotuloIncluir} />

      {linhas.length === 0 ? (
        <EstadoVazio titulo={c.vazio}>{c.textoVazio}</EstadoVazio>
      ) : (
        <ul aria-label={c.titulo} className="divide-y divide-border rounded-md border border-border bg-surface">
          {linhas.map((linha) => (
            <li key={linha.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2">
              <div className="min-w-0 flex-1 basis-48 py-1">
                <p className="text-base/6 font-medium break-words text-text">{linha.nome}</p>
                <p className="text-sm/5 text-text-secondary">{textoDeUso(linha.usos)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 has-[[data-renomeando]]:basis-full">
                <RenomearEntrada acao={acoes.renomear} id={linha.id} nome={linha.nome} />
                {linha.usos === 0 ? (
                  <Confirmacao
                    gatilho="Excluir"
                    titulo={`Excluir ${linha.nome}`}
                    consequencia={`A ${c.singular} sai da lista e deixa de aparecer como opção no cadastro dos ativos.`}
                    rotuloAcao={`Excluir ${c.singular}`}
                    acao={acoes.excluir}
                  >
                    <input type="hidden" name="id" value={linha.id} />
                  </Confirmacao>
                ) : (
                  <div className="flex flex-col items-start gap-1">
                    <button type="button" disabled aria-describedby={`uso-${linha.id}`} className={botaoSecundario}>
                      Excluir
                    </button>
                    <p id={`uso-${linha.id}`} className="text-sm/5 text-text-secondary">
                      Tire dos ativos antes de excluir.
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
