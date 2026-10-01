"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VERDICTS = [
  { value: "USEFUL", label: "Useful" },
  { value: "SOMEWHAT", label: "Somewhat" },
  { value: "NO", label: "No" },
] as const;

export function RateControls({
  reviewId,
  tags,
}: {
  reviewId: string;
  tags: Array<{ code: string; label: string; polarity: string }>;
}) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowed = tags.filter((t) =>
    verdict === "USEFUL" ? t.polarity === "positive" : verdict === "NO" ? t.polarity === "negative" : true,
  );

  async function submit() {
    if (!verdict || !tag) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdict, reasonTagCode: tag }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not record the verdict.");
      }
    } finally {
      setBusy(false);
    }
  }

  const chip = (active: boolean) =>
    `label-caps border px-2.5 py-1 transition-colors ${
      active ? "border-gold bg-gold/10 text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"
    }`;

  return (
    <div>
      <div className="flex gap-2" role="group" aria-label="Verdict">
        {VERDICTS.map((v) => (
          <button
            key={v.value}
            onClick={() => {
              setVerdict(v.value);
              setTag(null);
            }}
            aria-pressed={verdict === v.value}
            className={chip(verdict === v.value)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {verdict && (
        <div className="mt-3">
          <p className="label-caps mb-2 text-muted">Why — one reason</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Reason">
            {allowed.map((t) => (
              <button key={t.code} onClick={() => setTag(t.code)} aria-pressed={tag === t.code} className={chip(tag === t.code)}>
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={submit}
            disabled={!tag || busy}
            className="label-caps mt-4 border border-gold bg-oxblood px-5 py-2 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
          >
            {busy ? "Recording…" : "Record the verdict"}
          </button>
          {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}
        </div>
      )}
    </div>
  );
}
