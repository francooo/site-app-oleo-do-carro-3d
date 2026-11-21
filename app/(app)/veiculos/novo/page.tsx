import { PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ScreenHeader } from "@/components/app-shell/screen-header";
import { PlateLookupForm } from "@/components/vehicle/plate-lookup-form";
import { lookupPlate } from "@/lib/vehicles/plate-actions";

export const metadata: Metadata = { title: "Adicionar carro" };

// Tela 01 — cadastro pela placa. O usuário digita só a placa; o servidor
// consulta o fornecedor (lib/plate-lookup) e mostra "É este carro?". Sem
// placa, ou se a consulta falhar, segue para o cadastro manual.
export default function NovoVeiculoPage() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <ScreenHeader
        lead="Qual é a"
        highlight="placa do seu carro?"
        subtitle="Com a placa, a gente descobre o modelo e a versão para você."
        backHref="/garagem"
        backLabel="Voltar para a garagem"
      />

      <PlateLookupForm action={lookupPlate} />

      <div className="mt-8 flex justify-center">
        <Link
          href="/veiculos/novo/manual"
          className="text-accent-text hover:text-accent inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
        >
          <PencilLine className="h-4 w-4" aria-hidden="true" />
          Não sei a placa / cadastrar manualmente
        </Link>
      </div>
    </div>
  );
}
