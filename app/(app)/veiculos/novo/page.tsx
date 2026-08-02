"use client";

import { useActionState } from "react";

import { createVehicle } from "@/lib/vehicles/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";

export default function NovoVeiculoPage() {
  const [state, formAction, pending] = useActionState(createVehicle, undefined);

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-xl font-semibold">Adicionar veículo</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Cadastro manual por enquanto. Identificação por placa, com colapso de candidatos (PRD
        seção 5.2), chega no Sprint 1, depois do spike de fornecedor — ver docs/ROADMAP.md.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <TextField
          label="Placa"
          name="plate"
          placeholder="ABC1D23"
          autoCapitalize="characters"
          autoComplete="off"
          required
        />
        <TextField label="Marca" name="make" placeholder="Volkswagen" required />
        <TextField label="Modelo" name="model" placeholder="Polo" required />
        <TextField
          label="Ano"
          name="year"
          type="number"
          inputMode="numeric"
          placeholder="2020"
          required
        />
        <TextField
          label="Quilometragem atual (opcional)"
          name="currentKm"
          type="number"
          inputMode="numeric"
          placeholder="85000"
        />
        {state?.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}
        <SubmitButton disabled={pending}>
          {pending ? "Adicionando…" : "Adicionar veículo"}
        </SubmitButton>
      </form>
    </div>
  );
}
