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

  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader title="Configurações" backHref="/garagem" />

      <div className="mt-6 flex flex-col gap-1 rounded-xl border border-border/60 bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
        <p className="font-heading font-semibold text-foreground">
          {user.name ?? "Sem nome cadastrado"}
        </p>
        <p className="text-sm text-foreground-muted">{user.email}</p>
      </div>

      <form action={signOutAction} className="mt-6">
        <SubmitButton variant="secondary">Sair da conta</SubmitButton>
      </form>
    </div>
  );
}
