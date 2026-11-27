import { auth } from "@/lib/auth/auth";

// Quem pode usar a curadoria (/curadoria): e-mails em CURATOR_EMAILS,
// separados por vírgula. Sem a variável, ninguém tem acesso.
export function isCuratorEmail(email: string | null | undefined) {
  if (!email) return false;
  const allowed = (process.env.CURATOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

/** Sessão do curador ou null (não logado ou fora da lista). */
export async function getCuratorSession() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return session?.user && isCuratorEmail(email) ? { userId: session.user.id, email: email! } : null;
}
