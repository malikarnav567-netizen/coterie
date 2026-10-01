import { prisma } from "@/lib/db";
import { getConfig, getConfigNumber } from "@/modules/config/service";
import { countWords } from "@/lib/text";
import type { SessionUser } from "@/lib/guard";

/**
 * Samples. State machine SUBMITTED -> IN_REVIEW -> ACCEPTED | REJECTED(feedback).
 * Rejected users may resubmit after the configured cooldown; attemptNo increments.
 * Only an admin acceptance lifts a user to CREATIVE/AMATEUR — self-declaration
 * is impossible because this is the only code path that touches the tier.
 */

export async function submitSample(user: SessionUser, body: string, form: "POETRY" | "PROSE") {
  const maxWords = await getConfigNumber("sample_max_words");
  if (countWords(body) > maxWords) {
    throw Object.assign(
      new Error(`The committee reads samples of at most ${maxWords} words.`),
      { status: 400 },
    );
  }

  const last = await prisma.sampleSubmission.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (last?.status === "REJECTED") {
    const cooldownHours = await getConfigNumber("sample_resubmit_cooldown_hours");
    const elapsed = (Date.now() - last.decidedAt!.getTime()) / 3_600_000;
    if (elapsed < cooldownHours) {
      const hoursLeft = Math.ceil(cooldownHours - elapsed);
      throw Object.assign(
        new Error(`The committee asks you to wait ${hoursLeft}h before submitting again.`),
        { status: 429 },
      );
    }
  }
  if (last && last.status !== "REJECTED") {
    throw Object.assign(new Error("A sample is already with the committee."), { status: 409 });
  }

  const admins = await prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } });
  const attemptNo = last ? last.attemptNo + 1 : 1;

  const [sample] = await prisma.$transaction(async (tx) => {
    const created = await tx.sampleSubmission.create({
      data: { userId: user.id, form, body, attemptNo, status: "SUBMITTED" },
    });
    for (const admin of admins) {
      await tx.notification.create({
        data: {
          userId: admin.id,
          type: "NEW_POST_IN_QUEUE",
          payload: JSON.stringify({ kind: "sample", sampleId: created.id, userId: user.id }),
        },
      } as never);
    }
    return [created];
  });

  return sample;
}

export async function mySamples(userId: string) {
  return prisma.sampleSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function decideSample(
  admin: SessionUser,
  sampleId: string,
  decision: "ACCEPT" | "REJECT",
  feedbackText?: string,
) {
  const sample = await prisma.sampleSubmission.findUnique({ where: { id: sampleId } });
  if (!sample) throw Object.assign(new Error("Sample not found."), { status: 404 });
  if (sample.status === "ACCEPTED" || sample.status === "REJECTED") {
    throw Object.assign(new Error("That sample has already been decided."), { status: 409 });
  }

  const status = decision === "ACCEPT" ? "ACCEPTED" : "REJECTED";

  await prisma.$transaction(async (tx) => {
    await tx.sampleSubmission.update({
      where: { id: sampleId },
      data: { status, feedbackText: feedbackText ?? null, decidedBy: admin.id, decidedAt: new Date() },
    });

    if (decision === "ACCEPT" && sample.status !== "ACCEPTED") {
      const user = await tx.user.findUnique({ where: { id: sample.userId } });
      if (user && user.accessTier !== "CREATIVE") {
        await tx.user.update({
          where: { id: user.id },
          data: { accessTier: "CREATIVE", creativeLevel: "AMATEUR" },
        });
        await tx.progressionEvent.create({
          data: {
            userId: user.id,
            fromLevel: null,
            toLevel: "AMATEUR",
            reason: "Sample accepted by the committee",
            decidedBy: admin.id,
          },
        });
      }
    }

    await tx.notification.create({
      data: {
        userId: sample.userId,
        type: "SAMPLE_DECISION",
        payload: JSON.stringify({ decision, sampleId, feedbackText: feedbackText ?? null }),
      },
    } as never);
  });

  return prisma.sampleSubmission.findUnique({ where: { id: sampleId } });
}

export async function pendingSamples() {
  return prisma.sampleSubmission.findMany({
    where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { displayName: true, email: true } } },
  });
}

export async function sampleCooldownHours() {
  return getConfig("sample_resubmit_cooldown_hours");
}
