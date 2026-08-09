"use client";

import { Info, Plus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { createVehicle } from "@/lib/vehicles/actions";
import { buttonClasses } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/form-error";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export default function NovoVeiculoPage() {
  const [state, formAction, pending] = useActionState(createVehicle, undefined);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Adicionar veículo" backHref="/garagem" />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-surface-variant/40 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent-text" strokeWidth={2} aria-hidden="true" />
        <div className="text-sm text-foreground-muted">
          <p className="font-medium text-foreground">Cadastro manual por enquanto</p>
          <p className="mt-0.5">
            Identificação por placa, com colapso de candidatos (PRD seção 5.2), chega no Sprint 1,
            depois do spike de fornecedor — ver docs/ROADMAP.md.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-accent/10 blur-3xl"
        />

        <h2 className="font-heading text-lg font-semibold text-foreground">Dados do veículo</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Só o essencial pra calcular as recomendações do seu carro.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField label="Marca" name="make" placeholder="Volkswagen" required />
            </div>
            <div className="sm:col-span-2">
              <TextField label="Modelo" name="model" placeholder="Polo" required />
            </div>
            <TextField
              label="Ano"
              name="year"
              type="number"
              inputMode="numeric"
              placeholder="2020"
              required
            />
            <TextField
              label="Placa"
              name="plate"
              placeholder="ABC1D23"
              autoCapitalize="characters"
              autoComplete="off"
              required
            />
            <div className="sm:col-span-2">
              <TextField
                label="Quilometragem atual (opcional)"
                name="currentKm"
                type="number"
                inputMode="numeric"
                placeholder="85000"
              />
            </div>
          </div>

          {state?.error ? <FormError>{state.error}</FormError> : null}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
            <Link href="/garagem" className={`w-full sm:w-auto ${buttonClasses("secondary")}`}>
              Cancelar
            </Link>
            <SubmitButton disabled={pending} className="sm:w-auto">
              {pending ? (
                "Adicionando…"
              ) : (
                <>
                  <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  Adicionar veículo
                </>
              )}
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
