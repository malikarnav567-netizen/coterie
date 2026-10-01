import { execFileSync } from "node:child_process";

// Vitest does not load .env files; Node's built-in loader does (without
// overriding variables that are already set in the environment).
for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    // missing file is fine
  }
}

/**
 * Tests run against a dedicated Postgres schema (`coterie_test`) on the same
 * Supabase instance the app uses, so development data is never touched. The
 * schema is dropped, recreated, and pushed fresh before the suite.
 */
const TEST_SCHEMA = "coterie_test";

const direct = process.env.DIRECT_URL ?? "";
if (!direct) {
  throw new Error("DIRECT_URL is not set — tests cannot reach the test schema.");
}
const sep = direct.includes("?") ? "&" : "?";
export const testUrl = `${direct}${sep}schema=${TEST_SCHEMA}&sslmode=require`;

function sql(statement: string) {
  // `prisma db execute` needs an explicit connection URL (it does not read
  // schema datasources on its own); DIRECT_URL is the session pooler, safe
  // for DDL.
  execFileSync("npx", ["prisma", "db", "execute", "--stdin", "--url", direct], {
    stdio: ["pipe", "pipe", "pipe"],
    input: statement,
  });
}

export default function globalSetup() {
  sql(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE;`);
  sql(`CREATE SCHEMA ${TEST_SCHEMA};`);
  // The CLI reads directUrl (DIRECT_URL) for DDL, so both must point at the
  // test schema or the tables land in `public` instead.
  execFileSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl },
  });
}
