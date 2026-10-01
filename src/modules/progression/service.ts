import { prisma } from "@/lib/db";
import type { Prisma, ReviewerStats } from "@prisma/client";
import { getConfigNumber } from "@/modules/config/service";
import { notify } from "@/modules/notifications/service";

/**
 * Progression. Quality, never volume, never own-work popularity. Recompute runs
 * synchronously in the same transaction as each new rating, then the ladder is
 * checked in order. Every level change writes a ProgressionEvent.
 */

type Tx = Prisma.TransactionClient;

async function recomputeCore(tx: Tx, userId: string, maxPerPair: number): Promise<ReviewerStats> {
  const ratings = await tx.reviewRating.findMany({
    where: { reviewOwnerId: userId },
  });

  // Pair cap: at most maxPerPair ratings from the same rater count toward stats.
  const perRater = new Map<string, number>();
  let usefulWeighted = 0;
  const distinctUsefulRaters = new Set<string>();

  for (const r of ratings) {
    const used = perRater.get(r.raterId) ?? 0;
    if (used >= maxPerPair) continue;
    perRater.set(r.raterId, used + 1);
    if (r.verdict === "USEFUL") {
      usefulWeighted += r.weight ?? 1;
      distinctUsefulRaters.add(r.raterId);
    }
    // SOMEWHAT is tracked but does not count.
  }

  const usefulCount = Math.round(usefulWeighted * 100) / 100;
  const reviewsWritten = await tx.review.count({
    where: { reviewerId: userId, status: "PUBLISHED" },
  });

  const data = {
    reviewsWritten,
    usefulCount,
    distinctUsefulRaters: distinctUsefulRaters.size,
    lastRecomputedAt: new Date(),
  };

  const existing = await tx.reviewerStats.findUnique({ where: { userId } });
  if (existing) {
    return tx.reviewerStats.update({ where: { userId }, data });
  }
  return tx.reviewerStats.create({ data: { userId, ...data } });
}

/**
 * Called from the ratings module inside the same transaction as the new rating.
 * Returns the fresh stats and performs any automatic promotions.
 */
export async function recomputeReviewerStats(tx: Tx, userId: string): Promise<ReviewerStats> {
  const maxPerPair = await getConfigNumber("max_ratings_per_pair");
  const stats = await recomputeCore(tx, userId, maxPerPair);
  await checkLadder(tx, userId, stats);
  return stats;
}

async function checkLadder(tx: Tx, userId: string, stats: ReviewerStats) {
  const reviewerUseful = await getConfigNumber("reviewer_useful_count");
  const trustedUseful = await getConfigNumber("trusted_useful_count");
  const trustedDistinct = await getConfigNumber("trusted_distinct_writers");
  const mentorUseful = await getConfigNumber("mentor_useful_min");
  const mentorDistinct = await getConfigNumber("mentor_distinct_writers");

  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user || user.accessTier !== "CREATIVE") return;

  const promote = async (toLevel: string, reason: string) => {
    await tx.user.update({ where: { id: userId }, data: { creativeLevel: toLevel } });
    await tx.progressionEvent.create({
      data: { userId, fromLevel: user.creativeLevel, toLevel, reason, decidedBy: "system" },
    });
    if (toLevel === "REVIEWER") {
      await tx.badge.create({ data: { userId, type: "REVIEWER" } });
    } else if (toLevel === "TRUSTED") {
      await tx.badge.create({ data: { userId, type: "TRUSTED" } });
    }
    await notify({ userId, type: "PROMOTION", payload: { toLevel } }, tx);
  };

  let level = user.creativeLevel;

  if (level === "AMATEUR" && stats.usefulCount >= reviewerUseful) {
    await promote("REVIEWER", `usefulCount ${stats.usefulCount} >= ${reviewerUseful}`);
    level = "REVIEWER";
  }
  if (level === "REVIEWER" && stats.usefulCount >= trustedUseful && stats.distinctUsefulRaters >= trustedDistinct) {
    await promote(
      "TRUSTED",
      `usefulCount ${stats.usefulCount} >= ${trustedUseful}, distinct raters ${stats.distinctUsefulRaters} >= ${trustedDistinct}`,
    );
    level = "TRUSTED";
  }
  if (level === "TRUSTED" && stats.usefulCount >= mentorUseful && stats.distinctUsefulRaters >= mentorDistinct) {
    // Mentor threshold reached — this creates an admin task only. Never auto-mentor.
    const spotCheck = stats.usefulCount < mentorUseful * 1.2;
    await tx.reviewerStats.update({ where: { userId }, data: { spotCheck } });
    const pending = await tx.mentorReadNote.findFirst({
      where: { candidateId: userId, decision: "PENDING" },
    });
    if (!pending) {
      await tx.mentorReadNote.create({
        data: { candidateId: userId, adminId: await firstAdminId(tx), decision: "PENDING", notes: "" },
      });
    }
    await promote("MENTOR_CANDIDATE", "Mentor threshold reached — awaiting the admins' reading");
  }
}

async function firstAdminId(tx: Tx): Promise<string> {
  const admin = await tx.user.findFirst({ where: { isAdmin: true }, select: { id: true } });
  return admin?.id ?? "system";
}

/**
 * Admin approval is the only path to MENTOR. The admin reads a sample of the
 * candidate's reviews, records the note, and approves or declines.
 */
export async function mentorDecision(
  admin: { id: string; isAdmin: boolean },
  candidateId: string,
  decision: "APPROVE" | "DECLINE",
  notes: string,
) {
  const candidate = await prisma.user.findUnique({ where: { id: candidateId } });
  if (!candidate) throw Object.assign(new Error("Candidate not found."), { status: 404 });
  if (candidate.creativeLevel !== "MENTOR_CANDIDATE") {
    throw Object.assign(new Error("That member is not a mentor candidate."), { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.mentorReadNote.create({
      data: {
        candidateId,
        adminId: admin.id,
        decision: decision === "APPROVE" ? "APPROVED" : "DECLINED",
        notes,
      },
    });

    if (decision === "APPROVE") {
      await tx.user.update({ where: { id: candidateId }, data: { creativeLevel: "MENTOR" } });
      await tx.progressionEvent.create({
        data: {
          userId: candidateId,
          fromLevel: "MENTOR_CANDIDATE",
          toLevel: "MENTOR",
          reason: `Approved by the admins: ${notes.slice(0, 200)}`,
          decidedBy: admin.id,
        },
      });
      await tx.badge.create({ data: { userId: candidateId, type: "MENTOR" } });
      await notify({ userId: candidateId, type: "PROMOTION", payload: { toLevel: "MENTOR" } }, tx);
    } else {
      // Decline returns the member to TRUSTED — standing is kept, humility intact.
      await tx.user.update({ where: { id: candidateId }, data: { creativeLevel: "TRUSTED" } });
      await tx.progressionEvent.create({
        data: {
          userId: candidateId,
          fromLevel: "MENTOR_CANDIDATE",
          toLevel: "TRUSTED",
          reason: `Mentor reading declined: ${notes.slice(0, 200)}`,
          decidedBy: admin.id,
        },
      });
    }
  });
}

/**
 * Upkeep: rolling window over each mentor's most recent ratings. If the useful
 * share falls under the floor, flag once; if flagged again, revoke the badge
 * back to MENTOR_CANDIDATE pending admin review. Cron route calls this.
 */
export async function mentorUpkeep() {
  const windowSize = await getConfigNumber("mentor_upkeep_window");
  const floor = await getConfigNumber("mentor_upkeep_floor");
  const mentors = await prisma.user.findMany({ where: { creativeLevel: "MENTOR" } });

  const flagged: string[] = [];
  const revoked: string[] = [];

  for (const mentor of mentors) {
    const ratings = await prisma.reviewRating.findMany({
      where: { reviewOwnerId: mentor.id },
      orderBy: { createdAt: "desc" },
      take: windowSize,
    });
    if (ratings.length < Math.ceil(windowSize / 4)) continue; // not enough signal yet

    const useful = ratings.filter((r) => r.verdict === "USEFUL").length;
    const share = useful / ratings.length;
    if (share >= floor) continue;

    const flag = await prisma.progressionEvent.findFirst({
      where: {
        userId: mentor.id,
        reason: { startsWith: "Upkeep flag" },
        createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
      },
    });

    if (flag) {
      const badge = await prisma.badge.findFirst({
        where: { userId: mentor.id, type: "MENTOR", revokedAt: null },
      });
      if (!badge) continue;
      await prisma.badge.update({ where: { id: badge.id }, data: { revokedAt: new Date() } });
      await prisma.user.update({ where: { id: mentor.id }, data: { creativeLevel: "MENTOR_CANDIDATE" } });
      await prisma.progressionEvent.create({
        data: {
          userId: mentor.id,
          fromLevel: "MENTOR",
          toLevel: "MENTOR_CANDIDATE",
          reason: "Upkeep revoke: useful share under floor twice",
          decidedBy: "system",
        },
      });
      await notify({ userId: mentor.id, type: "PROMOTION", payload: { upkeepRevoked: true } });
      revoked.push(mentor.id);
    } else {
      await prisma.progressionEvent.create({
        data: {
          userId: mentor.id,
          fromLevel: "MENTOR",
          toLevel: "MENTOR",
          reason: "Upkeep flag: useful share under floor",
          decidedBy: "system",
        },
      });
      const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
      for (const a of admins) {
        await notify({ userId: a.id, type: "MODERATION", payload: { kind: "mentor_upkeep", mentorId: mentor.id } });
      }
      await notify({ userId: mentor.id, type: "PROMOTION", payload: { upkeepFlag: true } });
      flagged.push(mentor.id);
    }
  }

  return { checked: mentors.length, flagged, revoked };
}

export async function statsFor(userId: string) {
  return prisma.reviewerStats.findUnique({ where: { userId } });
}

export async function progressionHistory(userId: string) {
  return prisma.progressionEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function mentorCandidates() {
  return prisma.mentorReadNote.findMany({
    where: { decision: "PENDING" },
    include: { candidate: { select: { displayName: true, email: true, id: true } } },
    orderBy: { createdAt: "asc" },
  });
}

/** A sample of the candidate's reviews for the admins to read. */
export async function candidateReviewSample(candidateId: string, take = 5) {
  return prisma.review.findMany({
    where: { reviewerId: candidateId, status: "PUBLISHED" },
    include: {
      post: { select: { title: true, form: true } },
      rating: true,
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/** Exposed to admins at the mentor threshold. */
export async function spotCheckCandidates() {
  return prisma.reviewerStats.findMany({
    where: { spotCheck: true },
    include: { user: { select: { displayName: true, creativeLevel: true } } },
  });
}
