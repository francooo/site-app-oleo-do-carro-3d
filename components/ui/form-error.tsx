import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
