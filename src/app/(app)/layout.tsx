import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkle, WaxSeal } from "@/components/brand";
import { getViewer } from "@/lib/session";

const TABS = [
  { href: "/feed", label: "Feed", key: "feed" },
  { href: "/reviews", label: "Reviews", key: "reviews" },
  { href: "/events", label: "Events", key: "events" },
  { href: "/community", label: "Community", key: "community" },
  { href: "/profile", label: "Profile", key: "profile" },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/feed");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 border-b border-gold-dim/40 bg-ink/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8">
          <Link href="/feed" className="flex items-center gap-2 text-gold">
            <Sparkle size={12} />
            <span className="display-caps text-base text-ivory">Coterie</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {TABS.map((t) => (
              <Link key={t.key} href={t.href} className="label-caps text-muted transition-colors hover:text-gold-light">
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {viewer.isAdmin && (
              <Link href="/admin" className="label-caps text-gold/80 transition-colors hover:text-gold-light">
                Admin
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-2">
              <WaxSeal level={viewer.creativeLevel} size={26} />
              <span className="hidden text-sm text-ivory md:inline">{viewer.displayName}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-8 md:px-8 md:pb-16">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-gold-dim/50 bg-ink-2/95 backdrop-blur-sm md:hidden"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className="label-caps flex flex-col items-center gap-1 py-3 text-[9px] text-muted transition-colors hover:text-gold"
          >
            <TabGlyph tab={t.key} />
            {t.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function TabGlyph({ tab }: { tab: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.25, "aria-hidden": true } as const;
  switch (tab) {
    case "feed":
      return (
        <svg {...common}>
          <path d="M4 5h16M4 12h16M4 19h10" strokeLinecap="round" />
        </svg>
      );
    case "reviews":
      return (
        <svg {...common}>
          <path d="M12 3l2.2 4.9 5.3.6-4 3.6 1.1 5.3L12 14.7 7.4 17.4l1.1-5.3-4-3.6 5.3-.6L12 3z" strokeLinejoin="round" />
        </svg>
      );
    case "events":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="14" />
          <path d="M4 10h16M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      );
    case "community":
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 1 1-3.1-6.3L21 4l-1 3.6A8 8 0 0 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" strokeLinecap="round" />
        </svg>
      );
  }
}
