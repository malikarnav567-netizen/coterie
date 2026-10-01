"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CandidateCard({
  candidate,
}: {
  candidate: {
    noteId: string;
    candidateId: string;
    name: string;
    email: string;
    reviews: Array<{
      id: string;
      title: string;
      whatWorked: string;
      whatDidNot: string;
      oneSuggestion: string;
      verdict: string | null;
    }>;
  };
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "DECLINE") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mentor-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.candidateId, decision, notes }),
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

  return (
    <div className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps text-gold">
          {candidate.name} <span className="text-muted">· {candidate.email}</span>
        </p>
        <p className="label-caps text-muted">{candidate.reviews.length} sample reviews shown</p>
      </div>

      <div className="mt-4 space-y-4">
        {candidate.reviews.map((r) => (
          <div key={r.id} className="border-l border-gold-dim/40 pl-4">
            <p className="label-caps text-muted">
              On “{r.title}”{r.verdict ? ` · rated ${r.verdict.toLowerCase()}` : " · unrated"}
            </p>
            <p className="mt-1.5 text-sm text-ivory/85"><span className="label-caps mr-1.5 text-gold/70">I</span>{r.whatWorked}</p>
            <p className="mt-1 text-sm text-ivory/85"><span className="label-caps mr-1.5 text-gold/70">II</span>{r.whatDidNot}</p>
            <p className="mt-1 text-sm text-ivory/85"><span className="label-caps mr-1.5 text-gold/70">III</span>{r.oneSuggestion}</p>
          </div>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes for the record."
        className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={() => decide("DECLINE")}
          disabled={busy}
          className="label-caps border border-oxblood-bright px-4 py-2 text-[#e0a3a3] transition-colors hover:bg-oxblood/40 disabled:opacity-40"
        >
          Decline — return to Trusted
        </button>
        <button
          onClick={() => decide("APPROVE")}
          disabled={busy}
          className="label-caps border border-gold bg-oxblood px-4 py-2 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
        >
          Approve as Mentor
        </button>
      </div>
    </div>
  );
}
