// Arquivos de curadoria versionados no repositório: bootstrap do seed (entram
// no banco como publicados se o layout ainda não existir) e fixtures dos
// testes. Carros novos são cadastrados na curadoria online (/curadoria).

import type { CurationFile } from "@/lib/domain/curation";

import c0 from "./chevrolet-onix-turbo-2020.json";

export const CURATIONS: readonly CurationFile[] = [c0 as CurationFile];
