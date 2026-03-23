"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { useStaticData } from "@/hooks/useStaticData";

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
  const { emblems } = useStaticData();

  const entities: SelectableEntity[] = useMemo(
    () =>
      emblems.map((e) => ({
        id: e.id,
        name: e.name,
        icon: e.icon,
      })),
    [emblems]
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
