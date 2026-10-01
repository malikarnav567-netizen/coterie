import { getViewer } from "@/lib/session";
import { redirect } from "next/navigation";
import { EnterForms } from "./enter-forms";
import { Sparkle, Divider } from "@/components/brand";

export const metadata = { title: "Enter the Archive — Coterie" };

export default async function EnterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  // DB-backed check, not the raw JWT session: a cookie that outlived its user
  // row (deleted or suspended member) must not bounce between /enter and /feed
  // forever — show the forms and let them sign in again.
  const viewer = await getViewer();
  if (viewer) redirect("/feed");
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-16">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-gold">
          <Sparkle size={13} />
          <span className="display-caps text-2xl text-ivory">Coterie</span>
        </div>
        <p className="label-caps mt-3 text-muted">Enter the Archive</p>
      </div>

      <div className="mt-8 border border-gold-dim/50 bg-ink-2 p-7 md:p-9">
        <EnterForms next={next ?? "/feed"} />
      </div>

      <Divider className="my-8" />
      <p className="text-center text-sm text-muted">
        Membership opens with a college email. Coterie is currently read by one campus.
      </p>
    </div>
  );
}
