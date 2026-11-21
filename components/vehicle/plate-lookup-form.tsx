"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useActionState } from "react";

import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/vehicles/actions";

type PlateLookupFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultPlate?: string;
};

// Campo de placa no visual Mercosul (faixa azul "BRASIL"). Funciona sem
// JavaScript: é um <form> comum ligado à Server Action.
export function PlateLookupForm({ action, defaultPlate }: PlateLookupFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label htmlFor="plate" className="sr-only">
        Placa do carro
      </label>
      <div className="focus-within:ring-accent/40 mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] focus-within:ring-4">
        <div className="flex items-center justify-between bg-[#1A56DB] px-4 py-1.5">
          <span className="w-6" aria-hidden="true" />
          <span className="text-xs font-bold tracking-[0.35em] text-white">BRASIL</span>
          <span
            className="flex h-4 w-6 items-center justify-center rounded-[2px] bg-[#009C3B]"
            aria-hidden="true"
          >
            <span className="h-2.5 w-2.5 rotate-45 bg-[#FFDF00]" />
          </span>
        </div>
        <input
          id="plate"
          name="plate"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={8}
          pattern="[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}"
          title="Formato antigo (ABC1234) ou Mercosul (ABC1D23)"
          placeholder="ABC1D23"
          defaultValue={defaultPlate}
          aria-describedby="plate-help"
          className="font-heading w-full bg-transparent px-4 py-4 text-center text-4xl font-black tracking-[0.12em] text-slate-900 uppercase outline-none placeholder:text-slate-300 sm:text-5xl"
        />
      </div>
      <p id="plate-help" className="text-foreground-muted text-center text-sm">
        Usamos a placa só para identificar o modelo do carro.
      </p>

      {state?.error ? <FormError>{state.error}</FormError> : null}

      <SubmitButton disabled={pending} className="mt-2">
        {pending ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>Buscando seu carro…</span>
          </>
        ) : (
          <>
            <span>Buscar meu carro</span>
            <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
          </>
        )}
      </SubmitButton>
    </form>
  );
}
