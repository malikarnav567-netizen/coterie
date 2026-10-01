"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FORMS } from "@/lib/enums";

export function FeedFilters({
  form,
  genre,
  genres,
  basePath,
}: {
  form: string;
  genre: string | null;
  genres: string[];
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function push(over: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(over)) {
      if (v === null || v === "" || v === "ALL") p.delete(k);
      else p.set(k, v);
    }
    p.delete("page");
    router.push(`${basePath}${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const tabCls = (active: boolean) =>
    `label-caps border px-3 py-1.5 transition-colors ${
      active ? "border-gold text-gold" : "border-gold-dim/50 text-muted hover:text-ivory"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={tabCls(form === "ALL")} onClick={() => push({ form: null })} aria-pressed={form === "ALL"}>
        All
      </button>
      {FORMS.map((f) => (
        <button key={f} className={tabCls(form === f)} onClick={() => push({ form: f })} aria-pressed={form === f}>
          {f.charAt(0) + f.slice(1).toLowerCase()}
        </button>
      ))}
      {genres.length > 0 && (
        <label className="ml-auto flex items-center gap-2">
          <span className="label-caps text-muted">Genre</span>
          <select
            value={genre ?? ""}
            onChange={(e) => push({ genre: e.target.value || null })}
            className="label-caps border border-gold-dim/50 bg-ink-3 px-2 py-1.5 text-muted focus:border-gold focus:outline-none"
          >
            <option value="">All</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
