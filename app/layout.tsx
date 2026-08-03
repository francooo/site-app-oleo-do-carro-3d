import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontHeading = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoGuide AI",
  description:
    "O que o seu carro usa e quando trocar — em menos de 30 segundos.",
};

// viewportFit "cover" + padding com env(safe-area-inset-*) no body evita que
// conteúdo fique atrás do notch/gesture bar quando o PWA roda em modo
// standalone (display: "standalone" no manifest) — requisito mobile-first
// da seção 5.5 do PRD.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${fontHeading.variable} ${fontBody.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
      </body>
    </html>
  );
}
