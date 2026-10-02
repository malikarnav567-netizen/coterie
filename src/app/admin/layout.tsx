import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkle } from "@/components/brand";
import { getViewer } from "@/lib/session";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/enter?next=/admin");
  if (!viewer.isAdmin) redirect("/feed");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gold-dim/40 bg-ink-2/80">
        <div className="mx-auto max-w-6xl px-5 py-3 md:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-gold">
              <Sparkle size={12} />
              <span className="display-caps text-base text-ivory">The Admin Room</span>
            </Link>
            <Link
              href="/feed"
              className="label-caps touch-manipulation shrink-0 text-gold/80 transition-colors hover:text-gold-light"
            >
              ← The commons
            </Link>
          </div>
          <div className="mt-1 md:mt-4">
            <AdminNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
