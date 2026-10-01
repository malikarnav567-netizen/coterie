import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getViewer } from "@/lib/session";
import { REVIEW_PROMPTS, SECTION_2_PROMPT } from "@/lib/prompts";
import { getConfigNumber } from "@/modules/config/service";
import { ReviewLetter } from "./review-letter";

export const metadata = { title: "Write a review — Coterie" };

export default async function WriteReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/enter?next=/post/${id}/review`);
  if (viewer.accessTier !== "CREATIVE") redirect("/reviews");

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { displayName: true } } },
  });
  if (!post) notFound();

  const mine = await prisma.review.findUnique({
    where: { postId_reviewerId: { postId: id, reviewerId: viewer.id } },
  });
  if (mine) redirect(`/post/${id}`);

  const minWords = await getConfigNumber("review_min_words");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="parchment-card px-6 py-8 md:px-10 md:py-10">
        <p className="label-caps text-[color:var(--color-parchment-ink)]/60">
          A letter to {post.author.displayName}
        </p>
        <h1 className="display-caps mt-1.5 text-2xl text-[color:var(--color-parchment-ink)]">
          On “{post.title}”
        </h1>
        {post.intentLine && (
          <p className="accent-italic mt-3 !text-[color:var(--color-parchment-ink)]/75">
            “{post.intentLine}” — the writer&apos;s stated intent, read before you begin.
          </p>
        )}

        <ReviewLetter
          postId={post.id}
          minWords={minWords}
          prompts={REVIEW_PROMPTS[post.form as "POETRY" | "PROSE"]}
          section2Prompt={SECTION_2_PROMPT}
          form={post.form}
        />
      </div>
    </div>
  );
}
