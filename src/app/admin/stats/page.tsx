import { prisma } from "@/lib/db";

export const metadata = { title: "Stats — Coterie" };

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default async function AdminStatsPage() {
  const [posts, reviews, ratings, users, ratedReviews] = await Promise.all([
    prisma.post.count(),
    prisma.review.count(),
    prisma.reviewRating.count(),
    prisma.user.count(),
    prisma.review.count({ where: { ratedAt: { not: null } } }),
  ]);

  const reviewedPosts = await prisma.post.findMany({
    where: { firstReviewedAt: { not: null } },
    select: { createdAt: true, firstReviewedAt: true },
  });
  const hours = reviewedPosts.map((p) => (p.firstReviewedAt!.getTime() - p.createdAt.getTime()) / 3_600_000);

  const weekAgo = (n: number) => new Date(Date.now() - n * 7 * 86_400_000);
  const olderUsers = await prisma.user.count({ where: { createdAt: { lt: weekAgo(2) } } });
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

  const stats = [
    { label: "Members", value: String(users) },
    { label: "Published pieces", value: String(posts) },
    { label: "Posting rate", value: users ? `${(posts / users).toFixed(1)} per member` : "—" },
    { label: "Reviews written", value: String(reviews) },
    { label: "Median hours to first review", value: median(hours) === null ? "—" : `${Math.round(median(hours)! * 10) / 10}h` },
    { label: "Rating-use rate", value: reviews ? `${Math.round((ratedReviews / reviews) * 100)}%` : "—" },
    { label: "Week-2/3 return rate", value: olderUsers ? `${Math.round((returning / olderUsers) * 100)}%` : "—" },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory">The ledgers</h1>
        <p className="accent-italic mt-1">What the pilot is actually doing.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <div key={s.label} className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
            <p className="display-caps text-2xl text-gold-light">{s.value}</p>
            <p className="label-caps mt-1 text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
