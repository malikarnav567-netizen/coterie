import { requireUser, withParams } from "@/lib/guard";
import { getPost } from "@/modules/posts/service";
import { fail, ok } from "@/lib/http";

export const GET = withParams(async (_req, { id }: { id: string }) => {
  await requireUser();
  const post = await getPost(id);
  if (!post) return fail("Not found.", 404);
  return ok({ post });
});
