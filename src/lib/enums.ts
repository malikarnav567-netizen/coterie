/**
 * String enums + display labels. SQLite has no Prisma enums; the Zod schemas in
 * each module validate these at every boundary, and services guard state
 * transitions explicitly.
 */

export const ACCESS_TIERS = ["PUBLIC", "CREATIVE"] as const;
export type AccessTier = (typeof ACCESS_TIERS)[number];

export const CREATIVE_LEVELS = [
  "AMATEUR",
  "REVIEWER",
  "TRUSTED",
  "MENTOR_CANDIDATE",
  "MENTOR",
] as const;
export type CreativeLevel = (typeof CREATIVE_LEVELS)[number];

export const FORMS = ["POETRY", "PROSE"] as const;
export type Form = (typeof FORMS)[number];

export const SAMPLE_STATUSES = ["SUBMITTED", "IN_REVIEW", "ACCEPTED", "REJECTED"] as const;
export type SampleStatus = (typeof SAMPLE_STATUSES)[number];

export const POST_STATUSES = ["PUBLISHED", "HIDDEN"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const REVIEW_STATUSES = ["PUBLISHED", "HIDDEN"] as const;

export const VERDICTS = ["USEFUL", "SOMEWHAT", "NO"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const BADGE_TYPES = ["REVIEWER", "TRUSTED", "MENTOR"] as const;
export type BadgeType = (typeof BADGE_TYPES)[number];

export const EVENT_TYPES = ["PROMPT", "ROAST", "WORKSHOP"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATES = ["SCHEDULED", "SIGNUP_OPEN", "LIVE", "CLOSED", "RESULTS"] as const;
export type EventState = (typeof EVENT_STATES)[number];

export const ENTRY_STATUSES = ["SIGNED_UP", "SUBMITTED", "WITHDRAWN"] as const;

export const COMMUNITY_KINDS = ["BANTER", "CONFESSION", "GENERAL"] as const;
export type CommunityKind = (typeof COMMUNITY_KINDS)[number];

export const REPORT_TARGET_TYPES = ["POST", "REVIEW", "COMMUNITY_POST", "COMMUNITY_COMMENT"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const REPORT_STATUSES = ["OPEN", "RESOLVED"] as const;

export const MOD_ACTIONS = ["KEEP", "HIDE", "ASK_EDIT"] as const;
export type ModAction = (typeof MOD_ACTIONS)[number];

export const SAMPLE_COOLDOWN_MESSAGE = "The committee asks that you wait before submitting again.";

export const GENRES = [
  "Lyric", "Narrative", "Free verse", "Sonnet", "Experimental", // poetry
  "Literary fiction", "Flash fiction", "Essay", "Memoir", "Experimental prose",
] as const;

/** Display ladder shown in the UI. MENTOR_CANDIDATE is an internal admin state. */
export const LEVEL_RANK: Record<string, number> = {
  PUBLIC: 0,
  AMATEUR: 1,
  REVIEWER: 2,
  TRUSTED: 3,
  MENTOR_CANDIDATE: 3, // internal state, same public footing as TRUSTED
  MENTOR: 4,
};

export const LEVEL_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  AMATEUR: "Amateur",
  REVIEWER: "Reviewer",
  TRUSTED: "Trusted Reviewer",
  MENTOR_CANDIDATE: "Trusted Reviewer", // never shown as its own public rank
  MENTOR: "Mentor",
};
