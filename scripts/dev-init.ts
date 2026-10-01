/**
 * Clean-start initialization for a fresh database: the ten college campuses,
 * the review reason tags, and the config defaults. No demo users, posts, or
 * content — members enroll themselves through /enter.
 *
 * Safe to run repeatedly (idempotent upserts/creates).
 * Run with: npx tsx scripts/dev-init.ts
 */
import { prisma } from "../src/lib/db";

/** [name, domains...] — each domain is matched case-insensitively at sign-up. */
const COLLEGES: Array<[string, ...string[]]> = [
  ["Inderprastha Engineering College", "ipec.org.in"],
];

const REASON_TAGS = [
  { code: "specific", label: "Specific", polarity: "positive" },
  { code: "actionable", label: "Actionable", polarity: "positive" },
  { code: "fair", label: "Fair", polarity: "positive" },
  { code: "clarified_intent", label: "Clarified my intent", polarity: "positive" },
  { code: "too_vague", label: "Too vague", polarity: "negative" },
  { code: "too_harsh", label: "Too harsh", polarity: "negative" },
  { code: "missed_the_point", label: "Missed the point", polarity: "negative" },
];

const CONFIG_DEFAULTS: Array<[string, string]> = [
  ["sample_resubmit_cooldown_hours", "24"],
  ["sample_max_words", "1500"],
  ["review_min_words", "30"],
  ["reviewer_useful_count", "3"],
  ["trusted_useful_count", "8"],
  ["trusted_distinct_writers", "4"],
  ["mentor_useful_min", "10"],
  ["mentor_distinct_writers", "4"],
  ["mentor_upkeep_window", "20"],
  ["mentor_upkeep_floor", "0.5"],
  ["max_ratings_per_pair", "3"],
  ["rater_weight_max", "1.5"],
  ["public_can_access_community", "false"],
  ["public_can_view_events", "true"],
  ["public_can_see_review_text", "true"],
  ["confessions_display_anonymous", "true"],
  ["workshop_min_level", "AMATEUR"],
  ["max_reviews_per_post", "0"],
  ["prompt_entries_enter_review_flow", "true"],
];

async function main() {
  for (const [name, ...domains] of COLLEGES) {
    const existing = await prisma.campus.findFirst({ where: { name } });
    if (existing) {
      await prisma.campus.update({
        where: { id: existing.id },
        data: { emailDomains: JSON.stringify(domains), active: true },
      });
    } else {
      await prisma.campus.create({
        data: { name, emailDomains: JSON.stringify(domains), active: true },
      });
    }
  }
  console.log(`campuses: ${await prisma.campus.count()}`);

  for (const tag of REASON_TAGS) {
    await prisma.reasonTag.upsert({
      where: { code: tag.code },
      create: tag,
      update: { label: tag.label, polarity: tag.polarity },
    });
  }
  console.log(`reason tags: ${await prisma.reasonTag.count()}`);

  for (const [key, value] of CONFIG_DEFAULTS) {
    await prisma.config.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
  console.log(`config keys: ${await prisma.config.count()}`);

  console.log("\nDatabase ready. Open http://localhost:3000/enter to enroll.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
