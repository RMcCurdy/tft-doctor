"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/comps/FilterBar";
import type { FilterSelection } from "@/components/comps/FilterBar";
import { CompCard } from "@/components/comps/CompCard";
import { LoadingOverlay } from "@/components/ui/spinner";
import { RateLimitBanner } from "@/components/shared/RateLimitBanner";
import { useStaticData } from "@/hooks/useStaticData";
import type { CompArchetype } from "@/types/comp";

export default function HomePage() {
  const { champions, traits, getTraitIcon, getChampionCost, getItemIcon, isItemEmblem, isLoaded } =
    useStaticData();

  const [comps, setComps] = useState<CompArchetype[]>([]);
  const [compsLoading, setCompsLoading] = useState(true);
  const [compsError, setCompsError] = useState<string | null>(null);
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState<number | null>(null);
  const [selections, setSelections] = useState<FilterSelection[]>([]);

  const fetchComps = useCallback(async () => {
    setCompsLoading(true);
    setCompsError(null);
    setRateLimitRetryAfter(null);

    try {
      const res = await fetch("/api/comps", {
        signal: AbortSignal.timeout(15_000),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => null);
        const retryAfter =
          data?.retryAfter ??
          parseInt(res.headers.get("Retry-After") ?? "0", 10);
        setRateLimitRetryAfter(retryAfter || 120);
        setCompsError("Rate limit reached");
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to load comps (${res.status})`);
      }

      const data = await res.json();
      setComps(data.comps ?? []);
    } catch (err) {
      if (err instanceof DOMException && err.name === "TimeoutError") {
        setCompsError("Request timed out — the server may be starting up. Try refreshing.");
      } else {
        setCompsError(err instanceof Error ? err.message : "Failed to load comps");
      }
    } finally {
      setCompsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComps();
  }, [fetchComps]);

  const addSelection = useCallback((selection: FilterSelection) => {
    setSelections((prev) => {
      // Single-select per type: replace any existing selection of the same type
      const without = prev.filter((s) => s.type !== selection.type);
      return [...without, selection];
    });
  }, []);

  const removeSelection = useCallback((id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const filteredComps = useMemo(() => {
    if (selections.length === 0) return comps;

    return comps.filter((comp) => {
      return selections.every((sel) => {
        if (sel.type === "champion") {
          const allChampionIds = [
            ...comp.coreChampions.map((c) => c.championId),
            ...comp.flexChampions.map((c) => c.championId),
          ];
          return allChampionIds.includes(sel.id);
        }
        // trait
        return comp.traits.some((t) => t.traitId === sel.id);
      });
    });
  }, [comps, selections]);

  return (
    <>
      <FilterBar
        champions={champions}
        traits={traits}
        selections={selections}
        onAdd={addSelection}
        onRemove={removeSelection}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {rateLimitRetryAfter && (
            <RateLimitBanner
              retryAfter={rateLimitRetryAfter}
              onRetry={fetchComps}
            />
          )}

          {compsLoading && <LoadingOverlay />}

          {!compsLoading && !rateLimitRetryAfter && filteredComps.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {compsError
                  ? compsError
                  : selections.length > 0
                    ? "No comps match your filters. Try removing some."
                    : "No comp data available yet."}
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredComps.map((comp) => (
              <CompCard
                key={comp.id}
                comp={comp}
                getTraitIcon={getTraitIcon}
                getChampionCost={getChampionCost}
                getItemIcon={getItemIcon}
                isItemEmblem={isItemEmblem}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
