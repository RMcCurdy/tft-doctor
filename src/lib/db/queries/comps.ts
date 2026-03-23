import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { compArchetypes } from "@/lib/db/schema";

export async function getCompArchetypesForPatch(patchId: number) {
  return db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.patchId, patchId))
    .orderBy(compArchetypes.avgPlacement);
}

export async function getCompArchetypeById(id: number) {
  const [comp] = await db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.id, id))
    .limit(1);
  return comp ?? null;
}

export async function upsertCompArchetype(data: {
  patchId: number;
  compName: string;
  traitSignature: unknown;
  coreChampions: unknown;
  flexSlots?: unknown;
  earlyBoard?: unknown;
  primaryCarry?: string;
  secondaryCarry?: string;
  isReroll?: boolean;
  requiresEmblem?: string;
  heroAugmentName?: string;
  avgPlacement: string;
  top4Rate: string;
  winRate: string;
  playRate: string;
  sampleSize: number;
}) {
  // Try to find an existing comp with the same name and patch
  const [existing] = await db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.compName, data.compName))
    .limit(1);

  if (existing && existing.patchId === data.patchId) {
    await db
      .update(compArchetypes)
      .set({
        ...data,
        lastUpdated: new Date(),
      })
      .where(eq(compArchetypes.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db
    .insert(compArchetypes)
    .values(data)
    .returning({ id: compArchetypes.id });
  return inserted.id;
}

export async function getTopComps(patchId: number, limit = 10) {
  return db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.patchId, patchId))
    .orderBy(compArchetypes.avgPlacement)
    .limit(limit);
}

export async function getCompsByPlayRate(patchId: number, limit = 10) {
  return db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.patchId, patchId))
    .orderBy(desc(compArchetypes.playRate))
    .limit(limit);
}
