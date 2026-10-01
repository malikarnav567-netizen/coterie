import type { NextRequest } from "next/server";
import { requireTier, withParams } from "@/lib/guard";
import { createReviewSchema } from "@/modules/reviews/schema";
import { updateReview } from "@/modules/reviews/service";
import { parseBody } from "@/lib/http";

/** Edit an own review — allowed only until it has been rated (then it locks). */
export const PATCH = withParams(async (req: NextRequest, { id }: { id: string }) => {
  const user = await requireTier("creative");
  const parsed = await parseBody(req, createReviewSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const review = await updateReview(user, id, parsed.data);
    return Response.json(review as object);
  } catch (err) {
    const e = err as Error & { status?: number; fieldErrors?: Record<string, string> };
    return Response.json(
      { error: e.message, fieldErrors: e.fieldErrors },
      { status: e.status ?? 500 },
    );
  }
});
