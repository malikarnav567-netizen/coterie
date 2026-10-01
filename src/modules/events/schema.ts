import { z } from "zod";
import { EVENT_TYPES, CREATIVE_LEVELS } from "@/lib/enums";

export const createEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  title: z.string().trim().min(3, "Give the occasion a name.").max(140),
  description: z.string().trim().min(1, "Say what it is.").max(4000),
  rules: z.string().trim().max(4000).optional().nullable(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  minLevel: z.enum(["PUBLIC", ...CREATIVE_LEVELS] as [string, ...string[]]).default("PUBLIC"),
  capacity: z.number().int().min(1).max(500).optional().nullable(),
});

export const updateEventStateSchema = z.object({
  state: z.enum(["SCHEDULED", "SIGNUP_OPEN", "LIVE", "CLOSED", "RESULTS"]),
});

export const signupSchema = z.object({
  postId: z.string().trim().optional().nullable(),
});
