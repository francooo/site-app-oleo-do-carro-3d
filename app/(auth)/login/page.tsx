"use client";

import Link from "next/link";
import { useActionState } from "react";

import { authenticateWithCredentials, signInWithGoogle } from "@/lib/auth/actions";
import { buttonClasses } from "@/components/ui/button-styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticateWithCredentials, undefined);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Entrar</h1>

      <form action={signInWithGoogle}>
        <button type="submit" className={`w-full ${buttonClasses("secondary")}`}>
          Continuar com Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-foreground-muted">
        <div className="h-px flex-1 bg-border" />
        ou
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="E-mail" name="email" type="email" autoComplete="email" required />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state?.error ? (
          <p role="alert" className="text-sm text-error">
            {state.error}
          </p>
        ) : null}
        <SubmitButton disabled={pending}>{pending ? "Entrando…" : "Entrar"}</SubmitButton>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Não tem conta?{" "}
        <Link href="/signup" className="font-medium text-accent-text underline-offset-4 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
