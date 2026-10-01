import { prisma } from "@/lib/db";

export type SessionUser = {
  id: string;
  campusId: string;
  displayName: string;
  email: string;
  accessTier: "PUBLIC" | "CREATIVE";
  creativeLevel: "AMATEUR" | "REVIEWER" | "TRUSTED" | "MENTOR_CANDIDATE" | "MENTOR" | null;
  isAdmin: boolean;
  identityVerified: boolean;
  status: string;
};

/**
 * The single permission layer. Every route handler goes through one of these
 * guards; nothing checks session state inline. Guards throw GuardError, which
 * `withGuard` converts into the right HTTP response — including 403 for tier
 * violations that the UI hides but a direct API call would attempt.
 */
export class GuardError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loadSessionUser(): Promise<SessionUser | null> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      campusId: true,
      displayName: true,
      email: true,
      accessTier: true,
      creativeLevel: true,
      isAdmin: true,
      identityVerified: true,
      status: true,
    },
  });
  if (!user) return null;
  return user as SessionUser;
}

function ensureUsable(user: SessionUser) {
  if (user.status !== "ACTIVE") {
    throw new GuardError("This account is suspended.", 403);
  }
  if (!user.identityVerified && process.env.DEV_BYPASS_VERIFICATION !== "true") {
    // Unverified accounts are a read-only holding state.
    throw new GuardError("Verify your college email before taking part.", 403);
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await loadSessionUser();
  if (!user) throw new GuardError("You are not signed in.", 401);
  ensureUsable(user);
  return user;
}

export async function requireTier(tier: "creative"): Promise<SessionUser> {
  const user = await requireUser();
  if (user.accessTier !== "CREATIVE") {
    throw new GuardError("The critique room is for those who have shown their work. Submit a sample first.", 403);
  }
  return user;
}

const LEVEL_RANK: Record<string, number> = {
  AMATEUR: 1,
  REVIEWER: 2,
  TRUSTED: 3,
  MENTOR_CANDIDATE: 3,
  MENTOR: 4,
};

export async function requireLevel(level: "trusted" | "mentor"): Promise<SessionUser> {
  const user = await requireTier("creative");
  const need = level === "mentor" ? 4 : 3;
  const have = user.creativeLevel ? LEVEL_RANK[user.creativeLevel] ?? 0 : 0;
  if (have < need) throw new GuardError("Your standing does not permit this yet.", 403);
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.isAdmin) throw new GuardError("The admin room is closed to you.", 403);
  return user;
}

/**
 * Wrap a simple route handler (no dynamic segments) so GuardError becomes the
 * proper HTTP status. Handlers keep their own precise `req` annotation.
 */
export function withGuard(handler: (req: any, ...args: any[]) => Promise<Response>) {
  return async (req: any, ...args: any[]): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (err) {
      if (err instanceof GuardError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error("[route]", err);
      return Response.json({ error: "Something went astray." }, { status: 500 });
    }
  };
}

/**
 * Helper for dynamic routes: resolves `params`, then guards. The handler
 * receives the resolved params object, e.g. `{ id: "…" }`.
 */
export function withParams(handler: (req: any, params: any) => Promise<Response>) {
  return async (req: any, ctx: { params: Promise<any> }): Promise<Response> => {
    try {
      const params = await ctx.params;
      return await handler(req, params);
    } catch (err) {
      if (err instanceof GuardError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error("[route]", err);
      return Response.json({ error: "Something went astray." }, { status: 500 });
    }
  };
}
