/**
 * Fit Score Calculation
 *
 * Scores how well a comp archetype fits the user's current game state.
 * Score ranges from 0-100.
 *
 * Scoring components:
 * - Base score from comp's meta performance (avg placement)
 * - Emblem synergy bonus (+20 if user has a matching emblem)
 * - Item synergy bonus (+10-15 if user has items that are strong in this comp)
 * - Negative signal penalty (-10 if items are bad for this comp)
 */

import type { GameStateInput } from "@/types/api";
import type { compArchetypes } from "@/lib/db/schema";

type CompRow = typeof compArchetypes.$inferSelect;

export interface FitScoreResult {
  score: number;
  baseScore: number;
  emblemBonus: number;
  itemBonus: number;
  matchedEmblems: string[];
  matchedItems: string[];
  reasons: string[];
}

export function computeFitScore(
  input: GameStateInput,
  comp: CompRow,
  itemCompMap: Map<string, Map<number, number>>
): FitScoreResult {
  const reasons: string[] = [];
  const matchedEmblems: string[] = [];
  const matchedItems: string[] = [];

  // ── Base score from meta performance (0-50) ────────────────────────────
  // Lower avg placement = better comp = higher base score
  const avgPlacement = parseFloat(comp.avgPlacement ?? "4.5");
  const baseScore = Math.max(0, Math.min(50, (8.5 - avgPlacement) * 10));

  // ── Emblem synergy (0-25) ──────────────────────────────────────────────
  let emblemBonus = 0;
  const traitSig = comp.traitSignature as Record<string, number> | null;

  if (traitSig && input.emblems.length > 0) {
    for (const emblemId of input.emblems) {
      // Extract trait name from emblem ID: "TFT_Item_YordleEmblem" → "Yordle"
      const traitName = emblemId
        .replace("TFT_Item_", "")
        .replace("TFT16_Item_", "")
        .replace("EmblemItem", "")
        .replace("Emblem", "");

      // Check if this comp uses this trait
      const matchedTrait = Object.keys(traitSig).find(
        (t) => t.toLowerCase() === traitName.toLowerCase()
      );

      if (matchedTrait) {
        emblemBonus += 20;
        matchedEmblems.push(emblemId);
        reasons.push(
          `${traitName} Emblem synergizes with this comp's ${matchedTrait} trait`
        );
      }
    }
    emblemBonus = Math.min(25, emblemBonus);
  }

  // ── Item synergy (0-25) ────────────────────────────────────────────────
  let itemBonus = 0;

  if (input.items.length > 0) {
    // Check if the user's items align with the comp's carry items
    const carryChampion = comp.primaryCarry;

    for (const itemId of input.items) {
      const compPerf = itemCompMap.get(itemId);
      if (compPerf && comp.id && compPerf.has(comp.id)) {
        const itemAvg = compPerf.get(comp.id)!;
        if (itemAvg < avgPlacement) {
          // This item performs better than average in this comp
          itemBonus += 10;
          matchedItems.push(itemId);
          const cleanName = itemId.replace("TFT_Item_", "").replace(/([A-Z])/g, " $1").trim();
          reasons.push(`${cleanName} performs well in this comp`);
        }
      }
    }
    itemBonus = Math.min(25, itemBonus);
  }

  // ── If no inputs matched, add a base reason ────────────────────────────
  if (reasons.length === 0) {
    reasons.push(
      `Strong meta comp with ${avgPlacement.toFixed(1)} avg placement`
    );
  }

  const score = Math.round(Math.min(100, baseScore + emblemBonus + itemBonus));

  return {
    score,
    baseScore: Math.round(baseScore),
    emblemBonus,
    itemBonus,
    matchedEmblems,
    matchedItems,
    reasons,
  };
}
