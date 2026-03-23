"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { useStaticData } from "@/hooks/useStaticData";

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
  const { augments } = useStaticData();

  const entities: SelectableEntity[] = useMemo(
    () =>
      augments.map((a) => ({
        id: a.id,
        name: a.name,
        subtitle: a.tier ? a.tier.charAt(0).toUpperCase() + a.tier.slice(1) : undefined,
        icon: a.icon,
      })),
    [augments]
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
