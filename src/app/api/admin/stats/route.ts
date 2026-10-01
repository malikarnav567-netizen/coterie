import { requireAdmin, withGuard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";

export const GET = withGuard(async () => {
  await requireAdmin();
  const [posts, reviews, ratings, users, samplesPending, reportsOpen] = await Promise.all([
    prisma.post.count({ where: { status: "PUBLISHED" } }),
    prisma.review.count(),
    prisma.reviewRating.count(),
    prisma.user.count(),
    prisma.sampleSubmission.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  // Median hours to first review.
  const reviewed = await prisma.post.findMany({
    where: { firstReviewedAt: { not: null } },
    select: { createdAt: true, firstReviewedAt: true },
  });
  const hours = reviewed
    .map((p) => (p.firstReviewedAt!.getTime() - p.createdAt.getTime()) / 3_600_000)
    .sort((a, b) => a - b);
  const medianHours = hours.length ? hours[Math.floor(hours.length / 2)] : null;

  // Rating-use rate: share of reviews that have been rated.
  const ratedReviews = await prisma.review.count({ where: { ratedAt: { not: null } } });
  const ratingUseRate = reviews ? ratedReviews / reviews : null;

  // Week-2/3 return rate: members active in week 2 or 3 after sign-up.
  const weekAgo = (n: number) => new Date(Date.now() - n * 7 * 86_400_000);
  const returning = await prisma.user.count({
    where: {
      createdAt: { lt: weekAgo(2) },
      OR: [
        { posts: { some: { createdAt: { gte: weekAgo(2) } } } },
        { reviewsWritten: { some: { createdAt: { gte: weekAgo(2) } } } },
        { ratingsGiven: { some: { createdAt: { gte: weekAgo(2) } } } },
        { communityPosts: { some: { createdAt: { gte: weekAgo(2) } } } },
      ],
    },
  });
  const olderUsers = await prisma.user.count({ where: { createdAt: { lt: weekAgo(2) } } });
  const week2ReturnRate = olderUsers ? returning / olderUsers : null;

  return ok({
    stats: {
      posts,
      reviews,
      ratings,
      users,
      samplesPending,
      reportsOpen,
      medianHoursToFirstReview: medianHours === null ? null : Math.round(medianHours * 10) / 10,
      ratingUseRate: ratingUseRate === null ? null : Math.round(ratingUseRate * 100),
      week2ReturnRate: week2ReturnRate === null ? null : Math.round(week2ReturnRate * 100),
    },
  });
});
