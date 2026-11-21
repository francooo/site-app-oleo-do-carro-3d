import { CalendarDays, CarFront, Fuel, Gauge, Layers, Snowflake } from "lucide-react";
import type { ReactNode } from "react";

import { EngineIcon } from "@/components/icons/fluids";
import { IconTile } from "@/components/ui/icon-tile";
import { FUEL_LABEL, type FuelType } from "@/lib/domain/vehicle";

type SpecVehicle = {
  make: string;
  model: string;
  year: number;
  version: string | null;
  engineDisplacement: string | null;
  fuel: FuelType | null;
  hasAirConditioning: boolean | null;
  currentKm: number | null;
};

const km = new Intl.NumberFormat("pt-BR");

function Missing({ children }: { children: ReactNode }) {
  return <span className="text-warning text-base font-medium">{children}</span>;
}

// Lista "ícone + valor" da tela 03 (Confirme seu veículo). Campo ausente
// aparece em âmbar com texto explícito — nunca só uma linha vazia.
export function VehicleSpecList({
  vehicle,
  hide = [],
}: {
  vehicle: SpecVehicle;
  /** Linhas a omitir (ex.: "ac" na tela "É este carro?", que pergunta abaixo). */
  hide?: readonly string[];
}) {
  const rows: {
    key: string;
    icon: ReactNode;
    label: string;
    value: ReactNode;
  }[] = [
    {
      key: "model",
      icon: <CarFront />,
      label: "Carro",
      value: `${vehicle.make} ${vehicle.model}`,
    },
    { key: "year", icon: <CalendarDays />, label: "Ano", value: vehicle.year },
    {
      key: "version",
      icon: <Layers />,
      label: "Versão",
      value: vehicle.version ?? <Missing>Versão não informada</Missing>,
    },
    {
      key: "engine",
      icon: <EngineIcon />,
      label: "Motorização",
      value: vehicle.engineDisplacement ?? <Missing>Motorização não informada</Missing>,
    },
    {
      key: "fuel",
      icon: <Fuel />,
      label: "Combustível",
      value: vehicle.fuel ? FUEL_LABEL[vehicle.fuel] : <Missing>Combustível não informado</Missing>,
    },
    {
      key: "ac",
      icon: <Snowflake />,
      label: "Ar-condicionado",
      value:
        vehicle.hasAirConditioning == null
          ? "Não sei"
          : vehicle.hasAirConditioning
            ? "Com ar-condicionado"
            : "Sem ar-condicionado",
    },
  ];
  if (vehicle.currentKm != null) {
    rows.push({
      key: "km",
      icon: <Gauge />,
      label: "Quilometragem",
      value: `${km.format(vehicle.currentKm)} km`,
    });
  }

  return (
    <dl className="border-border/70 bg-surface-lowest/60 divide-border/60 divide-y rounded-2xl border px-4">
      {rows
        .filter((row) => !hide.includes(row.key))
        .map((row) => (
          <div key={row.key} className="flex items-center gap-4 py-3">
            <IconTile size="sm">{row.icon}</IconTile>
            <div className="min-w-0">
              <dt className="text-foreground-muted text-xs">{row.label}</dt>
              <dd className="font-heading text-foreground-strong text-lg leading-snug font-semibold">
                {row.value}
              </dd>
            </div>
          </div>
        ))}
    </dl>
  );
}
