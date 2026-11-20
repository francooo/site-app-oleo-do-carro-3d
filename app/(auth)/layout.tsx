import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ValuesStrip } from "@/components/brand/values-strip";

// Referência: referencias/login-aprovado-original.png — logo + slogan, cofre
// do motor em 3D, card escuro do formulário sobreposto e faixa de valores em
// madeira. No desktop (lg+) a imagem vira painel lateral e o formulário
// ocupa a coluna direita.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Marca + cofre do motor */}
        <div className="lg:border-copper/25 relative flex flex-col items-center px-4 pt-8 lg:w-1/2 lg:justify-center lg:border-r lg:px-12 lg:pt-0">
          <Link href="/" aria-label="Fluido Fácil — página inicial">
            <Logo markClassName="h-14 w-14 lg:h-16 lg:w-16" tagline="Seu guia dentro do capô" />
          </Link>
          <p className="font-heading text-accent-text mt-4 text-center text-sm font-semibold lg:text-lg">
            Saiba o que colocar e onde colocar
          </p>
          <div className="relative mt-2 -mb-10 w-full max-w-xl lg:mt-8 lg:mb-0">
            <Image
              src="/brand/hero-capo.webp"
              alt="Cofre do motor aberto com os reservatórios de limpador, arrefecimento, freio, óleo e direção indicados"
              width={1440}
              height={780}
              priority
              className="h-auto w-full [mask-image:linear-gradient(to_bottom,black_70%,transparent)] lg:rounded-2xl lg:[mask-image:none]"
            />
          </div>
        </div>

        {/* Formulário */}
        <div className="relative z-10 flex flex-1 items-start justify-center px-4 pb-8 lg:items-center lg:p-8">
          <div className="border-copper/45 from-surface/95 to-surface-lowest/95 shadow-card w-full max-w-[440px] rounded-2xl border bg-gradient-to-b p-6 backdrop-blur sm:p-8">
            {children}
          </div>
        </div>
      </div>
      <ValuesStrip />
    </div>
  );
}
