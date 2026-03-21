"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { getAugments } from "@/lib/mock-data";

interface AugmentSelectorProps {
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function AugmentSelector({
  selectedIds,
  onSelect,
  onRemove,
}: AugmentSelectorProps) {
  const entities: SelectableEntity[] = useMemo(
    () =>
      getAugments().map((a) => ({
        id: a.id,
        name: a.name,
        subtitle: a.tier.charAt(0).toUpperCase() + a.tier.slice(1),
      })),
    []
  );

  return (
    <GameEntitySelector
      label="Augments"
      placeholder="Search augments..."
      entities={entities}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onRemove={onRemove}
      maxSelections={3}
    />
  );
}
