import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/guard";

/**
 * Moderation. Reports capture a content snapshot at report time. Admins decide
 * KEEP / HIDE / ASK_EDIT and record `wouldHaveBlocked` for pilot notes. Dark or
 * sensitive subject matter in creative work is NOT a violation by itself — the
 * admin queue carries that reminder.
 */

export const REPORTABLE: Record<string, {
  model: "post" | "review" | "communityPost" | "communityComment";
}> = {
  POST: { model: "post" },
  REVIEW: { model: "review" },
  COMMUNITY_POST: { model: "communityPost" },
  COMMUNITY_COMMENT: { model: "communityComment" },
};

async function snapshotFor(targetType: string, targetId: string): Promise<string> {
  switch (targetType) {
    case "POST": {
      const p = await prisma.post.findUnique({ where: { id: targetId } });
      return JSON.stringify({ title: p?.title, body: p?.body?.slice(0, 2000) });
    }
    case "REVIEW": {
      const r = await prisma.review.findUnique({ where: { id: targetId } });
      return JSON.stringify({
        whatWorked: r?.whatWorked,
        whatDidNot: r?.whatDidNot,
        oneSuggestion: r?.oneSuggestion,
      });
    }
    case "COMMUNITY_POST": {
      const c = await prisma.communityPost.findUnique({ where: { id: targetId } });
      return JSON.stringify({ kind: c?.kind, body: c?.body });
    }
    case "COMMUNITY_COMMENT": {
      const c = await prisma.communityComment.findUnique({ where: { id: targetId } });
      return JSON.stringify({ body: c?.body });
    }
    default:
      return "{}";
  }
}

export async function createReport(user: SessionUser, input: {
  targetType: string;
  targetId: string;
  reason: string;
}) {
  const known = REPORTABLE[input.targetType];
  if (!known) throw Object.assign(new Error("That cannot be reported."), { status: 400 });
  const snapshot = await snapshotFor(input.targetType, input.targetId);
  return prisma.report.create({
    data: {
      reporterId: user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      snapshot,
      reason: input.reason.slice(0, 1000),
      status: "OPEN",
    },
  });
}

export async function openReports() {
  return prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "asc" },
    include: { reporter: { select: { displayName: true } } },
  });
}

export async function resolveReport(admin: SessionUser, input: {
  reportId: string;
  action: "KEEP" | "HIDE" | "ASK_EDIT";
  note: string;
  wouldHaveBlocked: boolean;
}) {
  const report = await prisma.report.findUnique({ where: { id: input.reportId } });
  if (!report) throw Object.assign(new Error("Report not found."), { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.moderationAction.create({
      data: {
        reportId: report.id,
        adminId: admin.id,
        action: input.action,
        note: input.note.slice(0, 1000),
        wouldHaveBlocked: input.wouldHaveBlocked,
      },
    });
    await tx.report.update({
      where: { id: report.id },
      data: { status: "RESOLVED", resolvedBy: admin.id, resolvedAt: new Date() },
    });

    if (input.action === "HIDE") {
      const at = { status: "HIDDEN" as const };
      if (report.targetType === "POST") {
        await tx.post.update({ where: { id: report.targetId }, data: at }).catch(() => {});
      } else if (report.targetType === "REVIEW") {
        await tx.review.update({ where: { id: report.targetId }, data: at }).catch(() => {});
      } else if (report.targetType === "COMMUNITY_POST") {
        await tx.communityPost.update({ where: { id: report.targetId }, data: at }).catch(() => {});
      } else if (report.targetType === "COMMUNITY_COMMENT") {
        await tx.communityComment.update({ where: { id: report.targetId }, data: at }).catch(() => {});
      }
    }
  });
}

export async function resolvedReports() {
  return prisma.report.findMany({
    where: { status: "RESOLVED" },
    orderBy: { resolvedAt: "desc" },
    take: 30,
    include: {
      reporter: { select: { displayName: true } },
      actions: { include: { admin: { select: { displayName: true } } } },
    },
  });
}
