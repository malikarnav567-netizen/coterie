import nodemailer from "nodemailer";

/**
 * The one real mailbox. When SMTP credentials are configured the code is
 * actually emailed; without them (dev with no account) the console is the
 * mailbox and the letter is printed to the server log instead.
 *
 * Config lives in .env / .env.local:
 *   SMTP_HOST  e.g. smtp.gmail.com
 *   SMTP_PORT  465 (implicit TLS) or 587 (STARTTLS)
 *   SMTP_USER  the sending mailbox
 *   SMTP_PASS  its password / app password
 *   EMAIL_FROM e.g. "Coterie <you@gmail.com>" — must be a mailbox you control
 */

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM?.trim() || "Coterie <no-reply@example.com>";

export function mailConfigured(): boolean {
  return Boolean(host && user && pass);
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: host!,
      port,
      secure: port === 465,
      auth: { user: user!, pass: pass! },
    });
  }
  return transporter;
}

export type MailResult =
  | { mode: "smtp"; delivered: true }
  | { mode: "smtp"; delivered: false; error: string }
  | { mode: "console"; delivered: false };

export async function sendMail(to: string, subject: string, body: string): Promise<MailResult> {
  if (!mailConfigured()) {
    console.log(
      `\n[coterie mail] To: ${to}\nSubject: ${subject}\n\n${body}\n(dev only — no SMTP configured, the code appears here instead of your inbox)\n`,
    );
    return { mode: "console", delivered: false };
  }

  try {
    await getTransporter().sendMail({ from, to, subject, text: body });
    return { mode: "smtp", delivered: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "SMTP send failed";
    console.error(`[coterie mail] SMTP send to ${to} failed: ${error}`);
    return { mode: "smtp", delivered: false, error };
  }
}
