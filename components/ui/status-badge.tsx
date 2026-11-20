import { AlertCircle, CheckCircle2, CircleHelp, CircleDot } from "lucide-react";

import { FLUID_STATUS_LABEL, type FluidStatus } from "@/lib/domain/fluid-status";

// Estados SEMPRE com texto + cor + ícone, nunca só cor (critério de UX §5).
const STYLES: Record<FluidStatus, { className: string; Icon: typeof CheckCircle2 }> = {
  em_dia: {
    className: "border-success/60 bg-success-soft text-success",
    Icon: CheckCircle2,
  },
  verificar: {
    className: "border-warning/60 bg-warning-soft text-warning",
    Icon: CircleDot,
  },
  atencao: {
    className: "border-error/60 bg-error-soft text-error",
    Icon: AlertCircle,
  },
  nao_informado: {
    className: "border-neutral/50 bg-neutral-soft text-neutral",
    Icon: CircleHelp,
  },
};

type StatusBadgeProps = {
  status: FluidStatus;
  /** Sobrescreve o texto padrão (ex.: "2 itens para verificar"). */
  label?: string;
  /** "xs": sem ícone e sem quebra, para cards estreitos (grade de 3 no celular). */
  size?: "xs" | "sm" | "md";
  className?: string;
};

export function StatusBadge({ status, label, size = "sm", className = "" }: StatusBadgeProps) {
  const { className: tone, Icon } = STYLES[status];
  const sizing =
    size === "md"
      ? "gap-2 px-3.5 py-2 text-sm"
      : size === "sm"
        ? "gap-1.5 px-2.5 py-1 text-xs"
        : "justify-center px-2 py-1 text-[0.6875rem] leading-tight";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap ${sizing} ${tone} ${className}`}
    >
      {size === "xs" ? null : (
        <Icon
          className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"}
          strokeWidth={2.4}
          aria-hidden="true"
        />
      )}
      {label ?? FLUID_STATUS_LABEL[status]}
    </span>
  );
}
