import { requireTier, withGuard } from "@/lib/guard";
import { reasonTags } from "@/modules/ratings/service";
import { ok } from "@/lib/http";

export const GET = withGuard(async () => {
  await requireTier("creative");
  const tags = await reasonTags();
  return ok({ tags });
});
