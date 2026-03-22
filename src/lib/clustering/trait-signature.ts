/**
 * Trait Signature Extraction
 *
 * Extracts a simplified trait signature from a participant's active traits.
 * The signature represents which traits are "active" at meaningful breakpoints
 * and identifies the dominant and secondary traits.
 */

import type { RiotTrait } from "@/types/riot";
import type { TraitSignature } from "./types";

/**
 * Generate a trait signature from a participant's trait data.
 *
 * A trait is "active" if tier_current >= 1 (it's hit at least the first breakpoint).
 * The dominant trait is the one with the most units contributing.
 */
export function generateTraitSignature(traits: RiotTrait[]): TraitSignature {
  // Filter to active traits (tier_current >= 1)
  const activeTraits: { name: string; tier: number; units: number }[] = traits
    .filter((t) => t.tier_current >= 1 && t.num_units > 0)
    .map((t) => ({
      name: cleanTraitName(t.name),
      tier: t.tier_current,
      units: t.num_units,
    }))
    .sort((a, b) => b.units - a.units);

  if (activeTraits.length === 0) {
    return {
      activeTraits: {},
      dominantTrait: "none",
      dominantUnits: 0,
      secondaryTraits: [],
    };
  }

  const activeTraitMap: Record<string, number> = {};
  for (const t of activeTraits) {
    activeTraitMap[t.name] = t.tier;
  }

  const dominant = activeTraits[0];
  const secondaryTraits = activeTraits.slice(1).map((t) => t.name);

  return {
    activeTraits: activeTraitMap,
    dominantTrait: dominant.name,
    dominantUnits: dominant.units,
    secondaryTraits,
  };
}

/**
 * Clean a trait API name to a human-readable name.
 * "TFT16_Yordle" → "Yordle"
 * "Set16_Slayer" → "Slayer"
 */
function cleanTraitName(apiName: string): string {
  return apiName
    .replace(/^TFT\d+_/, "")
    .replace(/^Set\d+_/, "");
}

/**
 * Calculate how much two trait signatures overlap.
 * Returns a score from 0 to 1, where 1 means all required traits match.
 */
export function traitOverlap(
  boardTraits: TraitSignature,
  requiredTraits: Record<string, number>
): number {
  const requiredKeys = Object.keys(requiredTraits);
  if (requiredKeys.length === 0) return 0;

  let matched = 0;
  for (const traitName of requiredKeys) {
    const requiredTier = requiredTraits[traitName];
    const boardTier = boardTraits.activeTraits[traitName];
    if (boardTier !== undefined && boardTier >= requiredTier) {
      matched++;
    }
  }

  return matched / requiredKeys.length;
}
