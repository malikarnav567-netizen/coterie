import { prisma } from "@/lib/db";
import { getConfigBool } from "@/modules/config/service";
import { excerpt } from "@/lib/text";
import type { SessionUser } from "@/lib/guard";

/**
 * Posts. Only CREATIVE tier may publish (guard + this module). Public users may
 * view the feed, like, and leave simple plain-text comments. Poetry line breaks
 * and stanza spacing are preserved verbatim — the body is never re-flowed;
 * rendering is the client's `white-space: pre-wrap` job.
 */

const FEED_PAGE_SIZE = 12;

export type FeedCard = {
  id: string;
  title: string;
  form: string;
  genre: string;
  excerpt: string;
  intentLine: string | null;
  authorName: string;
  authorLevel: string | null;
  authorId: string;
  reviewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export async function listFeed(opts: {
  form?: "ALL" | "POETRY" | "PROSE";
  genre?: string;
  page?: number;
}): Promise<{ cards: FeedCard[]; page: number; totalPages: number }> {
  const where = {
    status: "PUBLISHED" as const,
    ...(opts.form && opts.form !== "ALL" ? { form: opts.form } : {}),
    ...(opts.genre ? { genre: opts.genre } : {}),
  };
  const page = Math.max(1, opts.page ?? 1);

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, displayName: true, creativeLevel: true } },
        _count: { select: { likes: true, comments: true } },
      },
      skip: (page - 1) * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE,
    }),
  ]);

  const cards: FeedCard[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    form: p.form,
    genre: p.genre,
    excerpt: excerpt(p.body, 42),
    intentLine: p.intentLine,
    authorId: p.author.id,
    authorName: p.author.displayName,
    authorLevel: p.author.creativeLevel, // MENTOR_CANDIDATE renders as Trusted in the UI
    reviewCount: p.reviewCount,
    likeCount: p._count.likes,
    commentCount: p._count.comments,
    createdAt: p.createdAt.toISOString(),
  }));

  return { cards, page, totalPages: Math.max(1, Math.ceil(total / FEED_PAGE_SIZE)) };
}

export async function getPost(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, displayName: true, creativeLevel: true, accessTier: true } },
      likes: { select: { userId: true } },
      comments: {
        where: { post: { status: "PUBLISHED" } },
        include: { author: { select: { displayName: true, creativeLevel: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createPost(user: SessionUser, input: {
  title: string;
  form: "POETRY" | "PROSE";
  genre: string;
  body: string;
  intentLine?: string | null;
}) {
  const post = await prisma.post.create({
    data: {
      authorId: user.id,
      title: input.title,
      form: input.form,
      genre: input.genre,
      body: input.body, // verbatim — line breaks and stanza spacing are sacred
      intentLine: input.intentLine || null,
      status: "PUBLISHED",
    },
  });

  // Let reviewers know there is a new piece in the queue (no external fan-out in v1).
  return post;
}

export async function likePost(user: SessionUser, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error("Post not found."), { status: 404 });

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId: user.id } } });
    return { liked: false };
  }
  await prisma.postLike.create({ data: { postId, userId: user.id } });
  return { liked: true };
}

export async function commentOnPost(user: SessionUser, postId: string, body: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error("Post not found."), { status: 404 });
  // Simple plain-text comments for public users — no markdown, no length tricks.
  return prisma.postComment.create({
    data: { postId, authorId: user.id, body: body.slice(0, 1000) },
  });
}

export async function genresInUse(): Promise<string[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { genre: true },
    distinct: ["genre"],
  });
  return posts.map((p) => p.genre).sort();
}
