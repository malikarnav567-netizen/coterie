/**
 * Dev utility: dump current users and their pipeline standing.
 * Run with: npx tsx scripts/dev-users.ts
 */
import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      displayName: true,
      accessTier: true,
      creativeLevel: true,
      isAdmin: true,
      stats: { select: { usefulCount: true, distinctUsefulRaters: true, reviewsWritten: true } },
    },
    orderBy: { email: "asc" },
  });
  for (const u of users) {
    const s = u.stats ? ` useful=${u.stats.usefulCount} distinct=${u.stats.distinctUsefulRaters} reviews=${u.stats.reviewsWritten}` : "";
    console.log(`${u.email} | ${u.displayName} | tier=${u.accessTier} level=${u.creativeLevel ?? "—"} admin=${u.isAdmin}${s} | ${u.id}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
