import { z } from "zod";
import { COMMUNITY_KINDS } from "@/lib/enums";

export const createCommunityPostSchema = z.object({
  kind: z.enum(COMMUNITY_KINDS),
  body: z.string().trim().min(1, "Say something.").max(2000, "Keep it to the room."),
});

export const createCommunityCommentSchema = z.object({
  body: z.string().trim().min(1, "Say something.").max(1000),
});
