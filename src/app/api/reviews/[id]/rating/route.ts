import { requireTier, withParams } from "@/lib/guard";
import { rateReviewSchema } from "@/modules/reviews/schema";
import { rateReview } from "@/modules/ratings/service";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withParams(async (req, { id }: { id: string }) => {
  const user = await requireTier("creative"); // 403 for public, even via direct API
  const parsed = await parseBody(req, rateReviewSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const result = await rateReview(user, id, parsed.data.verdict, parsed.data.reasonTagCode);
    return ok(result, 201);
  } catch (err) {
    const e = err as Error & { status?: number };
    return fail(e.message, e.status ?? 500);
  }
});
