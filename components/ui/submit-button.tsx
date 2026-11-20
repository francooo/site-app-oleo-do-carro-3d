import type { ButtonHTMLAttributes } from "react";

import { type ButtonSize, type ButtonVariant, buttonClasses } from "@/components/ui/button-styles";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function SubmitButton({
  variant = "primary",
  size = "lg",
  className,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`w-full ${buttonClasses(variant, size)} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
