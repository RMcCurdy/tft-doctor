"use client";

import { useEffect, useState } from "react";

interface StaticChampion {
  id: string;
  name: string;
  icon: string;
  cost?: number;
}

interface StaticEntity {
  id: string;
  name: string;
  icon: string;
}

interface StaticDataResponse {
  champions: StaticChampion[];
  items: StaticEntity[];
  traits: StaticEntity[];
}

type ChampionEntry = { name: string; icon: string; cost: number };
type EntityEntry = { name: string; icon: string };

export function useStaticData() {
  const [championMap, setChampionMap] = useState<Record<string, ChampionEntry>>({});
  const [itemMap, setItemMap] = useState<Record<string, EntityEntry>>({});
  const [traitMap, setTraitMap] = useState<Record<string, EntityEntry>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/static")
      .then((r) => r.json())
      .then((data: StaticDataResponse) => {
        const champs: Record<string, ChampionEntry> = {};
        for (const c of data.champions) {
          champs[c.id] = { name: c.name, icon: c.icon, cost: c.cost ?? 1 };
        }
        setChampionMap(champs);

        const items: Record<string, EntityEntry> = {};
        for (const i of data.items) {
          items[i.id] = { name: i.name, icon: i.icon };
        }
        setItemMap(items);

        const traits: Record<string, EntityEntry> = {};
        for (const t of data.traits) {
          traits[t.id] = { name: t.name, icon: t.icon };
          // Also key by display-name-based ID (e.g., TFT16_Quickstriker)
          // so lookups work when comp data uses display names instead of internal IDs
          const nameKey = `TFT16_${t.name.replace(/[^a-zA-Z]/g, "")}`;
          if (nameKey !== t.id) {
            traits[nameKey] = { name: t.name, icon: t.icon };
          }
        }
        setTraitMap(traits);

        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  return {
    /** Returns .tex icon path for a champion */
    getChampionIcon: (id: string) => championMap[id]?.icon,
    /** Returns champion cost (1-5) */
    getChampionCost: (id: string) => championMap[id]?.cost,
    /** Returns .tex icon path for an item */
    getItemIcon: (id: string) => itemMap[id]?.icon,
    /** Returns .tex icon path for a trait */
    getTraitIcon: (id: string) => traitMap[id]?.icon,
    /** Returns display name for an item ID */
    getItemName: (id: string) => itemMap[id]?.name,
    isLoaded,
  };
}
