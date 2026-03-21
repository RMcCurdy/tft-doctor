/** Mock data access layer — used when USE_MOCK_DATA=true */

import type { Champion, Item, Augment, Trait, Emblem, Artifact } from "@/types/game";
import type { CompArchetype, CompRecommendation } from "@/types/comp";
import type { GameStateInput, RecommendationResponse } from "@/types/api";

import championsData from "../../mock/champions.json";
import itemsData from "../../mock/items.json";
import augmentsData from "../../mock/augments.json";
import traitsData from "../../mock/traits.json";
import emblemsData from "../../mock/emblems.json";
import artifactsData from "../../mock/artifacts.json";
import compArchetypesData from "../../mock/comp-archetypes.json";
import recommendationsData from "../../mock/recommendations.json";

export function getChampions(): Champion[] {
  return championsData as Champion[];
}

export function getItems(): Item[] {
  return itemsData as Item[];
}

export function getCompletedItems(): Item[] {
  return (itemsData as Item[]).filter((i) => !i.isComponent);
}

export function getComponentItems(): Item[] {
  return (itemsData as Item[]).filter((i) => i.isComponent);
}

export function getAugments(): Augment[] {
  return augmentsData as Augment[];
}

export function getTraits(): Trait[] {
  return traitsData as Trait[];
}

export function getEmblems(): Emblem[] {
  return emblemsData as Emblem[];
}

export function getArtifacts(): Artifact[] {
  return artifactsData as Artifact[];
}

export function getCompArchetypes(): CompArchetype[] {
  return compArchetypesData as unknown as CompArchetype[];
}

export function getCompById(id: string): CompArchetype | undefined {
  return getCompArchetypes().find((c) => c.id === id);
}

/**
 * Mock recommendation engine.
 * Returns pre-built recommendations, with basic scoring based on input overlap.
 */
export function getRecommendations(
  input: GameStateInput
): RecommendationResponse {
  const comps = getCompArchetypes();
  const sampleRecs =
    recommendationsData.sampleResponse.recommendations;

  // Simple mock scoring: boost comps that match any input
  const scored = comps.map((comp) => {
    let fitScore = 50; // baseline
    const explanations: string[] = [];

    // Check emblem synergy
    input.emblems.forEach((emblemId) => {
      const emblem = getEmblems().find((e) => e.id === emblemId);
      if (!emblem) return;
      const matchingTrait = comp.traits.find(
        (t) => t.traitId === emblem.traitId
      );
      if (matchingTrait) {
        fitScore += 20;
        explanations.push(
          `Your ${emblem.name} enables a higher ${matchingTrait.traitName} breakpoint`
        );
      }
    });

    // Check item synergy with carries
    const carries = comp.coreChampions.filter((c) => c.isCarry);
    input.items.forEach((itemId) => {
      carries.forEach((carry) => {
        if (carry.recommendedItems.includes(itemId)) {
          fitScore += 15;
          const item = getItems().find((i) => i.id === itemId);
          explanations.push(
            `${item?.name || itemId} is best-in-slot for ${carry.championName}`
          );
        }
      });
    });

    // Check augment synergy (basic: use sample data if available)
    const sampleRec = sampleRecs.find((r) => r.compId === comp.id);
    if (sampleRec?.augmentSynergies) {
      input.augments.forEach((augId) => {
        const synergy = sampleRec.augmentSynergies?.find(
          (s) => s.augmentId === augId
        );
        if (synergy) {
          fitScore += 10;
          explanations.push(`${synergy.augmentName}: ${synergy.impact}`);
        }
      });
    }

    // Cap at 100
    fitScore = Math.min(100, fitScore);

    if (explanations.length === 0) {
      explanations.push(
        `${comp.name} is a strong meta comp this patch (${comp.stats.avgPlacement} avg placement)`
      );
    }

    const confidence =
      fitScore >= 75 ? "high" : fitScore >= 50 ? "medium" : "low";

    return {
      comp,
      fitScore,
      fitExplanation: explanations,
      confidence,
      emblemApplication: sampleRec?.emblemApplication,
    } as { comp: CompArchetype; fitScore: number; fitExplanation: string[]; confidence: "high" | "medium" | "low"; emblemApplication?: CompRecommendation["emblemApplication"] };
  });

  // Sort by fitScore descending
  scored.sort((a, b) => b.fitScore - a.fitScore);

  const recommendations: CompRecommendation[] = scored
    .slice(0, 5)
    .map((s, i) => ({
      rank: i + 1,
      comp: s.comp,
      fitScore: s.fitScore,
      fitExplanation: s.fitExplanation,
      confidence: s.confidence,
      emblemApplication: s.emblemApplication,
    }));

  return {
    recommendations,
    meta: {
      patchVersion: "16.6",
      dataFreshness: new Date().toISOString(),
      totalMatchesAnalyzed: 48750,
      confidence: recommendations[0]?.confidence ?? "low",
    },
  };
}
