import { requireAdmin, withGuard } from "@/lib/guard";
import { CONFIG_DEFAULTS, setConfig, invalidateConfigCache } from "@/modules/config/service";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";

export const GET = withGuard(async () => {
  await requireAdmin();
  const rows = await prisma.config.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const config = Object.entries(CONFIG_DEFAULTS).map(([key, def]) => ({
    key,
    value: map.get(key) ?? def.value,
    type: def.type,
    label: def.label,
    overridden: map.has(key),
  }));
  return ok({ config });
});

export const POST = withGuard(async (req) => {
  await requireAdmin();
  const body = (await req.json().catch(() => ({}))) as { updates?: Array<{ key: string; value: string }> };
  const updates = body.updates ?? [];
  for (const u of updates) {
    if (!(u.key in CONFIG_DEFAULTS)) return fail(`Unknown key: ${u.key}`, 400);
    const def = CONFIG_DEFAULTS[u.key];
    if (def.type === "number") {
      const n = Number(u.value);
      if (!Number.isFinite(n) || n < 0) return fail(`${u.key} must be a non-negative number.`, 400);
    }
    if (def.type === "boolean" && u.value !== "true" && u.value !== "false") {
      return fail(`${u.key} must be true or false.`, 400);
    }
    if (def.type === "level" && !["PUBLIC", "AMATEUR", "REVIEWER", "TRUSTED", "MENTOR"].includes(u.value)) {
      return fail(`${u.key} must be a level.`, 400);
    }
  }
  for (const u of updates) {
    await setConfig(u.key, u.value);
  }
  invalidateConfigCache();
  return ok({ ok: true, updated: updates.length });
});
