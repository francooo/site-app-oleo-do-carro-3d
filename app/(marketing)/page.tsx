import Link from "next/link";

import { buttonClasses } from "@/components/ui/button-styles";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center sm:px-6">
      <h1 className="max-w-md text-3xl font-semibold tracking-tight">
        O que o seu carro usa — e quando trocar.
      </h1>
      <p className="max-w-md text-zinc-500">
        Óleo, fluidos, filtros e intervalos de manutenção específicos para a versão do seu
        veículo. Sem achismo, sem manual perdido no porta-luvas.
      </p>
      <Link href="/login" className={buttonClasses("primary")}>
        Entrar
      </Link>
    </div>
  );
}
