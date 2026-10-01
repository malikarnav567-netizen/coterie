"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PostActions({
  postId,
  liked,
  likeCount,
  reviewCount,
}: {
  postId: string;
  liked: boolean;
  likeCount: number;
  reviewCount: number;
}) {
  const [isLiked, setIsLiked] = useState(liked);
  const [count, setCount] = useState(likeCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsLiked(data.liked);
        setCount((c) => (data.liked ? c + 1 : c - 1));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-5 text-sm text-muted">
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={isLiked}
        className={`label-caps flex items-center gap-2 transition-colors hover:text-gold ${isLiked ? "!text-gold" : ""}`}
      >
        <span aria-hidden="true">♥</span> {count}
      </button>
      <span className="label-caps">
        {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
      </span>
    </div>
  );
}

export function ReportDialog({ targetType, targetId }: { targetType: string; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

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
      }
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <span className="label-caps text-gold">The admins have it.</span>;

  return (
    <>
      <button onClick={() => setOpen(true)} className="label-caps text-muted transition-colors hover:text-gold">
        Report
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Report content">
          <form onSubmit={submit} className="w-full max-w-md border border-gold-dim bg-ink-2 p-6">
            <h3 className="display-caps text-lg text-ivory">Report to the admins</h3>
            <p className="mt-2 text-sm text-muted">
              Flag cruelty or hate. Dark or sensitive subject matter in creative work is not, by itself, a violation.
            </p>
            <textarea
              required
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell the admins why."
              className="mt-4 w-full border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
              rows={3}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="label-caps text-muted hover:text-ivory">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="label-caps border border-gold bg-oxblood px-4 py-2 text-ivory hover:bg-oxblood-bright"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
