"use client";

import {
  ArrowRight,
  CalendarDays,
  Car,
  CarFront,
  ChevronDown,
  Fuel,
  Gauge,
  Layers,
  RectangleHorizontal,
  Snowflake,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useActionState } from "react";

import { EngineIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/form-error";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  COMMON_MAKES,
  ENGINE_DISPLACEMENTS,
  FUEL_LABEL,
  FUEL_TYPES,
  type FuelType,
  vehicleYearOptions,
} from "@/lib/domain/vehicle";
import type { ActionState } from "@/lib/vehicles/actions";

export type VehicleFormDefaults = {
  make?: string;
  model?: string;
  year?: number;
  version?: string | null;
  engineDisplacement?: string | null;
  fuel?: FuelType | null;
  hasAirConditioning?: boolean | null;
  currentKm?: number | null;
  plate?: string | null;
};

type VehicleFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: VehicleFormDefaults;
  submitLabel: string;
  cancelHref: string;
  cancelLabel: string;
};

const control =
  "w-full min-w-0 appearance-none bg-transparent py-3 pr-8 text-base text-foreground-strong outline-none placeholder:text-foreground-muted/70";

// Linha do formulário da tela 01: ícone cobre + rótulo à esquerda, valor à
// direita. O <label> envolve a linha inteira, então todo o retângulo é
// alvo de toque (≥ 56px) e foca o controle.
function Row({
  icon,
  label,
  htmlFor,
  hint,
  children,
  select = false,
}: {
  icon: ReactNode;
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
  select?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="border-border/80 bg-surface-lowest/70 focus-within:border-accent focus-within:ring-accent/20 relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border pl-4 transition-colors focus-within:ring-2 [&_svg.row-icon]:h-6 [&_svg.row-icon]:w-6"
    >
      <span className="text-accent shrink-0">{icon}</span>
      <span className="w-[7.25rem] shrink-0 sm:w-44">
        <span className="text-foreground block text-sm font-medium sm:text-base">{label}</span>
        {hint ? <span className="text-foreground-muted block text-xs">{hint}</span> : null}
      </span>
      <span className="relative flex min-w-0 flex-1 items-center">
        {children}
        {select ? (
          <ChevronDown
            className="text-accent pointer-events-none absolute right-3 h-5 w-5"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        ) : null}
      </span>
    </label>
  );
}

export function VehicleForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
  cancelLabel,
}: VehicleFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const years = vehicleYearOptions();
  const ac = defaults.hasAirConditioning == null ? "" : defaults.hasAirConditioning ? "sim" : "nao";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Row icon={<CarFront className="row-icon" />} label="Marca" htmlFor="make">
        <input
          id="make"
          name="make"
          list="vehicle-makes"
          required
          autoComplete="off"
          placeholder="Ex.: Fiat"
          defaultValue={defaults.make}
          className={control}
        />
        <datalist id="vehicle-makes">
          {COMMON_MAKES.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Row>

      <Row icon={<Car className="row-icon" />} label="Modelo" htmlFor="model">
        <input
          id="model"
          name="model"
          required
          autoComplete="off"
          placeholder="Ex.: Uno"
          defaultValue={defaults.model}
          className={control}
        />
      </Row>

      <Row icon={<CalendarDays className="row-icon" />} label="Ano" htmlFor="year" select>
        <select
          id="year"
          name="year"
          required
          defaultValue={defaults.year ?? ""}
          className={`${control} cursor-pointer`}
        >
          <option value="" disabled>
            Selecione
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Row>

      <Row icon={<Layers className="row-icon" />} label="Versão" htmlFor="version">
        <input
          id="version"
          name="version"
          autoComplete="off"
          placeholder="Ex.: Way, Attractive"
          defaultValue={defaults.version ?? ""}
          className={control}
        />
      </Row>

      <Row
        icon={<EngineIcon className="row-icon" />}
        label="Motorização"
        htmlFor="engineDisplacement"
        select
      >
        <select
          id="engineDisplacement"
          name="engineDisplacement"
          defaultValue={defaults.engineDisplacement ?? ""}
          className={`${control} cursor-pointer`}
        >
          <option value="">Selecione</option>
          {ENGINE_DISPLACEMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Row>

      <Row icon={<Fuel className="row-icon" />} label="Combustível" htmlFor="fuel" select>
        <select
          id="fuel"
          name="fuel"
          defaultValue={defaults.fuel ?? ""}
          className={`${control} cursor-pointer`}
        >
          <option value="">Selecione</option>
          {FUEL_TYPES.map((f) => (
            <option key={f} value={f}>
              {FUEL_LABEL[f]}
            </option>
          ))}
        </select>
      </Row>

      <Row
        icon={<Snowflake className="row-icon" />}
        label="Ar-condicionado"
        hint="Muda a capacidade do arrefecimento"
        htmlFor="hasAirConditioning"
        select
      >
        <select
          id="hasAirConditioning"
          name="hasAirConditioning"
          defaultValue={ac}
          className={`${control} cursor-pointer`}
        >
          <option value="">Não sei</option>
          <option value="sim">Sim</option>
          <option value="nao">Não</option>
        </select>
      </Row>

      <Row icon={<Gauge className="row-icon" />} label="Quilometragem atual" htmlFor="currentKm">
        <input
          id="currentKm"
          name="currentKm"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Digite os km"
          defaultValue={defaults.currentKm ?? ""}
          className={control}
        />
      </Row>

      <Row
        icon={<RectangleHorizontal className="row-icon" />}
        label="Placa"
        hint="Opcional"
        htmlFor="plate"
      >
        <input
          id="plate"
          name="plate"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABC1D23"
          defaultValue={defaults.plate ?? ""}
          className={`${control} uppercase placeholder:normal-case`}
        />
      </Row>

      {state?.error ? (
        <div className="mt-2">
          <FormError>{state.error}</FormError>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col items-center gap-3">
        <SubmitButton disabled={pending}>
          <span>{pending ? "Salvando…" : submitLabel}</span>
          <ArrowRight className="absolute right-5 h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
        </SubmitButton>
        <Link href={cancelHref} className={`${buttonClasses("secondary")} w-full sm:w-4/5`}>
          {cancelLabel}
        </Link>
      </div>
    </form>
  );
}
