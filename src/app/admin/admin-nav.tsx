"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Samples" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/mentor-candidates", label: "Mentor candidates" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/config", label: "Config" },
  { href: "/admin/stats", label: "Stats" },
];

/**
 * The Admin Room tab strip. On phones it is a single, thumb-swipeable row of
 * full-size targets (the old wrapping nav crushed these to ~16px); on wider
 * screens it settles back into an even row. The current tab is underlined.
 */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin"
      className="-mx-5 flex gap-1 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:gap-6 md:overflow-visible md:px-0"
    >
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`label-caps touch-manipulation min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 py-3 transition-colors md:min-h-0 md:border-b-0 md:px-0 md:py-0 ${
              active
                ? "border-gold text-gold-light"
                : "border-transparent text-muted hover:text-gold-light"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
