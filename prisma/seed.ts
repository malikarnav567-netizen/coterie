import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Short original pieces written for this seed — no third-party text. */

const POEMS: Array<{ title: string; genre: string; body: string; intent?: string }> = [
  {
    title: "Nocturne for the Reading Room",
    genre: "Lyric",
    intent: "The grammar is deliberate.",
    body: `The lamps burn low on borrowed time,
and every book agrees to keep
the small rebellions of the spine.

I read the way the midnight reads:
one page, one breath, one held reply.
Outside, the quad is loud with sleep.

If morning asks what passed for light,
I'll show it this — a wax-stamped hour,
a sentence that refused to die.`,
  },
  {
    title: "Self-Portrait with Borrowed Ink",
    genre: "Free verse",
    body: `I write in someone else's hand
until the letters forget their owner
and answer only to the page.

The nib scratches like a cat
demanding to be let in —
and I am let in, word by word,

a tenant of my own intent,
paying rent in punctuated breaths,
improving nothing but the light.`,
  },
  {
    title: "Two Kinds of Weather",
    genre: "Narrative",
    body: `My grandmother read storms in her knee
the way the sea reads longitude.
She never once was wrong — she said —
except about the rain, and me.

I keep her barometer of bone
hung by the door of every plan.
It creaks before the weather turns.
It creaks the loudest when I go.`,
  },
  {
    title: "Field Notes from the Archive",
    genre: "Sonnet",
    intent: "For anyone who has loved a library more than a person.",
    body: `The card catalog still smells of 1974,
a decade filed between D and F.
I press my thumb against the drawer's brass lip
the way you'd test a seal, or hold a breath.

The archivists are dead but their pencils
keep their points. The temperature is law.
I have borrowed sleep from open hours
and paid it back in margins, verse by verse.

One folder holds a letter never sent,
its ink gone brown as communion wine.
I read it standing, as one stands for hymns —
then file my own small silence in its place.

   The drawer closes like a held lament.
   The building keeps what people could not say.`,
  },
];

const PROSE: Array<{ title: string; genre: string; body: string; intent?: string }> = [
  {
    title: "The Unofficial History of the Bell Tower",
    genre: "Flash fiction",
    intent: "A myth for a campus that has too many.",
    body: `The bell tower was never rung. That was the rule, and like most rules it had been broken exactly once, by a night porter who claimed he heard a second bell answer his — a lower one, from under the ground.

The porter resigned by morning. The tower kept its silence like a held tongue. Students still swear the grass beneath it grows greener, fed on something the ground remembers.

Last winter a freshman climbed the stairs on a dare. She said the rope was warm. She said it swung a little, the way a cat's tail swings when it is pretending not to watch you.

The Provost issued a statement: the tower is structurally sound and historically mute. Both clauses were true. Neither was honest.

This is why we study here — not for the degrees, which are portable, but for the silences, which are not. Every campus keeps one. Ours happens to ring, if you believe the dead.`,
  },
  {
    title: "Ghosts of the Anatomy Wing",
    genre: "Literary fiction",
    body: `The anatomy wing kept its ghosts the way other buildings kept pigeons: informally, and mostly at night.

Marisol swept the lab at eleven. She had worked there long enough to know that the cadavers were the least haunted thing about the place. The hauntings lived in the margins of the textbooks — in the notes of students who had failed, and the brighter notes of those who had nearly not.

She found a card once, wedged behind the model of the inner ear: "For the next one who gets lost here — the answer is smaller than you think. — R."

She kept it in her coat for a year, waiting for a hand small enough to pass it to.

When she finally gave it away, to a first-year crying over the cochlea, she said nothing. The girl read it twice and stood up straighter. That was the whole of the ghost's work on earth, and it was finished.`,
  },
  {
    title: "Dear Registrar",
    genre: "Essay",
    body: `Dear Registrar — I am writing to contest nothing. I only wish the record to show that in the autumn of my second year I was happy, and that no form was issued for it.

There should be a form. I have thought about the fields it would carry: duration of happiness (est.); suspected cause (attach footnote); witnesses (two minimum, one of whom must have been surprised).

The registrar's office is a temple of the almost-true. Every transcript is a diary with the diarist removed. My GPA stands in for the mornings I walked the long way past the kilns because the smoke smelled like my grandmother's yard.

So: contest nothing, request one addition. Under Honors, under Probation, under Withdrawal — a fourth column, narrow, titled "Otherwise." I was otherwise. File me there.`,
  },
  {
    title: "The Night Class",
    genre: "Memoir",
    intent: "The grammar is deliberate.",
    body: `The night class met in a basement with no signal and one radiator that sounded like applause. There were nine of us, which is the exact number at which a room stops being a room and becomes a committee of witnesses.

Professor Ansel drank cold coffee in the manner of a man who had made his peace with every temperature. He never said "good." He said "interesting" like a scalpel, and "again" like a blessing.

Week six, a girl read a poem about her father's hands. The radiator applauded. Ansel let the silence go so long it changed from awkward to structural. Then he said: "Don't you dare explain it. You've already explained it. To everyone. That's what the poem was."

I have tried to write my way back to that basement every week since. The rent is silence. The landlord is patience. The lease renews each time I put a sentence on the page and do not apologize for it.`,
  },
];

async function main() {
  console.log("Seeding Coterie…");

  // Fresh start for a clean demo database.
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.eventEntry.deleteMany();
  await prisma.event.deleteMany();
  await prisma.mentorReadNote.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.progressionEvent.deleteMany();
  await prisma.reviewerStats.deleteMany();
  await prisma.reviewRating.deleteMany();
  await prisma.review.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.sampleSubmission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.config.deleteMany();

  // ---- Campus ----
  // Real art-and-writing colleges join the demo campus; upserts keep repeated
  // seeds idempotent. scripts/dev-campuses.ts applies the same list to a live
  // database without reseeding.
  const COLLEGES: Array<[string, ...string[]]> = [
    ["Inderprastha Engineering College", "ipec.org.in"],
  ];
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
  const campus = (await prisma.campus.findFirst({ where: { name: "Demo Arts College" } }))!;

  // ---- Users ----
  const mk = (displayName: string, email: string, opts: {
    password?: string;
    accessTier?: "PUBLIC" | "CREATIVE";
    creativeLevel?: string | null;
    isAdmin?: boolean;
    identityVerified?: boolean;
  } = {}) =>
    prisma.user.create({
      data: {
        displayName,
        email,
        campusId: campus.id,
        passwordHash: opts.password ? bcrypt.hashSync(opts.password, 10) : null,
        identityVerified: opts.identityVerified ?? true,
        accessTier: opts.accessTier ?? "PUBLIC",
        creativeLevel: opts.creativeLevel ?? null,
        isAdmin: opts.isAdmin ?? false,
      },
    });

  const admin = await mk("The Owner", "owner@demo.edu", { password: "owner123", isAdmin: true, accessTier: "CREATIVE", creativeLevel: "MENTOR" });

  const pub1 = await mk("Quinn Public", "quinn@demo.edu", { password: "quinn123", accessTier: "PUBLIC" });
  const pub2 = await mk("Vera Holdfast", "vera@demo.edu", { password: "vera123", accessTier: "PUBLIC", identityVerified: true });

  const ama1 = await mk("Mara Newleaf", "mara@demo.edu", { password: "mara123", accessTier: "CREATIVE", creativeLevel: "AMATEUR" });
  const ama2 = await mk("Odell Verse", "odell@demo.edu", { password: "odell123", accessTier: "CREATIVE", creativeLevel: "AMATEUR" });
  const ama3 = await mk("Sable Quill", "sable@demo.edu", { password: "sable123", accessTier: "CREATIVE", creativeLevel: "AMATEUR" });

  const reviewer = await mk("Iris Marginal", "iris@demo.edu", { password: "iris123", accessTier: "CREATIVE", creativeLevel: "REVIEWER" });
  const trusted = await mk("Corwin Steady", "corwin@demo.edu", { password: "corwin123", accessTier: "CREATIVE", creativeLevel: "TRUSTED" });
  const mentor = await mk("Augusta Bell", "augusta@demo.edu", { password: "augusta123", accessTier: "CREATIVE", creativeLevel: "MENTOR" });

  // ---- Reason tags ----
  const tagRows = [
    { code: "specific", label: "Specific", polarity: "positive" },
    { code: "actionable", label: "Actionable", polarity: "positive" },
    { code: "fair", label: "Fair", polarity: "positive" },
    { code: "clarified_intent", label: "Clarified my intent", polarity: "positive" },
    { code: "too_vague", label: "Too vague", polarity: "negative" },
    { code: "too_harsh", label: "Too harsh", polarity: "negative" },
    { code: "missed_the_point", label: "Missed the point", polarity: "negative" },
  ];
  for (const t of tagRows) await prisma.reasonTag.create({ data: t });

  // ---- Posts ----
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
  const postRows = [
    { author: ama1, ...POEMS[0], days: 9 },
    { author: ama2, ...PROSE[0], days: 8 },
    { author: ama3, ...POEMS[1], days: 7 },
    { author: ama1, ...PROSE[1], days: 6 },
    { author: reviewer, ...POEMS[2], days: 5 },
    { author: ama2, ...PROSE[2], days: 4 },
    { author: trusted, ...POEMS[3], days: 3 },
    { author: ama3, ...PROSE[3], days: 2 },
  ];
  const posts = [];
  for (const row of postRows) {
    posts.push(
      await prisma.post.create({
        data: {
          authorId: row.author.id,
          title: row.title,
          form: POEMS.some((p) => p.title === row.title) ? "POETRY" : "PROSE",
          genre: row.genre,
          body: row.body,
          intentLine: row.intent ?? null,
          createdAt: daysAgo(row.days),
        },
      }),
    );
  }

  // ---- Reviews (10, some rated) ----
  const mkReview = async (post: { id: string; authorId: string }, reviewerUser: { id: string }, sections: [string, string, string], days: number, rated?: { verdict: string; tag: string; rater: { id: string } }, daysRated?: number) => {
    const created = await prisma.review.create({
      data: {
        postId: post.id,
        reviewerId: reviewerUser.id,
        authorId: post.authorId,
        whatWorked: sections[0],
        whatDidNot: sections[1],
        oneSuggestion: sections[2],
        readerResponse: Math.random() > 0.5 ? "This one I will carry for a while; the last stanza follows me into the stairwell." : null,
        createdAt: daysAgo(days),
        ratedAt: rated && daysRated != null ? daysAgo(daysRated) : null,
      },
    });
    if (rated) {
      await prisma.reviewRating.create({
        data: {
          reviewId: created.id,
          raterId: rated.rater.id,
          reviewOwnerId: reviewerUser.id,
          verdict: rated.verdict,
          reasonTagCode: rated.tag,
          weight: 1,
          createdAt: daysAgo(daysRated ?? days - 1),
        },
      });
      await prisma.post.update({ where: { id: post.id }, data: { reviewCount: { increment: 1 } } });
    } else {
      await prisma.post.update({ where: { id: post.id }, data: { reviewCount: { increment: 1 } } });
    }
    return created;
  };

  const r1 = await mkReview(posts[0], reviewer, [
    "The second stanza earns its keep — \"one page, one breath, one held reply\" sets a pace the rest honors, and the apostrophe to morning keeps the piece from sinking into pure mood.",
    "The third stanza arrives a beat early; the turn lands before the reader has finished living in the second. The quad line also tilts cute when the rest is restrained.",
    "Delay the final stanza by one more beat of stillness — let the held reply sit unresolved for a line longer before the sentence that refuses to die.",
  ], 8, { verdict: "USEFUL", tag: "specific", rater: ama1 }, 7);
  void r1;

  const r2 = await mkReview(posts[1], trusted, [
    "The Porter paragraph is the load-bearing wall: the claim that a rule was broken \"exactly once\" gives the myth its authority. The closing contrast — portable degrees, unportable silences — lands.",
    "The freshman paragraph rushes. The bell imagery repeats before it has been earned, and the Provost paragraph, though funny, briefly breaks the piece's solemn contract.",
    "Cut one of the three bell-warmth sentences and let the Provost's dryness carry the humor; the myth will feel older for the restraint.",
  ], 7, { verdict: "USEFUL", tag: "actionable", rater: ama2 }, 6);
  void r2;

  await mkReview(posts[0], mentor, [
    "The spine rebellion image is the poem's credential — it declares the reading room a place where small insolence survives, which is exactly what the ending pays off.",
    "The middle stanza's meter loosens where the rest is taut; \"held reply\" is doing work the surrounding lines do not yet support.",
    "Consider a harder caesura before the final stanza — the poem needs one breath of true silence before it speaks.",
  ], 7, { verdict: "SOMEWHAT", tag: "too_vague", rater: ama1 }, 6);

  await mkReview(posts[2], ama1, [
    "The tenant conceit is fresh and consistent; paying \"rent in punctuated breaths\" keeps the metaphor honest all the way down.",
    "The second stanza's cat image is vivid but tonally brighter than the rest of the piece; it reads like a different poem visiting.",
    "Either dim the cat image or warm the rest of the poem to meet it — right now the registers argue instead of marrying.",
  ], 6, { verdict: "USEFUL", tag: "fair", rater: ama3 }, 5);

  await mkReview(posts[3], trusted, [
    "The card behind the inner ear is a perfect object: small, specific, and load-bearing. The ghost's \"work on earth\" closing gives the piece a shape, not just an ending.",
    "The middle paragraph tells us the hauntings live in margins before showing us one; trust the card to do that work alone.",
    "Open the second paragraph with the card's discovery instead of the summary — let the reader sweep the lab with Marisol before being told what haunts it.",
  ], 6, { verdict: "USEFUL", tag: "clarified_intent", rater: ama1 }, 5);

  await mkReview(posts[4], ama2, [
    "The knee as barometer is a strong domestic instrument, and the exception structure (\"except about the rain, and me\") gives the piece its ache.",
    "The third stanza's abstraction (\"every plan\") goes soft after two stanzas of concrete objects.",
    "Replace \"every plan\" with one named, physical plan — a door, a ticket, a coat — and the barometer will creak louder.",
  ], 5, { verdict: "NO", tag: "missed_the_point", rater: reviewer }, 4);

  await mkReview(posts[5], ama3, [
    "The \"diary with the diarist removed\" formulation is the essay's thesis and its best line; the form-fields conceit is sustained with real wit.",
    "The grandmother's yard arrives late; by then the essay has spent two paragraphs on bureaucratic parody, and the feeling has to fight through.",
    "Move the kiln smoke one paragraph earlier and let the parody orbit it, rather than the reverse.",
  ], 4, { verdict: "USEFUL", tag: "specific", rater: ama2 }, 3);

  await mkReview(posts[6], mentor, [
    "The volta at \"The drawer closes\" is genuinely earned — the sonnet's last two lines re-file the whole poem. The communion-wine ink is exact.",
    "The second quatrain's \"borrowed sleep\" metaphor sits close to the seed's \"borrowed\" in stanza one; the echo may be unintended.",
    "Consider un-borrowing one of the two; the poem should not spend its best verb twice.",
  ], 3, { verdict: "USEFUL", tag: "actionable", rater: trusted }, 2);

  await mkReview(posts[6], reviewer, [
    "The standing-for-hymns gesture tells us exactly how to read the letter; it is a stage direction the poem honors.",
    "The octave is one image heavier than the sestet; the folder and the letter and the pencil points all arrive without a breath between them.",
    "Cut the pencil detail — the letter and the temperature are enough to make the archive feel lived-in and law-abiding.",
  ], 2);

  await mkReview(posts[7], ama1, [
    "Ansel's \"again\" as blessing is the memoir's engine; the radiator applause gives the room a witness, which the ending's lease metaphor collects on.",
    "The closing triplet of metaphors (rent, landlord, lease) arrives in quick succession and the last one slightly outruns the evidence.",
    "Keep rent and landlord; let the lease go — the piece ends stronger on patience than on paperwork.",
  ], 1);

  // ---- Reviewer stats (roughly reflect the ratings above) ----
  await prisma.reviewerStats.create({ data: { userId: reviewer.id, reviewsWritten: 2, usefulCount: 1, distinctUsefulRaters: 1 } });
  await prisma.reviewerStats.create({ data: { userId: trusted.id, reviewsWritten: 2, usefulCount: 3, distinctUsefulRaters: 3 } });
  await prisma.reviewerStats.create({ data: { userId: mentor.id, reviewsWritten: 2, usefulCount: 4, distinctUsefulRaters: 2 } });
  await prisma.reviewerStats.create({ data: { userId: ama1.id, reviewsWritten: 2, usefulCount: 3, distinctUsefulRaters: 3 } });
  await prisma.reviewerStats.create({ data: { userId: ama2.id, reviewsWritten: 1, usefulCount: 2, distinctUsefulRaters: 2 } });
  await prisma.reviewerStats.create({ data: { userId: ama3.id, reviewsWritten: 1, usefulCount: 1, distinctUsefulRaters: 1 } });

  // ---- Badges ----
  await prisma.badge.create({ data: { userId: reviewer.id, type: "REVIEWER", awardedAt: daysAgo(20) } });
  await prisma.badge.create({ data: { userId: trusted.id, type: "REVIEWER", awardedAt: daysAgo(40) } });
  await prisma.badge.create({ data: { userId: trusted.id, type: "TRUSTED", awardedAt: daysAgo(15) } });
  await prisma.badge.create({ data: { userId: mentor.id, type: "REVIEWER", awardedAt: daysAgo(60) } });
  await prisma.badge.create({ data: { userId: mentor.id, type: "TRUSTED", awardedAt: daysAgo(45) } });
  await prisma.badge.create({ data: { userId: mentor.id, type: "MENTOR", awardedAt: daysAgo(30) } });

  // ---- Progression events ----
  await prisma.progressionEvent.create({ data: { userId: reviewer.id, fromLevel: "AMATEUR", toLevel: "REVIEWER", reason: "usefulCount reached threshold", decidedBy: "system", createdAt: daysAgo(20) } });
  await prisma.progressionEvent.create({ data: { userId: trusted.id, fromLevel: "REVIEWER", toLevel: "TRUSTED", reason: "usefulCount and distinct raters reached threshold", decidedBy: "system", createdAt: daysAgo(15) } });
  await prisma.progressionEvent.create({ data: { userId: mentor.id, fromLevel: "TRUSTED", toLevel: "MENTOR_CANDIDATE", reason: "Mentor threshold reached", decidedBy: "system", createdAt: daysAgo(35) } });
  await prisma.progressionEvent.create({ data: { userId: mentor.id, fromLevel: "MENTOR_CANDIDATE", toLevel: "MENTOR", reason: "Approved by the admins", decidedBy: admin.id, createdAt: daysAgo(30) } });

  // ---- Events ----
  const sunday = new Date();
  sunday.setDate(sunday.getDate() + ((7 - sunday.getDay()) % 7 || 7));
  sunday.setHours(23, 59, 0, 0);
  await prisma.event.create({ data: { type: "PROMPT", title: "Weekly Prompt: The Held Breath", description: "Write the moment before speaking. Any form. The prompt closes Sunday night.", rules: "One piece per member. Link your post when you sign up.", startsAt: daysAgo(2), endsAt: sunday, minLevel: "PUBLIC", hostId: mentor.id, state: "SIGNUP_OPEN" } });
  await prisma.event.create({ data: { type: "ROAST", title: "Roast Battle: The Overwrought Drafts", description: "Bring your most self-indulgent early draft and let the room do its work.", rules: "Roast the piece, never the person. Personal attacks remain violations. Opt-in only.", startsAt: daysAgo(-3), endsAt: daysAgo(-3.2), minLevel: "REVIEWER", hostId: trusted.id, state: "SIGNUP_OPEN" } });
  await prisma.event.create({ data: { type: "WORKSHOP", title: "Workshop: The Line Break as Decision", description: "A capped workshop on the line break as the smallest unit of intent.", rules: "Bring one poem you are stuck on. Seats are limited.", startsAt: daysAgo(-7), endsAt: daysAgo(-6.5), minLevel: "AMATEUR", capacity: 8, hostId: mentor.id, state: "SIGNUP_OPEN" } });

  // ---- Community ----
  await prisma.communityPost.create({ data: { kind: "BANTER", authorId: ama2.id, body: "The library printer has eaten eleven pages of my draft and I respect its editorial instincts." } });
  await prisma.communityPost.create({ data: { kind: "BANTER", authorId: reviewer.id, body: "Whoever left the anthology open upside-down on the third floor: same." } });
  await prisma.communityPost.create({ data: { kind: "CONFESSION", authorId: ama3.id, body: "I submitted a piece I wrote in one sitting and it was accepted. I do not know whether to be proud or to apologize." } });
  await prisma.communityPost.create({ data: { kind: "GENERAL", authorId: trusted.id, body: "Reminder that the critique room is for the work. Bring your worst drafts; they grow best here." } });
  await prisma.communityPost.create({ data: { kind: "BANTER", authorId: pub1.id, body: "As a public member I would like to formally petition for a reading room cat." } });

  // ---- Pending sample ----
  await prisma.sampleSubmission.create({
    data: {
      userId: pub2.id,
      form: "PROSE",
      body: "The college kept a lake for emergencies. Nobody swam in it; that was the point. It lay at the bottom of the hill like a held breath, grey as ledger paper, and first-years were told it existed so that something, somewhere, was being saved. I believed it the way you believe a locked door: not that it would open, but that the lock meant something. Then in October the sirens went — a drill, though nobody told the lake — and I swear the water stood up.",
      attemptNo: 1,
      status: "SUBMITTED",
      createdAt: daysAgo(1),
    },
  });

  // ---- One open report (with snapshot) ----
  await prisma.report.create({
    data: {
      reporterId: ama1.id,
      targetType: "COMMUNITY_POST",
      targetId: (await prisma.communityPost.findFirst({ where: { kind: "BANTER", authorId: pub1.id } }))!.id,
      snapshot: JSON.stringify({ kind: "BANTER", body: "As a public member I would like to formally petition for a reading room cat." }),
      reason: "Mild mockery of public members — flagging for the admins to judge.",
      status: "OPEN",
      createdAt: daysAgo(1),
    },
  });

  // ---- Config defaults ----
  await prisma.config.createMany({
    data: [
      { key: "sample_resubmit_cooldown_hours", value: "24" },
      { key: "sample_max_words", value: "1500" },
      { key: "review_min_words", value: "30" },
      { key: "reviewer_useful_count", value: "3" },
      { key: "trusted_useful_count", value: "8" },
      { key: "trusted_distinct_writers", value: "4" },
      { key: "mentor_useful_min", value: "10" },
      { key: "mentor_distinct_writers", value: "4" },
      { key: "mentor_upkeep_window", value: "20" },
      { key: "mentor_upkeep_floor", value: "0.5" },
      { key: "max_ratings_per_pair", value: "3" },
      { key: "rater_weight_max", value: "1.5" },
      { key: "public_can_access_community", value: "false" },
      { key: "public_can_view_events", value: "true" },
      { key: "public_can_see_review_text", value: "true" },
      { key: "confessions_display_anonymous", value: "true" },
      { key: "workshop_min_level", value: "AMATEUR" },
      { key: "max_reviews_per_post", value: "0" },
      { key: "prompt_entries_enter_review_flow", value: "true" },
    ],
  });

  console.log("Seed complete. Logins (all @demo.edu):");
  console.log("  owner@demo.edu / owner123   (admin, mentor)");
  console.log("  quinn@demo.edu / quinn123   (public)");
  console.log("  mara@demo.edu / mara123     (amateur)");
  console.log("  iris@demo.edu / iris123     (reviewer)");
  console.log("  corwin@demo.edu / corwin123 (trusted)");
  console.log("  augusta@demo.edu / augusta123 (mentor)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
