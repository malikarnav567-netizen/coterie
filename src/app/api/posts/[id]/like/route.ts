import { requireUser, withParams } from "@/lib/guard";
import { likePost } from "@/modules/posts/service";
import { fail, ok } from "@/lib/http";

export const POST = withParams(async (_req, { id }: { id: string }) => {
  const user = await requireUser(); // liking is open to every signed-in member
  try {
    const result = await likePost(user, id);
    return ok(result);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
