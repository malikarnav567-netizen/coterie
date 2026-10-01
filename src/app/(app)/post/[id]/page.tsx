import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { reviewsForPost, canSeeReviewText } from "@/modules/reviews/service";
import { getConfigBool } from "@/modules/config/service";
import { levelMark } from "@/lib/prompts";
import { WaxSeal, Divider } from "@/components/brand";
import { LinkButton } from "@/components/ui";
import { PostActions, ReportDialog } from "./actions";
import { CommentForm } from "./comment-form";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) return null;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, displayName: true, creativeLevel: true } },
      likes: { where: { userId: viewer.id }, select: { userId: true } },
      comments: {
        where: { post: { status: "PUBLISHED" } },
        include: { author: { select: { displayName: true, creativeLevel: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
    },
  });
  if (!post || post.status !== "PUBLISHED") notFound();

  const reviews = await reviewsForPost(post.id);
  const showReviewText = await canSeeReviewText(viewer.accessTier === "CREATIVE", await getConfigBool("public_can_see_review_text"));
  const isCreative = viewer.accessTier === "CREATIVE";
  const isAuthor = viewer.id === post.authorId;

  return (
    <article className="mx-auto max-w-3xl">
      <p className="label-caps text-muted">
        {post.form} · {post.genre}
      </p>
      <h1 className="display-caps mt-2 text-3xl text-ivory md:text-4xl">{post.title}</h1>
      <div className="mt-3 flex items-center gap-3">
        {post.author.creativeLevel && <WaxSeal level={post.author.creativeLevel} size={30} />}
        <Link href={`/profile/${post.authorId}`} className="label-caps text-gold hover:text-gold-light">
          {post.author.displayName}
        </Link>
        <span className="text-sm text-muted">{levelMark(post.author.creativeLevel as never)}</span>
      </div>

      {post.intentLine && (
        <p className="accent-italic mt-5 text-lg">“{post.intentLine}”</p>
      )}

      <div className="poem-body mt-8 text-ivory/90">{post.body}</div>

      <div className="mt-8 flex items-center gap-5 border-y border-gold-dim/40 py-4">
        <PostActions postId={post.id} liked={post.likes.length > 0} likeCount={post._count.likes} reviewCount={post.reviewCount} />
        <div className="ml-auto">
          <ReportDialog targetType="POST" targetId={post.id} />
        </div>
      </div>

      <Divider className="my-10" />

      {/* ---- reviews ---- */}
      <section aria-label="Reviews">
        <div className="flex items-center justify-between">
          <h2 className="display-caps text-xl text-ivory">
            Reviews <span className="text-muted">({post.reviewCount})</span>
          </h2>
          {isCreative && !isAuthor && (
            <LinkButton href={`/post/${post.id}/review`} variant="primary">
              Write a review
            </LinkButton>
          )}
        </div>

        {reviews.length === 0 ? (
          <p className="mt-6 border border-gold-dim/40 bg-ink-2 px-6 py-8 text-center text-muted">
            Nothing here yet. Be the first to write.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="border border-gold-dim/40 bg-ink-2 px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <WaxSeal level={r.reviewer.creativeLevel} size={24} />
                    <span className="label-caps text-gold">{r.reviewer.displayName}</span>
                    <span className="text-xs text-muted">{levelMark(r.reviewer.creativeLevel as never)}</span>
                  </div>
                  {r.rating && (
                    <span className="label-caps border border-gold-dim/60 px-2 py-0.5 text-[10px] text-muted">
                      Rated {r.rating.verdict.toLowerCase()} · {r.rating.reasonTagCode.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                {showReviewText || r.reviewer.id === viewer.id ? (
                  <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-ivory/85">
                    <p>
                      <span className="label-caps mr-2 text-gold/80">I · What worked</span>
                      {r.whatWorked}
                    </p>
                    <p>
                      <span className="label-caps mr-2 text-gold/80">II · What did not</span>
                      {r.whatDidNot}
                    </p>
                    <p>
                      <span className="label-caps mr-2 text-gold/80">III · One suggestion</span>
                      {r.oneSuggestion}
                    </p>
                    {r.readerResponse && (
                      <p className="accent-italic !text-gold-light/90">
                        <span className="label-caps mr-2 not-italic text-gold/80">IV</span>
                        {r.readerResponse}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm italic text-muted">
                    The critique room is for those who have shown their work.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Divider className="my-10" />

      {/* ---- comments ---- */}
      <section aria-label="Comments">
        <h2 className="display-caps text-xl text-ivory">Comments</h2>
        <div className="mt-5 space-y-4">
          {post.comments.map((c) => (
            <div key={c.id} className="border-l border-gold-dim/40 pl-4">
              <p className="label-caps text-muted">
                {c.author.displayName}
                {c.author.creativeLevel && ` · ${levelMark(c.author.creativeLevel as never)}`}
              </p>
              <p className="mt-1 text-[15px] text-ivory/85">{c.body}</p>
            </div>
          ))}
          {post.comments.length === 0 && <p className="text-sm text-muted">No comments yet.</p>}
        </div>
        <div className="mt-5">
          <CommentForm postId={post.id} />
        </div>
      </section>
    </article>
  );
}
