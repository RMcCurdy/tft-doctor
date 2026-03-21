/** Comp archetype and recommendation types */

export interface CompArchetype {
  id: string; // e.g., "jinx-rebels"
  name: string; // e.g., "Jinx Rebel Blasters"
  patchId: string; // e.g., "14.23"
  traits: ActiveTrait[];
  coreChampions: CompChampion[]; // Must-have champions
  flexChampions: CompChampion[]; // Champions that can vary
  stats: CompStats;
  tier: CompTier;
  lastUpdated: string; // ISO timestamp
}

export type CompTier = "S" | "A" | "B" | "C";

export interface ActiveTrait {
  traitId: string;
  traitName: string;
  activeUnits: number; // How many units contribute
  breakpointReached: number; // Which breakpoint is hit (e.g., 6 for "6 Yordle")
  maxBreakpoint: number; // The highest breakpoint for this trait
  style: "bronze" | "silver" | "gold" | "chromatic";
}

export interface CompChampion {
  championId: string;
  championName: string;
  starLevel: number; // Recommended star level (1-3)
  position?: BoardPosition;
  recommendedItems: string[]; // Item IDs, typically 3 for carries
  isCarry: boolean;
}

export interface BoardPosition {
  row: number; // 0-3 (front to back)
  col: number; // 0-6 (left to right)
}

export interface CompStats {
  avgPlacement: number; // e.g., 3.2
  top4Rate: number; // e.g., 0.68
  winRate: number; // e.g., 0.18
  playRate: number; // e.g., 0.05
  sampleSize: number; // e.g., 1247
}

export interface CompRecommendation {
  rank: number;
  comp: CompArchetype;
  fitScore: number; // 0-100
  fitExplanation: string[]; // Human-readable reasons
  confidence: "high" | "medium" | "low";
  emblemApplication?: {
    emblemId: string;
    bestChampionId: string;
    bestChampionName: string;
    reasoning: string;
  };
  augmentSynergies?: {
    augmentId: string;
    augmentName: string;
    impact: string; // e.g., "+0.3 avg placement improvement"
  }[];
}
