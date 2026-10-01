import { requireUser, withParams } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export const GET = withParams(async (_req, { id }: { id: string }) => {
  await requireUser();
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      accessTier: true,
      creativeLevel: true,
      createdAt: true,
      campus: { select: { name: true } },
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, form: true, genre: true, reviewCount: true, createdAt: true },
      },
      badges: { where: { revokedAt: null }, select: { type: true, awardedAt: true } },
    },
  });
  if (!user) return fail("No such member.", 404);
  return ok({ user });
});
