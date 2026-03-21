import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { patches } from "@/lib/db/schema";

export async function getCurrentPatch() {
  const [patch] = await db
    .select()
    .from(patches)
    .where(eq(patches.isCurrent, true))
    .limit(1);
  return patch ?? null;
}

export async function getPatchByVersion(version: string) {
  const [patch] = await db
    .select()
    .from(patches)
    .where(eq(patches.patchVersion, version))
    .limit(1);
  return patch ?? null;
}

export async function upsertPatch(data: {
  patchVersion: string;
  setNumber: number;
  releaseDate?: Date;
  isCurrent?: boolean;
}) {
  const existing = await getPatchByVersion(data.patchVersion);
  if (existing) {
    await db
      .update(patches)
      .set({
        isCurrent: data.isCurrent,
        releaseDate: data.releaseDate,
      })
      .where(eq(patches.id, existing.id));
    return existing;
  }

  const [patch] = await db.insert(patches).values(data).returning();
  return patch;
}

export async function markPatchAsCurrent(patchId: number) {
  // Unset all current patches first
  await db.update(patches).set({ isCurrent: false });
  // Set the new one
  await db
    .update(patches)
    .set({ isCurrent: true })
    .where(eq(patches.id, patchId));
}

export async function incrementMatchCount(patchId: number, count: number) {
  const [patch] = await db
    .select()
    .from(patches)
    .where(eq(patches.id, patchId))
    .limit(1);
  if (patch) {
    await db
      .update(patches)
      .set({ matchCount: (patch.matchCount ?? 0) + count })
      .where(eq(patches.id, patchId));
  }
}
