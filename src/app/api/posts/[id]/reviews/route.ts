import { requireTier, withParams } from "@/lib/guard";
import { createReviewSchema } from "@/modules/reviews/schema";
import { createReview } from "@/modules/reviews/service";
import { parseBody, ok } from "@/lib/http";

export const POST = withParams(async (req, { id }: { id: string }) => {
  const user = await requireTier("creative"); // 403 for public, even via direct API
  const parsed = await parseBody(req, createReviewSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const review = await createReview(user, id, parsed.data);
    return ok(review, 201);
  } catch (err) {
    const e = err as Error & { status?: number; fieldErrors?: Record<string, string> };
    return Response.json(
      { error: e.message, fieldErrors: e.fieldErrors },
      { status: e.status ?? 500 },
    );
  }
});
