import type { Metadata } from "next";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { VehicleForm } from "@/components/vehicle/vehicle-form";
import { createVehicle } from "@/lib/vehicles/actions";

export const metadata: Metadata = { title: "Cadastrar veículo" };

// Tela 01 — Cadastro do veículo. Depois de salvar, segue para a confirmação
// (tela 03) antes de qualquer dado técnico ser exibido.
export default function NovoVeiculoPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="Cadastrar"
        highlight="veículo"
        subtitle="Versão e motorização deixam as instruções certas para o seu carro."
        backHref="/garagem"
        backLabel="Voltar para a garagem"
      />
      <VehicleForm
        action={createVehicle}
        submitLabel="Salvar veículo"
        cancelHref="/garagem"
        cancelLabel="Voltar para garagem"
      />
    </div>
  );
}
