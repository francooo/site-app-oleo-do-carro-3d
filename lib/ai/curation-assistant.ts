// Import relativo (não "@/...") de propósito: este módulo também é
// carregado por scripts/curation-assistant.ts via tsx fora do Next.js, que
// não resolve o alias de path do tsconfig.
import { CURATION_MODEL, groq } from "./groq";

export interface FluidSpecDraft {
  fluidType: string;
  specification: string | null;
  viscosity: string | null;
  volumeMl: number | null;
  volumeWithFilterMl: number | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  warnings: string | null;
  /** Frase exata da fonte de onde o modelo tirou a informação — usada pelo
   *  humano para conferir antes de publicar (nunca publicar sem checar). */
  sourceQuote: string;
}

export interface CurationDraft {
  engineCode: string;
  fluids: FluidSpecDraft[];
  /** Pontos que o modelo não conseguiu extrair com confiança — motivo, não
   *  um valor arriscado. */
  uncertain: string[];
}

const SYSTEM_PROMPT = `Você extrai especificações técnicas de fluidos automotivos (óleo do motor, freio, arrefecimento, transmissão, limpador) a partir de texto de manual do proprietário ou fonte técnica equivalente.

Regras estritas:
- Nunca invente um valor que não esteja explícito no texto. Se não encontrar, use null.
- Para cada campo preenchido, inclua em "sourceQuote" a frase exata do texto de onde tirou a informação — isso é usado por um humano para conferir antes de publicar.
- Se o texto for ambíguo ou insuficiente para algum fluido, descreva o motivo em "uncertain" em vez de arriscar um valor.
- Responda só com o JSON no formato pedido, sem texto ou comentário adicional.`;

function buildUserPrompt(engineCode: string, sourceText: string) {
  return `Motor: ${engineCode}

Texto fonte:
"""
${sourceText}
"""

Responda exatamente neste formato JSON:
{
  "fluids": [
    {
      "fluidType": "oil" | "brake" | "coolant" | "transmission" | "washer",
      "specification": string | null,
      "viscosity": string | null,
      "volumeMl": number | null,
      "volumeWithFilterMl": number | null,
      "intervalKm": number | null,
      "intervalMonths": number | null,
      "warnings": string | null,
      "sourceQuote": string
    }
  ],
  "uncertain": string[]
}`;
}

// Rascunho para revisão manual — nunca escreve no banco diretamente (ver
// seção 6 do PRD: IA não é fonte de verdade sobre especificação; mínimo de
// duas fontes independentes e checagem humana antes de publicar).
export async function draftFluidSpecsFromSource(
  engineCode: string,
  sourceText: string,
): Promise<CurationDraft> {
  const completion = await groq.chat.completions.create({
    model: CURATION_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(engineCode, sourceText) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Groq não retornou conteúdo.");
  }

  const parsed = JSON.parse(raw) as { fluids?: FluidSpecDraft[]; uncertain?: string[] };
  return {
    engineCode,
    fluids: parsed.fluids ?? [],
    uncertain: parsed.uncertain ?? [],
  };
}
