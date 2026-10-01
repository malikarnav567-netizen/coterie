import { NextRequest } from "next/server";
import { z } from "zod";
import { parseBody, fail, ok } from "@/lib/http";
import { requestOtp, OtpError } from "@/modules/identity/otp";

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
});

/** Ask for a 6-digit code. In dev the code is printed to the server console. */
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, requestSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const result = await requestOtp(parsed.data.email);
    return ok({ sentTo: result.sentTo, notice: result.notice });
  } catch (err) {
    const status = err instanceof OtpError ? err.status : 500;
    return fail((err as Error).message, status);
  }
}
