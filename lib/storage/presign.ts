import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { STORAGE_BUCKET, storageClient } from "@/lib/storage/client";

const SIGNED_URL_TTL_SECONDS = 300;

// Usado para foto de veículo, comprovante de manutenção (5.4 do PRD) e,
// mais adiante, imagens dos diagramas de cofre do motor. URLs de curta
// duração — requisito de LGPD (seção 8.3 do PRD).

export function getUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(storageClient, command, {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}

export function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key });
  return getSignedUrl(storageClient, command, {
    expiresIn: SIGNED_URL_TTL_SECONDS,
  });
}
