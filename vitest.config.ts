import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup-env.ts"],
    environment: "node",
    // Supabase adds network round-trips on every query; the heavy progression
    // test alone does 60+ sequential ones. Keep the ceiling generous.
    testTimeout: 120000,
    // One shared test schema on Supabase + one shared Prisma client: a single
    // fork, no module isolation, files run strictly in order.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    isolate: false,
  } as never,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
