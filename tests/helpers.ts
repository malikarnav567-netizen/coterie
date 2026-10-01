import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/** A dedicated PrismaClient for tests (env DATABASE_URL points at the coterie_test schema). */
export const testPrisma = new PrismaClient();

export async function resetDb() {
  await testPrisma.emailOtp.deleteMany();
  await testPrisma.moderationAction.deleteMany();
  await testPrisma.report.deleteMany();
  await testPrisma.notification.deleteMany();
  await testPrisma.communityComment.deleteMany();
  await testPrisma.communityPost.deleteMany();
  await testPrisma.eventEntry.deleteMany();
  await testPrisma.event.deleteMany();
  await testPrisma.mentorReadNote.deleteMany();
  await testPrisma.badge.deleteMany();
  await testPrisma.progressionEvent.deleteMany();
  await testPrisma.reviewerStats.deleteMany();
  await testPrisma.reviewRating.deleteMany();
  await testPrisma.review.deleteMany();
  await testPrisma.postComment.deleteMany();
  await testPrisma.postLike.deleteMany();
  await testPrisma.post.deleteMany();
  await testPrisma.sampleSubmission.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.campus.deleteMany();
  await testPrisma.config.deleteMany();
  await testPrisma.reasonTag.deleteMany();
}

export type TestUser = {
  id: string;
  accessTier: "PUBLIC" | "CREATIVE";
  creativeLevel: string | null;
  isAdmin: boolean;
  identityVerified: boolean;
  campusId: string;
};

export async function seedBase() {
  await resetDb();
  const campus = await testPrisma.campus.create({
    data: { name: "Test College", emailDomains: JSON.stringify(["test.edu"]), active: true },
  });
  for (const t of [
    { code: "specific", label: "Specific", polarity: "positive" },
    { code: "actionable", label: "Actionable", polarity: "positive" },
    { code: "fair", label: "Fair", polarity: "positive" },
    { code: "clarified_intent", label: "Clarified my intent", polarity: "positive" },
    { code: "too_vague", label: "Too vague", polarity: "negative" },
    { code: "too_harsh", label: "Too harsh", polarity: "negative" },
    { code: "missed_the_point", label: "Missed the point", polarity: "negative" },
  ]) {
    await testPrisma.reasonTag.create({ data: t });
  }
  const mk = (displayName: string, email: string, o: Partial<TestUser> = {}) =>
    testPrisma.user.create({
      data: {
        displayName,
        email,
        campusId: campus.id,
        passwordHash: bcrypt.hashSync("pw123456", 4),
        identityVerified: true,
        accessTier: (o.accessTier ?? "PUBLIC") as "PUBLIC" | "CREATIVE",
        creativeLevel: o.creativeLevel ?? null,
        isAdmin: o.isAdmin ?? false,
      },
    });

  return {
    campus,
    admin: (await mk("Owner", "owner@test.edu", { isAdmin: true, accessTier: "CREATIVE", creativeLevel: "MENTOR" })) as TestUser,
    publicUser: (await mk("Quinn", "quinn@test.edu")) as TestUser,
    writer: (await mk("Mara", "mara@test.edu", { accessTier: "CREATIVE", creativeLevel: "AMATEUR" })) as TestUser,
    reader: (await mk("Odell", "odell@test.edu", { accessTier: "CREATIVE", creativeLevel: "AMATEUR" })) as TestUser,
    reviewer: (await mk("Iris", "iris@test.edu", { accessTier: "CREATIVE", creativeLevel: "REVIEWER" })) as TestUser,
    trusted: (await mk("Corwin", "corwin@test.edu", { accessTier: "CREATIVE", creativeLevel: "TRUSTED" })) as TestUser,
    trusted2: (await mk("Vera", "vera@test.edu")) as TestUser,
  };
}

/** SessionUser shape the services expect. */
export function asSession(u: TestUser) {
  return {
    id: u.id,
    campusId: u.campusId,
    displayName: "x",
    email: "x@test.edu",
    accessTier: u.accessTier,
    creativeLevel: u.creativeLevel as never,
    isAdmin: u.isAdmin,
    identityVerified: u.identityVerified,
    status: "ACTIVE",
  };
}

const W30 = Array(30).fill("word").join(" ");

export function validReviewInput() {
  return {
    whatWorked: W30,
    whatDidNot: W30,
    oneSuggestion: W30,
    readerResponse: null,
  };
}

export async function makePost(author: TestUser, overrides: Record<string, unknown> = {}) {
  return testPrisma.post.create({
    data: {
      authorId: author.id,
      title: "A test piece",
      form: "POETRY",
      genre: "Lyric",
      body: "Test body text.",
      ...(overrides as object),
    },
  });
}

export async function configDefaultsSeeded() {
  await testPrisma.config.createMany({
    data: [
      { key: "review_min_words", value: "30" },
      { key: "reviewer_useful_count", value: "3" },
      { key: "trusted_useful_count", value: "8" },
      { key: "trusted_distinct_writers", value: "4" },
      { key: "mentor_useful_min", value: "10" },
      { key: "mentor_distinct_writers", value: "4" },
      { key: "max_ratings_per_pair", value: "3" },
      { key: "rater_weight_max", value: "1.5" },
      { key: "mentor_upkeep_window", value: "20" },
      { key: "mentor_upkeep_floor", value: "0.5" },
      { key: "sample_max_words", value: "1500" },
      { key: "sample_resubmit_cooldown_hours", value: "24" },
      { key: "public_can_access_community", value: "false" },
      { key: "public_can_view_events", value: "true" },
      { key: "public_can_see_review_text", value: "true" },
      { key: "confessions_display_anonymous", value: "true" },
      { key: "workshop_min_level", value: "AMATEUR" },
      { key: "max_reviews_per_post", value: "0" },
      { key: "prompt_entries_enter_review_flow", value: "true" },
    ],
  });
}
