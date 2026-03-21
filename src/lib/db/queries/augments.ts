import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { augmentStats } from "@/lib/db/schema";

/** Get overall augment stats (not per-comp) for a patch */
export async function getOverallAugmentStats(patchId: number) {
  return db
    .select()
    .from(augmentStats)
    .where(
      and(
        eq(augmentStats.patchId, patchId),
        isNull(augmentStats.compArchetypeId)
      )
    )
    .orderBy(augmentStats.avgPlacement);
}

/** Get augment stats for a specific comp */
export async function getAugmentStatsForComp(
  patchId: number,
  compArchetypeId: number
) {
  return db
    .select()
    .from(augmentStats)
    .where(
      and(
        eq(augmentStats.patchId, patchId),
        eq(augmentStats.compArchetypeId, compArchetypeId)
      )
    )
    .orderBy(augmentStats.avgPlacement);
}

/** Get stats for a specific augment across all comps */
export async function getStatsForAugment(patchId: number, augmentId: string) {
  return db
    .select()
    .from(augmentStats)
    .where(
      and(
        eq(augmentStats.patchId, patchId),
        eq(augmentStats.augmentId, augmentId)
      )
    )
    .orderBy(augmentStats.avgPlacement);
}

export async function upsertAugmentStat(data: {
  patchId: number;
  augmentId: string;
  compArchetypeId: number | null;
  avgPlacement: string;
  pickRate: string;
  sampleSize: number;
}) {
  await db
    .insert(augmentStats)
    .values(data)
    .onConflictDoNothing();
}
