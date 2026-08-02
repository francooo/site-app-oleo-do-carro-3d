import type { ButtonHTMLAttributes } from "react";

import { buttonClasses } from "@/components/ui/button-styles";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function SubmitButton({
  variant = "primary",
  className,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`w-full ${buttonClasses(variant)} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
