import { Gauge, ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      {/* Painel de marca — só desktop. Sem imagem de estoque externa (não
          temos asset real); decoração é a mesma grade técnica + glow da
          landing (app/(marketing)/page.tsx). */}
      <div className="relative hidden overflow-hidden border-r border-border/30 bg-surface-lowest lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-3/4 w-3/4 -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
        />

        <div className="relative z-10 flex items-center gap-2 font-heading text-lg font-bold text-accent-text">
          <Gauge className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          AutoGuide AI
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-display-lg text-foreground">
            O que o seu carro usa — e quando trocar.
          </h1>
          <p className="mt-4 text-body-lg text-foreground-muted">
            Óleo, fluidos, filtros e intervalos de manutenção específicos para a versão do seu
            veículo. Sem achismo, sem manual perdido no porta-luvas.
          </p>
          <div className="mt-8 flex items-center gap-3 border-l-2 border-accent pl-4">
            <ShieldCheck className="h-5 w-5 text-accent-text" strokeWidth={2} aria-hidden="true" />
            <span className="text-sm text-foreground-muted">
              Dado sempre rastreável a uma fonte.
            </span>
          </div>
        </div>
      </div>

      {/* Painel do formulário */}
      <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-8">
        <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card-hover)] sm:p-8">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
