"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export type ActionState = { error?: string } | undefined;

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/garagem" });
}

export async function authenticateWithCredentials(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/garagem",
    });
  } catch (error) {
    // signIn() lança um redirect() internamente no sucesso — isso não é um
    // AuthError e precisa ser relançado para o Next efetivamente redirecionar.
    if (error instanceof AuthError) {
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}

export async function registerUser(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const acceptedTerms = formData.get("acceptedTerms") === "on";

  if (!email || !password || !acceptedTerms) {
    return { error: "E-mail, senha e aceite dos termos são obrigatórios." };
  }
  if (password.length < 8) {
    return { error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    passwordHash,
    acceptedTermsAt: new Date(),
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/garagem" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Conta criada, mas não foi possível entrar automaticamente. Tente fazer login." };
    }
    throw error;
  }
}
