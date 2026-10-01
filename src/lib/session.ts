import { loadSessionUser, type SessionUser } from "@/lib/guard";
import { prisma } from "@/lib/db";

export type { SessionUser };

export async function getSessionUser(): Promise<SessionUser | null> {
  return loadSessionUser();
}

export async function getViewer() {
  const user = await loadSessionUser();
  if (!user) return null;
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return {
    id: user.id,
    displayName: user.displayName,
    accessTier: user.accessTier as "PUBLIC" | "CREATIVE",
    creativeLevel: user.creativeLevel,
    isAdmin: user.isAdmin,
    identityVerified: user.identityVerified,
    unread,
  };
}

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;
