"use client";

import { AugmentSelector } from "@/components/advisor/AugmentSelector";
import { EmblemSelector } from "@/components/advisor/EmblemSelector";
import { ArtifactSelector } from "@/components/advisor/ArtifactSelector";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface FilterBarProps {
  augmentIds: string[];
  emblemIds: string[];
  artifactIds: string[];
  onAddAugment: (id: string) => void;
  onRemoveAugment: (id: string) => void;
  onAddEmblem: (id: string) => void;
  onRemoveEmblem: (id: string) => void;
  onAddArtifact: (id: string) => void;
  onRemoveArtifact: (id: string) => void;
  onReset: () => void;
  hasInput: boolean;
}

export function FilterBar({
  augmentIds,
  emblemIds,
  artifactIds,
  onAddAugment,
  onRemoveAugment,
  onAddEmblem,
  onRemoveEmblem,
  onAddArtifact,
  onRemoveArtifact,
  onReset,
  hasInput,
}: FilterBarProps) {
  return (
    <div className="sticky top-14 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-start lg:grid-cols-[1fr_1fr_1fr_auto]">
          <AugmentSelector
            selectedIds={augmentIds}
            onSelect={onAddAugment}
            onRemove={onRemoveAugment}
          />
          <EmblemSelector
            selectedIds={emblemIds}
            onSelect={onAddEmblem}
            onRemove={onRemoveEmblem}
          />
          <ArtifactSelector
            selectedIds={artifactIds}
            onSelect={onAddArtifact}
            onRemove={onRemoveArtifact}
          />
          {hasInput && (
            <div className="flex items-end sm:self-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-muted-foreground"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
