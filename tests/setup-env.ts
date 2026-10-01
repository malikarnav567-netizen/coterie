/**
 * Test runtime env: point Prisma at the dedicated coterie_test schema on the
 * shared Supabase instance (tests/global-setup.ts creates it before this runs).
 */
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    // missing file is fine
  }
}

const direct = process.env.DIRECT_URL ?? "";
if (!direct) {
  throw new Error("DIRECT_URL is not set — tests cannot reach the test schema.");
}
const sep = direct.includes("?") ? "&" : "?";
process.env.DATABASE_URL = `${direct}${sep}schema=coterie_test&sslmode=require`;
process.env.AUTH_SECRET = "test-secret";
process.env.DEV_BYPASS_VERIFICATION = "false";
