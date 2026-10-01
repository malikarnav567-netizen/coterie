"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminSampleCard({
  sample,
}: {
  sample: {
    id: string;
    form: string;
    body: string;
    attemptNo: number;
    status: string;
    createdAt: string;
    authorName: string;
    authorEmail: string;
  };
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: "ACCEPT" | "REJECT") {
    if (decision === "REJECT" && feedback.trim().length < 3) {
      setError("Rejection requires feedback — the writer must know why.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId: sample.id, decision, feedbackText: feedback || undefined }),
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
          {sample.authorName} <span className="text-muted">· {sample.authorEmail}</span>
        </p>
        <p className="label-caps text-muted">
          Attempt {sample.attemptNo} · {sample.form.toLowerCase()} · {new Date(sample.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="poem-body mt-4 !max-w-none !text-[16px] text-ivory/90">{sample.body}</div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Feedback for the writer (required on rejection)."
        className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={() => decide("REJECT")}
          disabled={busy}
          className="label-caps border border-oxblood-bright px-4 py-2 text-[#e0a3a3] transition-colors hover:bg-oxblood/40 disabled:opacity-40"
        >
          Reject with feedback
        </button>
        <button
          onClick={() => decide("ACCEPT")}
          disabled={busy}
          className="label-caps border border-gold bg-oxblood px-4 py-2 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
        >
          Accept — welcome them in
        </button>
      </div>
    </div>
  );
}
