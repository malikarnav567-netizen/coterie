"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReportCard({
  report,
}: {
  report: {
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    createdAt: string;
    reporterName: string;
    snapshot: Record<string, unknown>;
  };
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [whb, setWhb] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(action: "KEEP" | "HIDE" | "ASK_EDIT") {
    if (!note.trim()) {
      setError("A note is required for the record.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id, action, note, wouldHaveBlocked: whb }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        setError(data.error ?? "The decision could not be recorded.");
      }
    } finally {
      setBusy(false);
    }
  }

  const snapshotText = Object.values(report.snapshot)
    .filter((v) => typeof v === "string")
    .join(" · ")
    .slice(0, 400);

  return (
    <div className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps text-gold">{report.targetType.replace("_", " ")}</p>
        <p className="label-caps text-muted">
          {new Date(report.createdAt).toLocaleDateString()} · reported by {report.reporterName}
        </p>
      </div>

      <p className="mt-3 text-[15px] text-ivory/85">“{report.reason}”</p>
      {snapshotText && (
        <p className="mt-2 border-l border-gold-dim/40 pl-3 text-sm italic text-muted">{snapshotText}</p>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note for the record."
        className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={whb} onChange={(e) => setWhb(e.target.checked)} className="accent-[#8a2229]" />
        Would have blocked (pilot note)
      </label>
      {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button onClick={() => decide("KEEP")} disabled={busy} className="label-caps border border-gold-dim/60 px-4 py-2 text-muted transition-colors hover:text-ivory disabled:opacity-40">
          Keep
        </button>
        <button onClick={() => decide("ASK_EDIT")} disabled={busy} className="label-caps border border-gold px-4 py-2 text-gold transition-colors hover:text-gold-light disabled:opacity-40">
          Ask for an edit
        </button>
        <button onClick={() => decide("HIDE")} disabled={busy} className="label-caps border border-oxblood-bright bg-oxblood px-4 py-2 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40">
          Hide
        </button>
      </div>
    </div>
  );
}
