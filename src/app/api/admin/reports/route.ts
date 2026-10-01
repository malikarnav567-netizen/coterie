import type { NextRequest } from "next/server";
import { requireAdmin, withGuard } from "@/lib/guard";
import { openReports, resolveReport, resolvedReports } from "@/modules/moderation/service";
import { resolveReportSchema } from "@/modules/moderation/schema";
import { parseBody, fail, ok } from "@/lib/http";

export const GET = withGuard(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  if (url.searchParams.get("resolved") === "true") {
    const reports = await resolvedReports();
    return ok({ reports });
  }
  const reports = await openReports();
  return ok({ reports });
});

export const POST = withGuard(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const parsed = await parseBody(req, resolveReportSchema);
  if (!parsed.ok) return parsed.response;
  try {
    await resolveReport(admin, parsed.data);
    return ok({ ok: true });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
