import { Car, type LucideIcon, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Outras rotas que também marcam este item como ativo. */
  match?: string[];
};

// Fonte única dos itens da BottomNav (mobile) e da Sidebar (desktop).
// Alvo do design system (4 itens): Início, Garagem, Aprender, Perfil — os
// itens entram aqui conforme as rotas de cada fase ficam prontas.
export const NAV_ITEMS: NavItem[] = [
  { href: "/garagem", label: "Garagem", icon: Car, match: ["/veiculos"] },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function isNavItemActive(item: NavItem, pathname: string) {
  return [item.href, ...(item.match ?? [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
