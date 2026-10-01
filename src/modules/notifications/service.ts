import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * In-app notifications plus an email stub. The email transport is a console
 * log in dev; a real transport can replace `sendEmail` without touching
 * callers.
 */

export const NOTIFICATION_TYPES = [
  "SAMPLE_DECISION",
  "NEW_REVIEW",
  "REVIEW_RATED",
  "PROMOTION",
  "EVENT_REMINDER",
  "NEW_POST_IN_QUEUE",
  "MODERATION",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export async function notify(
  opts: {
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
  },
  tx?: Prisma.TransactionClient,
) {
  // When called inside a transaction, join it — a separate client would
  // deadlock against the transaction's write lock on SQLite.
  const client = tx ?? prisma;
  await client.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      payload: JSON.stringify(opts.payload),
    },
  });
}

export async function sendEmail(to: string, subject: string, body: string) {
  // Email stub — logs in dev. Integrate a transport here in production.
  console.log(`[coterie mail] to=${to} subject="${subject}"\n${body}\n`);
}

export async function listNotifications(userId: string, limit = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markRead(userId: string, id?: string) {
  const where: { userId: string; readAt: null; id?: string } = { userId, readAt: null };
  if (id) where.id = id;
  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
}
