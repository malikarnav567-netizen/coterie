import Link from "next/link";
import { getViewer } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getConfigBool } from "@/modules/config/service";
import { EmptyState } from "@/components/ui";
import { EventCard } from "./event-card";

export const metadata = { title: "Events — Coterie" };

export default async function EventsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const publicCanView = await getConfigBool("public_can_view_events");
  if (viewer.accessTier !== "CREATIVE" && !viewer.isAdmin && !publicCanView) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="display-caps text-2xl text-ivory">Events are for creatives</h1>
        <p className="accent-italic mt-2">Earn your seat to see the calendar.</p>
      </div>
    );
  }

  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      host: { select: { displayName: true } },
      _count: { select: { entries: { where: { status: { not: "WITHDRAWN" } } } } },
    },
  });
  const myEntries = await prisma.eventEntry.findMany({
    where: { userId: viewer.id, status: { not: "WITHDRAWN" } },
    select: { eventId: true },
  });
  const mine = new Set(myEntries.map((e) => e.eventId));

  const groups = {
    PROMPT: events.filter((e) => e.type === "PROMPT"),
    ROAST: events.filter((e) => e.type === "ROAST"),
    WORKSHOP: events.filter((e) => e.type === "WORKSHOP"),
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="display-caps text-2xl text-ivory md:text-3xl">Occasions</h1>
        <p className="accent-italic mt-1">
          {viewer.accessTier === "CREATIVE" ? "Sign up, bring work, sharpen each other." : "You may watch; sign-up begins with a sample."}
        </p>
      </div>

      {events.length === 0 && <EmptyState title="Nothing on the calendar yet." />}

      {(["PROMPT", "ROAST", "WORKSHOP"] as const).map((type) =>
        groups[type].length > 0 ? (
          <section key={type} aria-label={type}>
            <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">
              {type === "PROMPT" ? "Prompts" : type === "ROAST" ? "Roast battles" : "Workshops"}
            </h2>
            <div className="mt-4 space-y-4">
              {groups[type].map((e) => (
                <EventCard
                  key={e.id}
                  event={{
                    ...e,
                    startsAt: e.startsAt.toISOString(),
                    endsAt: e.endsAt.toISOString(),
                  }}
                  signedUp={mine.has(e.id)}
                  canSignup={viewer.accessTier === "CREATIVE"}
                />
              ))}
            </div>
          </section>
        ) : null,
      )}
    </div>
  );
}
