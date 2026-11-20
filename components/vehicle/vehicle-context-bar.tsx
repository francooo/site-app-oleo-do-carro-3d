import { ArrowLeftRight, CarFront } from "lucide-react";
import Link from "next/link";

import { type FuelType, vehicleDisplayName, vehicleEngineLabel } from "@/lib/domain/vehicle";

type ContextVehicle = {
  make: string;
  model: string;
  year: number;
  engineDisplacement: string | null;
  fuel: FuelType | null;
};

// Critério de UX §5: em toda tela técnica o usuário sabe qual carro está
// vendo. Faixa compacta com o carro selecionado + atalho para trocar.
export function VehicleContextBar({ vehicle }: { vehicle: ContextVehicle }) {
  const engine = vehicleEngineLabel(vehicle);
  return (
    <div className="border-copper/40 bg-surface-lowest/70 mb-5 flex items-center gap-3 rounded-xl border px-3 py-2">
      <CarFront className="text-accent h-5 w-5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="text-foreground-muted">Você está vendo: </span>
        <span className="text-foreground-strong font-semibold">{vehicleDisplayName(vehicle)}</span>
        {engine ? <span className="text-foreground-muted"> · {engine}</span> : null}
      </p>
      <Link
        href="/garagem"
        className="text-accent-text hover:bg-accent/10 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold"
      >
        <ArrowLeftRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        Trocar
      </Link>
    </div>
  );
}
