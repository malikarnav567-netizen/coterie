import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/guard";

/**
 * Identity. The single door is the OTP letter: a college email domain must
 * belong to an active Campus, and a verified code enrols the member to
 * verified PUBLIC — but PENDING, held at the door until the Admin Room
 * approves. There is no password path.
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
 * The universal admin allowlist. Every address listed in ADMIN_EMAILS
 * (comma separated) is above the campus gate: it may sign in with the OTP
 * letter from any domain and is always granted the Admin Room. This is how
 * the owner keeps one console over every campus.
 */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isUniversalAdmin(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

/**
 * Why a verified inbox still cannot come in, phrased for the member. `null`
 * means the door opens. New members are seated PENDING, so the Admin Room has
 * a live queue to approve; a denial reads SUSPENDED.
 */
export function doorRefusal(status: string): string | null {
  if (status === "PENDING") {
    return "Your email is verified. Your seat is waiting for the Admin Room to approve it.";
  }
  if (status !== "ACTIVE") {
    return "This membership is suspended. Write to the Admin Room.";
  }
  return null;
}

/**
 * The passwordless gate, shared by the OTP exchange: find the member row for
 * a college email, or enrol it (verified, PUBLIC, PENDING). Non-college
 * domains are refused — this is the gate every sign-in funnels through.
 *
 * Universal admins (ADMIN_EMAILS) pass regardless of domain: they are seated
 * on the default campus and always hold isAdmin.
 */
export async function ensureCollegeUser(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // An allowlisted address keeps its seat even if the roster was edited.
    if (isUniversalAdmin(email) && !existing.isAdmin) {
      return prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
    }
    // Returned whatever its standing: the caller decides the door. A PENDING or
    // SUSPENDED member must still reach the roster so the Admin Room sees them.
    return existing;
  }

  if (isUniversalAdmin(email)) {
    const campus = await prisma.campus.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    if (!campus) {
      throw Object.assign(
        new Error("No campus is open yet — the Admin Room cannot be seated."),
        { status: 503 },
      );
    }
    return prisma.user.create({
      data: {
        email,
        displayName: email.split("@")[0] ?? email,
        campusId: campus.id,
        identityVerified: true,
        accessTier: "CREATIVE",
        creativeLevel: "AMATEUR",
        isAdmin: true,
      },
    });
  }

  const campus = await findCampusForEmail(email);
  if (!campus) {
    throw Object.assign(
      new Error("That email is not a college address. Coterie opens with your campus."),
      { status: 403 },
    );
  }
  // A brand-new college address verifies its inbox, then waits at the door:
  // PENDING until a universal admin approves it in the Admin Room.
  return prisma.user.create({
    data: {
      email,
      displayName: email.split("@")[0] ?? email,
      campusId: campus.id,
      identityVerified: true,
      accessTier: "PUBLIC",
      status: "PENDING",
      isAdmin: false,
    },
  });
}

/**
 * The roster, for the Admin Room. Newest first; universal admins and
 * suspended members are flagged so the console can label them.
 */
export async function listMembers(search?: string) {
  const q = search?.trim();
  const members = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      displayName: true,
      accessTier: true,
      creativeLevel: true,
      isAdmin: true,
      status: true,
      identityVerified: true,
      createdAt: true,
      campus: { select: { name: true } },
    },
  });
  const allowlist = adminEmails();
  return members.map((m) => ({ ...m, universalAdmin: allowlist.includes(m.email.toLowerCase()) }));
}

export type MemberRow = Awaited<ReturnType<typeof listMembers>>[number];

/**
 * Approve (ACTIVE) or deny (SUSPENDED) a member. Approval lifts a PENDING
 * newcomer through the door; a denial blocks the OTP door immediately — the
 * row is kept, so no work is lost and reinstatement is easy.
 */
export async function setMemberStatus(
  admin: SessionUser,
  userId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  if (userId === admin.id) {
    throw Object.assign(new Error("You cannot change your own standing."), { status: 400 });
  }
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw Object.assign(new Error("That member does not exist."), { status: 404 });
  if (status === "SUSPENDED" && isUniversalAdmin(target.email)) {
    throw Object.assign(new Error("A universal admin cannot be denied from here."), { status: 400 });
  }
  return prisma.user.update({ where: { id: userId }, data: { status } });
}
