import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { emblemStats } from "@/lib/db/schema";

/** Get emblem stats for a specific comp */
export async function getEmblemStatsForComp(
  patchId: number,
  compArchetypeId: number
) {
  return db
    .select()
    .from(emblemStats)
    .where(
      and(
        eq(emblemStats.patchId, patchId),
        eq(emblemStats.compArchetypeId, compArchetypeId)
      )
    )
    .orderBy(emblemStats.avgPlacement);
}

/** Get all stats for a specific emblem */
export async function getStatsForEmblem(patchId: number, emblemItemId: string) {
  return db
    .select()
    .from(emblemStats)
    .where(
      and(
        eq(emblemStats.patchId, patchId),
        eq(emblemStats.emblemItemId, emblemItemId)
      )
    )
    .orderBy(emblemStats.avgPlacement);
}

export async function upsertEmblemStat(data: {
  patchId: number;
  emblemItemId: string;
  compArchetypeId: number;
  appliedToChampion: string | null;
  avgPlacement: string;
  usageRate: string;
  sampleSize: number;
}) {
  await db.insert(emblemStats).values(data).onConflictDoNothing();
}
