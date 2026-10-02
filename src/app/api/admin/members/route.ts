import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, withGuard } from "@/lib/guard";
import { listMembers, setMemberStatus } from "@/modules/identity/service";
import { parseBody, fail, ok } from "@/lib/http";

export const GET = withGuard(async (req: NextRequest) => {
  await requireAdmin();
  const search = req.nextUrl.searchParams.get("q") ?? undefined;
  const members = await listMembers(search);
  return ok({ members });
});

const decisionSchema = z.object({
  userId: z.string().min(1, "A member is required."),
  status: z.enum(["ACTIVE", "SUSPENDED"], { message: "Decision must be ACTIVE or SUSPENDED." }),
});

export const POST = withGuard(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const parsed = await parseBody(req, decisionSchema);
  if (!parsed.ok) return parsed.response;
  try {
    await setMemberStatus(admin, parsed.data.userId, parsed.data.status);
    return ok({ ok: true });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
