"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerUser } from "@/lib/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Criar conta</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <TextField label="E-mail" name="email" type="email" autoComplete="email" required />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <label className="flex items-start gap-2 py-1 text-sm text-foreground-muted">
          <input
            name="acceptedTerms"
            type="checkbox"
            required
            className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
          />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>
        {state?.error ? (
          <p role="alert" className="text-sm text-error">
            {state.error}
          </p>
        ) : null}
        <SubmitButton disabled={pending}>{pending ? "Criando conta…" : "Criar conta"}</SubmitButton>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-accent-text underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
