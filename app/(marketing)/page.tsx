import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-styles";

export default function LandingPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-4 text-center sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 -z-10 h-[420px] w-[420px] rounded-full opacity-70 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%)",
        }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 800 300"
        fill="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 w-full text-accent opacity-[0.08]"
      >
        <path
          d="M-50 260 C 150 200, 280 280, 480 160 S 780 40, 900 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M-50 300 C 160 250, 300 320, 500 210 S 800 90, 900 50"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium tracking-wide text-accent-text uppercase">
        Curadoria especializada
      </span>

      <h1 className="font-heading max-w-md text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        O que o seu carro usa — e quando trocar.
      </h1>
      <p className="max-w-md text-foreground-muted">
        Óleo, fluidos, filtros e intervalos de manutenção específicos para a versão do seu
        veículo. Sem achismo, sem manual perdido no porta-luvas.
      </p>
      <Link href="/login" className={buttonClasses("primary")}>
        Entrar
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium text-accent-text underline-offset-4 hover:underline"
      >
        Ver como funciona
      </Link>
    </div>
  );
}
