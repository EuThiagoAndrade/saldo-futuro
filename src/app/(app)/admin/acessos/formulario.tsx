"use client";

import { useActionState } from "react";
import { botaoPrincipal } from "@/components/botoes";
import { Campo, classeCampo, Retorno } from "@/components/campos";
import { ESTADO_INICIAL } from "@/lib/telas/acao";
import { autorizarEmail, type EstadoAcesso } from "./acoes";

export function FormAutorizarEmail() {
  const [estado, executar, pendente] = useActionState<EstadoAcesso, FormData>(autorizarEmail, ESTADO_INICIAL);
  const erroEmail = estado.campo === "email" ? estado.erro : undefined;
  const erroPapel = estado.campo === "papel" ? estado.erro : undefined;

  return (
    <form action={executar} className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4">
      <h2 className="text-lg/7 font-semibold">Autorizar e-mail</h2>
      <p id="aviso-google" className="text-base/6 text-text-secondary">
        Enquanto a tela de consentimento do Google estiver em Testando, adicione também a pessoa como usuário de teste no Google.
      </p>
      <Campo id="acesso-email" rotulo="E-mail">
        <input id="acesso-email" name="email" type="email" required autoComplete="off" autoCapitalize="none" spellCheck={false}
          aria-describedby={erroEmail ? "aviso-google acesso-email-erro" : "aviso-google"} aria-invalid={erroEmail ? true : undefined}
          className={`${classeCampo} ${erroEmail ? "border-loss" : ""}`} />
        {erroEmail ? <p id="acesso-email-erro" role="alert" className="text-sm/5 text-loss">{erroEmail}</p> : null}
      </Campo>
      <Campo id="acesso-papel" rotulo="Papel inicial">
        <select id="acesso-papel" name="papel" defaultValue="user" aria-describedby={erroPapel ? "aviso-papel acesso-papel-erro" : "aviso-papel"}
          aria-invalid={erroPapel ? true : undefined} className={`${classeCampo} ${erroPapel ? "border-loss" : ""}`}>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        {erroPapel ? <p id="acesso-papel-erro" role="alert" className="text-sm/5 text-loss">{erroPapel}</p> : null}
      </Campo>
      <p id="aviso-papel" className="text-sm/5 text-text-secondary">
        O papel inicial só vale no primeiro cadastro. Alterar o papel de uma conta existente requer o procedimento administrativo.
      </p>
      <Retorno ok={estado.ok} erro={estado.campo ? undefined : estado.erro} />
      {pendente ? <p role="status" className="text-sm/5 text-text-secondary">Autorizando e-mail. Aguarde.</p> : null}
      <button type="submit" disabled={pendente} className={`${botaoPrincipal} sm:self-end`}>Autorizar e-mail</button>
    </form>
  );
}
