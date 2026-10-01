"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function QueueFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(form: string) {
    const p = new URLSearchParams(params.toString());
    if (form === "ALL") p.delete("form");
    else p.set("form", form);
    router.push(`${pathname}${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const cls = (active: boolean) =>
    `label-caps border px-3 py-1.5 transition-colors ${
      active ? "border-gold text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"
    }`;

  return (
    <div className="flex gap-2" role="group" aria-label="Filter by form">
      {["ALL", "POETRY", "PROSE"].map((f) => (
        <button key={f} className={cls(current === f)} onClick={() => set(f)} aria-pressed={current === f}>
          {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}
