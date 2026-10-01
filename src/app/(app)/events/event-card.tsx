"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkle } from "@/components/brand";

export function EventCard({
  event,
  signedUp,
  canSignup,
}: {
  event: {
    id: string;
    type: string;
    title: string;
    description: string;
    rules: string | null;
    startsAt: string;
    endsAt: string;
    minLevel: string;
    capacity: number | null;
    state: string;
    host: { displayName: string };
    _count: { entries: number };
  };
  signedUp: boolean;
  canSignup: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(signedUp);

  async function toggleSignup() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}/signup`, {
        method: joined ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: joined ? undefined : JSON.stringify({ postId: null }),
      });
      if (res.ok) {
        setJoined(!joined);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not change your sign-up.");
      }
    } finally {
      setBusy(false);
    }
  }

  const start = new Date(event.startsAt);
  const seats = event.capacity ? `${event._count.entries} / ${event.capacity} seats` : `${event._count.entries} signed up`;

  return (
    <div className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="display-caps text-lg text-ivory">{event.title}</h3>
          <p className="label-caps mt-1 text-muted">
            {start.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · hosted by {event.host.displayName} · {event.state.replace("_", " ").toLowerCase()}
          </p>
        </div>
        <div className="text-right">
          <p className="label-caps text-gold">{seats}</p>
          {canSignup && event.state === "SIGNUP_OPEN" && (
            <button
              onClick={toggleSignup}
              disabled={busy}
              className={`label-caps mt-2 border px-4 py-1.5 transition-colors ${
                joined
                  ? "border-gold-dim/60 text-muted hover:text-ivory"
                  : "border-gold bg-oxblood text-ivory hover:bg-oxblood-bright"
              }`}
            >
              {joined ? "Withdraw" : "Sign up"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-[15px] text-ivory/85">{event.description}</p>

      {event.type === "ROAST" && event.rules && (
        <p className="mt-3 border border-oxblood-bright/50 bg-oxblood/15 px-4 py-2.5 text-sm text-[#e0b3b3]">
          <strong className="label-caps mr-2 text-[#e0b3b3]">Roast the piece, never the person.</strong>
          {event.rules}
        </p>
      )}
      {event.type !== "ROAST" && event.rules && (
        <p className="mt-3 text-sm italic text-muted">{event.rules}</p>
      )}

      {error && <p className="mt-2 text-sm text-[#d98a8a]">{error}</p>}
    </div>
  );
}
