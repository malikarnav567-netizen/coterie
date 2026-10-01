import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/session";
import { reviewsReceived } from "@/modules/reviews/service";
import { reasonTags } from "@/modules/ratings/service";
import { levelMark } from "@/lib/prompts";
import { WaxSeal } from "@/components/brand";
import { EmptyState } from "@/components/ui";
import { RateControls } from "./rate-controls";

export const metadata = { title: "Reviews received — Coterie" };

export default async function ReceivedPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/reviews/received");
  if (viewer.accessTier !== "CREATIVE") redirect("/reviews");

  const [reviews, tags] = await Promise.all([reviewsReceived(viewer.id), reasonTags()]);
  const unrated = reviews.filter((r) => !r.rating).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory md:text-3xl">Reviews received</h1>
        <p className="accent-italic mt-1">
          Rate the review, never the reviewer. {unrated > 0 ? `${unrated} await your verdict.` : "All rated."}
        </p>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          title="Nothing here yet."
          hint="When other creatives review your work, their letters arrive here for your verdict."
        />
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`border bg-ink-2 px-6 py-5 ${
                r.rating ? "border-gold-dim/40" : "border-gold/70 shadow-[0_0_18px_rgba(201,164,92,0.08)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/post/${r.post.id}`} className="display-caps text-base text-ivory hover:underline">
                    {r.post.title}
                  </Link>
                  <p className="label-caps mt-0.5 text-muted">
                    {r.post.form} · from {r.reviewer.displayName} ({levelMark(r.reviewer.creativeLevel as never)})
                  </p>
                </div>
                {!r.rating && <span className="label-caps border border-gold px-2 py-0.5 text-[10px] text-gold">Awaiting your verdict</span>}
              </div>

              <div className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ivory/85">
                <p><span className="label-caps mr-2 text-gold/80">I</span>{r.whatWorked}</p>
                <p><span className="label-caps mr-2 text-gold/80">II</span>{r.whatDidNot}</p>
                <p><span className="label-caps mr-2 text-gold/80">III</span>{r.oneSuggestion}</p>
                {r.readerResponse && <p className="accent-italic !text-gold-light/90">{r.readerResponse}</p>}
              </div>

              <div className="mt-5 border-t border-gold-dim/30 pt-4">
                {r.rating ? (
                  <p className="label-caps text-muted">
                    Rated {r.rating.verdict.toLowerCase()} · {r.rating.reasonTagCode.replace(/_/g, " ")} — this letter is now sealed.
                  </p>
                ) : (
                  <RateControls reviewId={r.id} tags={tags.map((t) => ({ code: t.code, label: t.label, polarity: t.polarity }))} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
