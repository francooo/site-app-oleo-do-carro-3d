"use client";

import { ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { authenticateWithCredentials, signInWithGoogle } from "@/lib/auth/actions";
import { buttonClasses } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/form-error";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticateWithCredentials, undefined);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Entrar</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          icon={Mail}
          autoComplete="email"
          required
        />
        <PasswordField label="Senha" name="password" autoComplete="current-password" required />
        {state?.error ? <FormError>{state.error}</FormError> : null}
        <SubmitButton disabled={pending}>
          {pending ? (
            "Entrando…"
          ) : (
            <>
              Entrar
              <ArrowRight
                className="absolute right-5 h-5 w-5 transition-transform group-hover:translate-x-1"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            </>
          )}
        </SubmitButton>
      </form>

      <Link href="/signup" className={`${buttonClasses("secondary", "lg")} w-full`}>
        Cadastrar
      </Link>

      <div className="text-foreground-muted flex items-center gap-3 text-xs">
        <div className="bg-border h-px flex-1" />
        ou
        <div className="bg-border h-px flex-1" />
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#f4efe7] px-4 py-3 text-sm font-semibold text-[#1f1f1f] transition-colors hover:bg-white"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Entrar com Google
        </button>
      </form>
    </div>
  );
}
