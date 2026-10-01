import { z } from "zod";
import { REPORT_TARGET_TYPES, MOD_ACTIONS } from "@/lib/enums";

export const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().trim().min(1),
  reason: z.string().trim().min(3, "Tell the admins why.").max(1000),
});

export const resolveReportSchema = z.object({
  reportId: z.string().trim().min(1),
  action: z.enum(MOD_ACTIONS),
  note: z.string().trim().min(1, "Leave a note for the record.").max(1000),
  wouldHaveBlocked: z.boolean().default(false),
});
