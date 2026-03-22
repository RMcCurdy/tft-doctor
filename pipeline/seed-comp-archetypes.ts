/**
 * Seed Comp Archetypes from Mock Data
 *
 * Replaces comp_archetypes in the DB with complete mock data
 * that includes full champion rosters, items, and trait details.
 *
 * Run: npx tsx pipeline/seed-comp-archetypes.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { compArchetypes } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./utils/logger";

import compData from "../mock/comp-archetypes.json";

const PATCH_ID = 1; // patch_id=1 corresponds to patch 16.6 in the DB

interface MockComp {
  id: string;
  name: string;
  patchId: string;
  traits: Array<{
    traitId: string;
    traitName: string;
    activeUnits: number;
    breakpointReached: number;
    maxBreakpoint: number;
    style: string;
  }>;
  coreChampions: Array<{
    championId: string;
    championName: string;
    starLevel: number;
    position?: { row: number; col: number };
    recommendedItems: string[];
    isCarry: boolean;
  }>;
  flexChampions: Array<{
    championId: string;
    championName: string;
    starLevel: number;
    recommendedItems: string[];
    isCarry: boolean;
  }>;
  stats: {
    avgPlacement: number;
    top4Rate: number;
    winRate: number;
    playRate: number;
    sampleSize: number;
  };
  tier: string;
  lastUpdated: string;
}

async function seedCompArchetypes() {
  const comps = compData as unknown as MockComp[];

  logger.info("Seeding comp archetypes from mock data...", {
    count: comps.length,
    patchId: PATCH_ID,
  });

  // Delete existing comps for this patch
  await db.delete(compArchetypes).where(eq(compArchetypes.patchId, PATCH_ID));
  logger.info("Cleared existing comp archetypes for patch");

  for (const comp of comps) {
    const primaryCarry = comp.coreChampions.find((c) => c.isCarry)?.championId ?? null;
    const secondaryCarry =
      comp.coreChampions.filter((c) => c.isCarry)[1]?.championId ?? null;

    await db.insert(compArchetypes).values({
      patchId: PATCH_ID,
      compName: comp.name,
      traitSignature: comp.traits, // Store full traits array
      coreChampions: comp.coreChampions,
      flexSlots: comp.flexChampions.length > 0 ? comp.flexChampions : null,
      primaryCarry,
      secondaryCarry,
      isReroll: false,
      requiresEmblem: null,
      avgPlacement: comp.stats.avgPlacement.toFixed(2),
      top4Rate: comp.stats.top4Rate.toFixed(3),
      winRate: comp.stats.winRate.toFixed(3),
      playRate: comp.stats.playRate.toFixed(3),
      sampleSize: comp.stats.sampleSize,
    });

    logger.info(`Seeded comp: ${comp.name}`, {
      champions: comp.coreChampions.length,
      carry: primaryCarry,
    });
  }

  logger.info("Comp archetype seeding complete", { count: comps.length });
}

seedCompArchetypes()
  .then(() => {
    logger.info("Seed script finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Seed script failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
