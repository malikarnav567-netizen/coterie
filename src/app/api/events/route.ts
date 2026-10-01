import { requireUser, requireTier, withGuard } from "@/lib/guard";
import { getConfigBool } from "@/modules/config/service";
import { listEvents, getEvent } from "@/modules/events/service";
import { fail, ok } from "@/lib/http";

export const GET = withGuard(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const event = await getEvent(id);
    if (!event) return fail("Not found.", 404);
    // Public is view-only, and only when the config allows viewing at all.
    if (user.accessTier !== "CREATIVE" && !user.isAdmin) {
      const publicCanView = await getConfigBool("public_can_view_events");
      if (!publicCanView) return fail("Events open to creatives.", 403);
    }
    return ok({ event });
  }

  if (user.accessTier !== "CREATIVE" && !user.isAdmin) {
    const publicCanView = await getConfigBool("public_can_view_events");
    if (!publicCanView) return fail("Events open to creatives.", 403);
  }
  const events = await listEvents(user);
  return ok({ events });
});

export const POST = withGuard(async (req) => {
  const user = await requireTier("creative");
  void user; // event creation is an admin/host action; kept for module parity
  return fail("Event creation is done from the admin room.", 403);
});
