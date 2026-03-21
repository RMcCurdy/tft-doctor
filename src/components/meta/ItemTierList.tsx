"use client";

import { Badge } from "@/components/ui/badge";
import type { Item } from "@/types/game";

interface ItemTierListProps {
  items: Item[];
}

export function ItemTierList({ items }: ItemTierListProps) {
  const completedItems = items.filter((i) => !i.isComponent && !i.isEmblem && !i.isArtifact);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Item List</h2>
      <div className="flex flex-wrap gap-1.5">
        {completedItems.slice(0, 30).map((item) => (
          <Badge key={item.id} variant="secondary" className="text-xs">
            {item.name}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {Math.min(completedItems.length, 30)} of {completedItems.length} completed items.
        Item performance stats will be available once the data pipeline is active.
      </p>
    </div>
  );
}
