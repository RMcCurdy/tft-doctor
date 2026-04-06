"use client";

import { useEffect, useState } from "react";

export interface StaticChampion {
  id: string;
  name: string;
  icon: string;
  cost?: number;
}

export interface StaticEntity {
  id: string;
  name: string;
  icon: string;
  tier?: string;
  description?: string;
}

export interface StaticItem {
  id: string;
  name: string;
  icon: string;
  isEmblem?: boolean;
  components?: string[];
}

interface StaticDataResponse {
  champions: StaticChampion[];
  items: StaticItem[];
  traits: StaticEntity[];
  augments: StaticEntity[];
  emblems: StaticEntity[];
  artifacts: StaticEntity[];
}

type ChampionEntry = { name: string; icon: string; cost: number };
type EntityEntry = { name: string; icon: string; tier?: string };
type ItemEntry = { name: string; icon: string; isEmblem: boolean; components: string[] };

interface RateLimitInfo {
  retryAfter: number;
}

export function useStaticData() {
  const [championMap, setChampionMap] = useState<Record<string, ChampionEntry>>({});
  const [itemMap, setItemMap] = useState<Record<string, ItemEntry>>({});
  const [traitMap, setTraitMap] = useState<Record<string, EntityEntry>>({});
  const [champions, setChampions] = useState<StaticChampion[]>([]);
  const [traits, setTraits] = useState<StaticEntity[]>([]);
  const [augments, setAugments] = useState<StaticEntity[]>([]);
  const [emblems, setEmblems] = useState<StaticEntity[]>([]);
  const [artifacts, setArtifacts] = useState<StaticEntity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);

  useEffect(() => {
    fetch("/api/static", { signal: AbortSignal.timeout(15_000) })
      .then((r) => {
        if (r.status === 429) {
          const retryAfter = parseInt(r.headers.get("Retry-After") ?? "0", 10);
          setRateLimit({ retryAfter: retryAfter || 120 });
          setError("Rate limit reached");
          throw new Error("Rate limited");
        }
        if (!r.ok) throw new Error(`Failed to load static data (${r.status})`);
        return r.json();
      })
      .then((data: StaticDataResponse) => {
        const champs: Record<string, ChampionEntry> = {};
        for (const c of data.champions ?? []) {
          champs[c.id] = { name: c.name, icon: c.icon, cost: c.cost ?? 1 };
        }
        setChampionMap(champs);
        setChampions(data.champions ?? []);

        const items: Record<string, ItemEntry> = {};
        for (const i of data.items ?? []) {
          items[i.id] = { name: i.name, icon: i.icon, isEmblem: i.isEmblem ?? false, components: i.components ?? [] };
        }
        setItemMap(items);

        const traitEntries: Record<string, EntityEntry> = {};
        for (const t of data.traits ?? []) {
          traitEntries[t.id] = { name: t.name, icon: t.icon };
          const nameKey = `TFT16_${t.name.replace(/[^a-zA-Z]/g, "")}`;
          if (nameKey !== t.id) {
            traitEntries[nameKey] = { name: t.name, icon: t.icon };
          }
        }
        setTraitMap(traitEntries);
        setTraits(data.traits ?? []);

        setAugments(data.augments ?? []);
        setEmblems(data.emblems ?? []);
        setArtifacts(data.artifacts ?? []);

        setIsLoaded(true);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "TimeoutError") {
          setError("Request timed out — the server may be starting up.");
        } else if (!(err instanceof Error && err.message === "Rate limited")) {
          setError(err instanceof Error ? err.message : "Failed to load static data");
        }
        setIsLoaded(true);
      });
  }, []);

  return {
    getChampionIcon: (id: string) => championMap[id]?.icon,
    getChampionCost: (id: string) => championMap[id]?.cost,
    getItemIcon: (id: string) => itemMap[id]?.icon,
    getTraitIcon: (id: string) => traitMap[id]?.icon,
    getItemName: (id: string) => itemMap[id]?.name,
    getItemComponents: (id: string) => itemMap[id]?.components ?? [],
    isItemEmblem: (id: string) => itemMap[id]?.isEmblem ?? false,
    champions,
    traits,
    augments,
    emblems,
    artifacts,
    isLoaded,
    error,
    rateLimit,
  };
}
