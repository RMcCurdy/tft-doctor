/**
 * Auto-Discover Comp Definitions from Match Data
 *
 * Classifies all boards with existing definitions, then analyzes
 * unclassified boards to discover new comp archetypes. Cross-references
 * with hero augment data to tag champion-specific comps.
 *
 * Outputs new definitions to be appended to comp-definitions.ts.
 *
 * Run: npx tsx pipeline/discover-comps.ts
 */

import { db } from "../src/lib/db";
import { participants, staticData } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { classifyBoards } from "../src/lib/clustering/comp-classifier";
import { SET_16_COMP_DEFINITIONS } from "../src/lib/clustering/comp-definitions";
import { isSummonedUnit, COMPONENT_ITEM_IDS } from "../src/lib/constants";
import type { ParticipantBoard, CompDefinition } from "../src/lib/clustering/types";
import type { RiotUnit, RiotTrait } from "../src/types/riot";
import { logger } from "./utils/logger";
import { writeFileSync } from "fs";

const MIN_BOARDS = 15;

// ─── Carry Scoring (matches comp-classifier logic) ─────────────────────────

const OFFENSIVE_IDS = new Set([
  "TFT_Item_InfinityEdge", "TFT_Item_JeweledGauntlet", "TFT_Item_GiantSlayer",
  "TFT_Item_Deathcap", "TFT_Item_GuinsoosRageblade", "TFT_Item_StatikkShiv",
  "TFT_Item_LastWhisper", "TFT_Item_HandOfJustice", "TFT_Item_HextechGunblade",
  "TFT_Item_ArchangelsStaff", "TFT_Item_Bloodthirster", "TFT_Item_TitansResolve",
  "TFT_Item_NashorsTooth",
]);

function getCarry(units: RiotUnit[]): { id: string; isReroll: boolean } | null {
  let bestId = "";
  let bestScore = 0;
  let bestCost = 0;
  let bestStar = 0;

  for (const u of units) {
    if (isSummonedUnit(u.character_id)) continue;
    const items = (u.itemNames ?? []).filter(i => !COMPONENT_ITEM_IDS.has(i));
    const offensiveCount = items.filter(i => OFFENSIVE_IDS.has(i)).length;
    const score = items.length * 30 + offensiveCount * 20 + u.rarity * 10 + u.tier * 15;
    if (score > bestScore) {
      bestScore = score;
      bestId = u.character_id;
      bestCost = u.rarity; // 0-indexed cost tier
      bestStar = u.tier;
    }
  }

  if (!bestId) return null;
  const isReroll = bestCost <= 1 && bestStar >= 3; // 1-2 cost at 3-star
  return { id: bestId, isReroll };
}

// ─── Hero Augment Mapping ──────────────────────────────────────────────────

interface AugmentEntry {
  id: string;
  name: string;
  description: string;
  tier: string;
}

function buildHeroAugmentMap(augments: AugmentEntry[], champMap: Map<string, string>): Map<string, { augmentId: string; augmentName: string }> {
  // Map: championId → hero augment info
  const result = new Map<string, { augmentId: string; augmentName: string }>();

  for (const aug of augments) {
    // Pattern 1: ID contains "Carry" (e.g., TFT16_Augment_RumbleCarry, TFT16_Augment_IllaoiCarry)
    const carryMatch = aug.id.match(/TFT16_Augment_(\w+?)Carry(?:II|III)?$/);
    if (carryMatch) {
      const champName = carryMatch[1];
      const champId = `TFT16_${champName}`;
      if (champMap.has(champId)) {
        result.set(champId, { augmentId: aug.id, augmentName: aug.name });
      }
      continue;
    }

    // Pattern 2: Description starts with "Gain a [ChampionName]" or "Gain [count] [ChampionName]"
    const gainMatch = aug.description?.match(/^Gain (?:a |an |\d+ )(\w[\w' ]*?)[\.\,]/);
    if (gainMatch && aug.id.startsWith("TFT16_Augment_")) {
      const gainedName = gainMatch[1].trim();
      // Find the champion by display name
      for (const [champId, champDisplayName] of champMap) {
        if (champDisplayName.toLowerCase() === gainedName.toLowerCase()) {
          if (!result.has(champId)) {
            result.set(champId, { augmentId: aug.id, augmentName: aug.name });
          }
          break;
        }
      }
    }
  }

  return result;
}

// ─── Trait Inference ────────────────────────────────────────────────────────

function inferTraits(boards: ParticipantBoard[]): Record<string, number> {
  // Count how often each trait is active across all boards
  const traitCounts = new Map<string, number>();
  for (const board of boards) {
    for (const trait of board.traits) {
      if (trait.tier_current >= 1) {
        const name = trait.name.replace("TFT16_", "");
        traitCounts.set(name, (traitCounts.get(name) ?? 0) + 1);
      }
    }
  }

  // Keep traits that appear in >50% of boards, take top 3
  const threshold = boards.length * 0.5;
  const required: Record<string, number> = {};
  const sorted = [...traitCounts.entries()].sort((a, b) => b[1] - a[1]);

  let count = 0;
  for (const [traitName, freq] of sorted) {
    if (freq < threshold || count >= 3) break;
    required[traitName] = 1;
    count++;
  }

  return required;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function discoverComps() {
  logger.info("Starting comp discovery...");

  // Load static data
  const [champRow] = await db.select().from(staticData).where(
    and(eq(staticData.dataType, "champions"), eq(staticData.patchVersion, "16.6"))
  );
  const [augRow] = await db.select().from(staticData).where(
    and(eq(staticData.dataType, "augments"), eq(staticData.patchVersion, "16.6"))
  );

  if (!champRow) {
    logger.error("No champion static data");
    process.exit(1);
  }

  const staticChampions = champRow.data as Array<{ id: string; name: string; cost: number }>;
  const champMap = new Map<string, string>();
  for (const c of staticChampions) champMap.set(c.id, c.name);

  // Build hero augment mapping
  const augments = (augRow?.data ?? []) as AugmentEntry[];
  const heroAugmentMap = buildHeroAugmentMap(augments, champMap);
  logger.info(`Found ${heroAugmentMap.size} hero augments mapped to champions`);

  // Existing carry IDs already covered
  const existingCarries = new Set(SET_16_COMP_DEFINITIONS.map(d => d.primaryCarry));

  // Load all participants
  const allParticipants = await db.select().from(participants);
  logger.info(`Loaded ${allParticipants.length} participants`);

  const boards: ParticipantBoard[] = allParticipants.map((p) => ({
    matchId: p.matchId,
    puuid: p.puuid ?? "",
    placement: p.placement,
    units: (typeof p.units === "string" ? JSON.parse(p.units) : p.units) as RiotUnit[],
    traits: (typeof p.traits === "string" ? JSON.parse(p.traits) : p.traits) as RiotTrait[],
    augments: [],
  }));

  // Classify with existing definitions
  const { results } = classifyBoards(boards, SET_16_COMP_DEFINITIONS);

  // Group unclassified boards by primary carry
  const carryGroups = new Map<string, ParticipantBoard[]>();
  let unclassifiedCount = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i].compId !== "unclassified") continue;
    unclassifiedCount++;

    const carry = getCarry(boards[i].units);
    if (!carry) continue;

    if (!carryGroups.has(carry.id)) carryGroups.set(carry.id, []);
    carryGroups.get(carry.id)!.push(boards[i]);
  }

  logger.info(`Unclassified boards: ${unclassifiedCount} / ${boards.length}`);
  logger.info(`Unique carries in unclassified: ${carryGroups.size}`);

  // Generate new comp definitions
  const newDefs: CompDefinition[] = [];

  // Sort by frequency descending
  const sortedGroups = [...carryGroups.entries()].sort((a, b) => b[1].length - a[1].length);

  for (const [carryId, carryBoards] of sortedGroups) {
    if (carryBoards.length < MIN_BOARDS) continue;
    if (existingCarries.has(carryId)) continue; // Already covered
    if (isSummonedUnit(carryId)) continue;

    const champName = champMap.get(carryId) ?? carryId.replace("TFT16_", "");
    const requiredTraits = inferTraits(carryBoards);

    // Check if this is a reroll comp
    const staticChamp = staticChampions.find(c => c.id === carryId);
    const avgStar = carryBoards.reduce((sum, b) => {
      const unit = b.units.find(u => u.character_id === carryId);
      return sum + (unit?.tier ?? 1);
    }, 0) / carryBoards.length;
    const isReroll = (staticChamp?.cost ?? 3) <= 2 && avgStar >= 2.5;

    // Check for hero augment
    const heroAugment = heroAugmentMap.get(carryId);

    const def: CompDefinition = {
      id: `auto-${carryId.replace("TFT16_", "").toLowerCase()}`,
      name: heroAugment ? `${champName} (${heroAugment.augmentName})` : `${champName} Carry`,
      primaryCarry: carryId,
      requiredTraits,
      isReroll: isReroll || undefined,
      heroAugment: heroAugment || undefined,
    };

    newDefs.push(def);

    const avgPlacement = (carryBoards.reduce((s, b) => s + b.placement, 0) / carryBoards.length).toFixed(2);
    logger.info(`Discovered: ${def.name}`, {
      boards: carryBoards.length,
      avgPlacement,
      isReroll,
      heroAugment: heroAugment?.augmentName ?? "none",
      traits: Object.keys(requiredTraits).join(", "),
    });
  }

  // Also create hero augment comps for champions that ARE in existing definitions
  // but have a hero augment that creates a different playstyle
  for (const [champId, augInfo] of heroAugmentMap) {
    if (isSummonedUnit(champId)) continue;
    // Skip if we already created a comp for this champion above
    if (newDefs.some(d => d.primaryCarry === champId)) continue;
    // Skip if the existing comp already covers this well
    if (!existingCarries.has(champId)) continue;

    // Check if there are unclassified boards with this champion as carry
    // that didn't match the existing definition (trait mismatch)
    const boards = carryGroups.get(champId);
    if (!boards || boards.length < 5) continue;

    const champName = champMap.get(champId) ?? champId.replace("TFT16_", "");
    const requiredTraits = inferTraits(boards);

    newDefs.push({
      id: `hero-${champId.replace("TFT16_", "").toLowerCase()}`,
      name: `${champName} (${augInfo.augmentName})`,
      primaryCarry: champId,
      requiredTraits,
      heroAugment: augInfo,
    });

    logger.info(`Hero augment variant: ${champName} (${augInfo.augmentName})`, { boards: boards.length });
  }

  logger.info(`\nTotal new definitions: ${newDefs.length}`);
  logger.info(`Combined with existing: ${SET_16_COMP_DEFINITIONS.length + newDefs.length} total`);

  // Write new definitions to a file for review and inclusion
  const defsCode = newDefs.map(d => {
    const lines = [
      `  {`,
      `    id: "${d.id}",`,
      `    name: "${d.name}",`,
      `    primaryCarry: "${d.primaryCarry}",`,
      `    requiredTraits: ${JSON.stringify(d.requiredTraits)},`,
    ];
    if (d.isReroll) lines.push(`    isReroll: true,`);
    if (d.heroAugment) {
      lines.push(`    heroAugment: { augmentId: "${d.heroAugment.augmentId}", augmentName: "${d.heroAugment.augmentName}" },`);
    }
    lines.push(`  },`);
    return lines.join("\n");
  }).join("\n\n");

  const output = `\n  // ── Auto-Discovered Comps ──────────────────────────────────────────\n\n${defsCode}`;
  writeFileSync("pipeline/_discovered-defs.txt", output);
  logger.info("Definitions written to pipeline/_discovered-defs.txt");
  logger.info("Review and append to src/lib/clustering/comp-definitions.ts");
}

discoverComps()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error("Discovery failed", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
