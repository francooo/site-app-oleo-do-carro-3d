import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Requisito 5.5 do PRD: a última ficha de veículo vista fica disponível
// offline (garagem/estacionamento costuma não ter sinal). Cache dedicado
// (não o cache genérico do restante do app) para a rota que serve a ficha
// como JSON puro — RSC payload não é confiável para cache offline, por
// isso a ficha é buscada via /api/veiculos/[id]/ficha.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /\/api\/veiculos\/.+\/ficha/,
      handler: new NetworkFirst({
        cacheName: "ficha-cache",
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
