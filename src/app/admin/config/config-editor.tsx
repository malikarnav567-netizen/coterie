"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { key: string; value: string; type: string; label: string; overridden: boolean };

export function ConfigEditor({ items }: { items: Item[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.key, i.value])),
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  function set(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
    setStatus(null);
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const updates = items.map((i) => ({ key: i.key, value: values[i.key] }));
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      setStatus(res.ok ? "The dials are set." : (data.error ?? "Could not save."));
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-32 border border-gold-dim bg-ink-3 px-2 py-1.5 text-right font-[family-name:var(--font-body)] text-sm text-ivory focus:border-gold focus:outline-none";

  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.key} className="flex flex-wrap items-center justify-between gap-3 border border-gold-dim/30 bg-ink-2 px-5 py-3.5">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-body)] text-sm text-ivory/90">{i.label}</p>
            <p className="label-caps mt-0.5 text-muted/70">
              {i.key}
              {i.overridden ? " · overridden" : " · default"}
            </p>
          </div>
          {i.type === "boolean" ? (
            <button
              onClick={() => set(i.key, values[i.key] === "true" ? "false" : "true")}
              aria-pressed={values[i.key] === "true"}
              className={`label-caps border px-3 py-1.5 transition-colors ${
                values[i.key] === "true" ? "border-gold text-gold" : "border-gold-dim/50 text-muted"
              }`}
            >
              {values[i.key] === "true" ? "On" : "Off"}
            </button>
          ) : i.type === "level" ? (
            <select value={values[i.key]} onChange={(e) => set(i.key, e.target.value)} className="border border-gold-dim bg-ink-3 px-2 py-1.5 text-sm text-ivory focus:border-gold focus:outline-none">
              {["PUBLIC", "AMATEUR", "REVIEWER", "TRUSTED", "MENTOR"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              step="any"
              min={i.type === "number" ? 0 : undefined}
              value={values[i.key]}
              onChange={(e) => set(i.key, e.target.value)}
              className={inputCls}
              aria-label={i.label}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        {status ? (
          <p className="text-sm text-gold-light" role="status">
            {status}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={save}
          disabled={busy}
          className="label-caps border border-gold bg-oxblood px-6 py-2.5 text-ivory transition-colors hover:bg-oxblood-bright disabled:opacity-40"
        >
          {busy ? "Setting…" : "Set the dials"}
        </button>
      </div>
    </div>
  );
}
