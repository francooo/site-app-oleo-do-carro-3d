import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// DESIGN.md ("Kinetic Logic") usa só Inter — sem par heading/body distinto.
// --font-heading é aliasada para a mesma fonte em globals.css (:root), para
// não precisar editar as páginas que já usam a classe `font-heading`.
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
  themeColor: "#131315",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fontBody.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {children}
      </body>
    </html>
  );
}
