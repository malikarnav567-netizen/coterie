import type { NextRequest } from "next/server";
import { requireUser, withGuard } from "@/lib/guard";
import { createSampleSchema } from "@/modules/samples/schema";
import { submitSample } from "@/modules/samples/service";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withGuard(async (req: NextRequest) => {
  const parsed = await parseBody(req, createSampleSchema);
  if (!parsed.ok) return parsed.response;
  const user = await requireUser();
  try {
    const sample = await submitSample(user, parsed.data.body, parsed.data.form);
    return ok(sample, 201);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
