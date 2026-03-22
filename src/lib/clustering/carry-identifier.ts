/**
 * Carry Identification Algorithm
 *
 * Scores each unit on a participant's board to determine the primary
 * and secondary carry champions. This is the foundation of the
 * carry-based comp clustering system.
 *
 * Carry score formula:
 *   (itemCount × 30) + (offensiveItemCount × 20) + (unitCost × 10) + (starLevel × 15)
 */

import type { RiotUnit } from "@/types/riot";
import type { CarryResult } from "./types";
import { OFFENSIVE_ITEM_IDS, SECONDARY_CARRY_THRESHOLD, SECONDARY_CARRY_MIN_ITEMS } from "@/lib/constants";

interface ScoredUnit {
  characterId: string;
  name: string;
  score: number;
  itemCount: number;
  cost: number;
  starLevel: number;
}

/**
 * Identify the primary and secondary carry from a participant's units.
 */
export function identifyCarry(units: RiotUnit[]): CarryResult {
  if (units.length === 0) {
    return {
      primary: "unknown",
      primaryName: "Unknown",
      primaryScore: 0,
      secondary: null,
      isReroll: false,
    };
  }

  const scored = units
    .map((unit) => scoreUnit(unit))
    .sort((a, b) => {
      // Sort by score descending, break ties by cost descending
      if (b.score !== a.score) return b.score - a.score;
      return b.cost - a.cost;
    });

  const primary = scored[0];

  // Secondary carry: must meet threshold and have enough items
  let secondary: ScoredUnit | null = null;
  if (scored.length > 1) {
    const candidate = scored[1];
    if (
      candidate.score >= SECONDARY_CARRY_THRESHOLD &&
      candidate.itemCount >= SECONDARY_CARRY_MIN_ITEMS
    ) {
      secondary = candidate;
    }
  }

  // Reroll detection: primary carry is 1-cost or 2-cost at 3 stars
  const isReroll = primary.cost <= 2 && primary.starLevel >= 3;

  return {
    primary: primary.characterId,
    primaryName: primary.name,
    primaryScore: primary.score,
    secondary: secondary?.characterId ?? null,
    isReroll,
  };
}

function scoreUnit(unit: RiotUnit): ScoredUnit {
  const itemNames = unit.itemNames ?? [];
  const itemCount = itemNames.length;
  const offensiveItemCount = itemNames.filter((item) =>
    OFFENSIVE_ITEM_IDS.has(item)
  ).length;

  // rarity is 0-indexed (0=1cost, 4=5cost), so add 1 for actual cost
  const cost = unit.rarity + 1;
  const starLevel = unit.tier;

  const score =
    itemCount * 30 +
    offensiveItemCount * 20 +
    cost * 10 +
    starLevel * 15;

  return {
    characterId: unit.character_id,
    name: unit.name || unit.character_id,
    score,
    itemCount,
    cost,
    starLevel,
  };
}
