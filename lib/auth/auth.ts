import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { db } from "@/lib/db/client";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // O provider de Credentials não passa pelo adapter para criar sessão —
  // por isso a estratégia precisa ser "jwt" mesmo com um adapter de banco
  // configurado (login via Google continua funcionando normalmente).
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // O Google só devolve e-mail verificado, então quem entra com Google prova
    // que é dono do e-mail: pode entrar na conta já criada com esse e-mail
    // (senão o Auth.js recusa com OAuthAccountNotLinked). A senha que ninguém
    // comprovou é apagada no evento linkAccount abaixo.
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "E-mail" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!user?.passwordHash) return null;

        const bcrypt = await import("bcryptjs");
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  events: {
    // O cadastro por senha não confirma o e-mail. Se a conta nunca teve o
    // e-mail comprovado, a senha pode ter sido criada por outra pessoa com o
    // e-mail de quem agora entrou pelo Google — por isso ela é apagada e o
    // e-mail passa a contar como verificado.
    linkAccount: async ({ user, account }) => {
      if (account.provider !== "google" || !user.id) return;
      const [row] = await db
        .select({ emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      if (!row || row.emailVerified) return;
      await db
        .update(users)
        .set({ emailVerified: new Date(), passwordHash: null })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
