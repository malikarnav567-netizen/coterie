import { NextRequest } from "next/server";
import { z } from "zod";
import { parseBody, fail, ok } from "@/lib/http";
import { verifyOtp, mintTicket, OtpError } from "@/modules/identity/otp";
import { ensureCollegeUser, doorRefusal } from "@/modules/identity/service";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  code: z.string().trim().min(4).max(10),
});

/**
 * Check a 6-digit code. Success consumes the code (single-use), resolves the
 * member, and — if the door opens — mints a 15-second handoff ticket the client
 * exchanges for a session through Auth.js's otp provider. New college inboxes
 * are seated PENDING; PENDING or SUSPENDED members are turned back here with a
 * plain reason instead of an opaque session failure.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, verifySchema);
  if (!parsed.ok) return parsed.response;

  let email: string;
  try {
    ({ email } = await verifyOtp(parsed.data.email, parsed.data.code));
  } catch (err) {
    const status = err instanceof OtpError ? err.status : 500;
    return fail((err as Error).message, status);
  }

  try {
    const member = await ensureCollegeUser(email);
    const refusal = doorRefusal(member.status);
    if (refusal) return fail(refusal, 403);
    return ok({ email, ticket: mintTicket(email), next: "/sample" });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
}
