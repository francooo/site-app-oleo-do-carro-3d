import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CurationEditor } from "@/components/curation/curation-editor";
import { auth } from "@/lib/auth/auth";
import { curationToolEnabled, listCurationFiles } from "@/lib/curation/files";

export const metadata: Metadata = { title: "Curadoria", robots: { index: false } };

// Ferramenta interna: transforma o manual do proprietário em ficha + mapa de
// um carro. Só existe no `pnpm dev` de quem cura — em produção é 404.
export default async function CuradoriaPage() {
  if (!curationToolEnabled()) notFound();
  const session = await auth();
  if (!session?.user) redirect("/login");

  const files = await listCurationFiles();
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <h1 className="font-heading text-foreground-strong text-3xl font-extrabold tracking-tight">
        Curadoria <span className="text-accent">de carros</span>
      </h1>
      <p className="text-foreground-muted mt-2 max-w-3xl text-sm">
        Do manual do proprietário para a ficha e o mapa do cofre. A figura que você carregar fica só
        no seu navegador — o app publica apenas as posições, redesenhadas. Nada vai para o banco sem
        a sua revisão: o resultado é um arquivo em <code>content/curadoria/</code>.
      </p>
      <CurationEditor existing={files} />
    </main>
  );
}
