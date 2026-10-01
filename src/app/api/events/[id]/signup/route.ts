import { requireTier, withParams } from "@/lib/guard";
import { signup, withdraw } from "@/modules/events/service";
import { signupSchema } from "@/modules/events/schema";
import { parseBody, fail, ok } from "@/lib/http";

export const POST = withParams(async (req, { id }: { id: string }) => {
  const user = await requireTier("creative"); // participation is for creatives
  const parsed = await parseBody(req, signupSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const entry = await signup(user, id, parsed.data.postId ?? null);
    return ok(entry, 201);
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});

export const DELETE = withParams(async (_req, { id }: { id: string }) => {
  const user = await requireTier("creative");
  try {
    await withdraw(user, id);
    return ok({ ok: true });
  } catch (err) {
    return fail((err as Error).message, (err as { status?: number }).status ?? 500);
  }
});
