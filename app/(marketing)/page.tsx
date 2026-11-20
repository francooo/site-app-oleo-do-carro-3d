import { BellRing, BookOpen, Car, MapPin, ShieldAlert, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { BrakeIcon, CoolantIcon, OilIcon, WasherIcon } from "@/components/icons/fluids";
import { buttonClasses } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/card";
import { CtaLink } from "@/components/ui/cta-link";
import { IconTile } from "@/components/ui/icon-tile";

const FEATURES = [
  {
    icon: MapPin,
    title: "Mapa de fluidos do seu carro",
    text: "O capô vira um mapa: toque em cada ponto para saber o que é, qual fluido usar e quanto cabe.",
  },
  {
    icon: BookOpen,
    title: "Tutoriais passo a passo",
    text: "Etapas curtas para verificar óleo, freio e arrefecimento — com o que fazer e o que nunca fazer.",
  },
  {
    icon: BellRing,
    title: "Histórico e lembretes",
    text: "Registre verificações e trocas com a quilometragem e receba um aviso antes da próxima.",
  },
  {
    icon: Car,
    title: "Vários carros na garagem",
    text: "Cada carro mantém seu modelo, versão, motor, status e histórico — é só trocar de carro.",
  },
] as const;

const FLUIDS = [
  { icon: OilIcon, label: "Óleo do motor" },
  { icon: BrakeIcon, label: "Fluido de freio" },
  { icon: CoolantIcon, label: "Arrefecimento" },
  { icon: WasherIcon, label: "Limpador" },
] as const;

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
        <div
          aria-hidden="true"
          className="bg-copper/15 pointer-events-none absolute top-0 left-1/2 h-3/4 w-3/4 -translate-x-1/2 rounded-full blur-[120px]"
        />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6 text-center lg:text-left">
            <span className="border-copper/50 bg-surface/70 text-label-md text-accent-text inline-flex items-center gap-2 rounded-full border px-3 py-1">
              <ShieldCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              Feito para quem não é mecânico
            </span>
            <h1 className="font-heading text-headline-lg-mobile sm:text-display-lg tracking-tight">
              Seu guia dentro do <span className="text-gradient-amber">capô</span>
            </h1>
            <p className="text-body-lg text-foreground-muted mx-auto max-w-xl lg:mx-0">
              Saiba o que colocar, onde colocar e quando verificar os fluidos do seu carro — com
              dados da versão exata do seu veículo e a fonte de cada informação.
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row lg:mx-0">
              <CtaLink href="/signup">Começar agora</CtaLink>
              <Link
                href="/login"
                className={`${buttonClasses("secondary", "lg")} w-full sm:w-auto sm:shrink-0`}
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          <Image
            src="/brand/hero-capo.webp"
            alt="Cofre do motor aberto com os reservatórios de cada fluido indicados"
            width={1440}
            height={780}
            priority
            className="border-copper/40 shadow-card h-auto w-full rounded-2xl border"
          />
        </div>

        <ul className="relative z-10 mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-8">
          {FLUIDS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="border-copper/40 bg-surface/80 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium"
            >
              <Icon className="text-accent h-5 w-5 shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      <section
        id="funcionalidades"
        className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-24"
      >
        <div className="mb-12 text-center">
          <h2 className="font-heading text-headline-lg-mobile sm:text-headline-lg tracking-tight">
            Cuidar do carro sem <span className="text-gradient-amber">intimidação</span>
          </h2>
          <p className="text-body-md text-foreground-muted mx-auto mt-3 max-w-2xl">
            Informação técnica por veículo e versão — nunca só pelo nome do modelo — explicada em
            linguagem simples.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex gap-4 p-6">
              <IconTile>
                <Icon strokeWidth={2} aria-hidden="true" />
              </IconTile>
              <div>
                <h3 className="font-heading text-lg font-bold">{title}</h3>
                <p className="text-body-md text-foreground-muted mt-1.5">{text}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Sem <Card>: a borda vermelha conflitaria com a borda cobre base. */}
        <div className="border-error/40 bg-surface/90 shadow-card mt-5 flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center">
          <span className="border-error/50 bg-surface-lowest text-error flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border">
            <ShieldAlert className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <p className="text-body-md text-foreground-muted">
            <strong className="text-foreground-strong">Segurança primeiro:</strong> verifique com o
            motor frio, nunca abra o arrefecimento quente, não misture fluidos e procure um
            profissional diante de vazamentos ou luzes de advertência.
          </p>
        </div>
      </section>
    </>
  );
}
