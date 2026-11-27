import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CurationEditor } from "@/components/curation/curation-editor";
import { getCuratorSession } from "@/lib/auth/curator";
import { listCurations } from "@/lib/db/queries/curations";

export const metadata: Metadata = { title: "Curadoria", robots: { index: false } };

// Curadoria online: do manual do proprietário para a ficha e o mapa de um
// carro, publicado na hora. Só para os e-mails de CURATOR_EMAILS — para
// qualquer outra pessoa (inclusive sem login) a página não existe (404).
export default async function CuradoriaPage() {
  const curator = await getCuratorSession();
  if (!curator) notFound();

  const rows = await listCurations();
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:py-10">
      <h1 className="font-heading text-foreground-strong text-3xl font-extrabold tracking-tight">
        Curadoria <span className="text-accent">de carros</span>
      </h1>
      <p className="text-foreground-muted mt-2 max-w-3xl text-sm">
        Do manual do proprietário para a ficha e o mapa do cofre. A figura que você carregar fica só
        no seu navegador — o app publica apenas as posições, redesenhadas. Salve como rascunho
        quantas vezes quiser; o carro só aparece para os usuários quando você publicar.
      </p>
      <CurationEditor existing={rows} curatorEmail={curator.email} />
    </main>
  );
}
