import { requireAdmin, withGuard } from "@/lib/guard";
import { mentorCandidates, mentorDecision, candidateReviewSample, spotCheckCandidates } from "@/modules/progression/service";
import { fail, ok } from "@/lib/http";

export const GET = withGuard(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);
  const candidateId = url.searchParams.get("candidateId");
  if (candidateId) {
    const reviews = await candidateReviewSample(candidateId);
    return ok({ reviews });
  }
  const [candidates, spotChecks] = await Promise.all([mentorCandidates(), spotCheckCandidates()]);
  return ok({ candidates, spotChecks });
});

export const POST = withGuard(async (req) => {
  const admin = await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as {
    candidateId?: string;
    decision?: string;
    notes?: string;
  };
  if (!body.candidateId || (body.decision !== "APPROVE" && body.decision !== "DECLINE")) {
    return fail("A candidate and a decision are required.", 400);
  }
  try {
    await mentorDecision(admin, body.candidateId, body.decision, body.notes ?? "");
    return ok({ ok: true });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
