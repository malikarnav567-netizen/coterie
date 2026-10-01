import { z } from "zod";
import { FORMS } from "@/lib/enums";

export const createSampleSchema = z.object({
  form: z.enum(FORMS),
  body: z.string().trim().min(1, "Paste your piece.").max(20_000, "That is longer than the sample allows."),
});

export const decideSampleSchema = z.object({
  sampleId: z.string().trim().min(1),
  decision: z.enum(["ACCEPT", "REJECT"]),
  feedbackText: z.string().trim().max(4000).optional(),
});
