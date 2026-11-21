"use client";

import { ArrowRight, Gauge, Snowflake } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { buttonClasses } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FipeVersion } from "@/lib/domain/plate-vehicle";
import type { ActionState } from "@/lib/vehicles/actions";

type PlateConfirmFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** Versões parecidas: o usuário escolhe. Vazio = não pergunta. */
  versionOptions: FipeVersion[];
  defaultVersionCode: string | null;
  manualHref: string;
};

const field =
  "border-border/80 bg-surface-lowest/70 focus-within:border-accent focus-within:ring-accent/20 flex min-h-14 items-center gap-3 rounded-xl border px-4 focus-within:ring-2";

export function PlateConfirmForm({
  action,
  versionOptions,
  defaultVersionCode,
  manualHref,
}: PlateConfirmFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      {versionOptions.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-foreground-strong mb-2 text-sm font-semibold">
            Qual destas é a versão do seu carro?
          </legend>
          {versionOptions.map((v) => (
            <label
              key={v.code}
              className="border-border/80 bg-surface-lowest/70 has-[:checked]:border-accent has-[:checked]:bg-accent/10 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-sm"
            >
              <input
                type="radio"
                name="fipeCode"
                value={v.code}
                defaultChecked={v.code === defaultVersionCode}
                className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-foreground-strong">{v.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}

      <label htmlFor="currentKm" className={field}>
        <Gauge className="text-accent h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="text-foreground w-36 shrink-0 text-sm font-medium">
          Quilometragem
          <span className="text-foreground-muted block text-xs font-normal">Opcional</span>
        </span>
        <input
          id="currentKm"
          name="currentKm"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Digite os km"
          className="text-foreground-strong placeholder:text-foreground-muted/70 w-full min-w-0 bg-transparent py-3 text-base outline-none"
        />
      </label>

      <label htmlFor="hasAirConditioning" className={field}>
        <Snowflake className="text-accent h-6 w-6 shrink-0" aria-hidden="true" />
        <span className="text-foreground w-36 shrink-0 text-sm font-medium">
          Ar-condicionado
          <span className="text-foreground-muted block text-xs font-normal">
            Muda o arrefecimento
          </span>
        </span>
        <select
          id="hasAirConditioning"
          name="hasAirConditioning"
          defaultValue=""
          className="text-foreground-strong w-full min-w-0 cursor-pointer bg-transparent py-3 text-base outline-none"
        >
          <option value="">Não sei</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      </label>

      {state?.error ? <FormError>{state.error}</FormError> : null}

      <SubmitButton disabled={pending} className="mt-2">
        <span>{pending ? "Salvando…" : "Sim, é o meu carro"}</span>
        <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </SubmitButton>
      <Link href={manualHref} className={`${buttonClasses("secondary")} w-full`}>
        Não é o meu carro
      </Link>
    </form>
  );
}
