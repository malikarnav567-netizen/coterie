import { prisma } from "@/lib/db";

/**
 * Identity. The single door is the OTP letter: a college email domain must
 * belong to an active Campus, and a verified code enrols the member straight
 * to verified PUBLIC. There is no password path.
 */

export function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export async function findCampusForEmail(email: string) {
  const domain = domainOf(email);
  if (!domain) return null;
  const campuses = await prisma.campus.findMany({ where: { active: true } });
  for (const campus of campuses) {
    let domains: string[] = [];
    try {
      domains = JSON.parse(campus.emailDomains) as string[];
    } catch {
      domains = [];
    }
    if (domains.map((d) => d.toLowerCase()).includes(domain)) return campus;
  }
  return null;
}

/**
 * The passwordless gate, shared by the OTP exchange: find the member row for
 * a college email, or enrol it (verified, PUBLIC). Non-college domains are
 * refused — this is the gate every sign-in funnels through.
 */
export async function ensureCollegeUser(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.status !== "ACTIVE") {
      throw Object.assign(new Error("This membership is suspended. Contact the Admin Room."), { status: 403 });
    }
    return existing;
  }
  const campus = await findCampusForEmail(email);
  if (!campus) {
    throw Object.assign(
      new Error("That email is not a college address. Coterie opens with your campus."),
      { status: 403 },
    );
  }
  return prisma.user.create({
    data: {
      email,
      displayName: email.split("@")[0] ?? email,
      campusId: campus.id,
      identityVerified: true,
      accessTier: "PUBLIC",
      isAdmin: false,
    },
  });
}
