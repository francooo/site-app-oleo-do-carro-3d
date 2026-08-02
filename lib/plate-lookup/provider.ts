// Contrato estável para o provedor de consulta de placa. Qual fornecedor
// implementar (apiplacas.com.br, fipeapi.com.br/placafipe.com.br, WebXcar,
// Direct Data, ...) é decidido no spike do Sprint 0 (ver docs/ROADMAP.md) —
// a UI e o restante do app dependem só desta interface, nunca de um SDK
// de fornecedor específico.

export interface PlateLookupResult {
  plate: string;
  make: string;
  model: string;
  year: number;
  fuelType: string | null;
  /** Chassi (VIN), quando o fornecedor devolve — resolve a identificação
   *  no nível 1 da hierarquia (PRD 5.2), sem precisar de colapso de
   *  candidatos. */
  vin: string | null;
  trim: string | null;
}

export interface PlateLookupProvider {
  lookup(plate: string): Promise<PlateLookupResult | null>;
}
