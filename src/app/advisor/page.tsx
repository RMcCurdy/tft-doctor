"use client";

import { GameStateInput } from "@/components/advisor/GameStateInput";
import { RecommendationList } from "@/components/advisor/RecommendationList";
import { useGameState } from "@/hooks/useGameState";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function AdvisorPage() {
  const {
    gameState,
    hasInput,
    addAugment,
    removeAugment,
    addEmblem,
    removeEmblem,
    addItem,
    removeItem,
    addArtifact,
    removeArtifact,
    setStage,
    reset,
  } = useGameState();

  const { data, isLoading, error } = useRecommendations(gameState);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Situational Advisor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your augments, emblems, and items to get personalized comp
          recommendations based on high-elo match data.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Input Panel */}
        <aside className="rounded-xl border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <GameStateInput
            augments={gameState.augments}
            emblems={gameState.emblems}
            items={gameState.items}
            artifacts={gameState.artifacts}
            stage={gameState.stage}
            onAddAugment={addAugment}
            onRemoveAugment={removeAugment}
            onAddEmblem={addEmblem}
            onRemoveEmblem={removeEmblem}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onAddArtifact={addArtifact}
            onRemoveArtifact={removeArtifact}
            onSetStage={setStage}
            onReset={reset}
            hasInput={hasInput}
          />
        </aside>

        {/* Results Panel */}
        <main className="min-w-0">
          <RecommendationList
            data={data}
            isLoading={isLoading}
            error={error}
            hasInput={hasInput}
          />
        </main>
      </div>
    </div>
  );
}
