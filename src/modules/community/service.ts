import { prisma } from "@/lib/db";
import { getConfigBool } from "@/modules/config/service";
import type { SessionUser } from "@/lib/guard";

/**
 * The Commons after hours. Separate tables from the critique domain; shares
 * only User and Report. Community content never appears in the Feed and never
 * counts toward progression. Flagging here is hate-only; dark or sensitive
 * creative work is not a violation.
 */

export async function canAccessCommunity(user: {
  accessTier: string;
  isAdmin: boolean;
  identityVerified: boolean;
} | null): Promise<boolean> {
  const allowed = await getConfigBool("public_can_access_community");
  if (!user) return false;
  if (user.accessTier === "CREATIVE" || user.isAdmin) return true;
  // Public members: creatives-only by default, unless the config is flipped.
  return allowed && user.identityVerified;
}

export async function listCommunity(user: {
  id: string;
  accessTier: string;
  isAdmin: boolean;
} | null) {
  const posts = await prisma.communityPost.findMany({
    where: { status: "PUBLISHED" },
    include: {
      author: { select: { displayName: true, creativeLevel: true, isAdmin: true } },
      comments: {
        where: { status: "PUBLISHED" },
        include: { author: { select: { displayName: true, isAdmin: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const anonymous = await getConfigBool("confessions_display_anonymous");
  const isAdmin = Boolean(user?.isAdmin);
  return posts.map((p) => ({
    id: p.id,
    kind: p.kind,
    body: p.body,
    createdAt: p.createdAt.toISOString(),
    authorName:
      p.kind === "CONFESSION" && anonymous && !isAdmin
        ? "A voice in the dark"
        : p.author.displayName,
    isAdmin,
    comments: p.comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      authorName: c.author.displayName,
    })),
  }));
}

export async function createCommunityPost(
  user: SessionUser,
  input: { kind: "BANTER" | "CONFESSION" | "GENERAL"; body: string },
) {
  return prisma.communityPost.create({
    data: { kind: input.kind, authorId: user.id, body: input.body },
  });
}

export async function createCommunityComment(user: SessionUser, postId: string, body: string) {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== "PUBLISHED") {
    throw Object.assign(new Error("That thread is closed."), { status: 404 });
  }
  return prisma.communityComment.create({
    data: { postId, authorId: user.id, body },
  });
}
