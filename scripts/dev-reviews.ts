/**
 * Dev utility: list published reviews, the post each sits on, and that post's
 * author (who is the only one allowed to rate the review).
 * Run with: npx tsx scripts/dev-reviews.ts
 */
import { prisma } from "../src/lib/db";

async function main() {
  const reviews = await prisma.review.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      reviewer: { select: { displayName: true, creativeLevel: true } },
      post: { select: { title: true, author: { select: { displayName: true, email: true } } } },
      rating: { select: { verdict: true, rater: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  for (const r of reviews) {
    const rated = r.rating ? ` rated=${r.rating.verdict} by ${r.rating.rater.displayName}` : " (unrated)";
    console.log(
      `review ${r.id} | by ${r.reviewer.displayName} (${r.reviewer.creativeLevel}) on "${r.post.title}" (post author: ${r.post.author.displayName} <${r.post.author.email}>)${rated}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
