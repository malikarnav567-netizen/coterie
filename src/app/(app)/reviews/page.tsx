import Link from "next/link";
import { getViewer } from "@/lib/session";
import { GothicArch } from "@/components/brand";
import { LinkButton } from "@/components/ui";

export const metadata = { title: "Reviews — Coterie" };

export default async function ReviewsHub() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const isCreative = viewer.accessTier === "CREATIVE";

  if (!isCreative) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <GothicArch className="mx-auto text-gold/30" size={90} />
        <h1 className="display-caps mt-6 text-2xl text-ivory">The critique room is locked</h1>
        <p className="accent-italic mt-2 text-lg">
          The critique room is for those who have shown their work.
        </p>
        <p className="mt-4 text-muted">
          Submit a short sample to the admins. Acceptance opens reviews, ratings, and events.
        </p>
        <div className="mt-8 flex justify-center">
          <LinkButton href="/sample" variant="primary">
            Earn your seat
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <h1 className="display-caps text-2xl text-ivory md:text-3xl">The critique room</h1>
      <p className="accent-italic">Two doors: what you owe, and what you are owed.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Link
          href="/reviews/queue"
          className="parchment-card glow-hover block px-6 py-8 text-center"
        >
          <p className="display-caps text-lg text-[color:var(--color-parchment-ink)]">Review queue</p>
          <p className="accent-italic mt-2 !text-[color:var(--color-parchment-ink)]/75">
            Pieces waiting longest, yours excluded.
          </p>
        </Link>
        <Link
          href="/reviews/received"
          className="border border-gold-dim/50 bg-ink-2 glow-hover block px-6 py-8 text-center"
        >
          <p className="display-caps text-lg text-ivory">Reviews received</p>
          <p className="accent-italic mt-2">
            Rate what was useful. Reviews lock once rated.
          </p>
        </Link>
      </div>
    </div>
  );
}
