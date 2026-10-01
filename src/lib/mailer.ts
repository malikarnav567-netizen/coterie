import nodemailer from "nodemailer";

/**
 * The one real mailbox. When SMTP credentials are configured the code is
 * actually emailed; without them (dev with no account) the console is the
 * mailbox and the letter is printed to the server log instead.
 *
 * Config lives in .env / .env.local and is read on every send (call time, not
 * import time) so tests can force the console mailbox by clearing the vars:
 *   SMTP_HOST  e.g. smtp.gmail.com
 *   SMTP_PORT  465 (implicit TLS) or 587 (STARTTLS)
 *   SMTP_USER  the sending mailbox
 *   SMTP_PASS  its password / app password
 *   EMAIL_FROM e.g. "Coterie <you@gmail.com>" — a mailbox you control
 */

type SmtpConfig = { host: string; port: number; user: string; pass: string; from: string };

function readConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const from = process.env.EMAIL_FROM?.trim() || `Coterie <${user}>`;
  return { host, port, user, pass, from };
}

export function mailConfigured(): boolean {
  return readConfig() !== null;
}

let cached: { key: string; transporter: ReturnType<typeof nodemailer.createTransport> } | null = null;

function getTransporter(cfg: SmtpConfig) {
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      transporter: nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.port === 465,
        auth: { user: cfg.user, pass: cfg.pass },
      }),
    };
  }
  return cached.transporter;
}

export type MailResult =
  | { mode: "smtp"; delivered: true }
  | { mode: "smtp"; delivered: false; error: string }
  | { mode: "console"; delivered: false };

export async function sendMail(to: string, subject: string, body: string): Promise<MailResult> {
  const cfg = readConfig();
  if (!cfg) {
    console.log(
      `\n[coterie mail] To: ${to}\nSubject: ${subject}\n\n${body}\n(dev only — no SMTP configured, the code appears here instead of your inbox)\n`,
    );
    return { mode: "console", delivered: false };
  }

  try {
    await getTransporter(cfg).sendMail({ from: cfg.from, to, subject, text: body });
    return { mode: "smtp", delivered: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "SMTP send failed";
    console.error(`[coterie mail] SMTP send to ${to} failed: ${error}`);
    return { mode: "smtp", delivered: false, error };
  }
}
