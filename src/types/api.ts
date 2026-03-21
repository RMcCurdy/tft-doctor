/** API request and response types */

import type { CompRecommendation } from "./comp";

export interface GameStateInput {
  /** IDs of augments already chosen (0-3) */
  augments: string[];
  /** IDs of emblems/spatula items available (0-3+) */
  emblems: string[];
  /** IDs of completed items or components held */
  items: string[];
  /** IDs of any special artifacts (Radiant, Ornn, etc.) */
  artifacts: string[];

  /** Champions currently on board (for mid-game updates) */
  currentChampions?: string[];
  /** Current player level (affects available champion pool) */
  level?: number;
  /** Current game stage (e.g., "3-2") */
  stage?: string;

  /** If currently on augment selection screen, the 3 options offered */
  augmentChoices?: string[];
  /** Optional: user wants to lean toward certain traits */
  preferredTraits?: string[];
}

export interface RecommendationResponse {
  recommendations: CompRecommendation[];
  meta: RecommendationMeta;
}

export interface RecommendationMeta {
  patchVersion: string;
  dataFreshness: string; // ISO timestamp of last aggregation
  totalMatchesAnalyzed: number;
  confidence: "high" | "medium" | "low";
}

/** Standard API error response */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
