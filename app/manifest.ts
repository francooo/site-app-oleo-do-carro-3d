import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluido Fácil",
    short_name: "Fluido Fácil",
    description:
      "Seu guia dentro do capô: saiba o que colocar, onde colocar e quando verificar os fluidos do seu carro.",
    lang: "pt-BR",
    start_url: "/garagem",
    display: "standalone",
    background_color: "#11100f",
    theme_color: "#11100f",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
