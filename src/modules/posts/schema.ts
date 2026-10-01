import { z } from "zod";
import { FORMS } from "@/lib/enums";

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "Give the piece a title.").max(200),
  form: z.enum(FORMS),
  genre: z.string().trim().min(1, "Choose a genre.").max(60),
  body: z.string().trim().min(1, "The page is blank.").max(50_000),
  intentLine: z.string().trim().max(280).optional().nullable(),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Say something.").max(1000, "Keep it brief."),
});

export const listFeedSchema = z.object({
  form: z.enum(["ALL", "POETRY", "PROSE"]).default("ALL"),
  genre: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
