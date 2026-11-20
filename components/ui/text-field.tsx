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
      <span className="text-foreground-muted text-sm font-medium">{label}</span>
      <div className="relative">
        {Icon ? (
          <Icon
            className="text-foreground-muted pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2"
            strokeWidth={2}
            aria-hidden="true"
          />
        ) : null}
        <input
          id={fieldId}
          name={name}
          className={`border-border bg-surface-lowest/80 text-foreground placeholder:text-foreground-muted/60 focus:border-accent focus:ring-accent/20 min-h-12 w-full rounded-xl border py-2.5 text-base transition-colors outline-none focus:ring-2 ${Icon ? "pl-10" : "pl-3"} ${trailingAction ? "pr-11" : "pr-3"} ${className ?? ""}`}
          {...props}
        />
        {trailingAction}
      </div>
    </label>
  );
}
