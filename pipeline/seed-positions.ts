/**
 * Seed Champion Board Positions v3
 *
 * Simple, correct rules:
 * - TANKS (row 0): Centered, lined up. Determined by manual list + tank traits.
 * - MIDLINE (row 1): Melee fighters, unique champs like Fiddlesticks.
 * - BACKLINE (row 3): ALL ranged/carry champions. Corners first, stacking inward.
 * - ROW 2: Overflow from row 1 or support/utility.
 *
 * Run: npx tsx pipeline/seed-positions.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { compArchetypes } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./utils/logger";

import championsData from "../mock/champions.json";

const champTraits = new Map<string, string[]>();
const champCost = new Map<string, number>();
for (const c of championsData) {
  champTraits.set(c.id, c.traits);
  champCost.set(c.id, c.cost);
}

// ─── Explicit row assignments ────────────────────────────────────────────────
// Row 0 = front tank line
// Row 1 = mid/melee/unique
// Row 3 = backline carries (always corners)
// If not listed, determined by traits

const ROW_OVERRIDE: Record<string, 0 | 1 | 2 | 3> = {
  // ── FRONTLINE TANKS (row 0) ──
  TFT16_Garen: 0,
  TFT16_JarvanIV: 0,
  TFT16_Braum: 0,
  TFT16_Shen: 0,
  TFT16_Darius: 0,
  TFT16_Sejuani: 0,
  TFT16_Poppy: 0,
  TFT16_Rumble: 0,
  TFT16_Nautilus: 0,
  TFT16_Ornn: 0,
  TFT16_Loris: 0,
  TFT16_Yorick: 0,
  TFT16_Galio: 0,
  TFT16_Sion: 0,
  TFT16_Blitzcrank: 0,
  TFT16_Leona: 0,
  TFT16_Taric: 0,
  TFT16_Kennen: 0,
  TFT16_Aatrox: 0,
  TFT16_Shyvana: 0,
  TFT16_Volibear: 0,
  TFT16_RiftHerald: 0,
  TFT16_BaronNashor: 0,
  TFT16_DrMundo: 0,
  TFT16_Illaoi: 0,
  TFT16_Skarner: 0,
  TFT16_Renekton: 0,
  TFT16_Nasus: 0,
  TFT16_Sylas: 0,
  TFT16_TahmKench: 0,
  TFT16_ChoGath: 0,
  TFT16_RekSai: 0,
  TFT16_Singed: 0,
  TFT16_Swain: 0,
  TFT16_XinZhao: 0,
  TFT16_Vi: 0,
  TFT16_Briar: 0,

  // ── MIDLINE (row 1) — melee fighters, unique champs ──
  TFT16_Fiddlesticks: 1,
  TFT16_BelVeth: 1,
  TFT16_Yone: 1,
  TFT16_Yasuo: 1,
  TFT16_Ambessa: 1,
  TFT16_Wukong: 1,
  TFT16_Sett: 1,
  TFT16_Ekko: 1,
  TFT16_Warwick: 1,
  TFT16_Kalista: 1,
  TFT16_Nidalee: 1,
  TFT16_Qiyana: 1,
  TFT16_Kindred: 1,
  TFT16_Gangplank: 1,
  TFT16_Brock: 1,
  TFT16_Tryndamere: 1,
  TFT16_Fizz: 1,
  TFT16_Viego: 1,
  TFT16_Gwen: 1,
  TFT16_Diana: 1,

  // ── SUPPORT/UTILITY (row 2) ──
  TFT16_Lulu: 2,
  TFT16_Sona: 2,
  TFT16_Orianna: 2,
  TFT16_Seraphine: 2,
  TFT16_Milio: 2,
  TFT16_Zilean: 2,
  TFT16_Kobuko: 2,
  TFT16_Azir: 2,
  TFT16_LeBlanc: 2,
  TFT16_Zoe: 2,

  // ── BACKLINE (row 3) — ranged carries, mages ──
  TFT16_AurelionSol: 3,
  TFT16_Xerath: 3,
  TFT16_Ziggs: 3,
  TFT16_KogMaw: 3,
  TFT16_Vayne: 3,
  TFT16_Teemo: 3,
  TFT16_Ashe: 3,
  TFT16_Jinx: 3,
  TFT16_MissFortune: 3,
  TFT16_KaiSa: 3,
  TFT16_Aphelios: 3,
  TFT16_THex: 3,
  TFT16_LucianSenna: 3,
  TFT16_Graves: 3,
  TFT16_Tristana: 3,
  TFT16_Caitlyn: 3,
  TFT16_Draven: 3,
  TFT16_Jhin: 3,
  TFT16_Ahri: 3,
  TFT16_Lux: 3,
  TFT16_Annie: 3,
  TFT16_Veigar: 3,
  TFT16_Lissandra: 3,
  TFT16_Malzahar: 3,
  TFT16_Mel: 3,
  TFT16_Anivia: 3,
  TFT16_Thresh: 3,
};

function getRow(championId: string): number {
  // Check manual override first
  if (ROW_OVERRIDE[championId] !== undefined) return ROW_OVERRIDE[championId];

  // Trait-based fallback
  const traits = champTraits.get(championId) ?? [];

  const tankTraits = ["Defender", "Warden", "Juggernaut", "Bruiser"];
  if (traits.some((t) => tankTraits.includes(t))) return 0;

  const backlineTraits = ["Longshot", "Gunslinger", "Arcanist", "Invoker", "Ascendant", "HexMech"];
  if (traits.some((t) => backlineTraits.includes(t))) return 3;

  const meleeTraits = ["Slayer", "Quickstriker", "Vanquisher", "Huntress", "Darkin"];
  if (traits.some((t) => meleeTraits.includes(t))) return 1;

  // Default: high cost → back, low cost → front
  const cost = champCost.get(championId) ?? 3;
  return cost >= 4 ? 3 : 1;
}

function centerColumns(count: number): number[] {
  if (count <= 0) return [];
  if (count >= 7) return [0, 1, 2, 3, 4, 5, 6];
  const start = Math.floor((7 - count) / 2);
  return Array.from({ length: count }, (_, i) => start + i);
}

function generatePositions(
  champions: Array<{ championId: string; championName: string; isCarry: boolean }>
) {
  // Categorize into rows
  const rowBuckets: Array<typeof champions> = [[], [], [], []];

  for (const c of champions) {
    const row = getRow(c.championId);
    rowBuckets[row].push(c);
  }

  // If row 0 is empty but row 1 has tanks, move some up
  // If any row has too many, overflow to adjacent
  const maxPerRow = 7;

  // Overflow handling: push extras to adjacent rows
  for (let r = 0; r < 4; r++) {
    while (rowBuckets[r].length > maxPerRow) {
      const overflow = rowBuckets[r].pop()!;
      const target = r < 3 ? r + 1 : r - 1;
      rowBuckets[target].push(overflow);
    }
  }

  const positions: Record<string, { row: number; col: number }> = {};

  // Row 0: tanks — centered
  const tankCols = centerColumns(rowBuckets[0].length);
  rowBuckets[0].forEach((c, i) => {
    positions[c.championId] = { row: 0, col: tankCols[i] };
  });

  // Row 1: melee/unique — centered
  const meleeCols = centerColumns(rowBuckets[1].length);
  rowBuckets[1].forEach((c, i) => {
    positions[c.championId] = { row: 1, col: meleeCols[i] };
  });

  // Row 2: support — centered
  const supportCols = centerColumns(rowBuckets[2].length);
  rowBuckets[2].forEach((c, i) => {
    positions[c.championId] = { row: 2, col: supportCols[i] };
  });

  // Row 3: backline — corners first, stacking inward
  const backline = rowBuckets[3];
  const leftCols = [0, 1, 2, 3];
  const rightCols = [6, 5, 4];
  backline.forEach((c, i) => {
    let col: number;
    if (i === 0) col = leftCols[0];
    else if (i === 1) col = rightCols[0];
    else if (i % 2 === 0) col = leftCols[Math.floor(i / 2)] ?? 3;
    else col = rightCols[Math.floor(i / 2)] ?? 3;
    positions[c.championId] = { row: 3, col };
  });

  return positions;
}

async function seedPositions() {
  logger.info("Seeding champion positions v3...");

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

    const backline = updated
      .filter((c) => c.position?.row === 3)
      .map((c) => `${c.championName}(col${c.position!.col})`)
      .join(", ");

    logger.info(`${comp.compName}`, {
      rows: `[${rowCounts.join(", ")}]`,
      back: backline || "none",
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
