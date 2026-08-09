import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/auth";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const user = session.user;
  const initial = (user.name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Configurações" backHref="/garagem" />

      <div className="relative flex flex-col items-center overflow-hidden rounded-xl border border-border/60 bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-accent/10 blur-3xl"
        />
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-accent/15 font-heading text-2xl font-semibold text-accent-text">
          {initial}
        </div>
        <p className="relative z-10 mt-4 font-heading text-lg font-semibold text-foreground">
          {user.name ?? "Sem nome cadastrado"}
        </p>
        <p className="relative z-10 text-sm text-foreground-muted">{user.email}</p>
      </div>

      <form action={signOutAction} className="mt-6">
        <SubmitButton variant="secondary">Sair da conta</SubmitButton>
      </form>
    </div>
  );
}
