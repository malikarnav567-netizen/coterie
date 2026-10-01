# Coterie — *Coterie Lux Mea*

A campus-gated peer-critique community for writers (poetry and prose). Dark
academia, candlelit-library interface; oxblood wax seals, gold hairlines,
parchment cards. Built as a **modular monolith**: one Next.js deployable, every
business rule enforced server-side.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
Prisma 6 + Supabase Postgres · Auth.js v5 (one-time code, the only door) ·
Zod · Vitest.

The landing page is rebuilt around the supplied reference artwork in
`public/ref-assets/` (all PNGs served locally, nothing hotlinked) with the
final information architecture: nav and cards use **COLLABORATE** (not
"Convene"), and the Create card covers all disciplines (Writing / Music /
Film / Art / Photography / More).

---

## Run it in under five commands

```bash
npm install
cp .env.example .env.local        # then fill in your Supabase connection strings
npx prisma db push                # create the schema on Supabase
npx tsx scripts/dev-init.ts       # seed the 10 colleges, reason tags, config
npm run dev                       # http://localhost:3000
```

> This checkout carries its own Node runtime in `.tools/node` — if `node` /
> `npm` are not on your PATH, prefix commands with
> `export PATH="$PWD/.tools/node/bin:$PATH"`. The bundled `serve.py` keeps a dev
> server alive in its own session: `python3 .tools/serve.py 3000`.

Other scripts: `npm run build` (production build + typecheck) · `npm run
typecheck` · `npm test` (Vitest, runs in a dedicated `coterie_test` schema on
the same Supabase instance — never touches app data) · `npm run db:studio`.

## Getting in (no seeded users)

The database starts clean: one real college campus, no members. Enter at
`/enter` with an `@ipec.org.in` address (Inderprastha Engineering College) —
there is exactly one door: **By letter**. A one-time 6-digit code is sent to
the college inbox (in dev the code is printed to the server console instead
of emailed); the code signs the member in and enrolls them on first use. No
passwords exist anywhere. New members are PUBLIC readers; an accepted sample
at `/sample` opens the creative tier. The first member to need `/admin` can
be promoted by flipping `isAdmin` on their User row (e.g. through `npm run
db:studio`).

> The old demo dataset (owner/quinn/mara/… at `demo.edu`, passwords
> `username123`) lived in the retired SQLite `dev.db`; `prisma/seed.ts` can
> still recreate it on any database if ever wanted.

## The map

| Area | Where |
|---|---|
| Landing (`/`), Manifesto | Public |
| Feed · Reviews · Events · Community · Profile | The five tabs (bottom bar on mobile) |
| Sample submission ("Earn your seat") | `/sample` |
| Compose | `/compose` (creatives only) |
| Write review ("Seal & Send") | `/post/[id]/review` |
| Admin room | `/admin` (samples, mentor candidates, reports, config, stats) |
| API | `/api/*` — every handler passes through `src/lib/guard.ts` |
| Upkeep cron | `GET /api/cron/upkeep` (set `CRON_SECRET` to require a bearer token) |

## How the rules are enforced (server-side, always)

- **Guards.** `requireUser / requireTier('creative') / requireLevel(...) /
  requireAdmin` wrap every route handler. A public user POSTing to
  `/api/posts`, `/api/posts/:id/reviews` or `/api/reviews/:id/rating` gets a
  **403** even with a hand-built request; the UI merely hides the doors.
- **Samples.** `SUBMITTED → IN_REVIEW → ACCEPTED | REJECTED(feedback)`.
  Acceptance is the *only* code path that sets `CREATIVE/AMATEUR`. Rejections
  carry feedback and a resubmit cooldown (`sample_resubmit_cooldown_hours`).
- **Reviews.** Three required sections, each ≥ `review_min_words` words
  (validated server-side with per-section messages), optional reader response,
  no self-review, one review per reviewer per post (unique index + check),
  Trusted/Mentor reviews sort higher, and a review **locks once rated** (edits
  via `PATCH /api/reviews/:id` before that).
- **Ratings.** Only the post's author, one per review (unique index), verdict
  USEFUL/SOMEWHAT/NO plus a polarity-consistent reason tag. "Somewhat" is
  recorded but never counted. The stats recompute runs **inside the same
  transaction** as the rating.
- **Progression.** Quality only: weighted useful count (pair-capped via
  `max_ratings_per_pair`, weights up to `rater_weight_max`) and distinct
  writers. AMATEUR→REVIEWER→TRUSTED are automatic at thresholds; TRUSTED→
  MENTOR_CANDIDATE creates an admin task only; **MENTOR requires admin
  approval** (MentorReadNote after reading a sample of the candidate's
  reviews). Upkeep flags/revokes mentors whose recent useful share falls under
  `mentor_upkeep_floor`. Every change writes a ProgressionEvent.
- **Domain separation.** Community lives in its own tables
  (`CommunityPost/CommunityComment`), never appears in the feed, and never
  touches progression. Flagging there is hate-only; dark or sensitive creative
  work is not a violation (the admin queue carries the reminder).
- **Config.** Every threshold and open-question default lives in the `Config`
  table, editable at `/admin/config` at runtime — no redeploy needed.

## Tests

```bash
npm test
```

27 tests in `tests/coterie.test.ts` run against a dedicated `coterie_test`
schema on Supabase (created and dropped per run):
permission guards, review validation, one-rating-per-review, self-review and
self-rating bans, pair capping, promotion thresholds, admin-only mentor
approval, upkeep flag→revoke, sample tier upgrade + cooldown, polarity rules,
community separation, and report snapshots.

## Database (Supabase)

The app runs on Supabase Postgres. `.env` carries two connection strings from
Supabase → **Connect**: `DATABASE_URL` (transaction pooler, port 6543, used by
the running app) and `DIRECT_URL` (session pooler, port 5432, used by the
Prisma CLI for `db push`). Tests isolate themselves in a `coterie_test`
schema. To rebuild from scratch: `npx prisma db push && npx tsx
scripts/dev-init.ts`.

Enum-like columns are strings validated with Zod, so no application code
depends on the database engine.

## Assumptions (spec ambiguities resolved to the config defaults)

- `public_can_access_community: false` — the Commons after hours is
  creatives-only unless the owner flips the dial.
- `public_can_view_events: true` — public members see events view-only.
- `public_can_see_review_text: true` — review text is readable by all members;
  when flipped off, public members see the lock note instead.
- `confessions_display_anonymous: true` — confessions render as "A voice in the
  dark"; the author is stored and visible to admins.
- `workshop_min_level: AMATEUR` — all creatives may sign up for workshops (G1).
- `max_reviews_per_post: 0` — unlimited reviews per post (G9).
- Prompt entries may link a Post into the review flow
  (`prompt_entries_enter_review_flow: true`).
- The review-edit endpoint is `PATCH /api/reviews/:id` and refuses any edit
  after a rating (the lock).
- Mentor upkeep flags once per 30-day window; a second flagged run revokes the
  badge back to MENTOR_CANDIDATE pending admin review.
- The dev-mode verification bypass (`DEV_BYPASS_VERIFICATION=true`) lets an
  unverified account *read* only; it never grants posting, reviewing, or
  rating rights.

**Deferred by spec and deliberately absent:** collaboration, recruiters/talent,
AI moderation, disciplines beyond writing, cross-college networking,
monetisation. They exist nowhere in the UI or the routes.
