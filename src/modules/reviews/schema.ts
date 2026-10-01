import { z } from "zod";

export const createReviewSchema = z.object({
  whatWorked: z.string().trim(),
  whatDidNot: z.string().trim(),
  oneSuggestion: z.string().trim(),
  readerResponse: z.string().trim().optional().nullable(),
});

export const rateReviewSchema = z.object({
  verdict: z.enum(["USEFUL", "SOMEWHAT", "NO"]),
  reasonTagCode: z.string().trim().min(1, "Choose a reason."),
});

export const decisionLabels: Record<string, string> = {
  USEFUL: "Useful",
  SOMEWHAT: "Somewhat",
  NO: "No",
};
