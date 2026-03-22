/**
 * Seed Champion Board Positions v4
 *
 * Simple model:
 * - Row 0: ALL melee champions (tanks, bruisers, fighters, assassins)
 * - Row 1: Only specific exceptions (Fiddlesticks, Bel'Veth)
 * - Row 2: Empty — nobody
 * - Row 3: ALL ranged champions + supports. Carries in corners, supports next to them.
 *
 * Run: npx tsx pipeline/seed-positions.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { compArchetypes } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./utils/logger";

// ─── Champion classification ────────────────────────────────────────────────

const RANGED = new Set([
  // Longshots/Gunslingers
  "TFT16_Caitlyn", "TFT16_Jhin", "TFT16_KogMaw", "TFT16_Aphelios",
  "TFT16_Ashe", "TFT16_Graves", "TFT16_Teemo", "TFT16_Tristana",
  "TFT16_Vayne", "TFT16_Kaisa", "TFT16_MissFortune", "TFT16_Jinx",
  "TFT16_Draven", "TFT16_Ziggs", "TFT16_THex", "TFT16_LucianSenna",
  "TFT16_Kindred", "TFT16_Kalista",
  // Mages/casters
  "TFT16_Anivia", "TFT16_Lulu", "TFT16_Sona", "TFT16_Ahri",
  "TFT16_LeBlanc", "TFT16_Malzahar", "TFT16_Orianna", "TFT16_Lux",
  "TFT16_Veigar", "TFT16_Annie", "TFT16_AurelionSol", "TFT16_Xerath",
  "TFT16_Lissandra", "TFT16_Mel", "TFT16_Seraphine", "TFT16_Zilean",
  "TFT16_Zoe", "TFT16_Milio", "TFT16_Azir",
  // Other ranged
  "TFT16_TwistedFate", "TFT16_Ryze", "TFT16_Yunara", "TFT16_Bard",
]);

const ROW1_EXCEPTIONS = new Set([
  "TFT16_Fiddlesticks",
  "TFT16_BelVeth",
]);

function getRow(championId: string): number {
  if (ROW1_EXCEPTIONS.has(championId)) return 1;
  if (RANGED.has(championId)) return 3;
  return 0; // All melee → front
}

// ─── Positioning logic ──────────────────────────────────────────────────────

function centerColumns(count: number): number[] {
  if (count <= 0) return [];
  if (count >= 7) return [0, 1, 2, 3, 4, 5, 6];
  const start = Math.floor((7 - count) / 2);
  return Array.from({ length: count }, (_, i) => start + i);
}

function generatePositions(
  champions: Array<{ championId: string; championName: string; isCarry: boolean }>
) {
  const frontline: typeof champions = [];
  const midline: typeof champions = [];
  const backline: typeof champions = [];

  for (const c of champions) {
    const row = getRow(c.championId);
    if (row === 0) frontline.push(c);
    else if (row === 1) midline.push(c);
    else backline.push(c);
  }

  const positions: Record<string, { row: number; col: number }> = {};

  // ─── Row 0: Melee — centered ─────────────────────────────────────────────
  const frontCols = centerColumns(frontline.length);
  frontline.forEach((c, i) => {
    positions[c.championId] = { row: 0, col: frontCols[i] };
  });

  // ─── Row 1: Exceptions only — centered ───────────────────────────────────
  const midCols = centerColumns(midline.length);
  midline.forEach((c, i) => {
    positions[c.championId] = { row: 1, col: midCols[i] };
  });

  // ─── Row 3: Ranged — all start from corners, stack inward ──────────────
  // col 0, col 6, col 1, col 5, col 2, col 4, col 3
  const backSlots = [0, 6, 1, 5, 2, 4, 3];
  backline.forEach((c, i) => {
    positions[c.championId] = { row: 3, col: backSlots[i] ?? 3 };
  });

  return positions;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function seedPositions() {
  logger.info("Seeding champion positions v4...");

  const comps = await db.select().from(compArchetypes);

  for (const comp of comps) {
    const champions = comp.coreChampions as Array<{
      championId: string;
      championName: string;
      starLevel: number;
      recommendedItems: string[];
      isCarry: boolean;
      position?: { row: number; col: number };
    }>;

    if (!champions || champions.length === 0) continue;

    const positions = generatePositions(champions);

    const updated = champions.map((c) => ({
      ...c,
      position: positions[c.championId] ?? undefined,
    }));

    await db
      .update(compArchetypes)
      .set({ coreChampions: updated })
      .where(eq(compArchetypes.id, comp.id));

    const rowCounts = [0, 0, 0, 0];
    updated.forEach((c) => { if (c.position) rowCounts[c.position.row]++; });

    const back = updated
      .filter((c) => c.position?.row === 3)
      .sort((a, b) => a.position!.col - b.position!.col)
      .map((c) => `${c.championName}(col${c.position!.col}${c.isCarry ? ",carry" : ""})`)
      .join(" ");

    logger.info(`${comp.compName}`, {
      rows: `[${rowCounts.join(",")}]`,
      back,
    });
  }

  logger.info("Done");
}

seedPositions()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Failed", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
