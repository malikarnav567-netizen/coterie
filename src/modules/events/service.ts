import { prisma } from "@/lib/db";
import { getConfig, getConfigBool } from "@/modules/config/service";
import { LEVEL_RANK } from "@/lib/enums";
import type { SessionUser } from "@/lib/guard";

/**
 * Events. Lifecycle SCHEDULED -> SIGNUP_OPEN -> LIVE -> CLOSED -> RESULTS.
 * Roast battles are consent-based opt-in with the rules shown prominently;
 * prompts may link a Post into the review flow (config).
 */

export async function listEvents(viewer: SessionUser | null) {
  const publicCanView = await getConfigBool("public_can_view_events");
  const where = viewer ? {} : publicCanView ? {} : { id: "___none___" };
  return prisma.event.findMany({
    where,
    include: {
      host: { select: { displayName: true, creativeLevel: true } },
      _count: { select: { entries: { where: { status: { not: "WITHDRAWN" } } } } },
    },
    orderBy: { startsAt: "asc" },
  });
}

export async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      host: { select: { displayName: true, creativeLevel: true } },
      entries: {
        include: { user: { select: { displayName: true, creativeLevel: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createEvent(host: SessionUser, input: {
  type: "PROMPT" | "ROAST" | "WORKSHOP";
  title: string;
  description: string;
  rules?: string | null;
  startsAt: Date;
  endsAt: Date;
  minLevel: string;
  capacity?: number | null;
}) {
  if (input.endsAt <= input.startsAt) {
    throw Object.assign(new Error("The occasion must end after it begins."), { status: 400 });
  }
  return prisma.event.create({
    data: {
      type: input.type,
      title: input.title,
      description: input.description,
      rules: input.rules ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      minLevel: input.minLevel,
      capacity: input.capacity ?? null,
      hostId: host.id,
      state: "SIGNUP_OPEN",
      discipline: "writing",
    },
  });
}

export async function setEventState(admin: SessionUser, eventId: string, state: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error("Event not found."), { status: 404 });
  return prisma.event.update({ where: { id: eventId }, data: { state } });
}

export async function signup(user: SessionUser, eventId: string, postId?: string | null) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Object.assign(new Error("Event not found."), { status: 404 });
  if (event.state !== "SIGNUP_OPEN") {
    throw Object.assign(new Error("Sign-up is not open for this occasion."), { status: 409 });
  }

  // Tier gate: creatives only for participation; view-only for public.
  if (user.accessTier !== "CREATIVE") {
    throw Object.assign(new Error("Show your work first — sign-up is for creatives."), { status: 403 });
  }

  // Level gate.
  const need = LEVEL_RANK[event.minLevel] ?? 0;
  const have = user.creativeLevel ? LEVEL_RANK[user.creativeLevel] ?? 0 : 0;
  if (have < need) {
    throw Object.assign(new Error("Your standing does not yet meet the threshold for this occasion."), { status: 403 });
  }

  // Capacity (workshops).
  if (event.capacity != null) {
    const count = await prisma.eventEntry.count({ where: { eventId, status: { not: "WITHDRAWN" } } });
    if (count >= event.capacity) {
      throw Object.assign(new Error("Every seat is taken."), { status: 409 });
    }
  }

  // Roast battles: consent-based opt-in; the rules are the contract.
  if (event.type === "ROAST" && !event.rules) {
    throw Object.assign(new Error("Roast battles require their rules text."), { status: 500 });
  }

  const existing = await prisma.eventEntry.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (existing) {
    if (existing.status === "WITHDRAWN") {
      return prisma.eventEntry.update({ where: { id: existing.id }, data: { status: "SIGNED_UP" } });
    }
    throw Object.assign(new Error("You are already on the list."), { status: 409 });
  }

  // Prompt entries may optionally link a Post into the review flow.
  const linkAllowed = await getConfigBool("prompt_entries_enter_review_flow");
  if (postId && !linkAllowed) {
    throw Object.assign(new Error("This prompt does not accept linked pieces."), { status: 409 });
  }

  return prisma.eventEntry.create({
    data: { eventId, userId: user.id, postId: postId ?? null, status: "SIGNED_UP" },
  });
}

export async function withdraw(user: SessionUser, eventId: string) {
  const entry = await prisma.eventEntry.findUnique({
    where: { eventId_userId: { eventId, userId: user.id } },
  });
  if (!entry) throw Object.assign(new Error("You are not signed up."), { status: 404 });
  return prisma.eventEntry.update({ where: { id: entry.id }, data: { status: "WITHDRAWN" } });
}
