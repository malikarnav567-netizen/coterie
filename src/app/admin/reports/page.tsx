import { openReports, resolvedReports } from "@/modules/moderation/service";
import { ReportCard } from "./report-card";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Reports — Coterie" };

function parseSnapshot(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function AdminReportsPage() {
  const [open, resolved] = await Promise.all([openReports(), resolvedReports()]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="display-caps text-2xl text-ivory">The moderation queue</h1>
        <p className="mt-2 border border-gold-dim/50 bg-ink-2 px-4 py-3 text-sm italic text-muted">
          Reminder: dark or sensitive subject matter in creative work is not, by itself, a violation.
          The critique room moderates cruelty; the commons moderates hate.
        </p>
      </div>

      <section>
        <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">Open</h2>
        {open.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing awaiting judgement.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {open.map((r) => (
              <ReportCard
                key={r.id}
                report={{
                  id: r.id,
                  targetType: r.targetType,
                  targetId: r.targetId,
                  reason: r.reason,
                  createdAt: r.createdAt.toISOString(),
                  reporterName: r.reporter.displayName,
                  snapshot: parseSnapshot(r.snapshot),
                }}
              />
            ))}
          </div>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">Recently resolved</h2>
          <div className="mt-4 space-y-2">
            {resolved.slice(0, 8).map((r) => {
              const action = r.actions[r.actions.length - 1];
              return (
                <p key={r.id} className="text-sm text-ivory/80">
                  <span className="label-caps text-muted">{r.targetType}</span> — {action?.action ?? "—"}
                  {action?.wouldHaveBlocked && <span className="text-gold"> · would have blocked</span>}
                  <span className="text-muted"> · {action?.note}</span>
                </p>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
