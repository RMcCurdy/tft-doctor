"use client";

import { useCallback, useState } from "react";
import type { GameStateInput } from "@/types/api";

const INITIAL_STATE: GameStateInput = {
  augments: [],
  emblems: [],
  items: [],
  artifacts: [],
  stage: undefined,
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameStateInput>(INITIAL_STATE);

  const addAugment = useCallback((id: string) => {
    setGameState((prev) => {
      if (prev.augments.length >= 3 || prev.augments.includes(id)) return prev;
      return { ...prev, augments: [...prev.augments, id] };
    });
  }, []);

  const removeAugment = useCallback((id: string) => {
    setGameState((prev) => ({
      ...prev,
      augments: prev.augments.filter((a) => a !== id),
    }));
  }, []);

  const addEmblem = useCallback((id: string) => {
    setGameState((prev) => {
      if (prev.emblems.includes(id)) return prev;
      return { ...prev, emblems: [...prev.emblems, id] };
    });
  }, []);

  const removeEmblem = useCallback((id: string) => {
    setGameState((prev) => ({
      ...prev,
      emblems: prev.emblems.filter((e) => e !== id),
    }));
  }, []);

  const addItem = useCallback((id: string) => {
    setGameState((prev) => {
      if (prev.items.includes(id)) return prev;
      return { ...prev, items: [...prev.items, id] };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setGameState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i !== id),
    }));
  }, []);

  const addArtifact = useCallback((id: string) => {
    setGameState((prev) => {
      if (prev.artifacts.includes(id)) return prev;
      return { ...prev, artifacts: [...prev.artifacts, id] };
    });
  }, []);

  const removeArtifact = useCallback((id: string) => {
    setGameState((prev) => ({
      ...prev,
      artifacts: prev.artifacts.filter((a) => a !== id),
    }));
  }, []);

  const setStage = useCallback((stage: string | undefined) => {
    setGameState((prev) => ({ ...prev, stage }));
  }, []);

  const reset = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  const hasInput =
    gameState.augments.length > 0 ||
    gameState.emblems.length > 0 ||
    gameState.items.length > 0 ||
    gameState.artifacts.length > 0;

  return {
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
  };
}
