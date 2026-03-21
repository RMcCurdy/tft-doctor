"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { getArtifacts } from "@/lib/mock-data";

interface ArtifactSelectorProps {
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function ArtifactSelector({
  selectedIds,
  onSelect,
  onRemove,
}: ArtifactSelectorProps) {
  const entities: SelectableEntity[] = useMemo(
    () =>
      getArtifacts().map((a) => ({
        id: a.id,
        name: a.name,
        subtitle: a.type.charAt(0).toUpperCase() + a.type.slice(1),
      })),
    []
  );

  return (
    <GameEntitySelector
      label="Artifacts"
      placeholder="Search artifacts..."
      entities={entities}
      selectedIds={selectedIds}
      onSelect={onSelect}
      onRemove={onRemove}
    />
  );
}
