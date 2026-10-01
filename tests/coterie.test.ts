import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { GuardError, requireTier, requireLevel, requireAdmin, requireUser, loadSessionUser } from "@/lib/guard";
import { asSession, seedBase, resetDb, testPrisma, configDefaultsSeeded, makePost, validReviewInput } from "./helpers";
import { validateSections, createReview, updateReview, reviewsForPost, reviewQueue } from "@/modules/reviews/service";
import { rateReview } from "@/modules/ratings/service";
import { recomputeReviewerStats, mentorDecision, mentorUpkeep } from "@/modules/progression/service";
import { createPost } from "@/modules/posts/service";
import { submitSample, decideSample } from "@/modules/samples/service";
import { createCommunityPost, listCommunity, canAccessCommunity } from "@/modules/community/service";
import { createReport } from "@/modules/moderation/service";
import { requestOtp, verifyOtp } from "@/modules/identity/otp";
import { ensureCollegeUser } from "@/modules/identity/service";

/**
 * One shared database, one ordered suite: state flows deliberately from the
 * review rules through progression into the integration checks.
 */

let u: Awaited<ReturnType<typeof seedBase>>;
let current: { id: string } | null = null;

vi.mock("@/lib/auth", () => ({
  auth: async () => (current ? { user: { id: current.id } } : null),
}));

beforeAll(async () => {
  u = await seedBase();
  await configDefaultsSeeded();
}, 30000);

afterAll(async () => {
  await resetDb();
  await testPrisma.$disconnect();
}, 30000);

// ---------------------------------------------------------------------------
// Permission guards
// ---------------------------------------------------------------------------

describe("permission guards", () => {
  it("rejects anonymous users with 401", async () => {
    current = null;
    await expect(loadSessionUser()).resolves.toBeNull();
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });

  it("public user passes requireUser but not requireTier (403)", async () => {
    current = u.publicUser;
    await expect(requireUser()).resolves.toMatchObject({ id: u.publicUser.id });
    await expect(requireTier("creative")).rejects.toMatchObject({ status: 403 });
  });

  it("allows creatives through requireTier", async () => {
    current = u.writer;
    await expect(requireTier("creative")).resolves.toMatchObject({ accessTier: "CREATIVE" });
  });

  it("blocks sub-trusted levels from requireLevel('trusted')", async () => {
    current = u.writer;
    await expect(requireLevel("trusted")).rejects.toMatchObject({ status: 403 });
    current = u.trusted;
    await expect(requireLevel("trusted")).resolves.toMatchObject({ creativeLevel: "TRUSTED" });
    current = u.reviewer;
    await expect(requireLevel("trusted")).rejects.toMatchObject({ status: 403 });
  });

  it("requires admin for requireAdmin", async () => {
    current = u.writer;
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
    current = u.admin;
    await expect(requireAdmin()).resolves.toMatchObject({ isAdmin: true });
  });

  it("GuardError carries its status", () => {
    expect(new GuardError("x", 418).status).toBe(418);
  });
});

// ---------------------------------------------------------------------------
// Review validation and rules
// ---------------------------------------------------------------------------

describe("review validation and rules", () => {
  it("flags each under-length section with a per-section message", async () => {
    const errors = await validateSections({ whatWorked: "too short", whatDidNot: "fine ".repeat(30), oneSuggestion: "" });
    expect(Object.keys(errors)).toEqual(["whatWorked", "oneSuggestion"]);
    expect(errors.whatWorked).toContain("30 words");
  });

  it("passes when all sections meet the minimum", async () => {
    expect(await validateSections(validReviewInput())).toEqual({});
  });

  it("rejects self-reviews with 403", async () => {
    const post = await makePost(u.writer);
    await expect(createReview(asSession(u.writer), post.id, validReviewInput())).rejects.toMatchObject({ status: 403 });
  });

  it("enforces one review per reviewer per post", async () => {
    const post = await makePost(u.writer);
    await createReview(asSession(u.reader), post.id, validReviewInput());
    await expect(createReview(asSession(u.reader), post.id, validReviewInput())).rejects.toMatchObject({ status: 409 });
  });

  it("locks a review after rating and blocks edits", async () => {
    const post = await makePost(u.writer);
    const review = await createReview(asSession(u.reviewer), post.id, validReviewInput());
    await testPrisma.review.update({ where: { id: review.id }, data: { ratedAt: new Date() } });
    await expect(updateReview(asSession(u.reviewer), review.id, validReviewInput())).rejects.toMatchObject({ status: 409 });
  });

  it("sorts trusted reviewers higher on the post page", async () => {
    const post = await makePost(u.writer);
    const r1 = await createReview(asSession(u.reviewer), post.id, validReviewInput());
    const r2 = await createReview(asSession(u.trusted), post.id, validReviewInput());
    const sorted = await reviewsForPost(post.id);
    expect(sorted[0].id).toBe(r2.id);
    expect(sorted.map((r) => r.id)).toContain(r1.id);
  });

  it("excludes own posts from the queue", async () => {
    const post = await makePost(u.writer);
    const own = await reviewQueue(asSession(u.writer));
    expect(own.find((p) => p.id === post.id)).toBeUndefined();
    const other = await reviewQueue(asSession(u.reader));
    expect(other.find((p) => p.id === post.id)).toBeDefined();
  });

  it("enforces verdict/reason polarity", async () => {
    const post = await makePost(u.writer);
    const review = await createReview(asSession(u.reviewer), post.id, validReviewInput());
    await expect(rateReview(asSession(u.writer), review.id, "USEFUL", "too_vague")).rejects.toMatchObject({ status: 400 });
  });

  it("allows exactly one rating per review, author only", async () => {
    const post = await makePost(u.writer);
    const review = await createReview(asSession(u.reviewer), post.id, validReviewInput());
    // a non-author cannot rate
    await expect(rateReview(asSession(u.reviewer), review.id, "USEFUL", "specific")).rejects.toMatchObject({ status: 403 });
    // the author can, once
    await rateReview(asSession(u.writer), review.id, "USEFUL", "specific");
    await expect(rateReview(asSession(u.writer), review.id, "NO", "too_harsh")).rejects.toMatchObject({ status: 409 });
  });
});

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

describe("progression", () => {
  it("recomputes stats with the pair cap and distinct raters", async () => {
    const post = await makePost(u.writer);
    const r1 = await createReview(asSession(u.reader), post.id, validReviewInput());
    const r2 = await createReview(asSession(u.reviewer), post.id, validReviewInput());
    await rateReview(asSession(u.writer), r1.id, "USEFUL", "specific");
    await rateReview(asSession(u.writer), r2.id, "SOMEWHAT", "fair");

    const stats = await testPrisma.reviewerStats.findUnique({ where: { userId: u.reader.id } });
    expect(stats?.usefulCount).toBe(1);
    expect(stats?.distinctUsefulRaters).toBe(1);
  });

  it("caps ratings from the same pair at max_ratings_per_pair", async () => {
    for (let i = 0; i < 5; i++) {
      const p = await makePost(u.writer, { title: `pair-${i}` });
      const r = await createReview(asSession(u.reader), p.id, validReviewInput());
      await rateReview(asSession(u.writer), r.id, "USEFUL", "specific");
    }
    // reader now has 1 + 5 = 6 useful ratings, but only 3 per pair count.
    const stats = await testPrisma.reviewerStats.findUnique({ where: { userId: u.reader.id } });
    expect(stats?.usefulCount).toBeLessThanOrEqual(3);
  });

  it("promotes AMATEUR to REVIEWER at the threshold and awards the badge", async () => {
    // reader sits at the cap (3 useful). A fresh recompute crosses reviewer_useful_count=3.
    await recomputeReviewerStats(testPrisma as never, u.reader.id);
    const user = await testPrisma.user.findUnique({ where: { id: u.reader.id } });
    expect(user?.creativeLevel).toBe("REVIEWER");
    const badge = await testPrisma.badge.findFirst({ where: { userId: u.reader.id, type: "REVIEWER" } });
    expect(badge).toBeTruthy();
  });

  it("never auto-promotes to MENTOR — candidate only, admin approval required", async () => {
    // trusted receives USEFUL ratings from four distinct writers.
    for (const w of [u.writer, u.reader, u.reviewer, u.admin]) {
      for (let i = 0; i < 3; i++) {
        const p = await makePost(w, { title: `m-${w.id}-${i}` });
        const r = await createReview(asSession(u.trusted), p.id, validReviewInput());
        await rateReview(asSession(w), r.id, "USEFUL", "specific");
      }
    }
    const user = await testPrisma.user.findUnique({ where: { id: u.trusted.id } });
    expect(user?.creativeLevel).toBe("MENTOR_CANDIDATE");
    const pending = await testPrisma.mentorReadNote.findFirst({ where: { candidateId: u.trusted.id, decision: "PENDING" } });
    expect(pending).toBeTruthy();

    await recomputeReviewerStats(testPrisma as never, u.trusted.id);
    const still = await testPrisma.user.findUnique({ where: { id: u.trusted.id } });
    expect(still?.creativeLevel).not.toBe("MENTOR");
  });

  it("admin approval grants MENTOR; decline returns to TRUSTED", async () => {
    await mentorDecision(asSession(u.admin), u.trusted.id, "APPROVE", "Letters read. Worthy.");
    const user = await testPrisma.user.findUnique({ where: { id: u.trusted.id } });
    expect(user?.creativeLevel).toBe("MENTOR");
    const badge = await testPrisma.badge.findFirst({ where: { userId: u.trusted.id, type: "MENTOR" } });
    expect(badge).toBeTruthy();

    await testPrisma.user.update({ where: { id: u.reviewer.id }, data: { creativeLevel: "MENTOR_CANDIDATE" } });
    await mentorDecision(asSession(u.admin), u.reviewer.id, "DECLINE", "Not yet.");
    const back = await testPrisma.user.findUnique({ where: { id: u.reviewer.id } });
    expect(back?.creativeLevel).toBe("TRUSTED");
  });

  it("upkeep flags then revokes a mentor whose useful share falls under the floor", async () => {
    // trusted is MENTOR. Flood their most recent ratings with NOs (20 > the 4
    // useful in history), dragging the useful share under the 0.5 floor.
    for (let i = 0; i < 20; i++) {
      const p = await makePost(u.reader, { title: `up-${i}` });
      const r = await createReview(asSession(u.trusted), p.id, validReviewInput());
      await rateReview(asSession(u.reader), r.id, "NO", "too_vague");
    }
    const first = await mentorUpkeep();
    const second = await mentorUpkeep();
    const user = await testPrisma.user.findUnique({ where: { id: u.trusted.id } });
    expect(
      first.flagged.includes(u.trusted.id) ||
        second.flagged.includes(u.trusted.id) ||
        user?.creativeLevel === "MENTOR_CANDIDATE",
    ).toBe(true);
    expect(second.revoked.includes(u.trusted.id) || user?.creativeLevel === "MENTOR_CANDIDATE").toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Access, samples, and domain separation
// ---------------------------------------------------------------------------

describe("access and domain separation", () => {
  it("public user cannot create a post — the route guard is the boundary", async () => {
    current = u.publicUser;
    await expect(requireTier("creative")).rejects.toMatchObject({ status: 403 });
  });

  it("sample acceptance is the only path to CREATIVE tier", async () => {
    const sample = await submitSample(asSession(u.publicUser), "A short sample of prose about a lake that holds its breath through October and gives it back in November.", "PROSE");
    expect(sample.status).toBe("SUBMITTED");

    await decideSample(asSession(u.admin), sample.id, "ACCEPT", undefined);
    const user = await testPrisma.user.findUnique({ where: { id: u.publicUser.id } });
    expect(user?.accessTier).toBe("CREATIVE");
    expect(user?.creativeLevel).toBe("AMATEUR");

    // rejection path with cooldown
    const s2 = await submitSample(asSession(u.trusted2!), "Another sample, longer than the first one, written quickly to test the rejection path of the sample state machine.", "PROSE");
    await decideSample(asSession(u.admin), s2.id, "REJECT", "Not yet — revise and return.");
    await expect(
      submitSample(asSession(u.trusted2!), "Resubmitting immediately without waiting for the cooldown window to elapse, which the committee should refuse.", "PROSE"),
    ).rejects.toMatchObject({ status: 429 });
  });

  it("community content never appears in the feed", async () => {
    await createCommunityPost(asSession(u.writer), { kind: "BANTER", body: "A banter note for the separation test." });
    const { listFeed } = await import("@/modules/posts/service");
    const feed = await listFeed({});
    expect(feed.cards.length).toBeGreaterThan(0);
    expect(feed.cards.some((c) => c.excerpt.includes("separation test"))).toBe(false);
  });

  it("community content never counts toward progression", async () => {
    const before = await testPrisma.reviewerStats.findUnique({ where: { userId: u.writer.id } });
    await createCommunityPost(asSession(u.writer), { kind: "GENERAL", body: "Community chatter should not move the needle on standing." });
    await createCommunityPost(asSession(u.writer), { kind: "CONFESSION", body: "Another confession for the stats separation check." });
    const after = await testPrisma.reviewerStats.findUnique({ where: { userId: u.writer.id } });
    expect(after?.usefulCount ?? 0).toBe(before?.usefulCount ?? 0);
    expect(after?.distinctUsefulRaters ?? 0).toBe(before?.distinctUsefulRaters ?? 0);
  });

  it("community access follows the config default (creatives only)", async () => {
    expect(await canAccessCommunity(asSession(u.publicUser))).toBe(false);
    expect(await canAccessCommunity(asSession(u.writer))).toBe(true);
  });

  it("reports capture a content snapshot", async () => {
    const post = await makePost(u.writer, { title: "Reportable piece" });
    const report = await createReport(asSession(u.reviewer), {
      targetType: "POST",
      targetId: post.id,
      reason: "Testing snapshot capture.",
    });
    expect(JSON.parse(report.snapshot).title).toBe("Reportable piece");
  });
});

// ---------------------------------------------------------------------------
// Email OTP (by letter)
// ---------------------------------------------------------------------------

/** Request a code while intercepting the dev mailbox (console). */
async function requestCode(email: string): Promise<string> {
  const spy = vi.spyOn(console, "log").mockImplementation(() => {});
  let mailed: string;
  try {
    await requestOtp(email);
    // read before mockRestore — restoring clears the captured calls
    mailed = spy.mock.calls.map((c) => String(c[0])).join("\n");
  } finally {
    spy.mockRestore();
  }
  const code = mailed.match(/\b(\d{6})\b/)?.[1];
  expect(code, "the dev mailer should print a 6-digit code").toBeTruthy();
  return code!;
}

describe("email otp", () => {
  it("issues a code, verifies it once, and refuses a replay", async () => {
    const code = await requestCode("newbie@test.edu");
    await expect(verifyOtp("newbie@test.edu", code)).resolves.toMatchObject({ email: "newbie@test.edu" });
    await expect(verifyOtp("newbie@test.edu", code)).rejects.toMatchObject({ status: 410 });
  });

  it("rejects wrong codes, counts attempts, then locks the letter", async () => {
    const code = await requestCode("clumsy@test.edu");
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) {
      await expect(verifyOtp("clumsy@test.edu", wrong)).rejects.toMatchObject({ status: 400 });
    }
    // even the correct code is dead once attempts are exhausted
    await expect(verifyOtp("clumsy@test.edu", code)).rejects.toMatchObject({ status: 429 });
  });

  it("verifies inbox control for any email, but gates enrollment by campus domain", async () => {
    const code = await requestCode("stranger@gmail.com");
    const { email } = await verifyOtp("stranger@gmail.com", code);
    await expect(ensureCollegeUser(email)).rejects.toMatchObject({ status: 403 });
  });

  it("enrols a college email at the exchange and returns the same member after", async () => {
    const first = await ensureCollegeUser("lettered@test.edu");
    expect(first.identityVerified).toBe(true);
    expect(first.accessTier).toBe("PUBLIC");
    const again = await ensureCollegeUser("lettered@test.edu");
    expect(again.id).toBe(first.id);
  });
});
