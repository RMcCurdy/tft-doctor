/**
 * Build Comp Archetypes from Real Match Data
 *
 * Reads all participants from the DB, classifies each board using the
 * carry-based clustering system, then aggregates per-comp champion usage,
 * item frequency, star levels, trait activation, and performance stats.
 *
 * Replaces mock seed data with real data-driven comp archetypes.
 *
 * Run: npx tsx pipeline/build-comps-from-data.ts
 */

import "dotenv/config";
import { db } from "../src/lib/db/index.js";
import {
  compArchetypes,
  participants,
  staticData,
} from "../src/lib/db/schema.js";
import { eq, and } from "drizzle-orm";
import { getCurrentPatch } from "../src/lib/db/queries/patches.js";
import { isSummonedUnit, THIEFS_GLOVES_ID, isCompletedItem } from "../src/lib/constants.js";
import { upsertCompArchetype } from "../src/lib/db/queries/comps.js";
import { classifyBoards } from "../src/lib/clustering/comp-classifier.js";
import { SET_16_COMP_DEFINITIONS } from "../src/lib/clustering/comp-definitions.js";
import { generateEarlyBoard } from "../src/lib/clustering/early-board.js";
import type { ParticipantBoard } from "../src/lib/clustering/types.js";
import type { RiotUnit, RiotTrait } from "../src/types/riot.js";
import { logger } from "./utils/logger.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_COMP_SAMPLE_SIZE = 5;
const CORE_LINEUP_SIZE = 8;
const MAX_CARRY_ITEMS = 3;

// ─── Static data types ──────────────────────────────────────────────────────

interface StaticChampion {
  id: string;
  name: string;
  cost: number;
  traits: string[];
}

interface StaticTrait {
  id: string;
  name: string;
  breakpoints: { minUnits: number; style: string }[];
}

// ─── Positioning (from seed-positions.ts) ────────────────────────────────────

const RANGED = new Set([
  "TFT16_Caitlyn", "TFT16_Jhin", "TFT16_KogMaw", "TFT16_Aphelios",
  "TFT16_Ashe", "TFT16_Graves", "TFT16_Teemo", "TFT16_Tristana",
  "TFT16_Vayne", "TFT16_Kaisa", "TFT16_MissFortune", "TFT16_Jinx",
  "TFT16_Draven", "TFT16_Ziggs", "TFT16_THex", "TFT16_LucianSenna",
  "TFT16_Kindred", "TFT16_Kalista",
  "TFT16_Anivia", "TFT16_Lulu", "TFT16_Sona", "TFT16_Ahri",
  "TFT16_LeBlanc", "TFT16_Malzahar", "TFT16_Orianna", "TFT16_Lux",
  "TFT16_Veigar", "TFT16_Annie", "TFT16_AurelionSol", "TFT16_Xerath",
  "TFT16_Lissandra", "TFT16_Mel", "TFT16_Seraphine", "TFT16_Zilean",
  "TFT16_Zoe", "TFT16_Milio", "TFT16_Azir",
  "TFT16_TwistedFate", "TFT16_Ryze", "TFT16_Yunara", "TFT16_Bard",
  "TFT16_Lucian",
]);

const ROW1_EXCEPTIONS = new Set(["TFT16_Fiddlesticks", "TFT16_BelVeth"]);

function getRow(championId: string): number {
  if (ROW1_EXCEPTIONS.has(championId)) return 1;
  if (RANGED.has(championId)) return 3;
  return 0;
}

function centerColumns(count: number): number[] {
  if (count <= 0) return [];
  if (count >= 7) return [0, 1, 2, 3, 4, 5, 6];
  const start = Math.floor((7 - count) / 2);
  return Array.from({ length: count }, (_, i) => start + i);
}

function generatePositions(
  champions: Array<{ championId: string; isCarry: boolean }>
): Record<string, { row: number; col: number }> {
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

  const frontCols = centerColumns(frontline.length);
  frontline.forEach((c, i) => {
    positions[c.championId] = { row: 0, col: frontCols[i] };
  });

  const midCols = centerColumns(midline.length);
  midline.forEach((c, i) => {
    positions[c.championId] = { row: 1, col: midCols[i] };
  });

  const backSlots = [0, 6, 1, 5, 2, 4, 3];
  backline.forEach((c, i) => {
    positions[c.championId] = { row: 3, col: backSlots[i] ?? 3 };
  });

  return positions;
}

// ─── Utility functions ───────────────────────────────────────────────────────

function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best = values[0] ?? 1;
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function topN<T>(items: T[], n: number, keyFn: (item: T) => number): T[] {
  return [...items].sort((a, b) => keyFn(b) - keyFn(a)).slice(0, n);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function buildCompsFromData() {
  const startTime = Date.now();
  logger.info("Starting comp build from real match data...");

  // ── 1. Get current patch ──────────────────────────────────────────────────
  const currentPatch = await getCurrentPatch();
  if (!currentPatch) {
    logger.error("No current patch found. Run detect-patch first.");
    process.exit(1);
  }
  logger.info(`Current patch: ${currentPatch.patchVersion} (id=${currentPatch.id})`);

  // ── 2. Load static data ───────────────────────────────────────────────────
  const [champRow] = await db
    .select()
    .from(staticData)
    .where(
      and(
        eq(staticData.dataType, "champions"),
        eq(staticData.patchVersion, currentPatch.patchVersion)
      )
    );
  const [traitRow] = await db
    .select()
    .from(staticData)
    .where(
      and(
        eq(staticData.dataType, "traits"),
        eq(staticData.patchVersion, currentPatch.patchVersion)
      )
    );

  if (!champRow || !traitRow) {
    logger.error("Missing static data. Run sync-static-data first.");
    process.exit(1);
  }

  const staticChampions = champRow.data as StaticChampion[];
  const staticTraits = traitRow.data as StaticTrait[];

  // Build lookup maps
  const championMap = new Map<string, StaticChampion>();
  for (const c of staticChampions) {
    championMap.set(c.id, c);
  }

  // Trait lookup keyed by display name (e.g., "Bruiser", not "TFT16_Brawler")
  const traitByName = new Map<string, StaticTrait>();
  for (const t of staticTraits) {
    traitByName.set(t.name, t);
  }

  logger.info(`Loaded ${staticChampions.length} champions, ${staticTraits.length} traits`);

  // ── 3. Load all participants ──────────────────────────────────────────────
  const allParticipants = await db.select().from(participants);
  logger.info(`Loaded ${allParticipants.length} participants`);

  const boards: ParticipantBoard[] = allParticipants.map((p) => ({
    matchId: p.matchId,
    puuid: p.puuid ?? "",
    placement: p.placement,
    units: (typeof p.units === "string" ? JSON.parse(p.units) : p.units) as RiotUnit[],
    traits: (typeof p.traits === "string" ? JSON.parse(p.traits) : p.traits) as RiotTrait[],
    augments: (typeof p.augments === "string" ? JSON.parse(p.augments) : p.augments) as string[],
  }));

  // ── 4. Classify all boards ────────────────────────────────────────────────
  const { results, stats: classStats } = classifyBoards(boards, SET_16_COMP_DEFINITIONS);

  const totalClassified = classStats.carryLookup + classStats.traitFallback;
  logger.info("Classification complete", {
    total: results.length,
    carryLookup: classStats.carryLookup,
    traitFallback: classStats.traitFallback,
    unclassified: classStats.unclassified,
    classificationRate: `${((totalClassified / results.length) * 100).toFixed(1)}%`,
  });

  // ── 5. Group by comp ──────────────────────────────────────────────────────
  const compGroups = new Map<string, { board: ParticipantBoard; compName: string }[]>();

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.compId === "unclassified") continue;
    if (!compGroups.has(r.compId)) compGroups.set(r.compId, []);
    compGroups.get(r.compId)!.push({ board: boards[i], compName: r.compName });
  }

  // ── 6. Delete existing comp archetypes for this patch ─────────────────────
  await db.delete(compArchetypes).where(eq(compArchetypes.patchId, currentPatch.id));
  logger.info("Cleared existing comp archetypes for this patch");

  // ── 7. Aggregate each comp ────────────────────────────────────────────────
  let compsBuilt = 0;
  let compsSkipped = 0;

  for (const compDef of SET_16_COMP_DEFINITIONS) {
    const group = compGroups.get(compDef.id);

    if (!group || group.length < MIN_COMP_SAMPLE_SIZE) {
      logger.warn(`Skipping ${compDef.name}: ${group?.length ?? 0} boards (min ${MIN_COMP_SAMPLE_SIZE})`);
      compsSkipped++;
      continue;
    }

    // ── 7a. Champion frequency analysis ───────────────────────────────────
    const champStats = new Map<
      string,
      { count: number; starLevels: number[]; itemSets: string[][] }
    >();

    for (const { board } of group) {
      for (const unit of board.units) {
        const id = unit.character_id;
        if (isSummonedUnit(id)) continue;
        if (!champStats.has(id)) {
          champStats.set(id, { count: 0, starLevels: [], itemSets: [] });
        }
        const stats = champStats.get(id)!;
        stats.count++;
        stats.starLevels.push(unit.tier);
        stats.itemSets.push(unit.itemNames ?? []);
      }
    }

    // ── 7b. Select top champions ──────────────────────────────────────────
    const champEntries = [...champStats.entries()].sort(
      (a, b) => b[1].count - a[1].count
    );

    const selectedIds = new Set<string>();

    // Guarantee carries are included
    if (compDef.primaryCarry && champStats.has(compDef.primaryCarry)) {
      selectedIds.add(compDef.primaryCarry);
    }
    if (compDef.secondaryCarry && champStats.has(compDef.secondaryCarry)) {
      selectedIds.add(compDef.secondaryCarry);
    }

    // Fill remaining slots with most frequent champions
    for (const [champId] of champEntries) {
      if (selectedIds.size >= CORE_LINEUP_SIZE) break;
      selectedIds.add(champId);
    }

    // ── 7c. Build coreChampions array ─────────────────────────────────────
    const isCarryId = new Set<string>();
    isCarryId.add(compDef.primaryCarry);
    if (compDef.secondaryCarry) isCarryId.add(compDef.secondaryCarry);

    const coreChampions: Array<{
      championId: string;
      championName: string;
      starLevel: number;
      threeStarRate: number;
      recommendedItems: string[];
      isCarry: boolean;
      position?: { row: number; col: number };
    }> = [];

    // Build sorted COMPLETED items per champion and compute item holder scores
    const champItemFreq = new Map<string, string[]>();
    const champAvgItems = new Map<string, number>();

    for (const champId of selectedIds) {
      const stats = champStats.get(champId)!;

      // Count frequency of each completed item
      const itemCounts = new Map<string, number>();
      let totalCompletedItems = 0;
      for (const items of stats.itemSets) {
        for (const item of items) {
          if (!isCompletedItem(item)) continue;
          itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
          totalCompletedItems++;
        }
      }

      champItemFreq.set(
        champId,
        [...itemCounts.entries()].sort((a, b) => b[1] - a[1]).map(([item]) => item)
      );
      champAvgItems.set(champId, totalCompletedItems / stats.count);
    }

    // Identify item holders: champions who average >= 1.5 completed items per game
    // Sort by score descending, cap at 3
    const itemHolderIds = new Set(
      [...champAvgItems.entries()]
        .filter(([, avg]) => avg >= 1.5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id)
    );

    for (const champId of selectedIds) {
      const stats = champStats.get(champId)!;
      const staticChamp = championMap.get(champId);
      const isCarry = isCarryId.has(champId);
      const sortedItems = champItemFreq.get(champId) ?? [];

      let recommendedItems: string[] = [];
      if (itemHolderIds.has(champId)) {
        // Data-driven item holder — assign top 3 completed items
        if (sortedItems[0] === THIEFS_GLOVES_ID) {
          recommendedItems = [THIEFS_GLOVES_ID];
        } else {
          recommendedItems = sortedItems
            .filter((id) => id !== THIEFS_GLOVES_ID)
            .slice(0, MAX_CARRY_ITEMS);
        }
      } else {
        // Non-item-holder — only include emblem items if commonly used
        for (const itemId of sortedItems) {
          if (!itemId.includes("EmblemItem")) continue;
          const emblemCount = stats.itemSets.filter((items) => items.includes(itemId)).length;
          if (emblemCount / stats.count >= 0.2) {
            recommendedItems.push(itemId);
          }
        }
      }

      coreChampions.push({
        championId: champId,
        championName: staticChamp?.name ?? champId.replace(/^TFT16_/, ""),
        starLevel: mode(stats.starLevels),
        threeStarRate: parseFloat(
          (stats.starLevels.filter((s) => s === 3).length / stats.starLevels.length).toFixed(3)
        ),
        recommendedItems,
        isCarry,
      });
    }

    // Sort by cost ascending
    coreChampions.sort((a, b) => {
      const costA = championMap.get(a.championId)?.cost ?? 1;
      const costB = championMap.get(b.championId)?.cost ?? 1;
      return costA - costB;
    });

    // ── 7d. Positioning ───────────────────────────────────────────────────
    const positions = generatePositions(coreChampions);
    for (const champ of coreChampions) {
      champ.position = positions[champ.championId];
    }

    // ── 7e. Early board ─────────────────────────────────────────────────
    const earlyBoard = generateEarlyBoard(
      coreChampions.map((c) => c.championId),
      championMap,
    );

    // ── 7f. Trait signature from canonical lineup + emblem items ────────────
    const traitUnitCounts = new Map<string, number>();
    for (const champ of coreChampions) {
      const staticChamp = championMap.get(champ.championId);
      if (!staticChamp) continue;
      for (const traitName of staticChamp.traits) {
        traitUnitCounts.set(traitName, (traitUnitCounts.get(traitName) ?? 0) + 1);
      }

      // Count emblem items as additional trait contributions
      for (const itemId of champ.recommendedItems) {
        if (!itemId.includes("EmblemItem")) continue;
        // TFT16_Item_DemaciaEmblemItem → Demacia → find matching trait
        const emblemPart = itemId
          .replace("TFT16_Item_", "")
          .replace("TFT_Item_", "")
          .replace("EmblemItem", "");
        const emblemTraitId = `TFT16_${emblemPart}`;
        // Find the display name for this trait ID
        const matchedTrait = staticTraits.find((t) => t.id === emblemTraitId);
        if (matchedTrait && !staticChamp.traits.includes(matchedTrait.name)) {
          traitUnitCounts.set(
            matchedTrait.name,
            (traitUnitCounts.get(matchedTrait.name) ?? 0) + 1
          );
        }
      }
    }

    const STYLE_ORDER: Record<string, number> = {
      chromatic: 0,
      gold: 1,
      silver: 2,
      bronze: 3,
    };

    const traitSignature = [...traitUnitCounts.entries()]
      .map(([traitName, unitCount]) => {
        const traitDef = traitByName.get(traitName);
        if (!traitDef) return null;

        // Find which breakpoint tier is reached (1-indexed)
        const sortedBps = [...traitDef.breakpoints].sort((a, b) => a.minUnits - b.minUnits);
        let tierReached = 0;
        let reachedMinUnits = 0;
        const maxMinUnits = sortedBps.length > 0 ? sortedBps[sortedBps.length - 1].minUnits : 0;

        for (let i = 0; i < sortedBps.length; i++) {
          if (unitCount >= sortedBps[i].minUnits) {
            tierReached = i + 1;
            reachedMinUnits = sortedBps[i].minUnits;
          }
        }

        if (tierReached === 0) return null; // Doesn't hit any breakpoint

        // Map tier position to in-game visual style:
        // 1st breakpoint = bronze, 2nd = silver, 3rd = gold, 4th+ = chromatic
        // For unique traits (1 breakpoint total), use chromatic
        const totalBps = sortedBps.length;
        let style: string;
        if (totalBps === 1) {
          style = "chromatic"; // unique traits
        } else if (tierReached === 1) {
          style = "bronze";
        } else if (tierReached === 2) {
          style = "silver";
        } else if (tierReached === 3) {
          style = "gold";
        } else {
          style = "chromatic";
        }

        return {
          traitId: traitDef.id,
          traitName: traitDef.name,
          activeUnits: unitCount,
          breakpointReached: reachedMinUnits,
          maxBreakpoint: maxMinUnits,
          style,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => {
        const orderDiff =
          (STYLE_ORDER[a.style] ?? 4) - (STYLE_ORDER[b.style] ?? 4);
        if (orderDiff !== 0) return orderDiff;
        return b.activeUnits - a.activeUnits;
      });

    // ── 7g. Performance stats ─────────────────────────────────────────────
    const placements = group.map((g) => g.board.placement);
    const avgPlacement = average(placements);
    const top4Rate = placements.filter((p) => p <= 4).length / placements.length;
    const winRate = placements.filter((p) => p === 1).length / placements.length;
    const playRate = group.length / totalClassified;

    // ── 7h. Upsert ───────────────────────────────────────────────────────
    await upsertCompArchetype({
      patchId: currentPatch.id,
      compName: compDef.name,
      traitSignature,
      coreChampions,
      flexSlots: null,
      earlyBoard,
      primaryCarry: compDef.primaryCarry,
      secondaryCarry: compDef.secondaryCarry ?? undefined,
      isReroll: compDef.isReroll ?? false,
      heroAugmentName: compDef.heroAugment?.augmentName,
      avgPlacement: avgPlacement.toFixed(2),
      top4Rate: top4Rate.toFixed(3),
      winRate: winRate.toFixed(3),
      playRate: playRate.toFixed(3),
      sampleSize: group.length,
    });

    compsBuilt++;
    logger.info(`${compDef.name}`, {
      games: group.length,
      avgPlacement: avgPlacement.toFixed(2),
      top4: `${(top4Rate * 100).toFixed(0)}%`,
      win: `${(winRate * 100).toFixed(0)}%`,
      lineup: coreChampions.map((c) => c.championName).join(", "),
    });
  }

  const durationMs = Date.now() - startTime;
  logger.info("Build complete", {
    compsBuilt,
    compsSkipped,
    totalParticipants: boards.length,
    totalClassified,
    durationMs,
  });
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

buildCompsFromData()
  .then(() => {
    logger.info("Pipeline finished successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error("Pipeline failed", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  });
