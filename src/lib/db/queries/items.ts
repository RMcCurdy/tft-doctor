import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { itemStats } from "@/lib/db/schema";

/** Get item stats for a specific comp */
export async function getItemStatsForComp(
  patchId: number,
  compArchetypeId: number
) {
  return db
    .select()
    .from(itemStats)
    .where(
      and(
        eq(itemStats.patchId, patchId),
        eq(itemStats.compArchetypeId, compArchetypeId)
      )
    )
    .orderBy(itemStats.avgPlacement);
}

/** Get all stats for a specific item */
export async function getStatsForItem(patchId: number, itemId: string) {
  return db
    .select()
    .from(itemStats)
    .where(
      and(eq(itemStats.patchId, patchId), eq(itemStats.itemId, itemId))
    )
    .orderBy(itemStats.avgPlacement);
}

export async function upsertItemStat(data: {
  patchId: number;
  itemId: string;
  compArchetypeId: number;
  carriedByChampion: string | null;
  avgPlacement: string;
  usageRate: string;
  sampleSize: number;
}) {
  await db.insert(itemStats).values(data).onConflictDoNothing();
}
