"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const buttonBase =
  "min-h-11 rounded-md px-4 text-sm/5 font-medium disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton = `${buttonBase} bg-primary text-on-primary hover:bg-primary-hover`;
const secondaryButton = `${buttonBase} border border-border-strong bg-surface text-primary`;
const fieldClass =
  "min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base/6 text-text";

// Mensagem neutra: não revela se o e-mail está ou não na lista de autorizados.
const FAILURE = "Não foi possível entrar com esses dados.";

export function LoginPanel({ initialError, passwordLogin }: { initialError: boolean; passwordLogin: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ? FAILURE : null);
  const [busy, setBusy] = useState(false);

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(FAILURE);
      setBusy(false);
    }
  }

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (error) {
      setError(FAILURE);
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p role="alert" className="rounded-md bg-loss-subtle px-3 py-2 text-sm/5 text-loss">
          {error}
        </p>
      ) : null}

      <button type="button" className={primaryButton} onClick={signInWithGoogle} disabled={busy}>
        Entrar com Google
      </button>

      {passwordLogin ? (
        <form onSubmit={signInWithPassword} className="flex flex-col gap-4 border-t border-border pt-6">
          <p className="text-sm/5 text-text-secondary">Acesso por senha, só neste ambiente local.</p>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm/5 font-medium text-text">
              E-mail
            </label>
            <input id="email" name="email" type="email" autoComplete="username" required className={fieldClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm/5 font-medium text-text">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={fieldClass}
            />
          </div>
          <button type="submit" className={secondaryButton} disabled={busy}>
            Entrar com senha
          </button>
        </form>
      ) : null}
    </div>
  );
}
