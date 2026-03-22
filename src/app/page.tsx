"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/comps/FilterBar";
import type { FilterSelection } from "@/components/comps/FilterBar";
import { CompCard } from "@/components/comps/CompCard";
import { LoadingOverlay } from "@/components/ui/spinner";
import { useStaticData } from "@/hooks/useStaticData";
import type { CompArchetype } from "@/types/comp";

export default function HomePage() {
  const { champions, traits, getTraitIcon, getChampionCost, isLoaded } =
    useStaticData();

  const [comps, setComps] = useState<CompArchetype[]>([]);
  const [compsLoading, setCompsLoading] = useState(true);
  const [selections, setSelections] = useState<FilterSelection[]>([]);

  useEffect(() => {
    fetch("/api/comps")
      .then((r) => r.json())
      .then((data) => setComps(data.comps ?? []))
      .finally(() => setCompsLoading(false));
  }, []);

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
          {compsLoading && <LoadingOverlay />}

          {!compsLoading && filteredComps.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {selections.length > 0
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
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
