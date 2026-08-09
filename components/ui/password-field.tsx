"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { useState } from "react";

import { TextField } from "@/components/ui/text-field";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      label={label}
      type={visible ? "text" : "password"}
      icon={Lock}
      trailingAction={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-muted transition-colors hover:text-accent-text"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      }
      {...props}
    />
  );
}
