import { type FluidContent, getFluidContent } from "@/content/fluidos";
import { type EngineSheet, listFluidTypes } from "@/lib/db/queries/engines";
import type { FluidStatusEntry } from "@/lib/domain/fluid-status";
import { type Capacity, formatChangeInterval, pickCapacity } from "@/lib/domain/fluid-specs";
import { TRACKED_FLUIDS, type TrackedFluidCode } from "@/lib/domain/fluids";

// Monta o "modelo de tela" de cada fluido: catálogo curado (se houver) +
// conteúdo de verificação + status do usuário. Usado por mapa, detalhe,
// tutorial e status — uma fonte só para os textos técnicos.

export type FluidView = {
  code: TrackedFluidCode;
  label: string;
  description: string;
  status: FluidStatusEntry;
  specification: string | null;
  capacity: Capacity | null;
  changeInterval: string | null;
  /** Observações da fonte (uso severo, capacidade do circuito...). */
  sourceNotes: string | null;
  source: { name: string; reference: string | null; verifiedAt: Date | null } | null;
  /** O carro tem curadoria para este fluido? */
  curated: boolean;
  content: FluidContent;
};

type VehicleLike = { hasAirConditioning: boolean | null };

export async function buildFluidViews(
  vehicle: VehicleLike,
  sheet: EngineSheet | null,
  statuses: FluidStatusEntry[],
): Promise<FluidView[]> {
  const types = await listFluidTypes();
  return TRACKED_FLUIDS.map((f) => {
    const row = sheet?.fluids.find((x) => x.fluidType === f.code);
    const type = types.find((t) => t.code === f.code);
    return {
      code: f.code,
      label: f.label,
      description: type?.description ?? "",
      status: statuses.find((s) => s.code === f.code)!,
      specification: row?.specification ?? null,
      capacity: row ? pickCapacity(row, vehicle.hasAirConditioning) : null,
      changeInterval: row ? formatChangeInterval(row.intervalKm, row.intervalMonths) : null,
      sourceNotes: row?.warnings ?? null,
      source: row?.source
        ? {
            name: row.source.name,
            reference: row.source.reference,
            verifiedAt: row.source.verifiedAt,
          }
        : null,
      curated: !!row,
      content: getFluidContent(f.code, sheet?.code),
    };
  });
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});
export function formatDate(d: Date) {
  return dateFmt.format(d);
}
