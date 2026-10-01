import { requireUser, withGuard } from "@/lib/guard";
import { listFeed } from "@/modules/posts/service";
import { ok } from "@/lib/http";

export const GET = withGuard(async (req) => {
  await requireUser(); // unverified accounts are read-only holding state; signed-in only
  const url = new URL(req.url);
  const feed = await listFeed({
    form: (url.searchParams.get("form") as "ALL" | "POETRY" | "PROSE") ?? "ALL",
    genre: url.searchParams.get("genre") ?? undefined,
    page: Number(url.searchParams.get("page") ?? "1") || 1,
  });
  return ok(feed);
});
