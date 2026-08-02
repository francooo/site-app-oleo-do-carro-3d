import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit não lê .env.local por padrão (essa é uma convenção do
// Next.js, não algo que ferramentas Node genéricas conhecem) — carregamos
// explicitamente aqui para que `drizzle-kit generate/migrate` usem o mesmo
// arquivo que o `next dev`/`next build` já leem automaticamente.
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL não definida — configure .env.local (ver .env.example)",
  );
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
