/**
 * Comp Classifier
 *
 * Classifies a participant's board into a named comp archetype using
 * a three-pass approach:
 *
 * Pass 1 — Carry-first lookup: Match identified carry against the
 *          comp definition table. High confidence.
 *
 * Pass 2 — Trait-signature fallback: If carry doesn't match any
 *          definition, score by trait overlap (≥60% threshold).
 *
 * Pass 3 — Unclassified: Board doesn't match any known comp.
 */

import type {
  ClassificationResult,
  CompDefinition,
  ParticipantBoard,
} from "./types";
import { identifyCarry } from "./carry-identifier";
import { generateTraitSignature, traitOverlap } from "./trait-signature";
import { MIN_TRAIT_OVERLAP } from "@/lib/constants";

/**
 * Classify a participant's board into a comp archetype.
 */
export function classifyBoard(
  board: ParticipantBoard,
  compDefinitions: CompDefinition[]
): ClassificationResult {
  const carry = identifyCarry(board.units);
  const traits = generateTraitSignature(board.traits);

  // ── Pass 1: Carry-first lookup ────────────────────────────────────────
  const carryMatches = compDefinitions.filter(
    (def) => def.primaryCarry === carry.primary
  );

  if (carryMatches.length > 0) {
    // Find the best match among comps that share this carry
    let bestMatch: CompDefinition | null = null;
    let bestScore = -1;

    for (const def of carryMatches) {
      // Check if reroll flag matches
      if (def.isReroll && !carry.isReroll) continue;
      if (!def.isReroll && carry.isReroll) continue;

      // Score by how many required traits are satisfied
      const overlap = traitOverlap(traits, def.requiredTraits);

      // Bonus for matching secondary carry
      let score = overlap;
      if (def.secondaryCarry && carry.secondary === def.secondaryCarry) {
        score += 0.1;
      }

      // Bonus for matching optional traits
      if (def.optionalTraits) {
        const optionalMatched = def.optionalTraits.filter(
          (t) => traits.activeTraits[t] !== undefined
        ).length;
        score += optionalMatched * 0.05;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = def;
      }
    }

    if (bestMatch && bestScore >= 0.3) {
      return {
        compId: bestMatch.id,
        compName: bestMatch.name,
        method: "carry-lookup",
        confidence: Math.min(1, bestScore),
        carry,
        traits,
      };
    }
  }

  // ── Pass 2: Trait-signature fallback ──────────────────────────────────
  let bestTraitMatch: CompDefinition | null = null;
  let bestTraitScore = 0;

  for (const def of compDefinitions) {
    const overlap = traitOverlap(traits, def.requiredTraits);
    if (overlap > bestTraitScore) {
      bestTraitScore = overlap;
      bestTraitMatch = def;
    }
  }

  if (bestTraitMatch && bestTraitScore >= MIN_TRAIT_OVERLAP) {
    return {
      compId: bestTraitMatch.id,
      compName: bestTraitMatch.name,
      method: "trait-fallback",
      confidence: bestTraitScore * 0.8, // Lower confidence for trait-only match
      carry,
      traits,
    };
  }

  // ── Pass 3: Unclassified ──────────────────────────────────────────────
  return {
    compId: "unclassified",
    compName: `Unclassified (${carry.primaryName} carry)`,
    method: "unclassified",
    confidence: 0,
    carry,
    traits,
  };
}

/**
 * Classify multiple boards in batch.
 * Returns a map of classification method → count for logging.
 */
export function classifyBoards(
  boards: ParticipantBoard[],
  compDefinitions: CompDefinition[]
): {
  results: ClassificationResult[];
  stats: { carryLookup: number; traitFallback: number; unclassified: number };
} {
  const results: ClassificationResult[] = [];
  const stats = { carryLookup: 0, traitFallback: 0, unclassified: 0 };

  for (const board of boards) {
    const result = classifyBoard(board, compDefinitions);
    results.push(result);

    switch (result.method) {
      case "carry-lookup":
        stats.carryLookup++;
        break;
      case "trait-fallback":
        stats.traitFallback++;
        break;
      case "unclassified":
        stats.unclassified++;
        break;
    }
  }

  return { results, stats };
}
