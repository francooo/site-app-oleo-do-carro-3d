"use client";

import { ArrowRight, CircleAlert, CircleCheck, Droplets } from "lucide-react";
import { useActionState } from "react";

import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import { CHECK_RESULT_LABEL, type CheckResult } from "@/lib/domain/fluid-status";
import type { CheckActionState } from "@/lib/fluids/actions";

const OPTIONS: { value: CheckResult; icon: typeof CircleCheck; tone: string }[] = [
  { value: "ok", icon: CircleCheck, tone: "text-success" },
  { value: "baixo_completei", icon: Droplets, tone: "text-warning" },
  { value: "baixo_nao_completei", icon: CircleAlert, tone: "text-error" },
];

type Props = {
  action: (state: CheckActionState, formData: FormData) => Promise<CheckActionState>;
  currentKm: number | null;
};

// "Registrar verificação" — cria o registro e atualiza o status do fluido.
export function RegisterCheckForm({ action, currentKm }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="font-heading text-foreground-strong mb-2 text-lg font-bold">
          Como estava o nível?
        </legend>
        {OPTIONS.map(({ value, icon: Icon, tone }) => (
          <label
            key={value}
            className="border-border/80 bg-surface-lowest/70 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-accent/40 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 transition-colors has-[:focus-visible]:ring-2"
          >
            <input
              type="radio"
              name="result"
              value={value}
              required
              className="accent-accent h-5 w-5 shrink-0"
            />
            <Icon className={`h-5 w-5 shrink-0 ${tone}`} strokeWidth={2.2} aria-hidden="true" />
            <span className="text-foreground-strong font-medium">{CHECK_RESULT_LABEL[value]}</span>
          </label>
        ))}
      </fieldset>

      <label htmlFor="km" className="flex flex-col gap-1.5">
        <span className="text-foreground-muted text-sm font-medium">
          Quilometragem agora (opcional)
        </span>
        <input
          id="km"
          name="km"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={currentKm ?? ""}
          placeholder="Ex.: 85000"
          className="border-border bg-surface-lowest/80 text-foreground focus:border-accent focus:ring-accent/20 min-h-12 rounded-xl border px-3 text-base outline-none focus:ring-2"
        />
      </label>

      {state?.error ? <FormError>{state.error}</FormError> : null}

      <SubmitButton disabled={pending}>
        <span>{pending ? "Registrando…" : "Registrar verificação"}</span>
        <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
      </SubmitButton>
    </form>
  );
}
