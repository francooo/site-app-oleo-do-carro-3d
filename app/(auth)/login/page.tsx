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
      <h1 className="text-2xl font-semibold">Entrar</h1>

      <form action={signInWithGoogle}>
        <button type="submit" className={`w-full ${buttonClasses("secondary")}`}>
          Continuar com Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        ou
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
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
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}
        <SubmitButton disabled={pending}>{pending ? "Entrando…" : "Entrar"}</SubmitButton>
      </form>

      <p className="text-center text-sm text-zinc-500">
        Não tem conta?{" "}
        <Link href="/signup" className="underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
