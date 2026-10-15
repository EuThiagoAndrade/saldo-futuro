"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { botaoPrincipal, botaoSecundario } from "@/components/botoes";
import { Campo, classeCampo } from "@/components/campos";
import { dataBr } from "@/lib/apresentacao/datas";
import type { MarcaBenchmark } from "@/lib/leitura";
import type { BenchmarkLido } from "@/lib/telas/leitura-benchmarks";

export function SincronizarBenchmark({ benchmark: b, hoje }: { benchmark: BenchmarkLido & { cobertura: MarcaBenchmark | null }; hoje: string }) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [inicio, setInicio] = useState(b.cobertura?.fim ?? "");
  const [fim, setFim] = useState(hoje);
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  async function executar() {
    setPendente(true); setErro(""); setOk("");
    try {
      const resposta = await fetch("/api/benchmarks/sincronizar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ benchmark: b.id, inicio, fim, confirmado: true }),
      });
      const resultado = await resposta.json();
      if (!resposta.ok || resultado.erro) setErro(resultado.erro ?? "Não foi possível confirmar a sincronização. Confira a cobertura atual.");
      else { setOk(resultado.ok); dialogo.current?.close(); }
    } catch {
      setErro("A resposta da sincronização não chegou. A cobertura será relida; confira o estado atual antes de repetir.");
    } finally {
      // Também após perda da resposta: o servidor relê o estado real, sem inferir sucesso.
      router.refresh(); setPendente(false);
    }
  }

  return <section className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
    <h2 className="text-lg/7 font-semibold">{b.nome}</h2>
    <p data-testid={`cobertura-${b.nome}`}>{b.cobertura ? `Disponível de ${dataBr(b.cobertura.inicio)} até ${dataBr(b.cobertura.fim)}` : "Ainda sem cobertura. Escolha a data inicial da primeira carga."}</p>
    <form onSubmit={(e) => { e.preventDefault(); setErro(""); dialogo.current?.showModal(); }} className="flex flex-col items-start gap-4 md:flex-row md:items-end">
      <Campo id={`${b.id}-inicio`} rotulo={`Data inicial (${b.nome})`}><input id={`${b.id}-inicio`} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} max={fim || hoje} required className={classeCampo} /></Campo>
      <Campo id={`${b.id}-fim`} rotulo={`Data final (${b.nome})`}><input id={`${b.id}-fim`} type="date" value={fim} onChange={(e) => setFim(e.target.value)} min={inicio} max={hoje} required className={classeCampo} /></Campo>
      <button className={botaoSecundario} type="submit">Sincronizar {b.nome}</button>
    </form>
    {ok ? <p role="status" className="text-text-secondary">{ok}</p> : null}
    <dialog ref={dialogo} aria-labelledby={`${b.id}-titulo`} aria-describedby={`${b.id}-consequencia`} onCancel={(e) => { if (pendente) e.preventDefault(); }}
      onClick={(e) => { if (e.target === dialogo.current && !pendente) dialogo.current?.close(); }}
      className="m-0 mt-auto w-full max-w-none rounded-t-lg bg-surface p-6 text-text shadow-overlay backdrop:bg-text/40 sm:m-auto sm:max-w-md sm:rounded-lg">
      <div className="flex flex-col gap-4">
        <h2 id={`${b.id}-titulo`} className="text-lg/7 font-semibold">Sincronizar {b.nome}?</h2>
        <p id={`${b.id}-consequencia`}>Os valores de {dataBr(inicio)} a {dataBr(fim)} serão substituídos pelos publicados no SGS. Repetir o mesmo período é seguro.</p>
        <p>{b.cobertura ? `Cobertura atual até ${dataBr(b.cobertura.fim)}.` : "Ainda sem cobertura."}</p>
        {erro ? <p role="alert" className="text-loss">{erro}</p> : null}
        {pendente ? <p role="status">Buscando e validando todas as janelas. Aguarde.</p> : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button autoFocus disabled={pendente} className={botaoSecundario} onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button disabled={pendente} className={botaoPrincipal} onClick={executar}>{erro ? "Tentar novamente" : `Confirmar sincronização de ${b.nome}`}</button>
        </div>
      </div>
    </dialog>
  </section>;
}
