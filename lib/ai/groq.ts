import Groq from "groq-sdk";

// Groq é o provedor de IA do MVP (ver seção 6 do PRD) — uso restrito a
// normalização de texto e assistência de conteúdo/curadoria. Nunca é fonte
// de verdade sobre especificação de fluido: toda sugestão exige checagem
// manual contra a fonte original antes de publicar.
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY não definida — configure .env.local (ver .env.example)");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Configurável por env porque modelos hospedados na Groq mudam com alguma
// frequência — trocar o padrão aqui não deve exigir tocar no restante do
// código (mesmo racional de abstração de provedor da seção 6 do PRD).
export const CURATION_MODEL = process.env.GROQ_CURATION_MODEL ?? "llama-3.3-70b-versatile";
