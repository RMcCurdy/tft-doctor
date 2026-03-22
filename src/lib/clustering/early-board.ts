/**
 * Early Board Generator
 *
 * Given a final comp's core champions, finds the best 5 cost 1-3 champions
 * to run in the early game (stages 2-1 through 3-2). Uses a greedy set-cover
 * approach to maximize trait overlap with the final comp while preferring
 * champions that are already in the final lineup (smooth transition).
 */

import type { EarlyBoardChampion } from "@/types/comp";

interface ChampionData {
  id: string;
  name: string;
  cost: number;
  traits: string[];
}

const EARLY_BOARD_SIZE = 5;
const MAX_COST = 3;

/**
 * Generate a 5-unit early game board for a comp.
 *
 * @param coreChampionIds - Champion IDs in the final comp's core lineup
 * @param championMap     - Full champion pool (id → static data)
 */
export function generateEarlyBoard(
  coreChampionIds: string[],
  championMap: Map<string, ChampionData>,
): EarlyBoardChampion[] {
  // 1. Collect target traits from the final comp's core champions
  const targetTraits = new Set<string>();
  const coreIds = new Set(coreChampionIds);

  for (const id of coreChampionIds) {
    const champ = championMap.get(id);
    if (!champ) continue;
    for (const trait of champ.traits) {
      targetTraits.add(trait);
    }
  }

  if (targetTraits.size === 0) return [];

  // 2. Build candidate pool: cost 1-3 with at least one trait
  const candidates = [...championMap.values()].filter(
    (c) => c.cost >= 1 && c.cost <= MAX_COST && c.traits.length > 0,
  );

  // 3. Greedy set-cover: pick champions that cover the most uncovered target traits
  const selected: EarlyBoardChampion[] = [];
  const coveredTraits = new Set<string>();
  const usedIds = new Set<string>();

  for (let i = 0; i < EARLY_BOARD_SIZE; i++) {
    let bestCandidate: ChampionData | null = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      if (usedIds.has(candidate.id)) continue;

      let newTraitCount = 0;
      let totalOverlap = 0;
      for (const trait of candidate.traits) {
        if (targetTraits.has(trait)) {
          totalOverlap++;
          if (!coveredTraits.has(trait)) newTraitCount++;
        }
      }

      // Skip champions with zero trait overlap
      if (totalOverlap === 0) continue;

      // Score: prioritize new trait coverage, then smooth transitions, then overlap depth
      const score =
        newTraitCount * 100 +
        (coreIds.has(candidate.id) ? 50 : 0) +
        totalOverlap * 10 +
        (MAX_COST + 1 - candidate.cost); // prefer cheaper units

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) break;

    selected.push({
      championId: bestCandidate.id,
      championName: bestCandidate.name,
    });
    usedIds.add(bestCandidate.id);

    for (const trait of bestCandidate.traits) {
      if (targetTraits.has(trait)) {
        coveredTraits.add(trait);
      }
    }
  }

  return selected;
}
