import { createHash, createHmac, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";
import { mailConfigured, sendMail } from "@/lib/mailer";

/**
 * Email one-time codes. A request emails a 6-digit code to a college address;
 * verifying it signs the member in (or verifies their enrollment). With SMTP
 * credentials configured the letter is really sent; without them the console
 * is the mailbox (dev).
 *
 * Rules baked in:
 * - codes are single-use (consumed on success)
 * - 10 minutes to live
 * - at most 5 verification attempts per code
 * - the code is stored only as a hash; a database leak reveals nothing
 */

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export class OtpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function hashCode(identifier: string, code: string): string {
  const secret = process.env.AUTH_SECRET ?? "coterie-dev-secret";
  return createHash("sha256").update(`${identifier}:${code}:${secret}`).digest("hex");
}

/** Deliver the code. Real SMTP when configured; the console otherwise. */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Issue a fresh 6-digit code for an email. Returns the delivery notice. */
export async function requestOtp(rawEmail: string): Promise<{ sentTo: string; notice: string }> {
  const email = normalizeEmail(rawEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new OtpError("Enter a valid email address.");
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.emailOtp.create({
    data: {
      identifier: email,
      codeHash: hashCode(email, code),
      purpose: "SIGNIN",
      sentTo: email,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  const result = await sendMail(
    email,
    "Your Coterie verification code",
    `Your verification code is:\n\n    ${code}\n\nIt opens the Archive once and expires in 10 minutes.\nIf you did not request it, ignore this letter.`,
  );

  if (result.mode === "smtp" && !result.delivered) {
    // The row above will simply expire; the next request issues a fresh code.
    throw new OtpError("The letter could not be sent — check back in a moment.", 502);
  }

  return {
    sentTo: email,
    notice: result.mode === "smtp"
      ? "The 6-digit code is in your inbox — it expires in ten minutes."
      : "No SMTP is configured: the 6-digit code is printed in the server console (.dev.log).",
  };
}

/**
 * Verify a code for an email. On success the code is consumed and the caller
 * learns whether the address belongs to a member already.
 */
export async function verifyOtp(rawEmail: string, code: string): Promise<{ email: string }> {
  const email = normalizeEmail(rawEmail);
  const cleaned = code.replace(/\D/g, "");
  if (cleaned.length !== 6) {
    throw new OtpError("The code is six digits.");
  }

  const otp = await prisma.emailOtp.findFirst({
    where: { identifier: email, purpose: "SIGNIN", consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) {
    throw new OtpError("No live code for that email — request a fresh letter.", 410);
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new OtpError("Too many wrong tries. Request a fresh letter.", 429);
  }

  if (hashCode(email, cleaned) !== otp.codeHash) {
    await prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    const left = MAX_ATTEMPTS - (otp.attempts + 1);
    throw new OtpError(left > 0 ? `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.` : "Too many wrong tries. Request a fresh letter.", 400);
  }

  await prisma.emailOtp.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { email };
}

/**
 * Handoff ticket. After the verify route consumes a correct code, it mints a
 * 15-second signed ticket so the client can complete sign-in through Auth.js
 * without the code being checked twice. Meaningless outside this server and
 * worthless after 15 seconds.
 */
export function mintTicket(email: string): string {
  const secret = process.env.AUTH_SECRET ?? "coterie-dev-secret";
  const exp = Date.now() + 15_000;
  const sig = createHmac("sha256", secret).update(`${email}:${exp}`).digest("hex").slice(0, 32);
  return `${exp}.${sig}`;
}

export function consumeTicket(email: string, ticket: string): boolean {
  const [expRaw, sig] = String(ticket).split(".");
  const exp = Number(expRaw);
  if (!exp || !sig || Date.now() > exp) return false;
  const secret = process.env.AUTH_SECRET ?? "coterie-dev-secret";
  const expected = createHmac("sha256", secret).update(`${email}:${exp}`).digest("hex").slice(0, 32);
  return sig.length === expected.length && sig === expected;
}
