import { mentorUpkeep } from "@/modules/progression/service";
import { ok } from "@/lib/http";

/**
 * Upkeep cron. Protect with CRON_SECRET in production:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/upkeep
 */
export const GET = async (req: Request) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }
  }
  const result = await mentorUpkeep();
  return ok(result);
};
