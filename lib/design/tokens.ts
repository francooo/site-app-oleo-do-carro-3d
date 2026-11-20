// Fonte de verdade dos tokens do design system "Fluido Fácil" v1.
//
// TS puro, sem import de Next/DOM: o futuro app Expo importa este mesmo
// objeto (ver docs/MOBILE-PARIDADE.md). app/globals.css espelha estes valores
// como CSS variables e lib/design/tokens.test.ts garante que os dois não
// divergem — ao mudar uma cor, mude aqui E no :root do globals.css.

export const colors = {
  // Base escura premium
  background: "#11100f", // Preto profundo
  "surface-lowest": "#0b0a09",
  "surface-low": "#1a1816",
  surface: "#262321", // Carvão — cards e painéis
  "surface-variant": "#3a3531",

  // Texto
  foreground: "#e8d8bd", // Creme
  "foreground-strong": "#fbf6ee", // títulos (mockups usam quase-branco)
  "foreground-muted": "#b3a48d",

  // Marca
  copper: "#c47a2c", // Cobre — contornos, ícones, detalhes
  accent: "#f0a64a", // Âmbar — CTA e pontos interativos
  "accent-hover": "#f5b865",
  "accent-active": "#d98f33",
  "accent-foreground": "#1a1209", // texto escuro sobre o âmbar
  "accent-text": "#f0a64a",
  wood: "#d7ad78", // Madeira clara — barra inferior e rodapé
  "wood-dark": "#9a6a3a",
  "wood-foreground": "#2a1b0e",

  border: "#4a3a2b",

  // Estados — sempre acompanhados de texto (critério de UX §5)
  success: "#4ade80", // Em dia
  "success-soft": "#0f2a18",
  warning: "#f0a64a", // Verificar
  "warning-soft": "#2e1f0c",
  error: "#f87171", // Atenção
  "error-soft": "#3a1212",
  neutral: "#a8a29e", // Não informado
  "neutral-soft": "#292524",
} as const;

export const radius = {
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 28,
} as const;

export const fonts = {
  heading: "Sora",
  body: "Inter",
} as const;

export type ColorToken = keyof typeof colors;
