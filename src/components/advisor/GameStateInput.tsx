"use client";

import { Button } from "@/components/ui/button";
import { AugmentSelector } from "./AugmentSelector";
import { EmblemSelector } from "./EmblemSelector";
import { ItemSelector } from "./ItemSelector";
import { ArtifactSelector } from "./ArtifactSelector";
import { StageSelector } from "./StageSelector";
import { RotateCcw } from "lucide-react";

interface GameStateInputProps {
  augments: string[];
  emblems: string[];
  items: string[];
  artifacts: string[];
  stage: string | undefined;
  onAddAugment: (id: string) => void;
  onRemoveAugment: (id: string) => void;
  onAddEmblem: (id: string) => void;
  onRemoveEmblem: (id: string) => void;
  onAddItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAddArtifact: (id: string) => void;
  onRemoveArtifact: (id: string) => void;
  onSetStage: (stage: string | undefined) => void;
  onReset: () => void;
  hasInput: boolean;
}

export function GameStateInput({
  augments,
  emblems,
  items,
  artifacts,
  stage,
  onAddAugment,
  onRemoveAugment,
  onAddEmblem,
  onRemoveEmblem,
  onAddItem,
  onRemoveItem,
  onAddArtifact,
  onRemoveArtifact,
  onSetStage,
  onReset,
  hasInput,
}: GameStateInputProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Game State</h2>
        {hasInput && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <AugmentSelector
        selectedIds={augments}
        onSelect={onAddAugment}
        onRemove={onRemoveAugment}
      />

      <EmblemSelector
        selectedIds={emblems}
        onSelect={onAddEmblem}
        onRemove={onRemoveEmblem}
      />

      <ItemSelector
        selectedIds={items}
        onSelect={onAddItem}
        onRemove={onRemoveItem}
      />

      <ArtifactSelector
        selectedIds={artifacts}
        onSelect={onAddArtifact}
        onRemove={onRemoveArtifact}
      />

      <StageSelector value={stage} onChange={onSetStage} />

      {!hasInput && (
        <p className="text-sm text-muted-foreground">
          Add your augments, emblems, or items to get comp recommendations.
        </p>
      )}
    </div>
  );
}
