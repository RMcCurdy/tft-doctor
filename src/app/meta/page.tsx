"use client";

import { CompTierList } from "@/components/meta/CompTierList";
import { AugmentTierList } from "@/components/meta/AugmentTierList";
import { ItemTierList } from "@/components/meta/ItemTierList";
import { getCompArchetypes, getAugments, getItems } from "@/lib/mock-data";

export default function MetaPage() {
  const comps = getCompArchetypes();
  const augments = getAugments();
  const items = getItems();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Meta Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current patch tier lists for comps, augments, and items based on
          high-elo match data.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Main content */}
        <div className="space-y-8">
          <CompTierList comps={comps} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <AugmentTierList augments={augments} />
          <ItemTierList items={items} />
        </aside>
      </div>
    </div>
  );
}
