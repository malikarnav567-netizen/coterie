import Link from "next/link";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { listFeed } from "@/modules/posts/service";
import { getConfigNumber } from "@/modules/config/service";
import { excerpt } from "@/lib/text";
import { levelMark } from "@/lib/prompts";
import { WaxSeal, Sparkle } from "@/components/brand";
import { EmptyState, LinkButton } from "@/components/ui";
import { FeedFilters } from "./filters";

export const metadata = { title: "The Commons — Coterie" };

type Search = { form?: string; genre?: string; page?: string };

export default async function FeedPage({ searchParams }: { searchParams: Promise<Search> }) {
  const viewer = await getViewer();
  if (!viewer) return null;
  const sp = await searchParams;
  const form = sp.form === "POETRY" || sp.form === "PROSE" ? sp.form : "ALL";
  const page = Number(sp.page ?? "1") || 1;
  const genre = sp.genre || undefined;

  const [{ cards, totalPages }, genres] = await Promise.all([
    listFeed({ form, genre, page }),
    genresInUse(),
  ]);

  const qs = (over: Partial<Search>) => {
    const p = new URLSearchParams();
    const merged = { form, genre, page: String(page), ...over };
    if (merged.form && merged.form !== "ALL") p.set("form", merged.form);
    if (merged.genre) p.set("genre", merged.genre);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    const s = p.toString();
    return s ? `/feed?${s}` : "/feed";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-caps text-2xl text-ivory md:text-3xl">The Commons</h1>
          <p className="accent-italic mt-1">Read what the campus is carrying.</p>
        </div>
        {viewer.accessTier === "CREATIVE" ? (
          <LinkButton href="/compose" variant="primary">
            New piece
          </LinkButton>
        ) : (
          <LinkButton href="/sample" variant="secondary">
            Submit a sample
          </LinkButton>
        )}
      </div>

      <FeedFilters
        form={form}
        genre={genre ?? null}
        genres={genres}
        basePath="/feed"
      />

      {cards.length === 0 ? (
        <EmptyState title="Nothing here yet. Be the first to write." />
      ) : (
        <div className="grid gap-6">
          {cards.map((card, i) => (
            <PostCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
          {page > 1 ? (
            <Link href={qs({ page: String(page - 1) })} className="label-caps text-gold hover:text-gold-light">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="label-caps text-muted">
            Folio {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={qs({ page: String(page + 1) })} className="label-caps text-gold hover:text-gold-light">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

async function genresInUse(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { genre: true },
    distinct: ["genre"],
  });
  return posts.map((p) => p.genre).sort();
}

function PostCard({ card }: { card: Awaited<ReturnType<typeof listFeed>>["cards"][number] }) {
  const isPoetry = card.form === "POETRY";
  return (
    <article className={`parchment-card glow-hover px-6 py-6 md:px-8 ${isPoetry ? "" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps text-[color:var(--color-parchment-ink)]/60">
            {card.form} · {card.genre}
          </p>
          <h2 className="display-caps mt-1.5 text-xl text-[color:var(--color-parchment-ink)]">
            <Link href={`/post/${card.id}`} className="hover:underline">
              {card.title}
            </Link>
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {card.authorLevel && <WaxSeal level={card.authorLevel} size={30} />}
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap font-[family-name:var(--font-body)] text-[15px] leading-relaxed text-[color:var(--color-parchment-ink)]/90">
        {card.excerpt}
      </p>

      {card.intentLine && (
        <p className="accent-italic mt-4 !text-[color:var(--color-parchment-ink)]/75 text-[15px]">
          “{card.intentLine}”
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-parchment-ink)]/20 pt-4">
        <Link
          href={`/profile/${card.authorId}`}
          className="label-caps text-[color:var(--color-parchment-ink)]/80 hover:underline"
        >
          {card.authorName}
          {card.authorLevel && ` · ${levelMark(card.authorLevel as never)}`}
        </Link>
        <div className="flex items-center gap-4 text-sm text-[color:var(--color-parchment-ink)]/70">
          <span>{card.reviewCount} {card.reviewCount === 1 ? "review" : "reviews"}</span>
          <span>{card.likeCount} ♥</span>
          <span>{card.commentCount} ✎</span>
        </div>
      </div>
    </article>
  );
}
