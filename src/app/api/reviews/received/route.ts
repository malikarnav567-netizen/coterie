import { requireTier, withGuard } from "@/lib/guard";
import { reviewsReceived } from "@/modules/reviews/service";
import { ok } from "@/lib/http";

export const GET = withGuard(async () => {
  const user = await requireTier("creative");
  const reviews = await reviewsReceived(user.id);
  return ok({ reviews });
});
