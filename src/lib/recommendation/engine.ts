/**
 * Recommendation Engine
 *
 * Takes a user's game state input and returns ranked comp recommendations
 * using a 3-tier approach:
 *   Tier 1 — Exact match: query for the exact combo of inputs
 *   Tier 2 — Partial decomposition: score comps by individual input matches
 *   Tier 3 — Meta inference: fit score against top meta comps
 *
 * When connected to the DB, uses real comp/augment/item stats.
 * Falls back to mock data when USE_MOCK_DATA=true.
 */

import type { GameStateInput, RecommendationResponse } from "@/types/api";
import type { CompArchetype, CompRecommendation } from "@/types/comp";
import { computeFitScore, type FitScoreResult } from "./fit-score";
import { generateExplanation } from "./explanation";
import { db } from "@/lib/db";
import { compArchetypes, itemStats, emblemStats } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentPatch } from "@/lib/db/queries/patches";

const MAX_RECOMMENDATIONS = 5;

export async function getRecommendations(
  input: GameStateInput
): Promise<RecommendationResponse> {
  const currentPatch = await getCurrentPatch();

  if (!currentPatch) {
    return emptyResponse("No patch data available");
  }

  // Fetch all comp archetypes for the current patch
  const comps = await db
    .select()
    .from(compArchetypes)
    .where(eq(compArchetypes.patchId, currentPatch.id))
    .orderBy(compArchetypes.avgPlacement);

  if (comps.length === 0) {
    return emptyResponse("No comp data available yet — run the aggregation pipeline first");
  }

  // Fetch item stats for scoring
  const items = await db
    .select()
    .from(itemStats)
    .where(eq(itemStats.patchId, currentPatch.id));

  // Build item → comp performance map
  const itemCompMap = new Map<string, Map<number, number>>();
  for (const stat of items) {
    if (!stat.compArchetypeId) continue;
    if (!itemCompMap.has(stat.itemId)) itemCompMap.set(stat.itemId, new Map());
    itemCompMap.get(stat.itemId)!.set(stat.compArchetypeId, parseFloat(stat.avgPlacement ?? "4.5"));
  }

  // Score each comp against the user's input
  const scored: { comp: typeof comps[0]; fit: FitScoreResult }[] = [];

  for (const comp of comps) {
    const fit = computeFitScore(input, comp, itemCompMap);
    scored.push({ comp, fit });
  }

  // Sort by fit score descending
  scored.sort((a, b) => b.fit.score - a.fit.score);

  // Take top N
  const topComps = scored.slice(0, MAX_RECOMMENDATIONS);

  const recommendations: CompRecommendation[] = topComps.map((s, i) => {
    const comp = s.comp;
    const avgPlacement = parseFloat(comp.avgPlacement ?? "4.5");
    const top4Rate = parseFloat(comp.top4Rate ?? "0.5");
    const winRate = parseFloat(comp.winRate ?? "0.125");
    const playRate = parseFloat(comp.playRate ?? "0.05");

    return {
      rank: i + 1,
      comp: {
        id: comp.compName?.toLowerCase().replace(/\s+/g, "-") ?? `comp-${comp.id}`,
        name: comp.compName ?? "Unknown Comp",
        patchId: currentPatch.patchVersion,
        traits: Array.isArray(comp.traitSignature)
          ? comp.traitSignature as CompArchetype["traits"]
          : Object.entries(comp.traitSignature as Record<string, number>).map(
              ([name, tier]) => ({
                traitId: `TFT16_${name}`,
                traitName: name,
                activeUnits: tier * 2,
                breakpointReached: tier,
                maxBreakpoint: tier + 2,
                style: tier >= 3 ? "gold" as const : tier >= 2 ? "silver" as const : "bronze" as const,
              })
            ),
        coreChampions: [],
        flexChampions: [],
        stats: {
          avgPlacement,
          top4Rate,
          winRate,
          playRate,
          sampleSize: comp.sampleSize ?? 0,
        },
        tier: avgPlacement <= 3.5 ? "S" : avgPlacement <= 4.0 ? "A" : avgPlacement <= 4.5 ? "B" : "C",
        lastUpdated: comp.lastUpdated?.toISOString() ?? new Date().toISOString(),
      },
      fitScore: s.fit.score,
      fitExplanation: generateExplanation(s.fit, comp.compName ?? "this comp"),
      confidence:
        (comp.sampleSize ?? 0) >= 200
          ? "high"
          : (comp.sampleSize ?? 0) >= 50
            ? "medium"
            : "low",
    };
  });

  return {
    recommendations,
    meta: {
      patchVersion: currentPatch.patchVersion,
      dataFreshness: new Date().toISOString(),
      totalMatchesAnalyzed: currentPatch.matchCount ?? 0,
      confidence:
        recommendations.length > 0
          ? recommendations[0].confidence
          : "low",
    },
  };
}

function emptyResponse(message: string): RecommendationResponse {
  return {
    recommendations: [],
    meta: {
      patchVersion: "unknown",
      dataFreshness: new Date().toISOString(),
      totalMatchesAnalyzed: 0,
      confidence: "low",
    },
  };
}
