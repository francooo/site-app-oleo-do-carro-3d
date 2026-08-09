import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Car,
  Droplet,
  MapPin,
  PlayCircle,
  Plug,
} from "lucide-react";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-styles";

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/30 bg-surface-lowest pt-20 pb-24 sm:pt-24 sm:pb-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-3/4 w-3/4 -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]"
        />

        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 sm:px-8 md:flex-row">
          <div className="w-full space-y-8 text-center md:w-1/2 md:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-label-md text-accent-text">
              <span className="h-2 w-2 rounded-full bg-accent-text" />
              Curadoria especializada
            </span>

            <h1 className="text-headline-lg-mobile text-foreground tracking-tight sm:text-display-lg">
              O que o seu carro usa — e quando trocar.
            </h1>

            <p className="mx-auto max-w-xl text-body-lg text-foreground-muted md:mx-0">
              Óleo, fluidos, filtros e intervalos de manutenção específicos para a versão do seu
              veículo. Sem achismo, sem manual perdido no porta-luvas.
            </p>

            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center md:justify-start">
              <Link href="/signup" className={`${buttonClasses("primary")} gap-2`}>
                Criar conta grátis
                <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </Link>
              <a href="#funcionalidades" className={`${buttonClasses("secondary")} gap-2`}>
                Ver como funciona
                <PlayCircle className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="mx-auto w-full max-w-md rounded-xl border border-border/50 bg-surface p-6 shadow-[var(--shadow-card-hover)]">
              <div className="flex items-center gap-3 border-b border-border/30 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-variant text-accent-text">
                  <Car className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    Volkswagen Polo 2020
                  </p>
                  <p className="font-mono text-xs text-foreground-muted">ABC1D23</p>
                </div>
              </div>
              <dl className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-2 text-sm text-foreground-muted">
                    <Droplet className="h-4 w-4 text-accent-text" strokeWidth={2} aria-hidden="true" />
                    Óleo do motor
                  </dt>
                  <dd className="font-mono text-sm text-foreground">5W30 API SN</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-foreground-muted">Intervalo</dt>
                  <dd className="font-mono text-sm text-foreground">10.000 km</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-foreground-muted">Filtro de óleo</dt>
                  <dd className="font-mono text-sm text-foreground">Mann W712</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-headline-lg text-foreground">Feito para quem não é mecânico</h2>
          <p className="mx-auto mt-4 max-w-2xl text-body-md text-foreground-muted">
            Confira o que a oficina propõe antes de aprovar o orçamento — com dado específico
            para a versão do seu carro, não um palpite genérico.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col rounded-xl border border-border/50 bg-surface p-8 transition-colors duration-300 hover:border-accent/50 md:col-span-2">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-border/50 bg-surface-variant text-accent-text">
              <BarChart3 className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="mb-3 text-headline-md text-foreground">
              Especificação certa para a versão do seu carro
            </h3>
            <p className="mb-6 max-w-md text-body-md text-foreground-muted">
              Identificação determinística por placa ou seleção manual — quando duas versões do
              mesmo modelo diferem, o app mostra as duas em vez de arriscar um dado errado.
            </p>
            <div className="mt-auto flex gap-6 border-t border-border/30 pt-6">
              <div className="flex flex-col">
                <span className="text-label-md text-accent-text">FONTES POR MOTOR</span>
                <span className="text-sm font-medium text-foreground">Mínimo de 2</span>
              </div>
              <div className="flex flex-col">
                <span className="text-label-md text-accent-text">BASE INICIAL</span>
                <span className="text-sm font-medium text-foreground">10-15 motores</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-surface p-8 transition-colors duration-300 hover:border-accent/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-border/50 bg-surface-variant text-warning">
              <AlertTriangle className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="mb-3 text-headline-md text-foreground">Avisos que importam</h3>
            <p className="text-body-md text-foreground-muted">
              Torque do bujão, motor com corrente de comando, cárter de alumínio — os detalhes
              que evitam um dano bobo.
            </p>
          </div>

          <div className="rounded-xl border border-border/50 bg-surface p-8 transition-colors duration-300 hover:border-accent/50">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-border/50 bg-surface-variant text-accent-text">
              <Plug className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="mb-3 text-headline-md text-foreground">Sem inventar dado</h3>
            <p className="text-body-md text-foreground-muted">
              Sem fonte confiável, o app não publica. Nunca preenche um campo com valor genérico
              só para não deixar em branco.
            </p>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-surface transition-colors duration-300 hover:border-accent/50 md:col-span-2 md:flex-row">
            <div className="flex flex-1 flex-col justify-center p-8">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-border/50 bg-surface-variant text-accent-text">
                <MapPin className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="mb-3 text-headline-md text-foreground">
                Onde fica cada coisa no cofre do motor
              </h3>
              <p className="text-body-md text-foreground-muted">
                Reservatório de freio, expansão do arrefecimento, vareta de óleo — sem ficar
                adivinhando qual tampa abrir.
              </p>
            </div>
            <div className="relative min-h-[200px] w-full bg-surface-variant/30 md:w-1/2">
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center text-foreground-muted/30"
              >
                <Car className="h-20 w-20" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
