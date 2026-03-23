"use client";

import { useMemo } from "react";
import {
  GameEntitySelector,
  type SelectableEntity,
} from "./GameEntitySelector";
import { useStaticData } from "@/hooks/useStaticData";

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
  const { artifacts } = useStaticData();

  const entities: SelectableEntity[] = useMemo(
    () =>
      artifacts.map((a) => ({
        id: a.id,
        name: a.name,
        icon: a.icon,
      })),
    [artifacts]
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
