"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameStateInput, RecommendationResponse } from "@/types/api";

interface UseRecommendationsResult {
  data: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;
  fetch: () => void;
}

export function useRecommendations(
  gameState: GameStateInput
): UseRecommendationsResult {
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchRecommendations = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gameState),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || `Request failed with status ${res.status}`
        );
      }

      const result: RecommendationResponse = await res.json();
      setData(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [gameState]);

  // Auto-fetch when game state changes (debounced)
  useEffect(() => {
    const hasInput =
      gameState.augments.length > 0 ||
      gameState.emblems.length > 0 ||
      gameState.items.length > 0 ||
      gameState.artifacts.length > 0;

    if (!hasInput) {
      setData(null);
      return;
    }

    const timer = setTimeout(fetchRecommendations, 300);
    return () => clearTimeout(timer);
  }, [gameState, fetchRecommendations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { data, isLoading, error, fetch: fetchRecommendations };
}
