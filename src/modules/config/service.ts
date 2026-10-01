import { prisma } from "@/lib/db";

/**
 * The Config store. Every tunable number in the spec lives here and is editable
 * at runtime from /admin/config. Defaults in code; overrides in the table.
 */

type ValueType = "string" | "number" | "boolean" | "level";

export const CONFIG_DEFAULTS: Record<string, { value: string; type: ValueType; label: string }> = {
  sample_resubmit_cooldown_hours: { value: "24", type: "number", label: "Hours before a rejected sample may be resubmitted" },
  sample_max_words: { value: "1500", type: "number", label: "Maximum words in a sample submission" },
  review_min_words: { value: "30", type: "number", label: "Minimum words per required review section" },
  reviewer_useful_count: { value: "3", type: "number", label: "Weighted useful ratings to become Reviewer" },
  trusted_useful_count: { value: "8", type: "number", label: "Weighted useful ratings to become Trusted" },
  trusted_distinct_writers: { value: "4", type: "number", label: "Distinct writers rating 'useful' to become Trusted" },
  mentor_useful_min: { value: "10", type: "number", label: "Weighted useful ratings to reach the mentor threshold" },
  mentor_distinct_writers: { value: "4", type: "number", label: "Distinct writers rating 'useful' at the mentor threshold" },
  mentor_upkeep_window: { value: "20", type: "number", label: "Rolling window (ratings) for mentor upkeep" },
  mentor_upkeep_floor: { value: "0.5", type: "number", label: "Minimum useful share in the upkeep window" },
  max_ratings_per_pair: { value: "3", type: "number", label: "Ratings per reviewer–writer pair that count toward stats" },
  rater_weight_max: { value: "1.5", type: "number", label: "Max weight multiplier for active, well-rated raters" },
  public_can_access_community: { value: "false", type: "boolean", label: "Q3 — Public may enter the Community space" },
  public_can_view_events: { value: "true", type: "boolean", label: "Q4 — Public may view events (view-only)" },
  public_can_see_review_text: { value: "true", type: "boolean", label: "G4 — Public may read review text" },
  confessions_display_anonymous: { value: "true", type: "boolean", label: "G6 — Confessions shown anonymously (author visible to admins only)" },
  workshop_min_level: { value: "AMATEUR", type: "level", label: "G1 — Minimum level to sign up for workshops" },
  max_reviews_per_post: { value: "0", type: "number", label: "G9 — Reviews per post (0 = unlimited)" },
  prompt_entries_enter_review_flow: { value: "true", type: "boolean", label: "Prompt entries may link a Post into the review flow" },
};

export type ConfigKey = keyof typeof CONFIG_DEFAULTS;

let cache: Map<string, string> | null = null;
let cacheAt = 0;
const CACHE_MS = 3_000;

async function loadAll(): Promise<Map<string, string>> {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;
  const rows = await prisma.config.findMany();
  const map = new Map<string, string>();
  for (const [key, def] of Object.entries(CONFIG_DEFAULTS)) map.set(key, def.value);
  for (const row of rows) map.set(row.key, row.value);
  cache = map;
  cacheAt = Date.now();
  return map;
}

/** Invalidate the short-lived cache (the admin config editor calls this after writes). */
export function invalidateConfigCache() {
  cache = null;
}

export async function getConfig(key: ConfigKey): Promise<string> {
  const map = await loadAll();
  return map.get(key) ?? CONFIG_DEFAULTS[key].value;
}

export async function getConfigNumber(key: ConfigKey): Promise<number> {
  const raw = await getConfig(key);
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number(CONFIG_DEFAULTS[key].value);
}

export async function getConfigBool(key: ConfigKey): Promise<boolean> {
  const raw = await getConfig(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return CONFIG_DEFAULTS[key].value === "true";
}

/** Values are validated by the admin schema; this is the single write path. */
export async function setConfig(key: string, value: string) {
  await prisma.config.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value },
  });
  invalidateConfigCache();
}

/** For seed: write defaults into the table so the admin editor shows them. */
export async function seedConfigDefaults() {
  const keys = Object.keys(CONFIG_DEFAULTS);
  const existing = await prisma.config.findMany({ where: { key: { in: keys } } });
  const have = new Set(existing.map((r) => r.key));
  const missing = keys.filter((k) => !have.has(k));
  if (missing.length === 0) return;
  await prisma.config.createMany({
    data: missing.map((key) => ({ key, value: CONFIG_DEFAULTS[key].value })),
  });
}
