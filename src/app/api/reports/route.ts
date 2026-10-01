import type { NextRequest } from "next/server";
import { requireUser, withGuard } from "@/lib/guard";
import { createReportSchema } from "@/modules/moderation/schema";
import { createReport } from "@/modules/moderation/service";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withGuard(async (req: NextRequest) => {
  const user = await requireUser();
  const parsed = await parseBody(req, createReportSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const report = await createReport(user, parsed.data);
    return ok(report, 201);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
