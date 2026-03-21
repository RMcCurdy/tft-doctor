"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { getEmblems } from "@/lib/mock-data";

interface EmblemSelectorProps {
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function EmblemSelector({
  selectedIds,
  onSelect,
  onRemove,
}: EmblemSelectorProps) {
  const entities: SelectableEntity[] = useMemo(
    () =>
      getEmblems().map((e) => ({
        id: e.id,
        name: e.name,
        subtitle: `Grants ${e.traitId.replace("TFT16_", "")} trait`,
      })),
    []
  );

  return (
    <GameEntitySelector
      label="Emblems"
      placeholder="Search emblems..."
      entities={entities}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onRemove={onRemove}
    />
  );
}
