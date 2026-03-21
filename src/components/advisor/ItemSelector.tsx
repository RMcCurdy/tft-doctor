"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { getCompletedItems } from "@/lib/mock-data";

interface ItemSelectorProps {
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ItemSelector({
  selectedIds,
  onSelect,
  onRemove,
}: ItemSelectorProps) {
  const entities: SelectableEntity[] = useMemo(
    () =>
      getCompletedItems()
        .filter((i) => !i.isEmblem)
        .map((i) => ({
          id: i.id,
          name: i.name,
          subtitle: i.components.length > 0 ? `${i.components.length} components` : undefined,
        })),
    []
  );

  return (
    <GameEntitySelector
      label="Items"
      placeholder="Search items..."
      entities={entities}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onRemove={onRemove}
    />
  );
}
