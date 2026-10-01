import { CONFIG_DEFAULTS } from "@/modules/config/service";
import { prisma } from "@/lib/db";
import { ConfigEditor } from "./config-editor";

export const metadata = { title: "Config — Coterie" };

export default async function AdminConfigPage() {
  const rows = await prisma.config.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const config = Object.entries(CONFIG_DEFAULTS).map(([key, def]) => ({
    key,
    value: map.get(key) ?? def.value,
    type: def.type,
    label: def.label,
    overridden: map.has(key),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display-caps text-2xl text-ivory">The dials</h1>
        <p className="accent-italic mt-1">Every threshold in Coterie, editable without a redeploy.</p>
      </div>
      <ConfigEditor items={config} />
    </div>
  );
}
