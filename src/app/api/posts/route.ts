import { requireTier, withGuard } from "@/lib/guard";
import { createPostSchema } from "@/modules/posts/schema";
import { createPost } from "@/modules/posts/service";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withGuard(async (req) => {
  const user = await requireTier("creative"); // 403 for public, even via direct API
  const parsed = await parseBody(req, createPostSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const post = await createPost(user, parsed.data);
    return ok(post, 201);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
