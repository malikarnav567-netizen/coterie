import { requireUser, withParams } from "@/lib/guard";
import { statsFor, progressionHistory } from "@/modules/progression/service";
import { ok } from "@/lib/http";

export const GET = withParams(async (_req, { id }: { id: string }) => {
  const viewer = await requireUser();
  if (viewer.id !== id && !viewer.isAdmin) {
    return Response.json({ error: "That dossier is not yours." }, { status: 403 });
  }
  const [stats, history] = await Promise.all([
    statsFor(id),
    progressionHistory(id),
  ]);
  return ok({ stats, history });
});
