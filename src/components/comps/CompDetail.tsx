"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatDisplay } from "@/components/shared/StatDisplay";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import type { CompArchetype } from "@/types/comp";
import { cn } from "@/lib/utils";

interface CompDetailProps {
  comp: CompArchetype;
}

const TIER_COLORS = {
  S: "text-amber-400",
  A: "text-emerald-400",
  B: "text-sky-400",
  C: "text-zinc-400",
} as const;

const COST_COLORS: Record<number, string> = {
  1: "border-zinc-500 bg-zinc-500/10",
  2: "border-emerald-500 bg-emerald-500/10",
  3: "border-sky-500 bg-sky-500/10",
  4: "border-purple-500 bg-purple-500/10",
  5: "border-amber-500 bg-amber-500/10",
};

export function CompDetail({ comp }: CompDetailProps) {
  const confidence =
    comp.stats.sampleSize >= 2000
      ? "high"
      : comp.stats.sampleSize >= 500
        ? "medium"
        : "low";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <span className={cn("text-2xl font-bold", TIER_COLORS[comp.tier])}>
            {comp.tier}
          </span>
          <h1 className="text-2xl font-bold sm:text-3xl">{comp.name}</h1>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {comp.traits.map((trait) => (
            <Badge key={trait.traitId} variant="outline">
              {trait.activeUnits} {trait.traitName}
            </Badge>
          ))}
          <ConfidenceBadge confidence={confidence} />
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="flex justify-between p-4">
          <StatDisplay label="Avg Placement" value={comp.stats.avgPlacement.toFixed(1)} />
          <StatDisplay label="Top 4 Rate" value={`${(comp.stats.top4Rate * 100).toFixed(0)}%`} />
          <StatDisplay label="Win Rate" value={`${(comp.stats.winRate * 100).toFixed(0)}%`} />
          <StatDisplay label="Play Rate" value={`${(comp.stats.playRate * 100).toFixed(1)}%`} />
          <StatDisplay label="Sample Size" value={comp.stats.sampleSize.toLocaleString()} />
        </CardContent>
      </Card>

      {/* Core Champions */}
      <Card>
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold">Core Champions</h2>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {comp.coreChampions.map((champ) => (
            <div
              key={champ.championId}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3",
                champ.isCarry && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded border text-xs font-bold",
                    COST_COLORS[champ.starLevel] || COST_COLORS[1]
                  )}
                >
                  {"★".repeat(champ.starLevel)}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {champ.championName}
                  </span>
                  {champ.isCarry && (
                    <Badge className="ml-2 text-xs" variant="default">
                      Carry
                    </Badge>
                  )}
                </div>
              </div>
              {champ.recommendedItems.length > 0 && (
                <div className="flex gap-1">
                  {champ.recommendedItems.map((itemId) => (
                    <Badge
                      key={itemId}
                      variant="secondary"
                      className="text-xs"
                    >
                      {itemId
                        .replace("TFT_Item_", "")
                        .replace(/([A-Z])/g, " $1")
                        .trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Flex Champions */}
      {comp.flexChampions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold">Flex Options</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {comp.flexChampions.map((champ) => (
                <Badge key={champ.championId} variant="secondary">
                  {champ.championName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patch info */}
      <p className="text-center text-xs text-muted-foreground">
        Patch {comp.patchId} • Last updated{" "}
        {new Date(comp.lastUpdated).toLocaleDateString()}
      </p>
    </div>
  );
}
