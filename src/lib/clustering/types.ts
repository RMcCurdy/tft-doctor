/** Types used by the clustering algorithm */

import type { RiotUnit, RiotTrait } from "@/types/riot";

/** Result of carry identification for a participant's board */
export interface CarryResult {
  /** Champion ID of the primary carry */
  primary: string;
  /** Champion name of the primary carry */
  primaryName: string;
  /** Carry score of the primary carry */
  primaryScore: number;
  /** Champion ID of the secondary carry (if exists) */
  secondary: string | null;
  /** Whether this is a reroll comp (low-cost 3-star carry) */
  isReroll: boolean;
}

/** Extracted trait signature from a participant's board */
export interface TraitSignature {
  /** Traits at or above their first meaningful breakpoint: { traitName: tierReached } */
  activeTraits: Record<string, number>;
  /** The single trait with the most units contributing */
  dominantTrait: string;
  /** Number of units contributing to the dominant trait */
  dominantUnits: number;
  /** All other active traits sorted by unit count */
  secondaryTraits: string[];
}

/** A comp definition used for classification (Pass 1 lookup table) */
export interface CompDefinition {
  id: string;
  name: string;
  primaryCarry: string; // champion API name (e.g., "TFT16_Jinx")
  secondaryCarry?: string;
  requiredTraits: Record<string, number>; // { traitName: minTier }
  optionalTraits?: string[];
  isReroll?: boolean;
  requiresEmblem?: string;
}

/** Result of classifying a participant's board */
export interface ClassificationResult {
  /** The matched comp definition ID, or "unclassified" */
  compId: string;
  /** The matched comp name */
  compName: string;
  /** How the classification was made */
  method: "carry-lookup" | "trait-fallback" | "unclassified";
  /** Confidence score (0-1) */
  confidence: number;
  /** The identified carry */
  carry: CarryResult;
  /** The trait signature */
  traits: TraitSignature;
}

/** A parsed participant board for clustering */
export interface ParticipantBoard {
  matchId: string;
  puuid: string;
  placement: number;
  units: RiotUnit[];
  traits: RiotTrait[];
  augments: string[];
}
