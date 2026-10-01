import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkle } from "@/components/brand";
import { getViewer } from "@/lib/session";

const TABS = [
  { href: "/admin", label: "Samples" },
  { href: "/admin/mentor-candidates", label: "Mentor candidates" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/config", label: "Config" },
  { href: "/admin/stats", label: "Stats" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/admin");
  if (!viewer.isAdmin) redirect("/feed");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gold-dim/40 bg-ink-2/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-8">
          <div className="flex items-center gap-2 text-gold">
            <Sparkle size={12} />
            <span className="display-caps text-base text-ivory">The Admin Room</span>
          </div>
          <nav aria-label="Admin" className="flex flex-wrap gap-5">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className="label-caps text-muted transition-colors hover:text-gold-light">
                {t.label}
              </Link>
            ))}
            <Link href="/feed" className="label-caps text-gold/80 transition-colors hover:text-gold-light">
              ← The commons
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
