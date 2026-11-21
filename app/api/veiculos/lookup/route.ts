import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { getLookupForUser, rowToPlateVehicle } from "@/lib/db/queries/plate-lookups";
import { pickFipeVersion } from "@/lib/domain/plate-vehicle";
import { lookupPlateForUser } from "@/lib/plate-lookup/service";

// Consulta de placa em JSON — mesmo serviço da tela web, para o app Expo
// (Fase 6, /api/v1). Exige sessão; a chave do fornecedor nunca sai daqui.
// Corpo: { "plate": "ABC1D23" }.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    plate?: unknown;
  } | null;
  const plate = typeof body?.plate === "string" ? body.plate : "";
  const result = await lookupPlateForUser(session.user.id, plate);

  if (result.status !== "found") {
    const status = result.status === "invalid" ? 422 : result.status === "limit" ? 429 : 200;
    return NextResponse.json(result, { status });
  }

  const row = await getLookupForUser(result.lookupId, session.user.id);
  const vehicle = row ? rowToPlateVehicle(row) : null;
  const choice = vehicle
    ? pickFipeVersion({
        versions: vehicle.fipeVersions,
        engineDisplacement: vehicle.engineDisplacement,
      })
    : null;
  return NextResponse.json({ ...result, vehicle, versionChoice: choice });
}
