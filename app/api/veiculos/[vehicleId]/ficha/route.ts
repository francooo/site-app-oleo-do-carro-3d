import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { getVehicleByIdForUser } from "@/lib/db/queries/vehicles";

// Endpoint-alvo do cache offline (requisito 5.5 do PRD): serve a ficha como
// JSON puro, cacheado pela regra `ficha-cache` do Serwist (app/sw.ts).
// RSC payload não é confiável para cache offline, por isso a ficha completa
// (Sprint 2+) será buscada por um client component contra esta rota.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ vehicleId: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { vehicleId } = await params;
  const vehicle = await getVehicleByIdForUser(session.user.id, vehicleId);
  if (!vehicle) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}
