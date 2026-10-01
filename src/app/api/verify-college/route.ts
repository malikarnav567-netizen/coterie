import type { NextRequest } from "next/server";
import { requireUser, withGuard } from "@/lib/guard";
import { verifyCollegeDomain } from "@/modules/identity/verify";
import { ok } from "@/lib/http";

export const POST = withGuard(async (req: NextRequest) => {
  const user = await requireUser();
  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const result = await verifyCollegeDomain(user.id, body.email ?? user.email);
  return ok(result);
});
