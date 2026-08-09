import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  // Esconde o indicador flutuante de dev tools (rota/bundler/preferências)
  // no canto da tela durante `next dev`.
  devIndicators: false,
  // `next dev` usa Turbopack por padrão no Next 16, mas o withSerwist()
  // acima injeta um config de webpack — sem isso o Next recusa a subir
  // ("This build is using Turbopack, with a webpack config..."). O
  // service worker do Serwist não é gerado sob Turbopack (aviso esperado);
  // o cache offline é testado via `pnpm build && pnpm start`, não em dev.
  turbopack: {},
};

export default withSerwist(nextConfig);
