"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ postId }: { postId: string }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not post the comment.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-start gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="A plain-spoken note…"
        aria-label="Add a comment"
        className="flex-1 border border-gold-dim bg-ink-3 px-3 py-2 text-[15px] text-ivory placeholder:text-muted/60 focus:border-gold focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !body.trim()}
        className="label-caps mt-1 border border-gold bg-oxblood px-4 py-2.5 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
      >
        Post
      </button>
      {error && <span className="text-sm text-[#d98a8a]">{error}</span>}
    </form>
  );
}
