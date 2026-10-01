import type { NextRequest } from "next/server";
import { requireAdmin, withGuard } from "@/lib/guard";
import { pendingSamples, decideSample } from "@/modules/samples/service";
import { decideSampleSchema } from "@/modules/samples/schema";
import { parseBody, fail, ok } from "@/lib/http";

export const GET = withGuard(async () => {
  await requireAdmin();
  const samples = await pendingSamples();
  return ok({ samples });
});

export const POST = withGuard(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const parsed = await parseBody(req, decideSampleSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const sample = await decideSample(
      admin,
      parsed.data.sampleId,
      parsed.data.decision,
      parsed.data.feedbackText,
    );
    return ok({ sample });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
