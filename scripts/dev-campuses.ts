/**
 * Dev utility: add real art-and-writing colleges alongside the demo campus.
 * Upserts, so it is safe to run repeatedly; it never touches users or content.
 * Run with: npx tsx scripts/dev-campuses.ts
 */
import { prisma } from "../src/lib/db";

/** [name, domains...] — each domain is matched case-insensitively at sign-up. */
const COLLEGES: Array<[string, ...string[]]> = [
  ["Demo Arts College", "demo.edu"], // the seeded campus, kept for the demo logins
  ["Rhode Island School of Design", "risd.edu"],
  ["Parsons School of Design", "newschool.edu", "parsons.edu"],
  ["The Juilliard School", "juilliard.edu"],
  ["California Institute of the Arts", "calarts.edu"],
  ["Bennington College", "bennington.edu"],
  ["Bard College", "bard.edu"],
  ["Sarah Lawrence College", "sarahlawrence.edu", "slc.edu"],
  ["School of the Art Institute of Chicago", "saic.edu"],
  ["Royal College of Art", "rca.ac.uk"],
];

async function main() {
  for (const [name, ...domains] of COLLEGES) {
    const existing = await prisma.campus.findFirst({
      where: { name },
      select: { id: true, emailDomains: true },
    });
    if (existing) {
      const merged = Array.from(
        new Set(
          [...safeParse(existing.emailDomains), ...domains].map((d) => d.toLowerCase()),
        ),
      );
      await prisma.campus.update({
        where: { id: existing.id },
        data: { emailDomains: JSON.stringify(merged), active: true },
      });
      console.log(`updated ${name} -> ${merged.join(", ")}`);
    } else {
      await prisma.campus.create({
        data: { name, emailDomains: JSON.stringify(domains), active: true },
      });
      console.log(`created ${name} -> ${domains.join(", ")}`);
    }
  }
  const total = await prisma.campus.count();
  console.log(`\n${total} campuses now gate the gate.`);
}

function safeParse(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === "string") : [];
  } catch {
    return [];
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
