import { S3Client } from "@aws-sdk/client-s3";

// Neon Object Storage é S3-compatible (beta desde jul/2026) e usa as mesmas
// credenciais do projeto Neon — sem conta cloud separada (ver seção 6 do
// PRD). Trocar de provedor no futuro (R2, S3) é só reapontar estas envs.
if (!process.env.NEON_STORAGE_ENDPOINT) {
  throw new Error(
    "NEON_STORAGE_ENDPOINT não definida — configure .env.local (ver .env.example)",
  );
}

export const storageClient = new S3Client({
  endpoint: process.env.NEON_STORAGE_ENDPOINT,
  region: process.env.NEON_STORAGE_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.NEON_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEON_STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export const STORAGE_BUCKET = process.env.NEON_STORAGE_BUCKET!;
