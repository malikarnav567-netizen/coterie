import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { statsFor } from "@/modules/progression/service";
import { levelMark } from "@/lib/prompts";
import { WaxSeal } from "@/components/brand";
import { Tag } from "@/components/ui";

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await getViewer();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      accessTier: true,
      creativeLevel: true,
      createdAt: true,
      campus: { select: { name: true } },
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, form: true, genre: true, reviewCount: true },
      },
      badges: { where: { revokedAt: null }, select: { type: true } },
    },
  });
  if (!user) notFound();

  const stats = await statsFor(id);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="flex items-center gap-4">
        <WaxSeal level={user.creativeLevel} size={44} />
        <div>
          <h1 className="display-caps text-2xl text-ivory md:text-3xl">{user.displayName}</h1>
          <p className="label-caps mt-1 text-muted">
            {user.campus.name} · joined {user.createdAt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Tag variant="gold">{levelMark(user.creativeLevel as never)}</Tag>
        {user.badges.map((b, i) => (
          <Tag key={i} variant={b.type === "MENTOR" ? "mentor" : "default"}>
            {b.type.charAt(0) + b.type.slice(1).toLowerCase()}
          </Tag>
        ))}
      </div>

      {user.accessTier === "CREATIVE" && stats && (
        <section className="grid grid-cols-3 gap-4 border border-gold-dim/40 bg-ink-2 px-6 py-5 text-center">
          <div>
            <p className="display-caps text-xl text-gold-light">{stats.usefulCount}</p>
            <p className="label-caps mt-1 text-muted">Useful ratings</p>
          </div>
          <div>
            <p className="display-caps text-xl text-gold-light">{stats.distinctUsefulRaters}</p>
            <p className="label-caps mt-1 text-muted">Distinct writers</p>
          </div>
          <div>
            <p className="display-caps text-xl text-gold-light">{stats.reviewsWritten}</p>
            <p className="label-caps mt-1 text-muted">Reviews written</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="label-caps border-b border-gold-dim/40 pb-2 text-gold">Their shelf</h2>
        <div className="mt-4 space-y-3">
          {user.posts.length === 0 && <p className="text-sm text-muted">An empty shelf — so far.</p>}
          {user.posts.map((p) => (
            <Link key={p.id} href={`/post/${p.id}`} className="glow-hover block border border-gold-dim/40 bg-ink-2 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="display-caps text-base text-ivory">{p.title}</span>
                <span className="label-caps text-muted">{p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}</span>
              </div>
              <p className="label-caps mt-1 text-muted/80">{p.form} · {p.genre}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
