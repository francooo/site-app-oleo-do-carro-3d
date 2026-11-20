// Ícones vetoriais dos fluidos, redesenhados a partir das referências do
// pacote Fluido Fácil v1. Traço em currentColor (padrão: cobre/âmbar via
// classe do pai), 24x24, mesma API de tamanho dos ícones lucide.

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Óleo do motor — almotolia com gota. */
export function OilIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2.5 10.5h3l2 -1.5h6.5l5 -2.5" />
      <path d="M5.5 10.5v6h9.5l4.5 -8.5" />
      <path d="M9.5 9V7h-2.5M9.5 7h2.5" />
      <path
        d="M21 12.2c0 0 -1.1 1.5 -1.1 2.3a1.1 1.1 0 0 0 2.2 0c0 -.8 -1.1 -2.3 -1.1 -2.3z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  );
}

/** Fluido de freio — símbolo de advertência de freio. */
export function BrakeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="6" />
      <path d="M12 9v3.5" />
      <path d="M12 15.2v.1" strokeWidth={2.4} />
      <path d="M4.2 7.5a9 9 0 0 0 0 9" />
      <path d="M19.8 7.5a9 9 0 0 1 0 9" />
    </Base>
  );
}

/** Arrefecimento — termômetro sobre ondas. */
export function CoolantIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v11" />
      <path d="M12 5h3M12 8h3M12 11h3" />
      <circle cx="12" cy="15.5" r="1.6" />
      <path d="M3 18.5c1.5 -1 3 -1 4.5 0s3 1 4.5 0 3 -1 4.5 0 3 1 4.5 0" />
      <path d="M3 21.5c1.5 -1 3 -1 4.5 0s3 1 4.5 0 3 -1 4.5 0 3 1 4.5 0" />
    </Base>
  );
}

/** Limpador de para-brisa — para-brisa com jato. */
export function WasherIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 10.5c5.5 -3 12.5 -3 18 0l-2.5 7.5h-13z" />
      <path d="M12 18l3.5 -6" />
      <path d="M8 4.5v.1M12 3.5v.1M16 4.5v.1M10 6.5v.1M14 6.5v.1" strokeWidth={2.2} />
    </Base>
  );
}

/** Direção hidráulica — volante. */
export function SteeringIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <path d="M3.5 10.5c3 -1 5.5 -1 7 .2M20.5 10.5c-3 -1 -5.5 -1 -7 .2" />
      <path d="M12 14v6.8" />
    </Base>
  );
}

/** Transmissão / câmbio — engrenagem simples. */
export function TransmissionIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6 8v8M12 8v8M18 8v4H6" />
    </Base>
  );
}

/** Genérico — gota. */
export function FluidDropIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3s-6 7 -6 11a6 6 0 0 0 12 0c0 -4 -6 -11 -6 -11z" />
    </Base>
  );
}

const BY_KEY = {
  oil: OilIcon,
  brake: BrakeIcon,
  coolant: CoolantIcon,
  washer: WasherIcon,
  steering: SteeringIcon,
  transmission: TransmissionIcon,
} as const;

/** Resolve o ícone pelo `fluid_types.code` (ver drizzle/seed.ts). */
export function FluidIcon({ fluidKey, ...props }: IconProps & { fluidKey: string }) {
  const k = fluidKey.toLowerCase();
  const match = (Object.keys(BY_KEY) as (keyof typeof BY_KEY)[]).find((key) => k.includes(key));
  const Icon = match ? BY_KEY[match] : FluidDropIcon;
  return <Icon {...props} />;
}
