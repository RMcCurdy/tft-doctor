"use client";

import { useEffect, useState } from "react";
import { FilterBar } from "@/components/comps/FilterBar";
import { CompCard } from "@/components/comps/CompCard";
import { RecommendationCard } from "@/components/advisor/RecommendationCard";
import { LoadingOverlay } from "@/components/ui/spinner";
import { useGameState } from "@/hooks/useGameState";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useStaticData } from "@/hooks/useStaticData";
import type { CompArchetype } from "@/types/comp";

export default function HomePage() {
  const {
    gameState,
    hasInput,
    addAugment,
    removeAugment,
    addEmblem,
    removeEmblem,
    addArtifact,
    removeArtifact,
    reset,
  } = useGameState();

  const { data: recommendations, isLoading: recsLoading, error: recsError } =
    useRecommendations(gameState);

  const { getTraitIcon, getChampionCost } = useStaticData();

  const [comps, setComps] = useState<CompArchetype[]>([]);
  const [compsLoading, setCompsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/comps")
      .then((r) => r.json())
      .then((data) => setComps(data.comps ?? []))
      .finally(() => setCompsLoading(false));
  }, []);

  return (
    <>
      <FilterBar
        augmentIds={gameState.augments}
        emblemIds={gameState.emblems}
        artifactIds={gameState.artifacts}
        onAddAugment={addAugment}
        onRemoveAugment={removeAugment}
        onAddEmblem={addEmblem}
        onRemoveEmblem={removeEmblem}
        onAddArtifact={addArtifact}
        onRemoveArtifact={removeArtifact}
        onReset={reset}
        hasInput={hasInput}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {hasInput ? (
          /* Recommended for You view */
          <div className="space-y-4">
            {recsLoading && <LoadingOverlay />}

            {recsError && (
              <div className="py-12 text-center">
                <p className="text-sm text-destructive">{recsError}</p>
              </div>
            )}

            {recommendations && recommendations.recommendations.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No recommendations found. Try adjusting your filters.
                </p>
              </div>
            )}

            {recommendations &&
              recommendations.recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.comp.id}
                  recommendation={rec}
                  getTraitIcon={getTraitIcon}
                />
              ))}

            {recommendations && (
              <p className="text-center text-xs text-muted-foreground">
                Patch {recommendations.meta.patchVersion} &middot; Data as of{" "}
                {new Date(
                  recommendations.meta.dataFreshness
                ).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          /* All Comps view */
          <div className="space-y-4">
            {compsLoading && <LoadingOverlay />}

            {!compsLoading && comps.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No comp data available yet.
                </p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {comps.map((comp) => (
                <CompCard key={comp.id} comp={comp} getTraitIcon={getTraitIcon} getChampionCost={getChampionCost} />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
