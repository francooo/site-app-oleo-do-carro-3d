import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

// text-base (16px), não text-sm: em iOS Safari um input com fonte < 16px
// faz a página dar zoom automático ao focar o campo — ruim no celular, que
// é o dispositivo principal deste produto (PRD 5.5).
export function TextField({ label, id, name, className, ...props }: TextFieldProps) {
  const fieldId = id ?? name;
  return (
    <label htmlFor={fieldId} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        id={fieldId}
        name={name}
        className={`min-h-11 rounded-md border border-zinc-300 px-3 py-2 text-base dark:border-zinc-700 dark:bg-transparent ${className ?? ""}`}
        {...props}
      />
    </label>
  );
}
