"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, Textarea } from "@/components/ui";

export function SampleForm({ maxWords, locked }: { maxWords: number; locked: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<"POETRY" | "PROSE">("POETRY");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, body }),
      });
      const data = await res.json();
      if (res.ok) router.refresh();
      else setError(data.error ?? "Something went astray.");
    } finally {
      setBusy(false);
    }
  }

  if (locked) {
    return (
      <p className="mt-2 border border-gold-dim/50 bg-ink-2 px-6 py-5 text-center text-muted">
        A sample is already with the committee. They read in order of arrival.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-5">
      <div>
        <span className="label-caps mb-2 block text-muted">Form</span>
        <div className="flex gap-2">
          {(["POETRY", "PROSE"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setForm(f)}
              aria-pressed={form === f}
              className={`label-caps border px-4 py-2 ${form === f ? "border-gold text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Textarea
          label="Your sample"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          placeholder={`Paste a short piece — at most ${maxWords} words. Show us your intent.`}
        />
        <p className={`label-caps mt-1.5 text-right ${words > maxWords ? "text-[#d98a8a]" : "text-muted"}`}>
          {words} / {maxWords}
        </p>
      </div>

      {error && (
        <p className="border border-oxblood-bright/60 bg-oxblood/20 px-3 py-2 text-sm text-[#e0a3a3]" role="alert">
          {error}
        </p>
      )}

      <PrimaryButton type="submit" disabled={busy || !body.trim()} className="w-full justify-center">
        {busy ? "Sealing the envelope…" : "Send to the committee"}
      </PrimaryButton>
    </form>
  );
}
