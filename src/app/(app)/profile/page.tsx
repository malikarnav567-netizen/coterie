import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { prisma } from "@/lib/db";
import { statsFor, progressionHistory } from "@/modules/progression/service";
import { statsProgress } from "@/modules/progression/progress";
import { levelMark } from "@/lib/prompts";
import { levelLabel } from "@/lib/levels";
import { Divider, WaxSeal, Sparkle } from "@/components/brand";
import { LinkButton, Tag } from "@/components/ui";
import { SignOutButton } from "./signout";

export const metadata = { title: "Profile — Coterie" };

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/profile");

  const [stats, history, badges, posts] = await Promise.all([
    statsFor(viewer.id),
    progressionHistory(viewer.id),
    prisma.badge.findMany({ where: { userId: viewer.id, revokedAt: null }, orderBy: { awardedAt: "asc" } }),
    prisma.post.findMany({
      where: { authorId: viewer.id, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, form: true, genre: true, reviewCount: true, createdAt: true },
    }),
  ]);

  const progress = await statsProgress(viewer.accessTier, viewer.creativeLevel, stats);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <WaxSeal level={viewer.creativeLevel} size={40} />
            <h1 className="display-caps text-2xl text-ivory md:text-3xl">{viewer.displayName}</h1>
          </div>
          <p className="label-caps mt-2 text-muted">
            {viewer.accessTier === "CREATIVE" ? levelLabel(viewer.creativeLevel) : "Public reader"}
            {viewer.isAdmin && " · Admin"}
          </p>
        </div>
        <SignOutButton />
      </header>

      {viewer.accessTier !== "CREATIVE" && (
        <section className="border border-gold/60 bg-ink-2 px-6 py-6 text-center">
          <p className="accent-italic text-lg">You have not yet shown your work.</p>
          <p className="mt-2 text-muted">Submit a sample to enter the critique room.</p>
          <div className="mt-5">
            <LinkButton href="/sample" variant="primary">Apply for creatives</LinkButton>
          </div>
        </section>
      )}

      {/* stats + progress */}
      {viewer.accessTier === "CREATIVE" && (
        <section aria-label="Reviewer standing" className="border border-gold-dim/40 bg-ink-2 px-6 py-6">
          <h2 className="label-caps text-gold">Your standing</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <Stat label="Useful ratings" value={stats?.usefulCount ?? 0} />
            <Stat label="Distinct writers" value={stats?.distinctUsefulRaters ?? 0} />
            <Stat label="Reviews written" value={stats?.reviewsWritten ?? 0} />
          </div>
          {progress && (
            <div className="mt-6 border-t border-gold-dim/30 pt-4">
              <p className="label-caps text-muted">
                Next: {levelLabel(progress.nextLevel)} — {progress.label}
              </p>
              <div className="mt-2 h-1 w-full bg-ink-3" role="progressbar" aria-valuenow={Math.round(progress.pct * 100)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1 bg-gold" style={{ width: `${Math.min(100, progress.pct * 100)}%` }} />
              </div>
              {progress.note && <p className="accent-italic mt-2 text-sm">{progress.note}</p>}
            </div>
          )}
          {viewer.creativeLevel === "MENTOR_CANDIDATE" && (
            <p className="mt-4 text-sm italic text-muted">
              The admins are reading a sample of your reviews. Mentor is theirs to give.
            </p>
          )}
        </section>
      )}

      {/* badges */}
      <section aria-label="Badges">
        <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">Honors</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.length === 0 && <p className="text-sm text-muted">None yet. They are earned, never given.</p>}
          {badges.map((b) => (
            <Tag key={b.id} variant={b.type === "MENTOR" ? "mentor" : "gold"}>
              {b.type === "REVIEWER" ? "Reviewer" : b.type === "TRUSTED" ? "Trusted" : "Mentor · Guide"}
            </Tag>
          ))}
        </div>
      </section>

      {/* portfolio */}
      <section aria-label="Portfolio">
        <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">Your shelf</h2>
        <div className="mt-4 space-y-3">
          {posts.length === 0 && (
            <p className="text-sm text-muted">
              Nothing here yet. {viewer.accessTier === "CREATIVE" ? "Set a page down." : "Submit a sample to begin."}
            </p>
          )}
          {posts.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="glow-hover block border border-gold-dim/40 bg-ink-2 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="display-caps text-base text-ivory">{p.title}</span>
                <span className="label-caps text-muted">{p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}</span>
              </div>
              <p className="label-caps mt-1 text-muted/80">{p.form} · {p.genre}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* progression audit */}
      {viewer.accessTier === "CREATIVE" && (
        <section aria-label="Progression history">
          <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">The record</h2>
          <div className="mt-4 space-y-2">
            {history.length === 0 && <p className="text-sm text-muted">A quiet history, so far.</p>}
            {history.map((h) => (
              <p key={h.id} className="text-sm text-ivory/80">
                <span className="text-muted">{h.createdAt.toLocaleDateString()} —</span>{" "}
                {h.fromLevel ? `${levelLabel(h.fromLevel)} → ` : ""}
                <span className="text-gold">{levelLabel(h.toLevel)}</span>
                <span className="text-muted"> · {h.reason}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      <Divider />

      <section aria-label="Settings" className="space-y-3 text-sm">
        <h2 className="label-caps text-gold">Settings</h2>
        <p className="text-muted">Verification: {viewer.identityVerified ? "college email confirmed" : "pending — some rooms stay closed until it clears."}</p>
        {!viewer.identityVerified && (
          <p className="text-muted">
            Verify from the <Link href="/enter" className="text-gold hover:underline">archive door</Link> if your domain was recently added.
          </p>
        )}
        <p className="text-muted">Report tools live beside every post, review, and commons note — look for “Report”.</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="display-caps text-2xl text-gold-light">{value}</p>
      <p className="label-caps mt-1 text-muted">{label}</p>
    </div>
  );
}
