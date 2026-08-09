import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Ícone decorativo à esquerda (ex.: Mail, Lock). */
  icon?: LucideIcon;
  /** Slot à direita dentro do campo (ex.: toggle de mostrar/ocultar senha). */
  trailingAction?: ReactNode;
};

// text-base (16px), não text-sm: em iOS Safari um input com fonte < 16px
// faz a página dar zoom automático ao focar o campo — ruim no celular, que
// é o dispositivo principal deste produto (PRD 5.5).
export function TextField({
  label,
  id,
  name,
  className,
  icon: Icon,
  trailingAction,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? name;
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground-muted">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-foreground-muted"
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
        <input
          id={fieldId}
          name={name}
          className={`min-h-11 w-full rounded-lg border border-border bg-surface py-2 text-base text-foreground outline-none transition-colors placeholder:text-foreground-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/20 ${Icon ? "pl-10" : "pl-3"} ${trailingAction ? "pr-11" : "pr-3"} ${className ?? ""}`}
          {...props}
        />
        {trailingAction}
      </div>
    </label>
  );
}
