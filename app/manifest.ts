import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AutoGuide AI",
    short_name: "AutoGuide",
    description:
      "O que o seu carro usa e quando trocar — em menos de 30 segundos.",
    start_url: "/garagem",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
