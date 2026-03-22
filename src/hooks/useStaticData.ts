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
  const [champions, setChampions] = useState<StaticChampion[]>([]);
  const [traits, setTraits] = useState<StaticEntity[]>([]);
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
        setChampions(data.champions);

        const items: Record<string, EntityEntry> = {};
        for (const i of data.items) {
          items[i.id] = { name: i.name, icon: i.icon };
        }
        setItemMap(items);

        const traitEntries: Record<string, EntityEntry> = {};
        for (const t of data.traits) {
          traitEntries[t.id] = { name: t.name, icon: t.icon };
          const nameKey = `TFT16_${t.name.replace(/[^a-zA-Z]/g, "")}`;
          if (nameKey !== t.id) {
            traitEntries[nameKey] = { name: t.name, icon: t.icon };
          }
        }
        setTraitMap(traitEntries);
        setTraits(data.traits);

        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  return {
    getChampionIcon: (id: string) => championMap[id]?.icon,
    getChampionCost: (id: string) => championMap[id]?.cost,
    getItemIcon: (id: string) => itemMap[id]?.icon,
    getTraitIcon: (id: string) => traitMap[id]?.icon,
    getItemName: (id: string) => itemMap[id]?.name,
    champions,
    traits,
    isLoaded,
  };
}
