import { prisma } from "@/lib/db";
import { getConfigNumber } from "@/modules/config/service";
import type { ReviewerStats } from "@prisma/client";

/** Re-export the progression service's read helpers for server components. */
export { statsFor, progressionHistory } from "./service";

export type LevelProgress = {
  nextLevel: "REVIEWER" | "TRUSTED" | "MENTOR_CANDIDATE";
  label: string;
  pct: number;
  note?: string;
} | null;

export async function statsProgress(
  accessTier: string,
  creativeLevel: string | null,
  stats: ReviewerStats | null,
): Promise<LevelProgress> {
  if (accessTier !== "CREATIVE") return null;
  const useful = stats?.usefulCount ?? 0;
  const distinct = stats?.distinctUsefulRaters ?? 0;

  if (creativeLevel === "AMATEUR") {
    const need = await getConfigNumber("reviewer_useful_count");
    return {
      nextLevel: "REVIEWER",
      label: `${Math.min(useful, need)} of ${need} useful ratings`,
      pct: need ? useful / need : 0,
    };
  }
  if (creativeLevel === "REVIEWER") {
    const [needUseful, needDistinct] = await Promise.all([
      getConfigNumber("trusted_useful_count"),
      getConfigNumber("trusted_distinct_writers"),
    ]);
    const pctU = needUseful ? useful / needUseful : 0;
    const pctD = needDistinct ? distinct / needDistinct : 0;
    return {
      nextLevel: "TRUSTED",
      label: `${Math.min(useful, needUseful)}/${needUseful} useful · ${Math.min(distinct, needDistinct)}/${needDistinct} distinct writers`,
      pct: Math.min(pctU, pctD),
    };
  }
  if (creativeLevel === "TRUSTED") {
    const [needUseful, needDistinct] = await Promise.all([
      getConfigNumber("mentor_useful_min"),
      getConfigNumber("mentor_distinct_writers"),
    ]);
    const pctU = needUseful ? useful / needUseful : 0;
    const pctD = needDistinct ? distinct / needDistinct : 0;
    return {
      nextLevel: "MENTOR_CANDIDATE",
      label: `${Math.min(useful, needUseful)}/${needUseful} useful · ${Math.min(distinct, needDistinct)}/${needDistinct} distinct writers`,
      pct: Math.min(pctU, pctD),
      note: "Reaching this threshold invites the admins to read your reviews.",
    };
  }
  return null;
}

export async function _touch() {
  // keep prisma import used for future cross-module helpers
  void prisma;
}
