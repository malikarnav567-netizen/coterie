import { requireUser, withGuard } from "@/lib/guard";
import { mySamples } from "@/modules/samples/service";
import { ok } from "@/lib/http";

export const GET = withGuard(async () => {
  const user = await requireUser();
  const samples = await mySamples(user.id);
  return ok({ samples });
});
