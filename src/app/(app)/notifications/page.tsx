import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { listNotifications, markRead } from "@/modules/notifications/service";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Notifications — Coterie" };

function describe(type: string, payload: Record<string, unknown>): string {
  switch (type) {
    case "NEW_REVIEW":
      return `${payload.reviewerName ?? "A member"} left a review of your work.`;
    case "REVIEW_RATED":
      return `Your review was rated ${String(payload.verdict ?? "").toLowerCase()}.`;
    case "PROMOTION":
      if (payload.upkeepFlag) return "Your mentor upkeep was flagged — the admins have been notified.";
      if (payload.upkeepRevoked) return "Your mentor badge was revoked pending the admins' review.";
      return `You have been raised to ${String(payload.toLevel ?? "a new level").replace("_", " ").toLowerCase()}.`;
    case "SAMPLE_DECISION":
      return payload.decision === "ACCEPT"
        ? "The committee accepted your sample. Welcome, creative."
        : "The committee could not accept your sample this time. Read their note and try again.";
    case "EVENT_REMINDER":
      return `An occasion you joined is beginning: ${String(payload.title ?? "")}.`;
    case "NEW_POST_IN_QUEUE":
      return payload.kind === "sample"
        ? "A new sample waits in the committee's queue."
        : "A new piece has entered the review queue.";
    case "MODERATION":
      return "The admins require your attention.";
    default:
      return "Something happened in the archive.";
  }
}

export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/notifications");
  const items = await listNotifications(viewer.id);
  await markRead(viewer.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="display-caps text-2xl text-ivory md:text-3xl">Letters</h1>
      {items.length === 0 ? (
        <EmptyState title="No letters yet." hint="Reviews, verdicts, and occasions will write to you here." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            let payload: Record<string, unknown> = {};
            try {
              payload = JSON.parse(n.payload);
            } catch {}
            return (
              <div
                key={n.id}
                className={`border px-5 py-4 ${n.readAt ? "border-gold-dim/30 bg-ink-2/50" : "border-gold/50 bg-ink-2"}`}
              >
                <p className="text-[15px] text-ivory/90">{describe(n.type, payload)}</p>
                <p className="label-caps mt-1.5 text-muted/70">{n.createdAt.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
