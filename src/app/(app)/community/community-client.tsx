"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KINDS = [
  { value: "BANTER", label: "Banter" },
  { value: "CONFESSION", label: "Confession" },
  { value: "GENERAL", label: "General" },
] as const;

export function CommunityComposer() {
  const router = useRouter();
  const [kind, setKind] = useState<string>("BANTER");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, body }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not post.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
      <div className="flex gap-2" role="group" aria-label="Post kind">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            aria-pressed={kind === k.value}
            className={`label-caps border px-3 py-1.5 transition-colors ${
              kind === k.value ? "border-gold text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={kind === "CONFESSION" ? "Say the thing you would not sign your name to…" : "Say something to the room…"}
        className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2.5 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={busy || !body.trim()}
          className="label-caps border border-gold bg-oxblood px-5 py-2 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
        >
          {kind === "CONFESSION" ? "Whisper it" : "Post"}
        </button>
      </div>
    </form>
  );
}

export function FlagButton({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      if (res.ok) {
        setSent(true);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <span className="label-caps text-gold/70">Flagged.</span>;

  return (
    <>
      <button onClick={() => setOpen(true)} className="label-caps text-muted/70 transition-colors hover:text-gold">
        Flag
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Flag content">
          <form onSubmit={submit} className="w-full max-w-md border border-gold-dim bg-ink-2 p-6">
            <h3 className="display-caps text-lg text-ivory">Flag for hate only</h3>
            <p className="mt-2 text-sm text-muted">
              In this room, the admins act on hate and cruelty. Dark or sensitive subjects are not violations.
            </p>
            <textarea
              required
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Tell the admins why."
              className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory focus:border-gold focus:outline-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="label-caps text-muted hover:text-ivory">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="label-caps border border-gold bg-oxblood px-4 py-2 text-ivory hover:bg-oxblood-bright">
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
