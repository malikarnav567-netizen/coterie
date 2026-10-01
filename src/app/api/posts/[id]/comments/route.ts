import type { NextRequest } from "next/server";
import { requireUser, withParams } from "@/lib/guard";
import { commentSchema } from "@/modules/posts/schema";
import { commentOnPost } from "@/modules/posts/service";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withParams(async (req: NextRequest, { id }: { id: string }) => {
  const user = await requireUser(); // simple comments are open to all members
  const parsed = await parseBody(req, commentSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const comment = await commentOnPost(user, id, parsed.data.body);
    return ok(comment, 201);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
