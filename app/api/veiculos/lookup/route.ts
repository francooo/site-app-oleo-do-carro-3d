import { NextResponse } from "next/server";

// Fornecedor de consulta de placa é decidido no spike do Sprint 0 (ver
// docs/ROADMAP.md) — a implementação escolhida satisfaz o contrato em
// lib/plate-lookup/provider.ts. Até lá, este endpoint reporta
// explicitamente que não há provedor configurado (nunca inventa dado).
export async function POST() {
  return NextResponse.json(
    { error: "plate_lookup_provider_not_configured" },
    { status: 501 },
  );
}
