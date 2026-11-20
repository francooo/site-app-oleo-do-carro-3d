import { CarFront } from "lucide-react";
import Image from "next/image";

import { vehicleImageKey } from "@/lib/domain/vehicle";

// Imagens curadas por modelo (renders do pacote Fluido Fácil). Carro sem
// imagem própria recebe uma ilustração neutra — nunca a foto de outro modelo.
const IMAGES: Record<string, { src: string; width: number; height: number }> = {
  "fiat-uno": { src: "/brand/carros/fiat-uno.webp", width: 1100, height: 575 },
};

type VehicleImageProps = {
  make: string;
  model: string;
  /** "card": funde à direita do card (máscara lateral); "hero": destaque central. */
  variant?: "card" | "hero";
  priority?: boolean;
  className?: string;
};

export function VehicleImage({
  make,
  model,
  variant = "card",
  priority = false,
  className = "",
}: VehicleImageProps) {
  const key = vehicleImageKey({ make, model });
  const image = key ? IMAGES[key] : undefined;

  // A máscara apaga as bordas do render (fundo de estúdio) para o carro
  // "flutuar" sobre o card escuro, como nos mockups. Inline (não classe
  // arbitrária do Tailwind) para levar o prefixo -webkit- junto.
  const mask =
    variant === "card"
      ? "linear-gradient(to right, transparent, black 22%, black 85%, transparent), linear-gradient(to bottom, transparent, black 10%, black 82%, transparent)"
      : "radial-gradient(ellipse 62% 58% at 50% 50%, black 60%, transparent 100%)";
  const maskStyle = {
    maskImage: mask,
    WebkitMaskImage: mask,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  } as const;

  if (!image) {
    return (
      <div
        aria-hidden="true"
        className={`text-copper/70 flex items-center justify-center ${className}`}
      >
        <div
          className={`border-copper/30 from-surface-variant/60 to-surface-lowest relative flex aspect-square items-center justify-center rounded-full border bg-radial ${
            variant === "hero" ? "h-40 md:h-56" : "h-full max-h-28"
          }`}
        >
          <CarFront className="h-1/2 w-1/2" strokeWidth={1.4} />
        </div>
      </div>
    );
  }

  return (
    <Image
      src={image.src}
      width={image.width}
      height={image.height}
      alt=""
      priority={priority}
      sizes={
        variant === "hero" ? "(min-width: 768px) 640px, 100vw" : "(min-width: 768px) 360px, 60vw"
      }
      style={maskStyle}
      className={`h-auto w-full object-contain ${className}`}
    />
  );
}
