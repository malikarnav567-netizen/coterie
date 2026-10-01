import { prisma } from "@/lib/db";
import { getConfigNumber, getConfigBool } from "@/modules/config/service";
import { countWords } from "@/lib/text";
import type { SessionUser } from "@/lib/guard";

/**
 * Reviews. Three required sections, each meeting review_min_words, validated
 * server-side with per-section messages. One review per reviewer per post
 * (unique constraint + explicit check). Reviews lock once rated.
 */

export type ReviewSectionErrors = Record<string, string>;

export async function validateSections(input: {
  whatWorked: string;
  whatDidNot: string;
  oneSuggestion: string;
}): Promise<ReviewSectionErrors> {
  const min = await getConfigNumber("review_min_words");
  const errors: ReviewSectionErrors = {};
  const checks: Array<[string, string]> = [
    ["whatWorked", input.whatWorked],
    ["whatDidNot", input.whatDidNot],
    ["oneSuggestion", input.oneSuggestion],
  ];
  for (const [key, text] of checks) {
    const n = countWords(text);
    if (n < min) {
      errors[key] = `Section needs ${min} words — you have ${n}.`;
    }
  }
  return errors;
}

export async function createReview(user: SessionUser, postId: string, input: {
  whatWorked: string;
  whatDidNot: string;
  oneSuggestion: string;
  readerResponse?: string | null;
}) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error("Post not found."), { status: 404 });
  if (post.authorId === user.id) {
    throw Object.assign(new Error("You cannot review your own work."), { status: 403 });
  }

  const maxPerPost = await getConfigNumber("max_reviews_per_post");
  if (maxPerPost > 0 && post.reviewCount >= maxPerPost) {
    throw Object.assign(new Error("This piece has all the reviews it can hold."), { status: 409 });
  }

  const sectionErrors = await validateSections(input);
  if (Object.keys(sectionErrors).length > 0) {
    throw Object.assign(
      new Error("Each required section must meet the word minimum."),
      { status: 400, fieldErrors: sectionErrors },
    );
  }

  const existing = await prisma.review.findUnique({
    where: { postId_reviewerId: { postId, reviewerId: user.id } },
  });
  if (existing) {
    throw Object.assign(new Error("You have already reviewed this piece."), { status: 409 });
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        postId,
        reviewerId: user.id,
        authorId: post.authorId,
        whatWorked: input.whatWorked,
        whatDidNot: input.whatDidNot,
        oneSuggestion: input.oneSuggestion,
        readerResponse: input.readerResponse || null,
        status: "PUBLISHED",
      },
    });
    await tx.post.update({
      where: { id: postId },
      data: {
        reviewCount: { increment: 1 },
        ...(post.firstReviewedAt ? {} : { firstReviewedAt: new Date() }),
      },
    });
    await tx.notification.create({
      data: {
        userId: post.authorId,
        type: "NEW_REVIEW",
        payload: JSON.stringify({ reviewId: created.id, postId, reviewerName: user.displayName }),
      },
    } as never);
    return created;
  });

  return review;
}

export async function updateReview(user: SessionUser, reviewId: string, input: {
  whatWorked: string;
  whatDidNot: string;
  oneSuggestion: string;
  readerResponse?: string | null;
}) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw Object.assign(new Error("Review not found."), { status: 404 });
  if (review.reviewerId !== user.id) {
    throw Object.assign(new Error("That letter is not yours to amend."), { status: 403 });
  }
  if (review.ratedAt) {
    throw Object.assign(new Error("Reviews lock once they are rated."), { status: 409 });
  }
  const sectionErrors = await validateSections(input);
  if (Object.keys(sectionErrors).length > 0) {
    throw Object.assign(
      new Error("Each required section must meet the word minimum."),
      { status: 400, fieldErrors: sectionErrors },
    );
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      whatWorked: input.whatWorked,
      whatDidNot: input.whatDidNot,
      oneSuggestion: input.oneSuggestion,
      readerResponse: input.readerResponse || null,
    },
  });
}

export async function reviewsForPost(postId: string) {
  const reviews = await prisma.review.findMany({
    where: { postId, status: "PUBLISHED" },
    include: {
      reviewer: { select: { id: true, displayName: true, creativeLevel: true } },
      rating: { select: { verdict: true, reasonTagCode: true, createdAt: true } },
    },
  });

  // Trusted and Mentor reviews sort higher on other people's posts.
  const rank: Record<string, number> = { MENTOR: 2, MENTOR_CANDIDATE: 1, TRUSTED: 1 };
  return reviews.sort((a, b) => {
    const ra = rank[a.reviewer.creativeLevel ?? ""] ?? 0;
    const rb = rank[b.reviewer.creativeLevel ?? ""] ?? 0;
    if (rb !== ra) return rb - ra;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/** Reviews the writer received, with rating state — drives "Reviews I received". */
export async function reviewsReceived(authorId: string) {
  return prisma.review.findMany({
    where: { authorId, status: "PUBLISHED" },
    include: {
      post: { select: { id: true, title: true, form: true } },
      reviewer: { select: { displayName: true, creativeLevel: true } },
      rating: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function reviewQueue(user: { id: string }, form?: "POETRY" | "PROSE") {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      authorId: { not: user.id },
      ...(form ? { form } : {}),
    },
    include: {
      author: { select: { displayName: true, creativeLevel: true } },
      reviews: { where: { reviewerId: user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return posts
    .filter((p) => p.reviews.length === 0)
    .map(({ reviews, ...p }) => p);
}

export function canSeeReviewText(isCreative: boolean, publicCanSee: boolean) {
  return isCreative || publicCanSee;
}
