import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { consumeTicket } from "@/modules/identity/otp";
import { ensureCollegeUser } from "@/modules/identity/service";

/**
 * Auth.js v5 with one door:
 * - OTP credentials ("by letter"): a 6-digit code emailed to a college address.
 *   There is deliberately no password path — the code is the credential.
 *
 * College verification is enforced in the identity module: passwordless
 * sign-ins auto-enrol college-domain emails and refuse every other domain.
 * The session loader re-reads the User row, so tier/level changes apply to
 * the next request without a re-login.
 */

const secrets = [process.env.AUTH_SECRET, "coterie-dev-secret"].filter(Boolean) as string[];

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  secret: secrets[0],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/enter", error: "/enter" },
  providers: [
    Credentials({
      id: "otp",
      name: "By letter (code)",
      credentials: {
        email: { label: "College email", type: "email" },
        ticket: { label: "Handoff ticket", type: "text" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const ticket = String(creds?.ticket ?? "");
        // The OTP route consumed the 6-digit code and minted the 15-second
        // ticket; here we only exchange it for a session. The code proves
        // inbox control; ensureCollegeUser enrols college addresses and
        // refuses every other domain.
        if (!email || !consumeTicket(email, ticket)) return null;
        const user = await ensureCollegeUser(email);
        return { id: user.id, email: user.email, name: user.displayName } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user = { ...session.user, id: token.sub } as any;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
