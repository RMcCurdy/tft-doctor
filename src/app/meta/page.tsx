"use client";

import { useEffect, useState } from "react";
import { CompTierList } from "@/components/meta/CompTierList";
import { AugmentTierList } from "@/components/meta/AugmentTierList";
import { ItemTierList } from "@/components/meta/ItemTierList";
import { Skeleton } from "@/components/ui/skeleton";
import type { CompArchetype } from "@/types/comp";
import type { Augment, Item } from "@/types/game";

export default function MetaPage() {
  const [comps, setComps] = useState<CompArchetype[]>([]);
  const [augments, setAugments] = useState<Augment[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/comps").then((r) => r.json()),
      fetch("/api/augments").then((r) => r.json()),
      fetch("/api/items").then((r) => r.json()),
    ])
      .then(([compsData, augmentsData, itemsData]) => {
        setComps(compsData.comps ?? []);
        setAugments(augmentsData.augments ?? []);
        setItems(itemsData.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Meta Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current patch tier lists for comps, augments, and items based on
          high-elo match data.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            <CompTierList comps={comps} />
          </div>
          <aside className="space-y-8">
            <AugmentTierList augments={augments} />
            <ItemTierList items={items} />
          </aside>
        </div>
      )}
    </div>
  );
}
