import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { reviewQueue } from "@/modules/reviews/service";
import { excerpt } from "@/lib/text";
import { levelMark } from "@/lib/prompts";
import { WaxSeal } from "@/components/brand";
import { EmptyState } from "@/components/ui";
import { QueueFilter } from "./queue-filter";

export const metadata = { title: "Review queue — Coterie" };

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/reviews/queue");
  if (viewer.accessTier !== "CREATIVE") redirect("/reviews");

  const sp = await searchParams;
  const form = sp.form === "POETRY" || sp.form === "PROSE" ? sp.form : undefined;
  const posts = await reviewQueue(viewer, form);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory md:text-3xl">Review queue</h1>
        <p className="accent-italic mt-1">Waiting longest first. Your own pieces do not appear.</p>
      </div>

      <QueueFilter current={form ?? "ALL"} />

      {posts.length === 0 ? (
        <EmptyState title="The queue is clear." hint="Every published piece has a letter from you — or there is nothing published yet." />
      ) : (
        <div className="space-y-4">
          {posts.map((p) => {
            const days = Math.floor((Date.now() - p.createdAt.getTime()) / 86_400_000);
            return (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="glow-hover block border border-gold-dim/40 bg-ink-2 px-6 py-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label-caps text-muted">
                      {p.form} · {p.genre}
                    </p>
                    <h2 className="display-caps mt-1 text-lg text-ivory">{p.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm text-ivory/70">{excerpt(p.body, 24)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="label-caps text-gold">
                      Waiting: {days} {days === 1 ? "day" : "days"}
                    </span>
                    <div className="mt-2 flex items-center justify-end gap-2 text-xs text-muted">
                      {p.author.creativeLevel && <WaxSeal level={p.author.creativeLevel} size={20} />}
                      {p.author.displayName}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
