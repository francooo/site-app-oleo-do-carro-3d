import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

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
    // Telas técnicas do carro (mapa, detalhe, tutorial, status): o usuário
    // abre no estacionamento/garagem, muitas vezes sem sinal. Navegações
    // (HTML completo) vão para um cache dedicado; com rede lenta, cai no
    // cache depois de 4 s.
    {
      matcher: ({ request, url }) =>
        request.mode === "navigate" &&
        /^\/veiculos\/[^/]+\/(mapa|status|fluidos)(\/|$)/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "fluidos-paginas",
        networkTimeoutSeconds: 4,
      }),
    },
    // Imagens de marca/tutorial: imutáveis por versão do app.
    {
      matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/brand/"),
      handler: new CacheFirst({ cacheName: "brand-assets" }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
