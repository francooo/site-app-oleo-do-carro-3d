import { Info } from "lucide-react";
import type { Metadata } from "next";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { VehicleForm } from "@/components/vehicle/vehicle-form";
import { isValidPlateFormat, normalizePlate } from "@/lib/plate";
import { createVehicle } from "@/lib/vehicles/actions";

export const metadata: Metadata = { title: "Cadastrar veículo" };

const REASON_MESSAGE: Record<string, string> = {
  nao_encontrada: "Não encontramos essa placa. Preencha os dados do carro abaixo.",
  indisponivel: "A consulta pela placa está indisponível agora. Preencha os dados abaixo.",
  limite: "Você atingiu o limite de consultas de hoje. Preencha os dados abaixo.",
  outro_carro: "Tudo bem! Preencha os dados do seu carro abaixo.",
};

// Cadastro manual (plano B do cadastro pela placa). Depois de salvar, segue
// para a confirmação (tela 03) antes de qualquer dado técnico.
export default async function CadastroManualPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string; motivo?: string }>;
}) {
  const { placa, motivo } = await searchParams;
  const plate = placa && isValidPlateFormat(placa) ? normalizePlate(placa) : undefined;
  const message = motivo ? REASON_MESSAGE[motivo] : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="Cadastrar"
        highlight="veículo"
        subtitle="Versão e motorização deixam as instruções certas para o seu carro."
        backHref="/veiculos/novo"
        backLabel="Voltar para a busca pela placa"
      />
      {message ? (
        <div
          role="status"
          className="border-copper/50 bg-warning-soft/60 text-foreground mb-5 flex items-start gap-3 rounded-xl border p-4 text-sm"
        >
          <Info className="text-accent mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{message}</p>
        </div>
      ) : null}
      <VehicleForm
        action={createVehicle}
        defaults={{ plate }}
        submitLabel="Salvar veículo"
        cancelHref="/garagem"
        cancelLabel="Voltar para garagem"
      />
    </div>
  );
}
