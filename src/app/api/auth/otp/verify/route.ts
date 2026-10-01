import { NextRequest } from "next/server";
import { z } from "zod";
import { parseBody, fail, ok } from "@/lib/http";
import { verifyOtp, mintTicket, OtpError } from "@/modules/identity/otp";

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  code: z.string().trim().min(4).max(10),
});

/**
 * Check a 6-digit code. Success consumes the code (single-use) and mints a
 * 15-second handoff ticket that the client exchanges for a session through
 * Auth.js's otp provider. Enrollment/verification happens at that exchange
 * (ensureCollegeUser): new college addresses become verified PUBLIC members.
 */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, verifySchema);
  if (!parsed.ok) return parsed.response;
  try {
    const { email } = await verifyOtp(parsed.data.email, parsed.data.code);
    return ok({ email, ticket: mintTicket(email), next: "/sample" });
  } catch (err) {
    const status = err instanceof OtpError ? err.status : 500;
    return fail((err as Error).message, status);
  }
}
