import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

// Fluido Fácil: título forte (Sora) + corpo de alta legibilidade (Inter) —
// "tipografia forte para títulos e alta legibilidade para instruções".
const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const fontHeading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Fluido Fácil — Cuide bem do seu carro",
    template: "%s · Fluido Fácil",
  },
  description:
    "Seu guia dentro do capô: saiba o que colocar, onde colocar e quando verificar os fluidos do seu carro.",
  applicationName: "Fluido Fácil",
};

// viewportFit "cover" + padding com env(safe-area-inset-*) no body evita que
// conteúdo fique atrás do notch/gesture bar quando o PWA roda em modo
// standalone (display: "standalone" no manifest) — requisito mobile-first
// da seção 5.5 do PRD.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#11100f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontBody.variable} ${fontHeading.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
      </body>
    </html>
  );
}
