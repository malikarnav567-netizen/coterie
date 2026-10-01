import { requireTier, withGuard } from "@/lib/guard";
import { reviewQueue } from "@/modules/reviews/service";
import { ok } from "@/lib/http";

export const GET = withGuard(async (req) => {
  const user = await requireTier("creative");
  const url = new URL(req.url);
  const formParam = url.searchParams.get("form");
  const form = formParam === "POETRY" || formParam === "PROSE" ? formParam : undefined;
  const posts = await reviewQueue(user, form);
  return ok({ posts });
});
