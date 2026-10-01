import { prisma } from "@/lib/db";
import { findCampusForEmail } from "@/modules/identity/service";

/**
 * Re-checks a member's email against the campus register. If their domain has
 * since been added (or they corrected a typo), verification can be granted.
 */
export async function verifyCollegeDomain(userId: string, email: string) {
  const campus = await findCampusForEmail(email);
  if (!campus) {
    return { verified: false, message: "That domain is not on the campus register." };
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: { identityVerified: true, campusId: campus.id },
  });
  return { verified: user.identityVerified, message: "Your college email checks out." };
}
