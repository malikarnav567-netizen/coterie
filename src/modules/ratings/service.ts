import { prisma } from "@/lib/db";
import { getConfig } from "@/modules/config/service";
import { recomputeReviewerStats } from "@/modules/progression/service";
import type { Verdict } from "@/lib/enums";

/**
 * Ratings. Only the post's author may rate; one rating per review (unique
 * constraint); a writer cannot rate their own review because the guard is the
 * author check and self-review is impossible. "Somewhat" is recorded but never
 * counts toward progression. Rating recompute runs synchronously in the same
 * transaction as the new rating.
 */

export async function reasonTags() {
  return prisma.reasonTag.findMany({ orderBy: [{ polarity: "asc" }, { label: "asc" }] });
}

function polarityConsistent(verdict: Verdict, polarity: string): boolean {
  if (verdict === "USEFUL") return polarity === "positive";
  if (verdict === "NO") return polarity === "negative";
  return true; // SOMEWHAT may take either polarity
}

export async function rateReview(rater: {
  id: string;
  accessTier: string;
  creativeLevel: string | null;
  isAdmin?: boolean;
}, reviewId: string, verdict: Verdict, reasonTagCode: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw Object.assign(new Error("Review not found."), { status: 404 });

  if (review.authorId !== rater.id) {
    throw Object.assign(new Error("Only the writer may rate this review."), { status: 403 });
  }

  const existing = await prisma.reviewRating.findUnique({ where: { reviewId } });
  if (existing) {
    throw Object.assign(new Error("Each review receives one rating."), { status: 409 });
  }

  const tag = await prisma.reasonTag.findUnique({ where: { code: reasonTagCode } });
  if (!tag) throw Object.assign(new Error("Unknown reason tag."), { status: 400 });
  if (!polarityConsistent(verdict, tag.polarity)) {
    throw Object.assign(
      new Error(`A "${verdict}" verdict takes a ${verdict === "USEFUL" ? "positive" : "negative"} reason.`),
      { status: 400 },
    );
  }

  const weight = await raterWeight(rater.id, rater.creativeLevel);

  const result = await prisma.$transaction(
    async (tx) => {
    const rating = await tx.reviewRating.create({
      data: {
        reviewId,
        raterId: rater.id,
        reviewOwnerId: review.reviewerId,
        verdict,
        reasonTagCode,
        weight,
      },
    });
    await tx.review.update({ where: { id: reviewId }, data: { ratedAt: new Date() } });
    await tx.notification.create({
      data: {
        userId: review.reviewerId,
        type: "REVIEW_RATED",
        payload: JSON.stringify({ reviewId, verdict }),
      },
    } as never);
    const stats = await recomputeReviewerStats(tx, review.reviewerId);
    return { rating, stats };
    },
    { timeout: 20000, maxWait: 10000 },
  );

  return result;
}

/**
 * Rater weight: active, well-rated members' useful ratings count slightly more
 * (cap rater_weight_max). Deliberately gentle — this nudges, it does not rule.
 */
export async function raterWeight(raterId: string, creativeLevel: string | null): Promise<number> {
  const maxW = await getConfig("rater_weight_max");
  const cap = Math.max(1, Number(maxW) || 1.5);
  if (!creativeLevel || ["AMATEUR"].includes(creativeLevel)) return 1;
  const stats = await prisma.reviewerStats.findUnique({ where: { userId: raterId } });
  const useful = stats?.usefulCount ?? 0;
  if (useful < 3) return 1;
  // Scale 3..10 useful -> 1.0..cap
  const t = Math.min(1, (useful - 3) / 7);
  return 1 + (cap - 1) * t;
}
