import type { NextRequest } from "next/server";
import { requireUser, requireTier, withGuard } from "@/lib/guard";
import { canAccessCommunity, listCommunity, createCommunityPost, createCommunityComment } from "@/modules/community/service";
import { createCommunityPostSchema, createCommunityCommentSchema } from "@/modules/community/schema";
import { parseBody, fail, ok } from "@/lib/http";

export const GET = withGuard(async () => {
  const user = await requireUser();
  if (!(await canAccessCommunity(user))) {
    return fail("The Commons after hours is for members.", 403);
  }
  const posts = await listCommunity(user);
  return ok({ posts });
});

export const POST = withGuard(async (req: NextRequest) => {
  const user = await requireUser();
  if (!(await canAccessCommunity(user))) {
    return fail("The Commons after hours is for members.", 403);
  }
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "posts";
  if (kind === "comments") {
    const postId = url.searchParams.get("postId") ?? "";
    const parsed = await parseBody(req, createCommunityCommentSchema);
    if (!parsed.ok) return parsed.response;
    const comment = await createCommunityComment(user, postId, parsed.data.body);
    return ok(comment, 201);
  }
  const parsed = await parseBody(req, createCommunityPostSchema);
  if (!parsed.ok) return parsed.response;
  const post = await createCommunityPost(user, parsed.data);
  return ok(post, 201);
});
